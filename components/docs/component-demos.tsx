"use client";

import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/blocks/combobox";
import { FloatingInput } from "@/components/blocks/floating-input";

const FRAMEWORK_ITEMS = [
  { value: "next", label: "Next.js", keywords: ["react", "app router"] },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit", disabled: true },
  { value: "vite", label: "Vite" },
];

export function ComponentDemo({ name }: { name: string }) {
  if (name === "combobox") {
    return <ComboboxDemo />;
  }

  if (name === "floating-input") {
    return <FloatingInputDemo />;
  }

  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      Chưa có live preview cho item này.
    </div>
  );
}

function ComboboxDemo() {
  const [value, setValue] = useState("next");
  const selectedLabel = useMemo(
    () => FRAMEWORK_ITEMS.find((item) => item.value === value)?.label ?? "Chưa chọn",
    [value],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-h-64 items-center justify-center rounded-lg border bg-muted/30 p-6">
        <Combobox
          autoHighlight
          items={FRAMEWORK_ITEMS}
          value={value}
          onValueChange={setValue}
          emptyText="Không tìm thấy framework."
        >
          <ComboboxInput
            aria-label="Chọn framework"
            className="w-full max-w-sm bg-background"
          />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} item={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm font-medium">Selected value</p>
        <p className="mt-2 font-mono text-sm text-muted-foreground">{value || "empty"}</p>
        <p className="mt-4 text-sm font-medium">Selected label</p>
        <p className="mt-2 text-sm text-muted-foreground">{selectedLabel}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          `SvelteKit` đang disabled để kiểm tra trạng thái không chọn được.
        </p>
      </div>
    </div>
  );
}

function FloatingInputDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-6">
        <FloatingInput
          id="preview-username"
          label="Tên đăng nhập"
          description="Tên này sẽ hiển thị trong hồ sơ công khai."
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <FloatingInput
          id="preview-disabled"
          label="Tên cửa hàng"
          description="Trạng thái disabled."
          disabled
          defaultValue="Hata UI"
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <FloatingInput
          id="preview-error"
          label="Slug"
          description="Slug này đã được sử dụng."
          defaultValue="hata-ui"
          aria-invalid
        />
      </div>

      <div className="dark rounded-lg border bg-card p-6 text-card-foreground">
        <FloatingInput
          id="preview-dark"
          label="Email"
          description="Kiểm tra màu ở dark mode."
          type="email"
        />
      </div>
    </div>
  );
}
