# Registry Ship Guide

Use `pnpm ship` to register an existing component, block, page, hook, or utility file into the shadcn registry.

The command does not create source files. Create or edit the component first, then ship it into the registry.

## Commands

```bash
corepack.cmd pnpm ship
corepack.cmd pnpm ship components/ui/input.tsx
corepack.cmd pnpm ship components/blocks/floating-input.tsx
corepack.cmd pnpm ship app/examples/login/page.tsx
```

Preview without writing:

```bash
corepack.cmd pnpm ship components/ui/input.tsx --dry-run
```

List candidates without writing:

```bash
corepack.cmd pnpm ship --list
corepack.cmd pnpm ship --list --new
corepack.cmd pnpm ship --list --changed
```

Explain why a file is or is not shippable:

```bash
corepack.cmd pnpm ship --why app/docs/registry-ship/page.tsx
```

Ship by discovery:

```bash
corepack.cmd pnpm ship --new
corepack.cmd pnpm ship --changed
corepack.cmd pnpm ship --all
corepack.cmd pnpm ship floating
```

Validate the whole registry:

```bash
corepack.cmd pnpm registry:validate
```

Build static registry JSON into `public/r`:

```bash
corepack.cmd pnpm registry:build
```

## What Gets Inferred

`pnpm ship` infers the registry item from the file path:

| Source path | Registry item type | Target |
| --- | --- | --- |
| `components/ui/*.tsx` | `registry:ui` | `@ui/<file>.tsx` |
| `components/blocks/*.tsx` | `registry:block` | `@components/blocks/<file>.tsx` |
| `app/**/page.tsx` | `registry:page` | same app path |
| `lib/*.ts` | `registry:lib` | `@lib/<file>.ts` |
| `hooks/*.ts` | `registry:hook` | `@hooks/<file>.ts` |

Unknown paths must pass `--type`.

## Options

```bash
corepack.cmd pnpm ship [path-or-query] [options]
```

| Option | Purpose |
| --- | --- |
| `--list` | Scan and print candidates without writing files. |
| `--new` | Ship unregistered candidates. |
| `--changed` | Reship registered candidates with changed source files in git. |
| `--all` | Ship both new and changed candidates. |
| `--type ui|component|block|page|lib|hook|file` | Override type inference. |
| `--name <name>` | Override inferred item name. |
| `--title <title>` | Override generated title. |
| `--description <text>` | Set registry description. |
| `--deps <pkg-a,pkg-b>` | Add npm dependencies. |
| `--registry-deps <item-a,item-b>` | Add registry dependencies. |
| `--why <path-or-query>` | Explain include/exclude/type matching without writing files. |
| `--force` | Allow an explicit path that is excluded by `registry.ship.json`. |
| `--dry-run` | Print the item without writing files. |
| `--no-validate` | Skip `shadcn registry validate`. |

## Ship Policy

`registry.ship.json` is the source of truth for which files discovery mode can see.

It keeps `pnpm ship --new`, `pnpm ship --changed`, fuzzy queries, and no-path runs from accidentally registering docs pages, internal helpers, demo-only files, or unfinished APIs.

```json
{
  "include": [
    "components/ui/*.{ts,tsx}",
    "components/blocks/*.{ts,tsx}",
    "app/examples/**/page.{ts,tsx}",
    "lib/utils.ts",
    "hooks/*.{ts,tsx}"
  ],
  "exclude": [
    "app/components/**",
    "app/docs/**",
    "app/page.tsx",
    "components/docs/**",
    "lib/registry-data.ts",
    "**/*.test.*",
    "**/*.spec.*",
    "**/*.stories.*"
  ],
  "types": {
    "components/ui/*.{ts,tsx}": "ui",
    "components/blocks/*.{ts,tsx}": "block",
    "app/examples/**/page.{ts,tsx}": "page",
    "lib/utils.ts": "lib",
    "hooks/*.{ts,tsx}": "hook"
  }
}
```

Policy fields:

