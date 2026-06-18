import type * as React from "react";

import { Field, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldLabelFloatingProps = React.ComponentProps<typeof Label>;

type FloatingInputProps = React.ComponentProps<typeof Input> & {
  description?: React.ReactNode;
  label?: React.ReactNode;
};

function FieldLabelFloating({
  className,
  ...props
}: FieldLabelFloatingProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit! gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border *:data-[slot=field]:p-3 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "pointer-events-none absolute left-2 z-10 origin-left bg-background px-1 transition-all duration-200",
        "top-1/3 -translate-y-2/3",
        "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75",
        "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:scale-75",
        className,
      )}
      {...props}
    />
  );
}

function FloatingInput({
  className,
  description = "Tên này sẽ hiển thị công khai.",
  id = "username",
  label = "Tên đăng nhập",
  ...props
}: FloatingInputProps) {
  return (
    <Field className="relative">
      <Input
        id={id}
        placeholder=" "
        className={cn("peer placeholder-transparent", className)}
        {...props}
      />
      <FieldLabelFloating htmlFor={id}>{label}</FieldLabelFloating>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export { FieldLabelFloating, FloatingInput, type FloatingInputProps };
