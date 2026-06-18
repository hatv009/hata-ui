#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT_REGISTRY = "registry.json";
const OUTPUT_DIR = "public/r";
const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

main();

function main() {
  try {
    const cwd = process.cwd();
    const rootRegistryPath = path.resolve(cwd, ROOT_REGISTRY);

    if (!existsSync(rootRegistryPath)) {
      fail(`Root ${ROOT_REGISTRY} was not found.`);
    }

    const registry = collectRegistry(cwd, rootRegistryPath);
    const outputDir = path.resolve(cwd, OUTPUT_DIR);

    rmSync(outputDir, { force: true, recursive: true });
    mkdirSync(outputDir, { recursive: true });

    writeJson(path.join(outputDir, "registry.json"), {
      $schema: registry.$schema,
      name: registry.name,
      homepage: registry.homepage,
      items: registry.items.map((item) => stripBuildMetadata(item)),
    });

    for (const item of registry.items) {
      writeJson(path.join(outputDir, `${item.name}.json`), toRegistryItem(cwd, item));
    }

    console.log(`Built ${registry.items.length} registry items into ${OUTPUT_DIR}.`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function collectRegistry(cwd, rootRegistryPath) {
  const visited = new Set();
  const root = readJson(rootRegistryPath);
  const items = [];

  visit(rootRegistryPath);

  return {
    $schema: root.$schema,
    homepage: root.homepage,
    items,
    name: root.name,
  };

  function visit(registryPath) {
    const resolvedPath = path.resolve(registryPath);

    if (visited.has(resolvedPath)) {
      return;
    }

    visited.add(resolvedPath);

    const registry = readJson(resolvedPath);
    const registryDir = path.dirname(resolvedPath);
    const registryFile = toPosix(path.relative(cwd, resolvedPath));

    for (const includePath of registry.include ?? []) {
      visit(path.resolve(registryDir, includePath));
    }

    for (const item of registry.items ?? []) {
      items.push({
        ...item,
        registryDir,
        registryFile,
      });
    }
  }
}

function toRegistryItem(cwd, item) {
  return {
    $schema: ITEM_SCHEMA,
    name: item.name,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
    files: (item.files ?? []).map((file) => {
      const sourcePath = path.resolve(item.registryDir, file.path);
      const relativePath = toPosix(path.relative(cwd, sourcePath));

      return cleanObject({
        path: relativePath,
        content: readFileSync(sourcePath, "utf8"),
        type: file.type,
        target: file.target,
      });
    }),
    type: item.type,
  };
}

function stripBuildMetadata(item) {
  const publicItem = { ...item };

  delete publicItem.registryDir;
  delete publicItem.registryFile;

  return publicItem;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(cleanObject(value), null, 2)}\n`, "utf8");
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

        return !(Array.isArray(entryValue) && entryValue.length === 0);
      })
      .map(([key, entryValue]) => [key, cleanObject(entryValue)]),
  );
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function fail(message) {
  console.error(`registry-build: ${message}`);
  process.exit(1);
}
