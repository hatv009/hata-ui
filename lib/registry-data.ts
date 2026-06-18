import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { withCustomConfig } from "react-docgen-typescript";

export type RegistryFileEntry = {
  path: string;
  type: string;
  target?: string;
};

export type RegistryItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFileEntry[];
};

export type RegistryItemWithSource = RegistryItem & {
  sourceRegistry: string;
  installPath: string;
};

export type RegistrySourceFile = RegistryFileEntry & {
  absolutePath: string;
  content: string;
  sourcePath: string;
};

export type RegistryProp = {
  defaultValue?: string;
  description?: string;
  name: string;
  required: boolean;
  type: string;
};

export type RegistryComponentApi = {
  displayName: string;
  filePath: string;
  props: RegistryProp[];
};

type RegistryFile = {
  include?: string[];
  items?: RegistryItem[];
};

const ROOT_REGISTRY = "registry.json";
const GITHUB_REGISTRY = "hatv009/hata-ui";

export function getRegistryItems() {
  const cwd = process.cwd();
  const rootRegistryPath = path.join(/* turbopackIgnore: true */ cwd, ROOT_REGISTRY);
  const visited = new Set<string>();
  const items: RegistryItemWithSource[] = [];

  visitRegistry(rootRegistryPath);

  return items.sort((left, right) => left.name.localeCompare(right.name));

  function visitRegistry(registryPath: string) {
    const resolvedPath = path.resolve(registryPath);

    if (visited.has(resolvedPath) || !existsSync(resolvedPath)) {
      return;
    }

    visited.add(resolvedPath);

    const registry = JSON.parse(readFileSync(resolvedPath, "utf8")) as RegistryFile;
    const registryDir = path.dirname(resolvedPath);
    const sourceRegistry = toPosix(path.relative(cwd, resolvedPath));

    for (const includePath of registry.include ?? []) {
      const childPath = path.resolve(registryDir, includePath);
      const childRelativePath = path.relative(cwd, childPath);

      if (childRelativePath.startsWith("..") || path.isAbsolute(childRelativePath)) {
        continue;
      }

      visitRegistry(childPath);
    }

    for (const item of registry.items ?? []) {
      items.push({
        ...item,
        sourceRegistry,
        installPath: `${GITHUB_REGISTRY}/${item.name}`,
      });
    }
  }
}

export function getRegistryItem(name: string) {
  return getRegistryItems().find((item) => item.name === name);
}

export function getRegistryItemSourceFiles(item: RegistryItemWithSource) {
  const cwd = process.cwd();
  const registryDir = path.dirname(path.resolve(/* turbopackIgnore: true */ cwd, item.sourceRegistry));

  return (item.files ?? [])
    .map((file) => {
      const absolutePath = path.resolve(/* turbopackIgnore: true */ registryDir, file.path);
      const relativePath = path.relative(cwd, absolutePath);

      if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath) ||
        !existsSync(absolutePath)
      ) {
        return null;
      }

      return {
        ...file,
        absolutePath,
        content: readFileSync(absolutePath, "utf8"),
        sourcePath: toPosix(relativePath),
      };
    })
    .filter((file): file is RegistrySourceFile => Boolean(file));
}

export function getRegistryComponentApi(item: RegistryItemWithSource) {
  const parser = withCustomConfig(path.join(/* turbopackIgnore: true */ process.cwd(), "tsconfig.json"), {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
  });

  return getRegistryItemSourceFiles(item)
    .filter((file) => /\.(tsx|ts)$/.test(file.sourcePath))
    .flatMap((file) =>
      parser.parse(file.absolutePath).map<RegistryComponentApi>((component) => ({
        displayName: component.displayName,
        filePath: file.sourcePath,
        props: Object.entries(component.props)
          .map(([name, prop]) => ({
            defaultValue: toDisplayText(prop.defaultValue?.value),
            description: toDisplayText(prop.description),
            name,
            required: prop.required,
            type: toDisplayText(prop.type.name) ?? "unknown",
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      })),
    )
    .filter((component) => component.props.length > 0);
}

export function getRegistryStats(items = getRegistryItems()) {
  const typeCounts = new Map<string, number>();
  let dependencyCount = 0;
  let fileCount = 0;

  for (const item of items) {
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
    dependencyCount += (item.dependencies?.length ?? 0) + (item.registryDependencies?.length ?? 0);
    fileCount += item.files?.length ?? 0;
  }

  return {
    dependencyCount,
    fileCount,
    itemCount: items.length,
    typeCounts: [...typeCounts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  };
}

export function getStaticRegistryUrl(itemName: string) {
  return `/r/${itemName}.json`;
}

export function getGitHubInstallCommand(itemName: string) {
  return `corepack.cmd pnpm dlx shadcn@latest add ${GITHUB_REGISTRY}/${itemName}#v0.1.0`;
}

export function getStaticInstallCommand(itemName: string) {
  return `corepack.cmd pnpm dlx shadcn@latest add https://<your-domain>${getStaticRegistryUrl(itemName)}`;
}

function toPosix(value: string) {
  return value.split(path.sep).join("/");
}

function toDisplayText(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}
