#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_REGISTRY = "registry.json";
const SHIP_CONFIG = "registry.ship.json";
const REPO_HELPERS_ITEM = "hatv009/hata-ui/helpers-utilities";
const KNOWN_TOP_FOLDERS = new Set(["app", "components", "docs", "hooks", "lib"]);
const DISCOVERY_ROOTS = ["components", "app", "lib", "hooks"];
const LOCAL_ALIAS_PREFIXES = ["@/", "~/"];
const IGNORED_BARE_IMPORTS = new Set(["react", "react-dom"]);
const DISCOVERY_IGNORES = new Set([".git", ".next", "node_modules", "public", "dist", "build"]);

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
    const cwd = process.cwd();
    const shipConfig = loadShipConfig(cwd);

    if (args.help) {
      printHelp();
      process.exit(0);
    }

    const rootRegistryPath = path.resolve(cwd, ROOT_REGISTRY);
    if (!existsSync(rootRegistryPath)) {
      fail(`Root ${ROOT_REGISTRY} was not found.`);
    }

    const existingState = loadRegistryState(cwd);

    if (args.why) {
      explainCandidate(cwd, args.why, args, existingState, shipConfig);
      return;
    }

    if (args.list || args.new || args.changed || args.all || !args.path) {
      handleDiscoveryMode(cwd, args, existingState, shipConfig);
      return;
    }

    const sourcePath = resolveInputPath(cwd, args, existingState, shipConfig);
    const shippedItem = shipSourcePath(cwd, sourcePath, args, existingState, shipConfig, {
      dryRun: args.dryRun,
    });

    if (args.dryRun) {
      return;
    }

    if (args.validate) {
      runRegistryValidation(cwd);
    }

    console.log(
      `Shipped "${shippedItem.item.name}" to ${shippedItem.registryRelativePath}${
        args.validate ? "." : " (validation skipped)."
      }`,
    );
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

    if (arg === "--force") {
      args.force = true;
      continue;
    }

    if (arg === "--all") {
      args.all = true;
      continue;
    }

    if (arg === "--changed") {
      args.changed = true;
      continue;
    }

    if (arg === "--list") {
      args.list = true;
      continue;
    }

    if (arg === "--new") {
      args.new = true;
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
        case "--why":
          args.why = value;
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
  const blockFolderIndexMatch = sourcePath.match(/^components\/blocks\/([^/]+)\/index\.[^.]+$/);
  const name =
    args.name ??
    (blockFolderIndexMatch
      ? kebabCase(blockFolderIndexMatch[1])
      : normalizedType === "registry:page"
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

function handleDiscoveryMode(cwd, args, existingState, shipConfig) {
  const candidates = discoverCandidates(cwd, existingState, args, shipConfig);
  const selectedCandidates = selectCandidates(candidates, args);

  if (args.list) {
    printCandidates(args.new || args.changed || args.all ? selectedCandidates : candidates);
    return;
  }

  if (!args.path && !args.new && !args.changed && !args.all) {
    if (selectedCandidates.length === 1) {
      const [candidate] = selectedCandidates;
      console.log(`No path provided. Found one unregistered candidate: ${candidate.sourcePath}`);
      const shippedItem = shipSourcePath(cwd, candidate.sourcePath, args, existingState, shipConfig, {
        dryRun: args.dryRun,
      });

      if (!args.dryRun && args.validate) {
        runRegistryValidation(cwd);
      }

      if (!args.dryRun) {
        console.log(`Shipped "${shippedItem.item.name}" to ${shippedItem.registryRelativePath}.`);
      }

      return;
    }

    printCandidates(candidates, {
      intro:
        selectedCandidates.length === 0
          ? "No unregistered candidates found."
          : `No path provided. Found ${selectedCandidates.length} unregistered candidates.`,
      statusFilter: "new",
    });
    process.exit(selectedCandidates.length === 0 ? 0 : 1);
  }

  if (selectedCandidates.length === 0) {
    printCandidates(candidates, {
      intro: "No candidates matched the requested mode.",
    });
    process.exit(0);
  }

  if (selectedCandidates.length > 1 && args.name) {
    fail("--name can only be used when shipping a single path or query match.");
  }

  if (hasAmbiguousCandidates(selectedCandidates)) {
    printCandidates(selectedCandidates, {
      intro: "Ambiguous candidates found. Pass --name or ship each path explicitly.",
    });
    process.exit(1);
  }

  const shippedItems = selectedCandidates.map((candidate) =>
    shipSourcePath(cwd, candidate.sourcePath, args, existingState, shipConfig, {
      dryRun: args.dryRun,
    }),
  );

  if (args.dryRun) {
    return;
  }

  if (args.validate) {
    runRegistryValidation(cwd);
  }

  for (const shippedItem of shippedItems) {
    console.log(`Shipped "${shippedItem.item.name}" to ${shippedItem.registryRelativePath}.`);
  }
}

function resolveInputPath(cwd, args, existingState, shipConfig) {
  const directPath = normalizeRelativePath(args.path, cwd);
  const absoluteDirectPath = path.resolve(cwd, directPath);

  if (existsSync(absoluteDirectPath)) {
    return directPath;
  }

  const matches = fuzzyMatchCandidates(args.path, discoverCandidates(cwd, existingState, args, shipConfig));

  if (matches.length === 1) {
    return matches[0].sourcePath;
  }

  if (matches.length > 1) {
    printCandidates(matches, {
      intro: `Query "${args.path}" matched ${matches.length} candidates. Ship one path explicitly.`,
    });
    process.exit(1);
  }

  fail(`File not found and no registry candidate matched query: ${args.path}`);
}

function shipSourcePath(cwd, sourcePath, args, existingState, shipConfig, options = {}) {
  const absoluteSourcePath = path.resolve(cwd, sourcePath);

  if (!existsSync(absoluteSourcePath)) {
    fail(`File not found: ${sourcePath}`);
  }

  const policy = getShipPolicy(sourcePath, shipConfig);

  if (policy.excludeMatch && !args.force) {
    fail(
      `${sourcePath} is excluded by ${SHIP_CONFIG} pattern "${policy.excludeMatch}". Pass --force to override.`,
    );
  }

  const inference = inferRegistryItem(sourcePath, withPolicyType(args, policy));
  const registryPath = resolveOwningRegistry(cwd, sourcePath);
  const registryRelativePath = toPosix(path.relative(cwd, registryPath));
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

  if (options.dryRun) {
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
    return { item, registryRelativePath };
  }

  ensureRootInclude(cwd, registryRelativePath);
  upsertRegistryItem(registryPath, item);

  return { item, registryRelativePath };
}

function discoverCandidates(cwd, existingState, args, shipConfig) {
  const changedPaths = getChangedPaths(cwd);
  const candidates = [];

  for (const root of DISCOVERY_ROOTS) {
    const absoluteRoot = path.resolve(cwd, root);

    if (!existsSync(absoluteRoot)) {
      continue;
    }

    for (const sourcePath of walkFiles(cwd, absoluteRoot)) {
      const policy = getShipPolicy(sourcePath, shipConfig);

      if (!policy.includeMatch || policy.excludeMatch) {
        continue;
      }

      const policyArgs = withPolicyType(args, policy);
      const normalizedType = policyArgs.type ? normalizeType(policyArgs.type) : inferTypeFromPath(sourcePath);

      if (!normalizedType) {
        continue;
      }

      const inference = inferRegistryItem(sourcePath, { ...policyArgs, type: normalizedType });
      const registeredSources = existingState.filesBySourcePath.get(sourcePath) ?? [];
      const duplicateSources = existingState.itemsByName.get(inference.name) ?? [];
      const isRegistered = registeredSources.length > 0;
      const isChanged = changedPaths.has(sourcePath);
      const status = isRegistered ? (isChanged ? "changed" : "registered") : "new";

      candidates.push({
        itemName: inference.name,
        itemType: inference.itemType,
        registeredSources,
        sourcePath,
        status,
        duplicateCount: duplicateSources.length,
        excludeMatch: policy.excludeMatch,
        includeMatch: policy.includeMatch,
        typeMatch: policy.typeMatch,
      });
    }
  }

  return candidates.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

function explainCandidate(cwd, query, args, existingState, shipConfig) {
  const directPath = normalizeRelativePath(query, cwd);
  const absoluteDirectPath = path.resolve(cwd, directPath);
  const candidates = discoverCandidates(cwd, existingState, args, shipConfig);
  const targets = existsSync(absoluteDirectPath)
    ? [buildCandidateExplanation(cwd, directPath, args, existingState, shipConfig)]
    : fuzzyMatchCandidates(
        query,
        uniqueCandidatesBySourcePath([
          ...candidates,
          ...discoverAllInferableCandidates(cwd, existingState, args, shipConfig),
        ]),
      );

  if (targets.length === 0) {
    console.log(`No file or candidate matched "${query}".`);
    return;
  }

  for (const target of targets) {
    const explanation =
      target.includeMatch !== undefined
        ? target
        : buildCandidateExplanation(cwd, target.sourcePath, args, existingState, shipConfig);

    printCandidateExplanation(explanation);
  }
}

function discoverAllInferableCandidates(cwd, existingState, args, shipConfig) {
  const candidates = [];

  for (const root of DISCOVERY_ROOTS) {
    const absoluteRoot = path.resolve(cwd, root);

    if (!existsSync(absoluteRoot)) {
      continue;
    }

    for (const sourcePath of walkFiles(cwd, absoluteRoot)) {
      const policy = getShipPolicy(sourcePath, shipConfig);
      const policyArgs = withPolicyType(args, policy);
      const normalizedType = policyArgs.type ? normalizeType(policyArgs.type) : inferTypeFromPath(sourcePath);

      if (!normalizedType) {
        continue;
      }

      const inference = inferRegistryItem(sourcePath, { ...policyArgs, type: normalizedType });
      const registeredSources = existingState.filesBySourcePath.get(sourcePath) ?? [];

      candidates.push({
        itemName: inference.name,
        itemType: inference.itemType,
        sourcePath,
        status: registeredSources.length > 0 ? "registered" : "new",
        includeMatch: policy.includeMatch,
        excludeMatch: policy.excludeMatch,
        typeMatch: policy.typeMatch,
      });
    }
  }

  return candidates;
}

function buildCandidateExplanation(cwd, sourcePath, args, existingState, shipConfig) {
  const policy = getShipPolicy(sourcePath, shipConfig);
  const policyArgs = withPolicyType(args, policy);
  const inferredType = policyArgs.type ? normalizeType(policyArgs.type) : inferTypeFromPath(sourcePath);
  const registeredSources = existingState.filesBySourcePath.get(sourcePath) ?? [];
  const changedPaths = getChangedPaths(cwd);

  return {
    sourcePath,
    includeMatch: policy.includeMatch,
    excludeMatch: policy.excludeMatch,
    typeMatch: policy.typeMatch,
    itemType: inferredType ?? "(not inferable)",
    status: registeredSources.length > 0 ? (changedPaths.has(sourcePath) ? "changed" : "registered") : "new",
  };
}

function printCandidateExplanation(explanation) {
  console.log(explanation.sourcePath);
  console.log(`  status: ${explanation.status}`);
  console.log(`  include: ${explanation.includeMatch ?? "(no include match)"}`);
  console.log(`  exclude: ${explanation.excludeMatch ?? "(no exclude match)"}`);
  console.log(`  type: ${explanation.itemType}`);
  console.log(`  type rule: ${explanation.typeMatch ?? "(path inference)"}`);
  console.log("");
}

function selectCandidates(candidates, args) {
  if (args.all) {
    return candidates.filter((candidate) => candidate.status === "new" || candidate.status === "changed");
  }

  if (args.changed) {
    return candidates.filter((candidate) => candidate.status === "changed");
  }

  return candidates.filter((candidate) => candidate.status === "new");
}

function fuzzyMatchCandidates(query, candidates) {
  const normalizedQuery = kebabCase(query);
  const lowerQuery = query.toLowerCase();

  return candidates.filter((candidate) => {
    const fields = [
      candidate.sourcePath,
      candidate.itemName,
      candidate.itemType,
      candidate.sourcePath.replace(/\.[^.]+$/, ""),
    ];

    return fields.some((field) => {
      const lowerField = field.toLowerCase();
      return lowerField.includes(lowerQuery) || kebabCase(field).includes(normalizedQuery);
    });
  });
}

function uniqueCandidatesBySourcePath(candidates) {
  const seen = new Set();
  const unique = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.sourcePath)) {
      continue;
    }

    seen.add(candidate.sourcePath);
    unique.push(candidate);
  }

  return unique;
}

