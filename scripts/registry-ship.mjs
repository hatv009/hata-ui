#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_REGISTRY = "registry.json";
const REPO_HELPERS_ITEM = "hatv009/hata-ui/helpers-utilities";
const KNOWN_TOP_FOLDERS = new Set(["app", "components", "docs", "hooks", "lib"]);
const LOCAL_ALIAS_PREFIXES = ["@/", "~/"];
const IGNORED_BARE_IMPORTS = new Set(["react", "react-dom"]);

const TYPE_ALIASES = {
  block: "registry:block",
  component: "registry:component",
  file: "registry:file",
  hook: "registry:hook",
  lib: "registry:lib",
  page: "registry:page",
  ui: "registry:ui",
};

main();

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));

    if (args.help || !args.path) {
      printHelp();
      process.exit(args.help ? 0 : 1);
    }

    const cwd = process.cwd();
    const sourcePath = normalizeRelativePath(args.path, cwd);
    const absoluteSourcePath = path.resolve(cwd, sourcePath);

    if (!existsSync(absoluteSourcePath)) {
      fail(`File not found: ${sourcePath}`);
    }

    const rootRegistryPath = path.resolve(cwd, ROOT_REGISTRY);
    if (!existsSync(rootRegistryPath)) {
      fail(`Root ${ROOT_REGISTRY} was not found.`);
    }

    const inference = inferRegistryItem(sourcePath, args);
    const registryPath = resolveOwningRegistry(cwd, sourcePath);
    const registryRelativePath = toPosix(path.relative(cwd, registryPath));
    const existingState = loadRegistryState(cwd);
    const duplicateSources = existingState.itemsByName.get(inference.name) ?? [];
    const isUpdatingSameRegistry =
      duplicateSources.length === 1 &&
      path.resolve(cwd, duplicateSources[0].registryFile) === registryPath;

    if (duplicateSources.length > 0 && !isUpdatingSameRegistry) {
      const locations = duplicateSources
        .map((source) => `${source.registryFile} items[${source.index}]`)
        .join(", ");
      fail(
        `Registry item "${inference.name}" already exists in ${locations}. Use --name to publish this file under a different item name.`,
      );
    }

    const source = readFileSync(absoluteSourcePath, "utf8");
    const deps = inferDependencies(source, args);
    const item = cleanObject({
      name: inference.name,
      type: inference.itemType,
      title: args.title ?? titleize(inference.name),
      description: args.description ?? defaultDescription(inference),
      dependencies: deps.dependencies,
      registryDependencies: deps.registryDependencies,
      files: [
        cleanObject({
          path: toPosix(path.relative(path.dirname(registryPath), absoluteSourcePath)),
          type: inference.fileType,
          target: inference.target,
        }),
      ],
    });

    if (args.dryRun) {
      console.log(
        JSON.stringify(
          {
            registryFile: registryRelativePath,
            item,
            validationSkipped: true,
          },
          null,
          2,
        ),
      );
      return;
    }

    ensureRootInclude(cwd, registryRelativePath);
    upsertRegistryItem(registryPath, item);

    if (!args.validate) {
      console.log(`Shipped "${item.name}" to ${registryRelativePath} (validation skipped).`);
      return;
    }

    const validationCommand =
      process.platform === "win32"
        ? {
            command: "cmd.exe",
            args: ["/d", "/s", "/c", "corepack.cmd pnpm dlx shadcn@latest registry validate ./registry.json"],
          }
        : {
            command: "corepack",
            args: ["pnpm", "dlx", "shadcn@latest", "registry", "validate", "./registry.json"],
          };

    const result = spawnSync(validationCommand.command, validationCommand.args, {
      cwd,
      encoding: "utf8",
      shell: false,
    });

    if (result.error) {
      fail(`Could not run registry validation: ${result.error.message}`);
    }

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (result.status !== 0) {
      fail(`Registry validation failed after shipping "${item.name}".`);
    }

    console.log(`Shipped "${item.name}" to ${registryRelativePath}.`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function parseArgs(argv) {
  const args = {
    deps: [],
    registryDeps: [],
    validate: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--no-validate") {
      args.validate = false;
      continue;
    }

    if (arg.startsWith("--")) {
      const [flag, inlineValue] = arg.split("=", 2);
      const value = inlineValue ?? argv[++index];

      if (!value) {
        fail(`Missing value for ${flag}.`);
      }

      switch (flag) {
        case "--description":
          args.description = value;
          break;
        case "--deps":
          args.deps.push(...splitList(value));
          break;
        case "--name":
          args.name = value;
          break;
        case "--registry-deps":
          args.registryDeps.push(...splitList(value));
          break;
        case "--title":
          args.title = value;
          break;
        case "--type":
          args.type = value;
          break;
        default:
          fail(`Unknown option: ${flag}`);
      }

      continue;
    }

    if (args.path) {
      fail(`Unexpected extra argument: ${arg}`);
    }

    args.path = arg;
  }

  return args;
}

