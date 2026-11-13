"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

/* ---------- Slider ---------- */

/** A single-value slider with a violet range and a 20 px thumb (44 px hit area on touch). Pass an aria-label. */
export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(function Slider(
  { className, ...props },
  ref,
) {
  const count = (props.value ?? props.defaultValue ?? [0]).length;
  return (
    <SliderPrimitive.Root ref={ref} className={cn("relative flex h-11 w-full touch-none select-none items-center", className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-3">
        <SliderPrimitive.Range className="absolute h-full bg-[image:var(--accent-grad)]" />
      </SliderPrimitive.Track>
      {Array.from({ length: count }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={props["aria-label"]}
          className="block h-5 w-5 rounded-full border-2 border-white bg-accent-fill shadow-[0_2px_8px_rgb(0_0_0/0.5)] transition-transform duration-[var(--t-micro)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        />
      ))}
    </SliderPrimitive.Root>
  );
});

/* ---------- Segmented control ---------- */

export type SegmentedOption<V extends string> = { value: V; label: React.ReactNode; ariaLabel?: string };

/** One choice out of a few. Arrow keys move, the selected one cannot be unselected. */
export function Segmented<V extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: V;
  onValueChange: (v: V) => void;
  options: Array<SegmentedOption<V>>;
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as V)}
      aria-label={label}
      className={cn("inline-flex rounded-full border border-line bg-surface-1 p-1", className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          aria-label={o.ariaLabel}
          className="h-8 rounded-full px-4 text-[13px] font-medium text-muted transition-colors duration-[var(--t-control)] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=on]:bg-surface-3 data-[state=on]:text-fg pointer-coarse:min-h-11"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

/* ---------- Tabs ---------- */

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(function TabsList(
  { className, ...props },
  ref,
) {
  return <TabsPrimitive.List ref={ref} className={cn("flex gap-1 overflow-x-auto border-b border-line", className)} {...props} />;
});

export const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(function TabsTrigger(
  { className, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative -mb-px h-11 shrink-0 whitespace-nowrap border-b-2 border-transparent px-4 text-sm font-medium text-muted transition-colors duration-[var(--t-control)] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=active]:border-accent data-[state=active]:text-fg",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(function TabsContent(
  { className, ...props },
  ref,
) {
  return <TabsPrimitive.Content ref={ref} className={cn("pt-6 focus-visible:outline-none", className)} {...props} />;
});
