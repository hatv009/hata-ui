"use client";

import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import * as React from "react";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type ComboboxItemData = {
  value: string;
  label: string;
  disabled?: boolean;
  keywords?: string[];
};

type ComboboxItemInput = ComboboxItemData | string;
type ComboboxFilter = (item: ComboboxItemData, query: string) => boolean;

type ComboboxContextProps = {
  clear: () => void;
  disabled: boolean;
  emptyText: string;
  filteredItems: ComboboxItemData[];
  highlightedItem: ComboboxItemData | undefined;
  highlightedValue: string;
  inputValue: string;
  items: ComboboxItemData[];
  open: boolean;
  selectedItem: ComboboxItemData | undefined;
  selectItem: (item: ComboboxItemData) => void;
  setHighlightedValue: (value: string) => void;
  setInputValue: (value: string) => void;
  setOpen: (open: boolean) => void;
  value: string;
};

type ComboboxProps = Omit<
  React.ComponentProps<typeof PopoverPrimitive.Root>,
  "open" | "defaultOpen" | "onOpenChange"
> & {
  autoHighlight?: boolean;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  emptyText?: string;
  filter?: ComboboxFilter;
  inputValue?: string;
  items: ComboboxItemInput[];
  onInputValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  value?: string;
};

const ComboboxContext = React.createContext<ComboboxContextProps | null>(null);

function Combobox({
  autoHighlight = false,
  children,
  defaultInputValue,
  defaultOpen,
  defaultValue,
  disabled = false,
  emptyText = "No results found.",
  filter = defaultComboboxFilter,
  inputValue: inputValueProp,
  items,
  onInputValueChange,
  onOpenChange,
  onValueChange,
  open: openProp,
  value: valueProp,
  ...props
}: ComboboxProps) {
  const normalizedItems = React.useMemo(
    () => items.map(normalizeComboboxItem),
    [items],
  );
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });
  const [inputValue, setInputValue] = useControllableState({
    value: inputValueProp,
    defaultValue:
      defaultInputValue ??
      getItemByValue(normalizedItems, defaultValue)?.label ??
      "",
    onChange: onInputValueChange,
  });
  const [highlightedValue, setHighlightedValue] = React.useState(() =>
    autoHighlight && defaultOpen
      ? (getFirstEnabledItem(
          getFilteredItems(
            normalizedItems,
            defaultInputValue ??
              getItemByValue(normalizedItems, defaultValue)?.label ??
              "",
            filter,
          ),
        )?.value ?? "")
      : "",
  );

  const selectedItem = React.useMemo(
    () => getItemByValue(normalizedItems, value),
    [normalizedItems, value],
  );

  const highlightedItem = React.useMemo(
    () => getItemByValue(normalizedItems, highlightedValue),
    [highlightedValue, normalizedItems],
  );
  const filterInputValue =
    selectedItem && inputValue === selectedItem.label ? "" : inputValue;

  React.useEffect(() => {
    if (valueProp === undefined || inputValueProp !== undefined) {
      return;
    }

    setInputValue(selectedItem?.label ?? "");
  }, [inputValueProp, selectedItem, setInputValue, valueProp]);

  const filteredItems = React.useMemo(
    () => getFilteredItems(normalizedItems, filterInputValue, filter),
    [filter, filterInputValue, normalizedItems],
  );

  const updateHighlightedValue = React.useCallback(
    (nextItems: ComboboxItemData[]) => {
      if (!autoHighlight) {
        return;
      }

      setHighlightedValue(getFirstEnabledItem(nextItems)?.value ?? "");
    },
    [autoHighlight],
  );

  const updateInputValue = React.useCallback(
    (nextInputValue: string) => {
      setInputValue(nextInputValue);
      updateHighlightedValue(
        getFilteredItems(
          normalizedItems,
          selectedItem && nextInputValue === selectedItem.label
            ? ""
            : nextInputValue,
          filter,
        ),
      );
    },
    [
      filter,
      normalizedItems,
      selectedItem,
      setInputValue,
      updateHighlightedValue,
    ],
  );

  const updateOpen = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        updateHighlightedValue(filteredItems);
      }
    },
    [filteredItems, setOpen, updateHighlightedValue],
  );

  const selectItem = React.useCallback(
    (item: ComboboxItemData) => {
      if (item.disabled || disabled) {
        return;
      }

      setValue(item.value);
      setInputValue(item.label);
      setOpen(false);
    },
    [disabled, setInputValue, setOpen, setValue],
  );

  const clear = React.useCallback(() => {
    setValue("");
    updateInputValue("");
  }, [setValue, updateInputValue]);

  const contextValue = React.useMemo<ComboboxContextProps>(
    () => ({
      clear,
      disabled,
      emptyText,
      filteredItems,
      highlightedItem,
      highlightedValue,
      inputValue,
      items: normalizedItems,
      open,
      selectedItem,
      selectItem,
      setHighlightedValue,
      setInputValue: updateInputValue,
      setOpen: updateOpen,
      value,
    }),
    [
      clear,
      disabled,
      emptyText,
      filteredItems,
      highlightedItem,
      highlightedValue,
      inputValue,
      normalizedItems,
      open,
      selectedItem,
      selectItem,
      setHighlightedValue,
      updateInputValue,
      updateOpen,
      value,
    ],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <PopoverPrimitive.Root
        data-slot="combobox"
        open={open}
        onOpenChange={updateOpen}
        {...props}
      >
        {children}
      </PopoverPrimitive.Root>
    </ComboboxContext.Provider>
  );
}

