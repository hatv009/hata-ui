"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

type SearchItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  installPath: string;
  registryDependencies?: string[];
  dependencies?: string[];
  files?: Array<{ path: string; target?: string; type: string }>;
};

export function ComponentSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const types = useMemo(
    () => ["all", ...Array.from(new Set(items.map((item) => item.type))).sort()],
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const matchesQuery =
        !normalizedQuery ||
        [item.name, item.title, item.description, item.type, item.installPath]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesType && matchesQuery;
    });
  }, [items, query, type]);

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          aria-label="Search registry items"
          placeholder="Search by name, type, dependency..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          aria-label="Filter by registry type"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {types.map((typeName) => (
            <option key={typeName} value={typeName}>
              {typeName === "all" ? "All types" : typeName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {filteredItems.map((item) => (
          <Link
            key={item.name}
            className="group rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-foreground/30"
            href={`/components/${item.name}`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-medium">{item.title ?? item.name}</h2>
                  <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {item.type}
                  </span>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {item.description ?? "No description yet."}
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground">
                {item.name}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{item.files?.length ?? 0} files</span>
              <span>{(item.registryDependencies?.length ?? 0) + (item.dependencies?.length ?? 0)} deps</span>
              <span className="font-mono">{item.installPath}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
