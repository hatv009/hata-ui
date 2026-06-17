import Link from "next/link";

import { ComponentSearch } from "@/components/docs/component-search";
import { Separator } from "@/components/ui/separator";
import { getRegistryItems, getRegistryStats } from "@/lib/registry-data";

export const metadata = {
  title: "Components | Hata UI",
  description: "Browse Hata UI registry items and install commands.",
};

export default function ComponentsPage() {
  const items = getRegistryItems();
  const stats = getRegistryStats(items);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="space-y-5">
          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link className="text-foreground" href="/">
              Hata UI
            </Link>
            <Link href="/docs/registry-ship">Ship guide</Link>
          </nav>
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Registry catalog
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
              Components, blocks, pages, and helpers ready for shadcn install.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Search the source registry, inspect dependencies, and copy an install command for each item.
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Items" value={stats.itemCount} />
          <Metric label="Files" value={stats.fileCount} />
          <Metric label="Dependencies" value={stats.dependencyCount} />
        </section>

        <Separator />

        <ComponentSearch items={items} />
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