function ComboboxTrigger({
  "aria-label": ariaLabel = "Open options",
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger> & {
  disabled?: boolean;
}) {
  const combobox = useCombobox();

  return (
    <PopoverPrimitive.Trigger data-slot="combobox-trigger" asChild {...props}>
      <InputGroupButton
        className={cn("data-pressed:bg-transparent", className)}
        aria-label={ariaLabel}
        disabled={disabled ?? combobox.disabled}
        size="icon-xs"
        variant="ghost"
      >
        <ChevronDownIcon className="pointer-events-none" />
      </InputGroupButton>
    </PopoverPrimitive.Trigger>
  );
}

function ComboboxClear({
  "aria-label": ariaLabel = "Clear",
  className,
  onClick,
  onMouseDown,
  ...props
}: React.ComponentProps<typeof InputGroupButton>) {
  const combobox = useCombobox();

  return (
    <InputGroupButton
      data-slot="combobox-clear"
      className={cn(className)}
      aria-label={ariaLabel}
      disabled={combobox.disabled}
      size="icon-xs"
      variant="ghost"
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown?.(event);
      }}
      onClick={(event) => {
        combobox.clear();
        onClick?.(event);
      }}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </InputGroupButton>
  );
}

function ComboboxInput({
  className,
  children,
  disabled,
  onChange,
  onKeyDown,
  onClick,
  showClear = true,
  showTrigger = true,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue"> & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  const combobox = useCombobox();
  const isDisabled = disabled ?? combobox.disabled;
  const hasClearValue =
    combobox.inputValue.length > 0 || !!combobox.selectedItem;

  return (
    <PopoverPrimitive.Anchor data-slot="popover-anchor" asChild>
      <InputGroup className={cn("w-auto", className)}>
        <InputGroupInput
          aria-autocomplete="list"
          aria-expanded={combobox.open}
          aria-haspopup="listbox"
          disabled={isDisabled}
          role="combobox"
          value={combobox.inputValue}
          onChange={(event) => {
            combobox.setInputValue(event.target.value);

            if (!combobox.open) {
              combobox.setOpen(true);
            }

            onChange?.(event);
          }}
          onClick={(event) => {
            if (!isDisabled && !combobox.open) {
              combobox.setOpen(true);
            }

            onClick?.(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              combobox.setOpen(true);
              combobox.setHighlightedValue(
                getNextEnabledItem(
                  combobox.filteredItems,
                  combobox.highlightedValue,
                  1,
                )?.value ?? "",
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              combobox.setHighlightedValue(
                getNextEnabledItem(
                  combobox.filteredItems,
                  combobox.highlightedValue,
                  -1,
                )?.value ?? "",
              );
            }

            if (event.key === "Enter" && combobox.highlightedItem) {
              event.preventDefault();
              combobox.selectItem(combobox.highlightedItem);
            }

            if (event.key === "Escape") {
              combobox.setOpen(false);
            }

            onKeyDown?.(event);
          }}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          {showTrigger && (
            <ComboboxTrigger
              className={cn(
                showClear &&
                  hasClearValue &&
                  "group-has-data-[slot=combobox-clear]/input-group:hidden",
              )}
              disabled={isDisabled}
            />
          )}
          {showClear && hasClearValue && (
            <ComboboxClear disabled={isDisabled} />
          )}
        </InputGroupAddon>
        {children}
      </InputGroup>
    </PopoverPrimitive.Anchor>
  );
}

function ComboboxContent({
  className,
  align = "start",
  onOpenAutoFocus,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="combobox-content"
        align={align}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          onOpenAutoFocus?.(event);
        }}
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex w-(--radix-popover-trigger-width) origin-(--radix-popover-content-transform-origin) flex-col overflow-hidden rounded-md bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function ComboboxList({
  className,
  children,
  empty,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode | ((item: ComboboxItemData) => React.ReactNode);
  empty?: React.ReactNode;
}) {
  const combobox = useCombobox();
  const listChildren =
    typeof children === "function" ? (
      combobox.filteredItems.length > 0 ? (
        combobox.filteredItems.map(children)
      ) : empty !== undefined ? (
        <ComboboxEmpty>{empty}</ComboboxEmpty>
      ) : (
        <ComboboxEmpty />
      )
    ) : (
      children
    );

  return (
    <div
      data-slot="combobox-list"
      role="listbox"
      className={cn("max-h-72 overflow-y-auto overscroll-contain", className)}
      {...props}
    >
      {listChildren}
    </div>
  );
}

function ComboboxItem({
  className,
  item,
  value,
  children,
  onClick,
  onMouseEnter,
  ...props
}: Omit<React.ComponentProps<"button">, "value"> & {
  item?: ComboboxItemData;
  value?: string;
}) {
  const combobox = useCombobox();
  const resolvedItem = item ??
    getItemByValue(combobox.items, value) ?? {
      value: value ?? "",
      label: value ?? "",
    };
  const selected = combobox.value === resolvedItem.value;
  const highlighted = combobox.highlightedValue === resolvedItem.value;

  return (
    <button
      aria-disabled={resolvedItem.disabled}
      aria-selected={selected}
      data-disabled={resolvedItem.disabled ? "" : undefined}
      data-highlighted={highlighted ? "" : undefined}
      data-selected={selected ? "" : undefined}
      data-slot="combobox-item"
      role="option"
      type="button"
      className={cn(
        "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-hidden select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-medium data-disabled:pointer-events-none data-disabled:opacity-50 hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
        className,
      )}
      disabled={resolvedItem.disabled}
      onClick={(event) => {
        combobox.selectItem(resolvedItem);
        onClick?.(event);
      }}
      onMouseEnter={(event) => {
        if (!resolvedItem.disabled) {
          combobox.setHighlightedValue(resolvedItem.value);
        }

        onMouseEnter?.(event);
      }}
      {...props}
    >
      {children ?? resolvedItem.label}

      {selected === true && <CheckIcon className="ml-auto size-4" />}
    </button>
  );
}

function ComboboxEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const combobox = useCombobox();

  if (combobox.filteredItems.length > 0) {
    return null;
  }

  return (
    <div
      data-slot="combobox-empty"
      className={cn(
        "px-2 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? combobox.emptyText}
    </div>
  );
}

function useCombobox() {
  const context = React.useContext(ComboboxContext);

  if (!context) {
    throw new Error("useCombobox must be used within <Combobox />");
  }

  return context;
}

function defaultComboboxFilter(item: ComboboxItemData, query: string) {
  const normalizedQuery = normalizeText(query);
  const searchableText = [item.label, item.value, ...(item.keywords ?? [])]
    .map(normalizeText)
    .join(" ");

  return searchableText.includes(normalizedQuery);
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function normalizeComboboxItem(item: ComboboxItemInput) {
  if (typeof item === "string") {
    return {
      value: item,
      label: item,
    };
  }

  return item;
}

function getFilteredItems(
  items: ComboboxItemData[],
  query: string,
  filter: ComboboxFilter,
) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => filter(item, normalizedQuery));
}

function getFirstEnabledItem(items: ComboboxItemData[]) {
  return items.find((item) => !item.disabled);
}

function getItemByValue(items: ComboboxItemData[], value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return items.find((item) => item.value === value);
}

function getNextEnabledItem(
  items: ComboboxItemData[],
  currentValue: string,
  direction: 1 | -1,
) {
  const enabledItems = items.filter((item) => !item.disabled);

  if (enabledItems.length === 0) {
    return undefined;
  }

  const currentIndex = enabledItems.findIndex(
    (item) => item.value === currentValue,
  );
  const nextIndex =
    currentIndex === -1
      ? direction === 1
        ? 0
        : enabledItems.length - 1
      : (currentIndex + direction + enabledItems.length) % enabledItems.length;

  return enabledItems[nextIndex];
}

function useControllableState<T>({
  defaultValue,
  onChange,
  value,
}: {
  defaultValue: T;
  onChange?: (value: T) => void;
  value?: T;
}) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: T) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  return [currentValue, setValue] as const;
}

export {
    Combobox,
    ComboboxClear,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    useCombobox,
    type ComboboxItemData,
    type ComboboxItemInput
};

