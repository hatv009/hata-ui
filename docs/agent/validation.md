# Validation

## 1. Code, Config, Schema, or Runtime Changes

Run these before considering implementation complete:
`corepack.cmd pnpm lint && corepack.cmd pnpm typecheck && corepack.cmd pnpm build`

## 2. Vietnamese UI Copy

- **Format:** Use UTF-8 and write readable Vietnamese directly. Do NOT use Unicode escape sequences.
- **Verify:** If edited via PowerShell or bulk rewrite, manually check source files for readability.
- **Scan for Mojibake:** `rg "Ã|Ä|Æ|Â|Ð|°|áº|á»" src/features src/app`

## 3. Documentation-Only Changes

Skip full app validation unless bundled with code changes or explicitly requested. Instead:

- **Inspect:** Review changed docs directly.
- **Search:** Verify paths, routes, APIs, tables, and terminology using focused `rg` searches.
- **Audit:** Run repo-local reference audit if docs structure, naming, or phase scope changed.
- **Review:** Check `git diff --cached --stat` before committing.
