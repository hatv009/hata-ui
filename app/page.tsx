import Link from "next/link";


import { Separator } from "@/components/ui/separator";
import ComboboxDemo from "@/features/combobox-demo";
import { getGitHubInstallCommand, getRegistryItems, getRegistryStats } from "@/lib/registry-data";



export default function Home() {
  const items = getRegistryItems();
  const stats = getRegistryStats(items);
  const featuredItems = items.slice(0, 4);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10">
        <header className="space-y-8">
          <nav className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link className="font-semibold" href="/">
              Hata UI
            </Link>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <Link href="/components">Components</Link>
              <Link href="/docs/registry-ship">Ship guide</Link>
              <a href="/r/input.json">Registry JSON</a>
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="space-y-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                shadcn registry for Hata UI
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
                Ship reusable UI primitives, blocks, and pages with registry-first docs.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Browse source registry items, inspect install commands, and publish static registry JSON for
                shadcn consumers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                  href="/components"
                >
                  Browse components
                </Link>
                <Link
                  className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
                  href="/docs/registry-ship"
                >
                  Read ship guide
                </Link>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">First install command</p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                {items[0] ? getGitHubInstallCommand(items[0].name) : "No registry items found."}
              </pre>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Registry items" value={stats.itemCount} />
          <Metric label="Files shipped" value={stats.fileCount} />
          <Metric label="Dependencies" value={stats.dependencyCount} />
        </section>

        <Separator />
        <h2 className="text-2xl font-medium">Example</h2>
        <div className="flex flex-col">
        <ComboboxDemo/>
        </div>
       
        <Separator />

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Featured registry items</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Source metadata is read directly from `registry.json` and included registries.
              </p>
            </div>
            <Link className="text-sm font-medium" href="/components">
              View all
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {featuredItems.map((item) => (
              <Link
                className="rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30"
                href={`/components/${item.name}`}
                key={item.name}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium">{item.title ?? item.name}</h3>
                  <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {item.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description ?? "No description yet."}</p>
                <p className="mt-4 font-mono text-xs text-muted-foreground">{item.installPath}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
    </div>
  );
}
