'use client';
import { Combobox, ComboboxContent, ComboboxInput } from "@/components/blocks/combobox";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
const frameworks = [
  { value: "nextjs", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

const ComboboxDemo = () => {
  return (
    <Combobox>
          <ComboboxInput className="w-40" showClear/>
          <ComboboxContent className="p-0">
            <Command>
          <CommandList>
            <CommandEmpty>Không có kết quả.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                  }}
                >
                  {/* <Check className={value === option.value ? "mr-2 h-4 w-4 opacity-100" : "mr-2 h-4 w-4 opacity-0"} /> */}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
          </ComboboxContent>
        </Combobox>
  )
}

export default ComboboxDemo