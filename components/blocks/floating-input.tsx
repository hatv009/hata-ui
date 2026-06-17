import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FieldLabelFloating({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit! gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border *:data-[slot=field]:p-3 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "absolute left-2 z-10 origin-left bg-background px-1 duration-200 pointer-events-none transition-all",
        "top-1/3 -translate-y-2/3",
        "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75",
        "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:scale-75",
        className,
      )}
      {...props}
    />
  );
}

function FloatingInput() {
  return (
    <Field className="relative">
      <Input
        id="username"
        placeholder=" " // Khoảng trắng bắt buộc để kích hoạt :placeholder-shown
        className="peer placeholder-transparent"
      />
      <FieldLabelFloating htmlFor="username">Tên đăng nhập</FieldLabelFloating>
      <FieldDescription>Tên này sẽ hiển thị công khai.</FieldDescription>
    </Field>
  );
}

export { FloatingInput, FieldLabelFloating };
