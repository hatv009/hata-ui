# React/Vite Structure

Use these rules together with `docs/agent/code-structure.md` for React/Vite projects.

## Route Structure

- Do not use Next.js-only conventions such as `src/app`, `page.tsx`, `loading.tsx`, Server Components, Server Actions, `redirect`, or `notFound`.
- Follow the router already installed in the project. If no router exists, keep route entries under the project's existing `src/routes/`, `src/pages/`, or equivalent convention.
- Keep route entries thin: read route params/search state, call route hooks when needed, and render a feature screen from `src/features/<feature>/`.
- Put large interactive workflows in `src/features/<feature>/screens/`, not directly in route entries.

## Data And State

- Use `src/features/<feature>/api.ts` for browser-side API client functions.
- Put feature hooks, query adapters, and client-side services inside the feature folder unless multiple features genuinely share them.
- Do not import server-only secrets or admin SDK clients into browser code.
- Use framework-neutral React patterns for mutations: pending state, disabled controls, submit labels, error feedback, and optimistic UI when appropriate.
- Use `<Suspense>` for lazy components or data libraries that explicitly support it. Do not use Suspense as a substitute for client mutation pending state.

## Environment

- Only expose browser-safe values with the `VITE_` prefix.
- Treat all values exposed through `import.meta.env` as browser-visible unless the build tool documents otherwise.
