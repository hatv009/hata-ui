"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/blocks/combobox"

const frameworks = [
  { value: "nextjs", label: "Next.js", keywords: ["react", "vercel"] },
  { value: "sveltekit", label: "SvelteKit", keywords: ["svelte"] },
  { value: "nuxt", label: "Nuxt.js", keywords: ["vue"] },
  { value: "remix", label: "Remix", keywords: ["react"] },
  { value: "astro", label: "Astro", keywords: ["content"] },
]

const ComboboxDemo = () => {
  return (
    <Combobox items={frameworks} autoHighlight>
      <ComboboxInput className="w-56" placeholder="Tìm framework..." />
      <ComboboxContent>
        <ComboboxList empty="Không có kết quả.">
          {(item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export default ComboboxDemo
