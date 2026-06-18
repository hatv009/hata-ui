# Next.js Structure

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Use these rules together with `docs/agent/code-structure.md` for Next.js projects.

## App Router Structure

- Keep `src/app/<route>/page.tsx` thin. It may read `params` or `searchParams`, call server-only feature data loaders, use `redirect` or `notFound`, and render a feature screen.
- Put large interactive workflows in `src/features/<feature>/screens/`, not directly in route files.
- Keep server-only data access in feature loaders, server services, or other server-only modules. Never import secrets or admin clients into Client Components.
- Use `src/features/<feature>/data.ts` for server-only route data loaders when the data belongs to one feature.
- Use `src/features/<feature>/api.ts` for browser-side API client functions.
- Pass only serializable props from Server Components to Client Components.

## Loading And Navigation

- If a route waits on request data but can show a meaningful shell, wrap the async content in a nearby `<Suspense>` boundary with a feature skeleton.
- Use `loading.tsx` only when the loading UI should apply to the whole route segment.
- Avoid root-level loading UI when it would unintentionally cover unrelated pages.
- Do not add `unstable_instant` to auth-gated or user-specific dynamic routes unless the route has been deliberately designed with a validated static shell.

## Environment And Fonts

- Only expose browser-safe values with the `NEXT_PUBLIC_` prefix.
- Keep server-only values unprefixed and read them only in server-safe modules.
- `next/font/google` is allowed when `corepack.cmd pnpm build` verifies successfully in the current environment.
