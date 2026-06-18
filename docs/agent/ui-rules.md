# UI Rules

Use these rules for dashboard and extension UI work.

- Use shadcn/ui components from `src/components/ui` for dashboard UI.
- Before creating a local UI helper or primitive, check whether a matching shadcn/ui component already exists in `src/components/ui`.
- If a matching shadcn/ui primitive is missing, use the shadcn MCP tools to search/view the component and get the add command before hand-writing a replacement.
- Only create custom components directly when they are domain-specific app components, such as dashboard sections, product rows, voucher cards, or feature-specific skeleton compositions.
- Use `lucide-react` icons for icon buttons and visual labels.
- Use pnpm as the package manager through Corepack: `corepack.cmd pnpm ...`.
- Add shadcn components with `corepack.cmd pnpm dlx shadcn@latest add <component>` on Windows.
- Prefer shadcn form patterns for submit flows: `Label`, `Input`, `Textarea`, `Button`, inline validation copy, and `Alert` for feedback.
- For sections that wait on async data, prefer a nearby React `<Suspense>` boundary with a feature-level skeleton fallback when the framework supports that pattern and a meaningful shell can render first.
- Do not use Suspense as a substitute for client mutation state. Form submissions and button actions should expose pending state with disabled controls, submit labels, or optimistic UI where appropriate.
- Build loading fallbacks from shadcn primitives such as `Skeleton`, `Card`, `Alert`, and `Button`; feature files may compose those primitives into domain-specific skeletons.
- Keep pages operational and dashboard-first; do not replace app screens with marketing landing pages.
- Vietnamese is the default product language. User-facing web UI and extension text should be Vietnamese unless the user asks otherwise.
