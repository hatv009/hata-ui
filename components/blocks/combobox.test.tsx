import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";

const items = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit", disabled: true },
];

describe("Combobox", () => {
  it("selects an enabled item with the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ComboboxFixture onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox", { name: "Framework" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("remix");
  });

  it("filters items from input text", async () => {
    const user = userEvent.setup();

    render(<ComboboxFixture />);

    await user.type(screen.getByRole("combobox", { name: "Framework" }), "ast");

    expect(screen.getByRole("option", { name: "Astro" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Next.js" })).not.toBeInTheDocument();
  });

  it("clears the current value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ComboboxFixture defaultValue="next" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("does not select disabled items", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ComboboxFixture onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    await user.click(screen.getByRole("option", { name: "SvelteKit" }));

    expect(onValueChange).not.toHaveBeenCalledWith("sveltekit");
  });
});

function ComboboxFixture({
  defaultValue,
  onValueChange,
}: {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Combobox
      autoHighlight
      defaultValue={defaultValue}
      emptyText="No frameworks."
      items={items}
      onValueChange={onValueChange}
    >
      <ComboboxInput aria-label="Framework" />
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
  );
}
