import Link from "next/link";
import { notFound } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import {
  getGitHubInstallCommand,
  getRegistryItem,
  getRegistryItems,
  getStaticInstallCommand,
  getStaticRegistryUrl,
} from "@/lib/registry-data";

export function generateStaticParams() {
  return getRegistryItems().map((item) => ({
    name: item.name,
  }));
}

export async function generateMetadata({ params }: PageProps<"/components/[name]">) {
  const { name } = await params;
  const item = getRegistryItem(name);

  if (!item) {
    return {
      title: "Component not found | Hata UI",
    };
  }

  return {
    title: `${item.title ?? item.name} | Hata UI`,
    description: item.description,
  };
}

export default async function ComponentDetailPage({ params }: PageProps<"/components/[name]">) {
  const { name } = await params;
  const item = getRegistryItem(name);

  if (!item) {
    notFound();
  }

  const registryDeps = item.registryDependencies ?? [];
  const packageDeps = item.dependencies ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link href="/">Hata UI</Link>
          <Link href="/components">Components</Link>
          <span className="text-foreground">{item.name}</span>
        </nav>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {item.type}
            </span>
            <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {item.sourceRegistry}
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">{item.title ?? item.name}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {item.description ?? "No description yet."}
            </p>
          </div>
        </header>

        <section className="grid gap-4">
          <CommandBlock label="GitHub registry install" value={getGitHubInstallCommand(item.name)} />
          <CommandBlock label="Static registry install" value={getStaticInstallCommand(item.name)} />
          <CommandBlock label="Static registry URL" value={getStaticRegistryUrl(item.name)} />
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2">
          <InfoPanel title="Registry dependencies" values={registryDeps} empty="No registry dependencies." />
          <InfoPanel title="Package dependencies" values={packageDeps} empty="No package dependencies." />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Files</h2>
          <div className="grid gap-3">
            {(item.files ?? []).map((file) => (
              <div key={`${file.path}-${file.type}`} className="rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <code className="font-mono text-sm">{file.path}</code>
                  <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {file.type}
                  </span>
                </div>
                {file.target ? (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">target: {file.target}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function CommandBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">{label}</p>
      <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
        {value}
      </pre>
    </div>
  );
}

function InfoPanel({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={value} className="rounded-md border px-2 py-1 font-mono text-xs text-muted-foreground">
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
