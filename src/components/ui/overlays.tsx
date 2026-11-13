"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Dialog and Sheet ---------- */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const overlayClass = "ui-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]";

type ContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Visible title. Radix needs one for the accessible name; pass `hideTitle` to keep it for screen readers only. */
  title: string;
  description?: string;
  hideTitle?: boolean;
  closeLabel?: string;
};

function ContentShell({ title, description, hideTitle, closeLabel = "Close", children }: Pick<ContentProps, "title" | "description" | "hideTitle" | "closeLabel" | "children">) {
  return (
    <>
      <div className={cn("flex items-start justify-between gap-4", hideTitle && "sr-only")}>
        <div className="min-w-0 space-y-1">
          <DialogPrimitive.Title className="text-lg font-semibold leading-tight">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="text-sm leading-relaxed text-muted">{description}</DialogPrimitive.Description> : null}
        </div>
      </div>
      {children}
      <DialogPrimitive.Close
        aria-label={closeLabel}
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-fg pointer-coarse:h-11 pointer-coarse:w-11"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </DialogPrimitive.Close>
    </>
  );
}

export const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, ContentProps>(function DialogContent(
  { className, title, description, hideTitle, closeLabel, children, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        ref={ref}
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "ui-pop fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-5 overflow-y-auto rounded-[var(--radius-panel)] border border-line-strong bg-surface-2 p-6 shadow-dialog focus:outline-none",
          className,
        )}
        {...props}
      >
        <ContentShell title={title} description={description} hideTitle={hideTitle} closeLabel={closeLabel}>
          {children}
        </ContentShell>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

/** A panel that slides in from the right (filters, the studio inspector on small screens). */
export const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, ContentProps>(function SheetContent(
  { className, title, description, hideTitle, closeLabel, children, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "ui-sheet fixed inset-y-0 right-0 z-50 w-[min(26rem,100vw)] space-y-5 overflow-y-auto border-l border-line-strong bg-surface-1 p-6 shadow-dialog focus:outline-none",
          className,
        )}
        {...props}
      >
        <ContentShell title={title} description={description} hideTitle={hideTitle} closeLabel={closeLabel}>
          {children}
        </ContentShell>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

/* ---------- Dropdown menu ---------- */

/** Non-modal: the page behind stays reachable by assistive tech, as in any native menu. */
export function DropdownMenu(props: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Root>) {
  return <DropdownPrimitive.Root modal={false} {...props} />;
}
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof DropdownPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>>(
  function DropdownMenuContent({ className, sideOffset = 8, ...props }, ref) {
    return (
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          className={cn("ui-pop z-50 min-w-48 overflow-hidden rounded-[var(--radius-field)] border border-line-strong bg-surface-3 p-1.5 shadow-menu", className)}
          {...props}
        />
      </DropdownPrimitive.Portal>
    );
  },
);

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { danger?: boolean }
>(function DropdownMenuItem({ className, danger, ...props }, ref) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-surface-2",
        danger ? "text-danger" : "text-fg",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = ({ className }: { className?: string }) => <DropdownPrimitive.Separator className={cn("my-1.5 h-px bg-line", className)} />;
export const DropdownMenuLabel = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) => (
  <DropdownPrimitive.Label className={cn("px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-muted", className)} {...props} />
);

/* ---------- Popover ---------- */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** Pass `aria-label`: a popover is a dialog and needs a name. */
export const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>>(
  function PopoverContent({ className, sideOffset = 8, align = "start", ...props }, ref) {
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          align={align}
          className={cn("ui-pop z-50 w-72 rounded-[var(--radius-card)] border border-line-strong bg-surface-3 p-4 shadow-menu focus:outline-none", className)}
          {...props}
        />
      </PopoverPrimitive.Portal>
    );
  },
);

/* ---------- Tooltip ---------- */

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={150}>
    {children}
  </TooltipPrimitive.Provider>
);

/** Wrap an element. The tooltip is a hint, never the only place a fact lives. */
export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactElement; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={8} className="ui-pop z-50 max-w-60 rounded-[8px] border border-line-strong bg-surface-3 px-2.5 py-1.5 text-[13px] leading-snug text-fg shadow-menu">
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
