import * as React from "react";

import { cn } from "@/lib/utils";
import { FieldLabel } from "@/components/ui/field";

type Props = React.ComponentProps<"input"> & {
  label: string;
  htmlFor?: string;
};

function Input({ className, type, label, htmlFor, ...props }: Props) {
  return (
    <div className="relative mt-2">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "peer placeholder-transparent",
          className,
        )}
        placeholder=" "
        {...props}
      />
      <FieldLabel
        htmlFor={htmlFor}
        className={cn(
          "absolute left-2 z-10 origin-left bg-background px-1 text-muted-foreground duration-200 pointer-events-none transition-all",
          "top-1/2 -translate-y-2/3 scale-100",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-focus:text-primary",
          "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:scale-75",
        )}
      >
        {label}
      </FieldLabel>
    </div>
  );
}

export { Input };
