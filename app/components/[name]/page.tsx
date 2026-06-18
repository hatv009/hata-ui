import Link from "next/link";
import { notFound } from "next/navigation";

import { ComponentDemo } from "@/components/docs/component-demos";
import { Separator } from "@/components/ui/separator";
import {
  getRegistryComponentApi,
  getGitHubInstallCommand,
  getRegistryItem,
  getRegistryItemSourceFiles,
  getRegistryItems,
  getStaticInstallCommand,
  getStaticRegistryUrl,
  type RegistryComponentApi,
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
  const sourceFiles = getRegistryItemSourceFiles(item);
  const componentApi = getRegistryComponentApi(item);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
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
              {item.description ?? "Chưa có mô tả."}
            </p>
          </div>
        </header>

        <section className="grid gap-4">
          <CommandBlock label="Cài từ GitHub registry" value={getGitHubInstallCommand(item.name)} />
          <CommandBlock label="Cài từ static registry" value={getStaticInstallCommand(item.name)} />
          <CommandBlock label="Static registry URL" value={getStaticRegistryUrl(item.name)} />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading
            title="Live preview"
            description="Các trạng thái chính để kiểm tra nhanh trước khi install."
          />
          <ComponentDemo name={item.name} />
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2">
          <InfoPanel title="Registry dependencies" values={registryDeps} empty="Không có registry dependency." />
          <InfoPanel title="Package dependencies" values={packageDeps} empty="Không có package dependency." />
        </section>

        <section className="space-y-3">
          <SectionHeading
            title="Files"
            description="Source files sẽ được copy bởi shadcn registry installer."
          />
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

        <section className="space-y-4">
          <SectionHeading
            title="Code"
            description="Snapshot từ source file trong registry."
          />
          <div className="grid gap-4">
            {sourceFiles.map((file) => (
              <SourceBlock key={file.sourcePath} label={file.sourcePath} value={file.content} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            title="API"
            description="Props được trích xuất từ TypeScript source khi có thể."
          />
          {componentApi.length ? (
            <div className="grid gap-4">
              {componentApi.map((component) => (
                <ApiTable key={`${component.filePath}-${component.displayName}`} component={component} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Chưa trích xuất được props cho item này.
            </div>
          )}
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

function SourceBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/50 px-4 py-2">
        <p className="font-mono text-xs text-muted-foreground">{label}</p>
      </div>
      <pre className="max-h-[520px] overflow-auto p-4 font-mono text-xs leading-6 text-muted-foreground">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ApiTable({ component }: { component: RegistryComponentApi }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="font-mono text-sm font-medium">{component.displayName}</h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{component.filePath}</p>
      </div>
      <div
        aria-label={`Bảng API của ${component.displayName}`}
        className="overflow-x-auto"
        tabIndex={0}
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Prop</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Bắt buộc</th>
              <th className="px-4 py-2 font-medium">Default</th>
              <th className="px-4 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {component.props.map((prop) => (
              <tr key={prop.name} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{prop.name}</td>
                <td className="max-w-xs px-4 py-2 font-mono text-xs text-muted-foreground">
                  {prop.type}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{prop.required ? "Có" : "Không"}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {prop.defaultValue ?? "-"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {prop.description || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