function hasAmbiguousCandidates(candidates) {
  const seen = new Set();

  for (const candidate of candidates) {
    if (seen.has(candidate.itemName)) {
      return true;
    }

    seen.add(candidate.itemName);
  }

  return false;
}

function printCandidates(candidates, options = {}) {
  const visibleCandidates = options.statusFilter
    ? candidates.filter((candidate) => candidate.status === options.statusFilter)
    : candidates;

  console.log(options.intro ?? `Found ${visibleCandidates.length} registry candidates.`);

  if (visibleCandidates.length === 0) {
    console.log("No matching files found under components, app, lib, or hooks.");
    return;
  }

  console.log("");

  for (const [index, candidate] of visibleCandidates.entries()) {
    console.log(
      `${index + 1}. ${candidate.sourcePath.padEnd(42)} ${candidate.itemType.padEnd(18)} ${candidate.status.padEnd(
        10,
      )} ${candidate.itemName}`,
    );
  }

  console.log("");
  console.log("Ship one explicitly:");
  console.log(`corepack.cmd pnpm ship ${quotePathForShell(visibleCandidates[0].sourcePath)}`);
}

function walkFiles(cwd, directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (DISCOVERY_IGNORES.has(entry.name)) {
      continue;
    }

    const absoluteEntryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(cwd, absoluteEntryPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = toPosix(path.relative(cwd, absoluteEntryPath));

    if (/\.(tsx|ts|jsx|js)$/.test(relativePath)) {
      files.push(relativePath);
    }
  }

  return files;
}

