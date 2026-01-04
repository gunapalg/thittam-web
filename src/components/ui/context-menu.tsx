import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * NOTE: We intentionally avoid Radix ContextMenu here.
 * Some environments can crash at runtime with Radix scope/version issues
 * (e.g. `createRovingFocusGroupScope is not a function`).
 *
 * This shim degrades to no context menu (renders children only) but keeps the
 * component API surface compatible so imports don't crash the app.
 */

export const ContextMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const ContextMenuTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
ContextMenuTrigger.displayName = "ContextMenuTrigger";

export const ContextMenuContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => null;

export const ContextMenuItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  ),
);
ContextMenuItem.displayName = "ContextMenuItem";

export const ContextMenuCheckboxItem = ContextMenuItem as any;
export const ContextMenuRadioItem = ContextMenuItem as any;

export const ContextMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
  ),
);
ContextMenuLabel.displayName = "ContextMenuLabel";

export const ContextMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />,
);
ContextMenuSeparator.displayName = "ContextMenuSeparator";

export const ContextMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
);

// API-compat exports (no-op)
export const ContextMenuGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ContextMenuPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ContextMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ContextMenuRadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ContextMenuSubTrigger: React.FC<React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }> = ({
  className,
  inset,
  ...props
}) => <div className={cn("px-2 py-1.5 text-sm", inset && "pl-8", className)} {...props} />;
export const ContextMenuSubContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => null;