function inferRegistryItem(sourcePath, args) {
  const normalizedType = args.type ? normalizeType(args.type) : inferTypeFromPath(sourcePath);

  if (!normalizedType) {
    fail(`Could not infer registry type for ${sourcePath}. Pass --type ui|component|block|page|lib|hook|file.`);
  }

  const fileName = path.posix.basename(sourcePath);
  const extensionlessName = fileName.replace(/\.[^.]+$/, "");
  const name =
    args.name ??
    (normalizedType === "registry:page"
      ? kebabCase(sourcePath.replace(/^app\//, "").replace(/\/page\.[^.]+$/, "-page"))
      : kebabCase(extensionlessName));

  const typePair = getTypePair(normalizedType);

  return {
    fileType: typePair.fileType,
    itemType: typePair.itemType,
    name,
    sourcePath,
    target: inferTarget(sourcePath, normalizedType),
  };
}

function inferTypeFromPath(sourcePath) {
  if (/^components\/ui\/[^/]+\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
    return "registry:ui";
  }

  if (/^components\/blocks\/[^/]+\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
    return "registry:block";
  }

  if (/^app\/.+\/page\.(tsx|ts|jsx|js)$/.test(sourcePath) || /^app\/page\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
    return "registry:page";
  }

  if (/^lib\/[^/]+\.(ts|tsx|js|jsx)$/.test(sourcePath)) {
    return "registry:lib";
  }

  if (/^hooks\/[^/]+\.(ts|tsx|js|jsx)$/.test(sourcePath)) {
    return "registry:hook";
  }

  return null;
}

function inferTarget(sourcePath, itemType) {
  const fileName = path.posix.basename(sourcePath);

  switch (itemType) {
    case "registry:block":
      return `@components/blocks/${fileName}`;
    case "registry:component":
      return `@components/${fileName}`;
    case "registry:file":
    case "registry:page":
      return sourcePath;
    case "registry:hook":
      return `@hooks/${fileName}`;
    case "registry:lib":
      return `@lib/${fileName}`;
    case "registry:ui":
      return `@ui/${fileName}`;
    default:
      return undefined;
  }
}

function getTypePair(itemType) {
  if (itemType === "registry:block") {
    return {
      fileType: "registry:component",
      itemType,
    };
  }

  return {
    fileType: itemType,
    itemType,
  };
}

function normalizeType(type) {
  const normalized = type.startsWith("registry:") ? type : TYPE_ALIASES[type];

  if (!normalized) {
    fail(`Unknown registry type "${type}".`);
  }

  return normalized;
}

function inferDependencies(source, args) {
  const imports = extractImports(source);
  const dependencies = new Set(args.deps);
  const registryDependencies = new Set(args.registryDeps);

  for (const specifier of imports) {
    if (specifier === "@/lib/utils" || specifier === "~/lib/utils") {
      registryDependencies.add(REPO_HELPERS_ITEM);
      continue;
    }

    const uiMatch = specifier.match(/^[@~]\/components\/ui\/([^/]+)$/);
    if (uiMatch) {
      registryDependencies.add(kebabCase(uiMatch[1]));
      continue;
    }

    if (specifier.startsWith(".") || LOCAL_ALIAS_PREFIXES.some((prefix) => specifier.startsWith(prefix))) {
      continue;
    }

    if (IGNORED_BARE_IMPORTS.has(specifier) || specifier.startsWith("next/")) {
      continue;
    }

    dependencies.add(getPackageName(specifier));
  }

  return {
    dependencies: sortSet(dependencies),
    registryDependencies: sortSet(registryDependencies),
  };
}

function extractImports(source) {
  const imports = new Set();
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      imports.add(match[1]);
    }
  }

  return imports;
}