| Field | Purpose |
| --- | --- |
| `include` | Glob-like patterns allowed in discovery mode. |
| `exclude` | Glob-like patterns always hidden from discovery mode. |
| `types` | Pattern-based type overrides used before path inference. |
| `defaults` | Reserved for future defaults such as package namespace or helper dependency. |

Discovery mode only scans files that match `include` and do not match `exclude`.

Explicit paths are more permissive: a path outside `include` can still ship if type inference works or you pass `--type`. A path that matches `exclude` fails unless you pass `--force`.

```bash
corepack.cmd pnpm ship app/docs/registry-ship/page.tsx
corepack.cmd pnpm ship app/docs/registry-ship/page.tsx --force --dry-run
```

Use `--why` when a candidate does not appear or when the inferred type looks surprising:

```bash
corepack.cmd pnpm ship --why app/docs/registry-ship/page.tsx
corepack.cmd pnpm ship --why floating
```

Public shippable pages should live under `app/examples/**`. Keep docs, app chrome, and internal browser pages outside the registry surface.

## Discovery Mode

When you run `pnpm ship` without a path, the script scans `components`, `app`, `lib`, and `hooks`, then filters those files through `registry.ship.json`.

- If it finds exactly one unregistered candidate, it ships that file.
- If it finds multiple candidates, it prints the list and exits without writing.
- If it finds none, it prints an empty result and exits successfully.

Candidate statuses:

| Status | Meaning |
| --- | --- |
| `new` | File can be inferred but is not registered yet. |
| `registered` | File is already present in an included registry. |
| `changed` | File is registered and appears in `git status --porcelain`. |

You can also pass a fuzzy query instead of a path:

```bash
corepack.cmd pnpm ship floating
corepack.cmd pnpm ship login
```

If the query matches one candidate, the script ships it. If it matches more than one, it prints the matches and asks you to ship one path explicitly.

## Dependency Inference

The script reads imports from the shipped file:

- `@/components/ui/input` becomes registry dependency `input`.
- `@/components/ui/field` becomes registry dependency `field`.
- `@/lib/utils` becomes registry dependency `hatv009/hata-ui/helpers-utilities`.
- Bare package imports such as `lucide-react` become npm dependencies.
- `react`, `react-dom`, `next/*`, local relative imports, and other `@/` aliases are ignored unless handled above.

Add anything missed with `--deps` or `--registry-deps`.

## Examples

Let the script decide:

```bash
corepack.cmd pnpm ship
```

Ship a primitive:

```bash
corepack.cmd pnpm ship components/ui/button.tsx
```

Ship a block and keep a custom description:

```bash
corepack.cmd pnpm ship components/blocks/floating-input.tsx --description "Input with label floating"
```

Ship a page:

```bash
corepack.cmd pnpm ship app/examples/login/page.tsx
```

Reship changed registered files:

```bash
corepack.cmd pnpm ship --changed
```

Ship all unregistered files:

```bash
corepack.cmd pnpm ship --new
```

If `app/registry.json` does not exist, the script creates it and adds it to the root `registry.json` include list.

## Publishing Flow

1. Create or edit the source component/page.
2. Run `corepack.cmd pnpm ship --list --new`.
3. Run `corepack.cmd pnpm ship <path> --dry-run`.
4. Run `corepack.cmd pnpm ship <path>`.
5. Run `corepack.cmd pnpm lint`.
6. Run `corepack.cmd pnpm build`.
7. Tag or publish the repo release.

Consumers can install from the GitHub registry:

```bash
corepack.cmd pnpm dlx shadcn@latest add hatv009/hata-ui/<item>#<tag>
```

Example:

```bash
corepack.cmd pnpm dlx shadcn@latest add hatv009/hata-ui/floating-input#v0.1.0
```

## Notes

- Item names must be unique across all included registry files.
- The script updates an existing item when the same name already exists in the same registry file.
- For a different item name, pass `--name`.
- Keep Vietnamese UI copy readable as UTF-8. If PowerShell output looks suspicious, scan with the command in `docs/agent/validation.md`.