function getChangedPaths(cwd) {
  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd,
    encoding: "utf8",
    shell: false,
  });

  if (result.error || result.status !== 0) {
    return new Set();
  }

  return new Set(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => line.slice(3).split(" -> ").pop())
      .filter(Boolean)
      .map((filePath) => toPosix(filePath)),
  );
}

function loadShipConfig(cwd) {
  const configPath = path.resolve(cwd, SHIP_CONFIG);

  if (!existsSync(configPath)) {
    return {
      exclude: [],
      include: [
        "components/ui/*.{ts,tsx}",
        "components/blocks/*.{ts,tsx}",
        "components/blocks/*/index.{ts,tsx}",
        "app/**/page.{ts,tsx}",
        "lib/*.{ts,tsx}",
        "hooks/*.{ts,tsx}",
      ],
      types: {},
    };
  }

  const rawConfig = readJson(configPath);

  return {
    exclude: Array.isArray(rawConfig.exclude) ? rawConfig.exclude : [],
    include: Array.isArray(rawConfig.include) ? rawConfig.include : [],
    types: rawConfig.types && typeof rawConfig.types === "object" ? rawConfig.types : {},
  };
}

function getShipPolicy(sourcePath, shipConfig) {
  const includeMatch = findMatchingPattern(sourcePath, shipConfig.include);
  const excludeMatch = findMatchingPattern(sourcePath, shipConfig.exclude);
  const typeEntry = Object.entries(shipConfig.types ?? {}).find(([pattern]) => matchesGlob(sourcePath, pattern));

  return {
    excludeMatch,
    includeMatch,
    typeMatch: typeEntry?.[0],
    typeOverride: typeEntry?.[1],
  };
}

