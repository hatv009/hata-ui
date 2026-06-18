# Validation

## 1. Code, Config, Schema, or Runtime Changes

Run these before considering implementation complete:
`corepack.cmd pnpm validate && corepack.cmd pnpm typecheck && corepack.cmd pnpm lint && corepack.cmd pnpm test && corepack.cmd pnpm build`

## 2. Vietnamese UI Copy

- **Format:** Use UTF-8 and write readable Vietnamese directly. Do NOT use Unicode escape sequences.
- **Verify:** If edited via PowerShell or bulk rewrite, manually check source files for readability.

## 3. Registry Changes

- Validate source registry: `corepack.cmd pnpm registry:validate`.
- Build static registry JSON: `corepack.cmd pnpm registry:build`.
- Inspect generated `public/r/<item>.json` when component source, dependencies, or targets change.

## 4. Documentation-Only Changes

Skip full app validation unless bundled with code changes or explicitly requested. Instead:

- **Inspect:** Review changed docs directly.
- **Search:** Verify paths, routes, APIs, tables, and terminology using focused `rg` searches.
- **Audit:** Run repo-local reference audit if docs structure, naming, or phase scope changed.
- **Review:** Check `git diff --cached --stat` before committing.
