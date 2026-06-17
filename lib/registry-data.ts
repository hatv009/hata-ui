import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

type RegistryFile = {
  include?: string[];
  items?: RegistryItem[];
};

const ROOT_REGISTRY = "registry.json";
const GITHUB_REGISTRY = "hatv009/hata-ui";

export function getRegistryItems() {
  const cwd = process.cwd();
  const rootRegistryPath = path.join(cwd, ROOT_REGISTRY);
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