function withPolicyType(args, policy) {
  if (args.type || !policy.typeOverride) {
    return args;
  }

  return {
    ...args,
    type: policy.typeOverride,
  };
}

function findMatchingPattern(sourcePath, patterns) {
  return patterns.find((pattern) => matchesGlob(sourcePath, pattern));
}

function matchesGlob(sourcePath, pattern) {
  return globToRegExp(pattern).test(sourcePath);
}

function globToRegExp(pattern) {
  let index = 0;
  let source = "^";

  while (index < pattern.length) {
    const char = pattern[index];
    const nextChar = pattern[index + 1];

    if (char === "*") {
      if (nextChar === "*") {
        const afterGlobstar = pattern[index + 2];
        if (afterGlobstar === "/") {
          source += "(?:.*/)?";
          index += 3;
        } else {
          source += ".*";
          index += 2;
        }
      } else {
        source += "[^/]*";
        index += 1;
      }
      continue;
    }

    if (char === "?") {
      source += "[^/]";
      index += 1;
      continue;
    }

    if (char === "{") {
      const closeIndex = pattern.indexOf("}", index);
      if (closeIndex !== -1) {
        const choices = pattern
          .slice(index + 1, closeIndex)
          .split(",")
          .map((choice) => escapeRegExp(choice.trim()))
          .join("|");
        source += `(?:${choices})`;
        index = closeIndex + 1;
        continue;
      }
    }

    source += escapeRegExp(char);
    index += 1;
  }

  source += "$";
  return new RegExp(source);
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function runRegistryValidation(cwd) {
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
    fail("Registry validation failed after shipping.");
  }
}

