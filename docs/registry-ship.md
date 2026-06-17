# Registry Ship Guide

Use `pnpm ship` to register an existing component, block, page, hook, or utility file into the shadcn registry.

The command does not create source files. Create or edit the component first, then ship it into the registry.

## Commands

```bash
corepack.cmd pnpm ship components/ui/input.tsx
corepack.cmd pnpm ship components/blocks/floating-input.tsx
corepack.cmd pnpm ship app/examples/login/page.tsx
```

Preview without writing:

```bash
corepack.cmd pnpm ship components/ui/input.tsx --dry-run
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
corepack.cmd pnpm ship <path> [options]
```

| Option | Purpose |
| --- | --- |
| `--type ui|component|block|page|lib|hook|file` | Override type inference. |
| `--name <name>` | Override inferred item name. |
| `--title <title>` | Override generated title. |
| `--description <text>` | Set registry description. |
| `--deps <pkg-a,pkg-b>` | Add npm dependencies. |
| `--registry-deps <item-a,item-b>` | Add registry dependencies. |
| `--dry-run` | Print the item without writing files. |
| `--no-validate` | Skip `shadcn registry validate`. |

## Dependency Inference

The script reads imports from the shipped file:

- `@/components/ui/input` becomes registry dependency `input`.
- `@/components/ui/field` becomes registry dependency `field`.
- `@/lib/utils` becomes registry dependency `hatv009/hata-ui/helpers-utilities`.
- Bare package imports such as `lucide-react` become npm dependencies.
- `react`, `react-dom`, `next/*`, local relative imports, and other `@/` aliases are ignored unless handled above.

Add anything missed with `--deps` or `--registry-deps`.

## Examples

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

If `app/registry.json` does not exist, the script creates it and adds it to the root `registry.json` include list.

## Publishing Flow

1. Create or edit the source component/page.
2. Run `corepack.cmd pnpm ship <path> --dry-run`.
3. Run `corepack.cmd pnpm ship <path>`.
4. Run `corepack.cmd pnpm lint`.
5. Run `corepack.cmd pnpm build`.
6. Tag or publish the repo release.

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
