import Link from "next/link";

import { ComponentSearch } from "@/components/docs/component-search";
import { Separator } from "@/components/ui/separator";
import { getRegistryItems, getRegistryStats } from "@/lib/registry-data";

export const metadata = {
  title: "Components | Hata UI",
  description: "Duyệt registry items và lệnh cài đặt của Hata UI.",
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
            <Link href="/docs/registry-ship">Hướng dẫn ship</Link>
          </nav>
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Registry catalog
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
              Components, blocks, pages và helpers sẵn sàng cài qua shadcn.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Tìm item trong registry, kiểm tra dependencies và lấy lệnh install cho từng component.
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Items" value={stats.itemCount} />
          <Metric label="Files" value={stats.fileCount} />
          <Metric label="Dependencies" value={stats.dependencyCount} />
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Roadmap</h2>
            <p className="text-sm text-muted-foreground">
              Nhóm component ưu tiên tiếp theo cho registry React/shadcn.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <RoadmapGroup
              title="Form"
              items={["password-input", "otp-input", "textarea-with-counter", "field-error"]}
            />
            <RoadmapGroup
              title="Overlay"
              items={["confirm-dialog", "command-menu", "sheet-form"]}
            />
            <RoadmapGroup
              title="Data display"
              items={["empty-state", "status-badge", "copy-button", "kbd", "metric-card"]}
            />
            <RoadmapGroup
              title="Data entry"
              items={["multi-select", "tag-input", "date-range-picker"]}
            />
          </div>
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

function RoadmapGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border px-2 py-1 font-mono text-xs text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
