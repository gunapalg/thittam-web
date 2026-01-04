import * as React from "react";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

type ToggleGroupType = "single" | "multiple";

type ToggleGroupCtx = {
  type: ToggleGroupType;
  value: string | string[] | undefined;
  setValue: (next: string | string[]) => void;
  variant: ToggleVariant;
  size: ToggleSize;
  disabled?: boolean;
};

const ToggleGroupContext = React.createContext<ToggleGroupCtx | null>(null);

function useToggleGroupCtx(component: string) {
  const ctx = React.useContext(ToggleGroupContext);
  if (!ctx) throw new Error(`${component} must be used within <ToggleGroup>`);
  return ctx;
}

export const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: ToggleGroupType;
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: (next: string | string[]) => void;
    variant?: ToggleVariant;
    size?: ToggleSize;
    disabled?: boolean;
  }
>(
  (
    {
      className,
      children,
      type = "single",
      value: valueProp,
      defaultValue,
      onValueChange,
      variant = "default",
      size = "default",
      disabled,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState<string | string[] | undefined>(defaultValue);
    const value = valueProp ?? uncontrolled;

    const setValue = React.useCallback(
      (next: string | string[]) => {
        onValueChange?.(next);
        if (valueProp === undefined) setUncontrolled(next);
      },
      [onValueChange, valueProp],
    );

    const ctx = React.useMemo<ToggleGroupCtx>(
      () => ({ type, value, setValue, variant, size, disabled }),
      [type, value, setValue, variant, size, disabled],
    );

    return (
      <ToggleGroupContext.Provider value={ctx}>
        <div ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props}>
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  },
);
ToggleGroup.displayName = "ToggleGroup";

export const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    variant?: ToggleVariant;
    size?: ToggleSize;
  }
>(({ className, children, value, variant, size, onClick, ...props }, ref) => {
  const ctx = useToggleGroupCtx("ToggleGroupItem");

  const selected =
    ctx.type === "multiple"
      ? Array.isArray(ctx.value) && ctx.value.includes(value)
      : typeof ctx.value === "string" && ctx.value === value;

  const dataState = selected ? "on" : "off";

  return (
    <button
      ref={ref}
      type="button"
      data-state={dataState}
      aria-pressed={selected}
      disabled={ctx.disabled || props.disabled}
      className={cn(
        toggleVariants({
          variant: (variant ?? ctx.variant) as any,
          size: (size ?? ctx.size) as any,
        }),
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        if (ctx.disabled || props.disabled) return;

        if (ctx.type === "multiple") {
          const prev = Array.isArray(ctx.value) ? ctx.value : [];
          const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
          ctx.setValue(next);
        } else {
          // single
          const next = selected ? "" : value;
          ctx.setValue(next);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";
