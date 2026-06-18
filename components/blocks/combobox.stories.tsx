import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";

const frameworkItems = [
  { value: "next", label: "Next.js", keywords: ["react", "app router"] },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit", disabled: true },
  { value: "vite", label: "Vite" },
];

const meta = {
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  title: "Blocks/Combobox",
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: frameworkItems,
  },
  render: () => <ComboboxStory />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    items: frameworkItems,
  },
  render: () => <ComboboxStory disabled />,
};

function ComboboxStory({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState("next");

  return (
    <div className="w-80">
      <Combobox
        autoHighlight
        disabled={disabled}
        items={frameworkItems}
        value={value}
        onValueChange={setValue}
        emptyText="Không tìm thấy framework."
      >
        <ComboboxInput aria-label="Chọn framework" />
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
  );
}
