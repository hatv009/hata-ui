# Hata UI

Registry-first React components and blocks for shadcn projects.

## Development

```bash
corepack.cmd pnpm dev
```

Open `http://localhost:3000/components` to browse registry items.

## Component Docs

- `/components` lists registry items.
- `/components/[name]` shows install commands, live previews, source snippets, dependencies, and extracted props.
- Storybook is available for isolated component review:

```bash
corepack.cmd pnpm storybook
```

## Registry Workflow

Ship a component into the source registry:

```bash
corepack.cmd pnpm ship components/blocks/floating-input/index.tsx
```

Validate and build static registry JSON:

```bash
corepack.cmd pnpm registry:validate
corepack.cmd pnpm registry:build
```

Static item JSON is written to `public/r/<item>.json`.

## Validation

```bash
corepack.cmd pnpm validate
corepack.cmd pnpm typecheck
corepack.cmd pnpm lint
corepack.cmd pnpm test
corepack.cmd pnpm build
```

Use Storybook for visual review and Vitest for component behavior tests.
