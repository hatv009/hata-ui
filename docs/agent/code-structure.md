# Code Structure

Use these rules when organizing application code.

- Build new non-trivial route workflows feature-first under `src/features/<feature>/`; do not start by putting a large interactive page directly in `src/app`.
- Tiny static or redirect-only routes may stay in `src/app`, but once a route has user workflow state, forms, feature-specific data loading, or repeated UI sections, create a feature module.
- Route-level interactive containers live in `src/features/<feature>/screens/`.
- Reusable feature UI sections live in `src/features/<feature>/components/`.
- Feature-specific schemas, inferred form types, API clients, server data loaders, and domain helpers should stay inside the feature folder.
- Shared app constants live in `src/constants/`.
- Shared runtime helpers live in `src/lib/`.
- Export the feature public API through `src/features/<feature>/index.ts`.
- Avoid barrel files for generic `src/lib` and `src/constants`.

## New Route Workflow Structure

Use this default shape for a new user-facing workflow:

```txt
src/app/<route>/page.tsx
src/features/<feature>/
  index.ts
  api.ts
  data.ts
  schemas.ts
  screens/
  components/
  lib/
```

- `src/app/<route>/page.tsx`: keep thin. It may read route params/search params, call server-only feature data loaders, redirect/notFound, and render a feature screen. If the page waits on request data, wrap the async content in a nearby `<Suspense>` boundary with a feature skeleton.
- `src/features/<feature>/index.ts`: export only the public feature surface used by routes or other features, such as screens, route skeletons, or server data loaders.
- `src/features/<feature>/screens/`: route-level client or server containers that orchestrate page state, router refreshes, toasts, mutations, and composition of feature sections.
- `src/features/<feature>/components/`: reusable feature UI components with explicit props. They should not secretly fetch route data, mutate global route state, or depend on unrelated routes.
- `src/features/<feature>/data.ts`: server-only data loaders for App Router pages. Keep Supabase admin/server calls here or in existing server services, never in Client Components.
- `src/features/<feature>/api.ts`: browser-side API client functions. Use `API_ROUTES` and `src/lib/http.ts` request helpers instead of scattering raw `fetch` calls in screens.
- `src/features/<feature>/schemas.ts`: Zod schemas and `z.infer` types for feature forms, API inputs, and reusable value objects.
- `src/features/<feature>/lib/`: pure helpers, mappers, date math, formatters, and domain utilities that do not touch React state or server secrets.

## Page Composition Rules

- Keep route files in `src/app` as wiring, not product screens.
- Put user workflow state in feature screens, not in `src/app`.
- Put repeated cards, rows, panels, skeleton compositions, and form sections in feature components.
- Put shared route URLs in `src/constants/app-routes.ts` and shared API URLs in `src/constants/api-routes.ts`.
- Use feature-local `api.ts`, `data.ts`, `schemas.ts`, and `lib/` before adding shared abstractions.
- Add shared abstractions only when multiple features genuinely need the same behavior.
- Keep UI copy Vietnamese and readable as UTF-8 source text. Do not use Unicode escape sequences to work around terminal rendering.
- For loading states, compose feature skeletons from shadcn primitives such as `Skeleton` and `Card`; do not create ad hoc loading helpers when a shadcn primitive exists.

## Example Pattern

```tsx
// src/app/example/page.tsx
import { Suspense } from "react";

import {
  ExampleScreen,
  ExampleScreenSkeleton,
  getExampleData,
} from "@/features/example";

export default function ExamplePage() {
  return (
    <Suspense fallback={<ExampleScreenSkeleton />}>
      <ExampleContent />
    </Suspense>
  );
}

async function ExampleContent() {
  const data = await getExampleData();

  return <ExampleScreen initialData={data} />;
}
```

```tsx
// src/features/example/index.ts
export { ExampleScreen } from "./screens/example-screen";
export { ExampleScreenSkeleton } from "./components/example-screen-skeleton";
export { getExampleData } from "./data";
```

## New Page Checklist

- The route file is thin and contains no large JSX workflow.
- Server-only data access is outside Client Components.
- Client mutations use feature API functions and shared HTTP helpers.
- Form schemas and inferred types live in the feature.
- Repeated UI is extracted into feature components with clear props.
- Loading, empty, and error states are represented intentionally.
- shadcn primitives are reused before creating local UI helpers.
- Vietnamese UI copy is readable UTF-8 and passes the mojibake scan in `docs/agent/validation.md`.

For larger refactors, follow `docs/skills/shopee-feature-refactor.md`.