function inferTypeFromPath(sourcePath) {
  if (/^components\/ui\/[^/]+\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
    return "registry:ui";
  }

  if (/^components\/blocks\/[^/]+\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
    return "registry:block";
  }

  if (/^components\/blocks\/[^/]+\/index\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
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
      if (/^components\/blocks\/[^/]+\/index\.(tsx|ts|jsx|js)$/.test(sourcePath)) {
        const blockName = sourcePath.split("/")[2];
        const extension = path.posix.extname(sourcePath);

        return `@components/blocks/${blockName}${extension}`;
      }

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
  const filesBySourcePath = new Map();
  const itemsByName = new Map();

  visitRegistry(rootRegistryPath);

  return { filesBySourcePath, itemsByName };

  function visitRegistry(registryPath) {
    const resolvedRegistryPath = path.resolve(registryPath);

    if (visited.has(resolvedRegistryPath) || !existsSync(resolvedRegistryPath)) {
      return;
    }

    visited.add(resolvedRegistryPath);

    const registry = readJson(resolvedRegistryPath);
    const registryFile = toPosix(path.relative(cwd, resolvedRegistryPath));
    const registryDir = path.dirname(resolvedRegistryPath);

    for (const includePath of registry.include ?? []) {
      visitRegistry(path.resolve(path.dirname(resolvedRegistryPath), includePath));
    }

    for (const [index, item] of (registry.items ?? []).entries()) {
      const entries = itemsByName.get(item.name) ?? [];
      entries.push({ index, registryFile });
      itemsByName.set(item.name, entries);

      for (const file of item.files ?? []) {
        if (!file.path) {
          continue;
        }

        const absoluteSourcePath = path.resolve(registryDir, file.path);
        const relativeSourcePath = path.relative(cwd, absoluteSourcePath);

        if (relativeSourcePath.startsWith("..") || path.isAbsolute(relativeSourcePath)) {
          continue;
        }

        const sourcePath = toPosix(relativeSourcePath);
        const sourceEntries = filesBySourcePath.get(sourcePath) ?? [];
        sourceEntries.push({ index, itemName: item.name, registryFile });
        filesBySourcePath.set(sourcePath, sourceEntries);
      }
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
  console.log(`Usage: pnpm ship [path-or-query] [options]

Discovery:
  pnpm ship                 Auto-ship one new candidate, otherwise list candidates
  pnpm ship --list          List registry candidates
  pnpm ship --list --new    List unregistered candidates
  pnpm ship --changed       Reship registered files changed in git
  pnpm ship --new           Ship all unregistered candidates
  pnpm ship --all           Ship new and changed candidates
  pnpm ship floating        Fuzzy-match and ship one candidate

Options:
  --type ui|component|block|page|lib|hook|file
  --name <item-name>
  --title <title>
  --description <text>
  --deps <package-a,package-b>
  --registry-deps <item-a,item-b>
  --why <path-or-query>
  --dry-run
  --force
  --no-validate
`);
}

function quotePathForShell(filePath) {
  return /[\s[\]{}()]/.test(filePath) ? `"${filePath.replace(/"/g, '\\"')}"` : filePath;
}

function fail(message) {
  console.error(`registry-ship: ${message}`);
  process.exit(1);
}
