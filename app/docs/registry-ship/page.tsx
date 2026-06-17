import Link from "next/link";

import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Registry Ship Guide | Hata UI",
  description: "How to register Hata UI components, blocks, pages, hooks, and utilities.",
};

const inferenceRows = [
  ["components/ui/*.tsx", "registry:ui", "@ui/<file>.tsx"],
  ["components/blocks/*.tsx", "registry:block", "@components/blocks/<file>.tsx"],
  ["app/**/page.tsx", "registry:page", "same app path"],
  ["lib/*.ts", "registry:lib", "@lib/<file>.ts"],
  ["hooks/*.ts", "registry:hook", "@hooks/<file>.ts"],
];

const options = [
  ["--list", "Scan and print candidates without writing files."],
  ["--new", "Ship unregistered candidates."],
  ["--changed", "Reship registered candidates with changed source files in git."],
  ["--all", "Ship both new and changed candidates."],
  ["--type ui|component|block|page|lib|hook|file", "Override type inference."],
  ["--name <name>", "Override inferred item name."],
  ["--title <title>", "Override generated title."],
  ["--description <text>", "Set registry description."],
  ["--deps <pkg-a,pkg-b>", "Add npm dependencies."],
  ["--registry-deps <item-a,item-b>", "Add registry dependencies."],
  ["--why <path-or-query>", "Explain include, exclude, and type matching without writing files."],
  ["--force", "Allow an explicit path that is excluded by registry.ship.json."],
  ["--dry-run", "Print the item without writing files."],
  ["--no-validate", "Skip shadcn registry validate."],
];

const policyRows = [
  ["include", "Glob-like patterns allowed in discovery mode."],
  ["exclude", "Glob-like patterns always hidden from discovery mode."],
  ["types", "Pattern-based type overrides used before path inference."],
  ["defaults", "Reserved for future defaults such as namespace or helper dependency."],
];

export default function RegistryShipDocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link href="/">Hata UI</Link>
          <Link href="/components">Components</Link>
          <span className="text-foreground">Ship guide</span>
        </nav>

        <header className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Registry workflow
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
            Register existing files into the shadcn registry with one command.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Create or edit the source component first, then use `pnpm ship` to infer metadata, update the nearest
            registry file, and validate the catalog.
          </p>
        </header>

        <section className="grid gap-4">
          <CommandBlock command="corepack.cmd pnpm ship" />
          <CommandBlock command="corepack.cmd pnpm ship components/ui/input.tsx" />
          <CommandBlock command="corepack.cmd pnpm ship components/blocks/floating-input.tsx" />
          <CommandBlock command="corepack.cmd pnpm ship app/examples/login/page.tsx --dry-run" />
          <CommandBlock command="corepack.cmd pnpm ship --list --new" />
          <CommandBlock command="corepack.cmd pnpm ship --changed" />
          <CommandBlock command="corepack.cmd pnpm ship --why app/docs/registry-ship/page.tsx" />
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Path inference</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Source path</th>
                  <th className="px-4 py-3 font-medium">Registry type</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {inferenceRows.map(([source, type, target]) => (
                  <tr key={source} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{source}</td>
                    <td className="px-4 py-3 font-mono text-xs">{type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Discovery mode</h2>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <p>
              Running `pnpm ship` without a path scans `components`, `app`, `lib`, and `hooks`, then filters those
              files through `registry.ship.json`. One unregistered candidate ships automatically; multiple candidates
              are listed without writing.
            </p>
            <p>
              Status values are `new` for unregistered files, `registered` for files already present in a registry,
              and `changed` for registered files shown by `git status --porcelain`.
            </p>
            <p>
              You can also pass a fuzzy query such as `floating` or `login`. One match ships; multiple matches are
              printed so you can choose an explicit path.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Ship policy</h2>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <p>
              `registry.ship.json` keeps discovery commands from registering docs pages, internal helpers, demo-only
              files, or components that are not public API yet.
            </p>
            <p>
              Discovery commands only see files that match `include` and do not match `exclude`. Explicit paths outside
              `include` can still ship if type inference works or you pass `--type`; explicit paths matching `exclude`
              require `--force`.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Field</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {policyRows.map(([field, purpose]) => (
                  <tr key={field} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{field}</td>
                    <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4">
            <CommandBlock command="corepack.cmd pnpm ship --list --new" />
            <CommandBlock command="corepack.cmd pnpm ship --why app/docs/registry-ship/page.tsx" />
            <CommandBlock command="corepack.cmd pnpm ship app/docs/registry-ship/page.tsx --force --dry-run" />
          </div>
          <p className="text-sm text-muted-foreground">
            Public shippable pages should live under `app/examples/**`; docs, app chrome, and internal browser pages
            should stay outside the registry surface.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Options</h2>
          <div className="grid gap-3">
            {options.map(([option, description]) => (
              <div key={option} className="rounded-lg border bg-card p-4">
                <code className="font-mono text-sm">{option}</code>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Publish flow</h2>
          <ol className="grid gap-3 text-sm text-muted-foreground">
            <li>1. Create or edit the source component/page.</li>
            <li>2. Run `corepack.cmd pnpm ship --list --new`.</li>
            <li>3. Run `corepack.cmd pnpm ship &lt;path&gt; --dry-run`.</li>
            <li>4. Run `corepack.cmd pnpm ship &lt;path&gt;`.</li>
            <li>5. Run `corepack.cmd pnpm lint` and `corepack.cmd pnpm build`.</li>
            <li>6. Tag or publish the repo release.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function CommandBlock({ command }: { command: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-card p-4 font-mono text-xs text-muted-foreground">
      {command}
    </pre>
  );
}
