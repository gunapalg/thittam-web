import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * NOTE: We intentionally avoid Radix Menubar here.
 * Some environments can crash at runtime with Radix scope/version issues
 * (e.g. `createRovingFocusGroupScope is not a function`).
 *
 * This is a minimal, API-compatible shim used only to prevent startup crashes.
 */

export const Menubar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex h-10 items-center space-x-1 rounded-md border bg-background p-1", className)} {...props} />
);

export const MenubarMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MenubarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MenubarPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MenubarSub: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const MenubarRadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const MenubarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  ),
);
MenubarTrigger.displayName = "MenubarTrigger";

export const MenubarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    />
  ),
);
MenubarContent.displayName = "MenubarContent";

export const MenubarItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }>(
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
MenubarItem.displayName = "MenubarItem";

export const MenubarCheckboxItem = MenubarItem as any;
export const MenubarRadioItem = MenubarItem as any;

export const MenubarLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
  ),
);
MenubarLabel.displayName = "MenubarLabel";

export const MenubarSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  ),
);
MenubarSeparator.displayName = "MenubarSeparator";

export const MenubarSubTrigger: React.FC<React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }> = ({
  className,
  inset,
  ...props
}) => <div className={cn("flex items-center rounded-sm px-2 py-1.5 text-sm", inset && "pl-8", className)} {...props} />;

export const MenubarSubContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)} {...props} />
);

export const MenubarShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
);
