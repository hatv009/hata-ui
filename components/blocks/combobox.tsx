import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, XIcon } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import React from 'react'
import { Button } from "../ui/button"



type ComboboxContextProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ComboboxContext = React.createContext<ComboboxContextProps | null>(null);


function ComboboxProvider() {
  return (
    <div>combobox</div>
  )
}


function Combobox({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="combobox" {...props} />
}


function ComboboxTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="combobox-trigger" 
        asChild
{...props}
  >
    <Button variant={'ghost'} size={'icon-xs'}>
        <ChevronDownIcon/>
    </Button>
    </PopoverPrimitive.Trigger>
}


function ComboboxClear({ className, ...props }: React.ComponentProps<typeof InputGroupButton>) {
  return (
    <InputGroupButton
      data-slot="combobox-clear"
      className={cn(className)}
      variant={'ghost'}
      size={'icon-xs'}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </InputGroupButton>
  )
}


function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: React.ComponentProps<"input"> & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  return (
     <PopoverPrimitive.Anchor data-slot="popover-anchor" asChild  >
    <InputGroup className={cn("w-auto", className)}>
      <InputGroupInput {...props}/>
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
    </PopoverPrimitive.Anchor>
  )
}


function ComboboxContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="combobox-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex w-(--radix-popover-trigger-width) origin-(--radix-popover-content-transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Combobox, ComboboxClear, ComboboxContent, ComboboxInput }

