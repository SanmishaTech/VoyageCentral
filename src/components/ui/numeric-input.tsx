import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumericInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "onChange"
> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Allow decimal point (default true) */
  allowDecimal?: boolean;
};

/**
 * Text input that only accepts numeric characters (and optional decimal).
 */
const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, onChange, allowDecimal = true, onKeyDown, ...props }, ref) => {
    const sanitize = (raw: string) => {
      let v = raw.replace(/[^\d.]/g, "");
      if (!allowDecimal) {
        v = v.replace(/\./g, "");
      } else {
        const parts = v.split(".");
        if (parts.length > 2) {
          v = parts[0] + "." + parts.slice(1).join("");
        }
      }
      return v;
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn(className)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
          ];
          if (allowedKeys.includes(e.key)) return;
          if (allowDecimal && (e.key === "." || e.key === ",")) return;
          if (!/^\d$/.test(e.key)) {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const next = sanitize(e.target.value.replace(",", "."));
          e.target.value = next;
          onChange?.(e);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text");
          const next = sanitize(text.replace(",", "."));
          const el = e.target as HTMLInputElement;
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const merged =
            el.value.slice(0, start) + next + el.value.slice(end);
          el.value = sanitize(merged);
          onChange?.({
            ...e,
            target: el,
            currentTarget: el,
          } as React.ChangeEvent<HTMLInputElement>);
        }}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