function getPackageName(specifier) {
  if (specifier.startsWith("@")) {
    const [scope, name] = specifier.split("/");
    return `${scope}/${name}`;
  }

  return specifier.split("/")[0];
}

function resolveOwningRegistry(cwd, sourcePath) {
  const absoluteSourcePath = path.resolve(cwd, sourcePath);
  let currentDir = path.dirname(absoluteSourcePath);

  while (currentDir.startsWith(cwd) && currentDir !== cwd) {
    const candidate = path.join(currentDir, ROOT_REGISTRY);
    if (existsSync(candidate)) {
      return candidate;
    }

    currentDir = path.dirname(currentDir);
  }

  const [topFolder] = sourcePath.split("/");
  if (KNOWN_TOP_FOLDERS.has(topFolder)) {
    return path.resolve(cwd, topFolder, ROOT_REGISTRY);
  }

  return path.resolve(cwd, ROOT_REGISTRY);
}

function ensureRootInclude(cwd, registryRelativePath) {
  if (registryRelativePath === ROOT_REGISTRY) {
    return;
  }

  const rootRegistryPath = path.resolve(cwd, ROOT_REGISTRY);
  const rootRegistry = readJson(rootRegistryPath);
  const include = new Set(rootRegistry.include ?? []);
  include.add(registryRelativePath);
  rootRegistry.include = [...include].sort();
  writeJson(rootRegistryPath, rootRegistry);
}

function upsertRegistryItem(registryPath, item) {
  const registry = existsSync(registryPath)
    ? readJson(registryPath)
    : {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        items: [],
      };

  registry.items = registry.items ?? [];

  const existingIndex = registry.items.findIndex((existingItem) => existingItem.name === item.name);
  if (existingIndex >= 0) {
    registry.items[existingIndex] = item;
  } else {
    registry.items.push(item);
  }

  registry.items.sort((left, right) => left.name.localeCompare(right.name));
  writeJson(registryPath, registry);
}

function loadRegistryState(cwd) {
  const rootRegistryPath = path.resolve(cwd, ROOT_REGISTRY);
  const visited = new Set();
  const itemsByName = new Map();

  visitRegistry(rootRegistryPath);

  return { itemsByName };

  function visitRegistry(registryPath) {
    const resolvedRegistryPath = path.resolve(registryPath);

    if (visited.has(resolvedRegistryPath) || !existsSync(resolvedRegistryPath)) {
      return;
    }

    visited.add(resolvedRegistryPath);

    const registry = readJson(resolvedRegistryPath);
    const registryFile = toPosix(path.relative(cwd, resolvedRegistryPath));

    for (const includePath of registry.include ?? []) {
      visitRegistry(path.resolve(path.dirname(resolvedRegistryPath), includePath));
    }

    for (const [index, item] of (registry.items ?? []).entries()) {
      const entries = itemsByName.get(item.name) ?? [];
      entries.push({ index, registryFile });
      itemsByName.set(item.name, entries);
    }
  }
}

function normalizeRelativePath(filePath, cwd) {
  const absolutePath = path.resolve(cwd, filePath);
  const relativePath = path.relative(cwd, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    fail(`Path must stay inside the project: ${filePath}`);
  }

  return toPosix(relativePath);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value.map(cleanObject);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => {
        if (entryValue === undefined) {
          return false;
        }

        if (Array.isArray(entryValue) && entryValue.length === 0) {
          return false;
        }

        return true;
      })
      .map(([key, entryValue]) => [key, cleanObject(entryValue)]),
  );
}

function splitList(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sortSet(set) {
  return [...set].sort((left, right) => left.localeCompare(right));
}

function kebabCase(value) {
  return value
    .replace(/\\/g, "/")
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function titleize(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function defaultDescription(item) {
  if (item.itemType === "registry:ui") {
    return `${titleize(item.name)} UI primitive.`;
  }

  if (item.itemType === "registry:page") {
    return `${titleize(item.name)} page.`;
  }

  return `${titleize(item.name)} registry item.`;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function printHelp() {
  console.log(`Usage: pnpm ship <path> [options]

Options:
  --type ui|component|block|page|lib|hook|file
  --name <item-name>
  --title <title>
  --description <text>
  --deps <package-a,package-b>
  --registry-deps <item-a,item-b>
  --dry-run
  --no-validate
`);
}

function fail(message) {
  console.error(`registry-ship: ${message}`);
  process.exit(1);
}
