import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The only button style in the product. Pill shaped, one primary per view.
 * `loading` keeps the label, shows a small orbit ring and sets aria-busy; the button stays in the layout so nothing jumps.
 */
export const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold leading-none transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--t-control)] ease-[var(--ease-out)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[image:var(--accent-grad)] text-white shadow-[0_8px_24px_-10px_rgb(109_77_255/0.8)] hover:brightness-110 hover:shadow-[0_10px_28px_-8px_rgb(109_77_255/0.9)]",
        secondary: "border border-line-strong bg-surface-2 text-fg hover:bg-surface-3",
        ghost: "text-muted hover:bg-surface-2 hover:text-fg",
        danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
        light: "bg-fg text-ink hover:bg-white",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px] pointer-coarse:min-h-11",
        md: "h-10 px-5 text-sm pointer-coarse:min-h-11",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function OrbitRing() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="10" r="7.5" opacity="0.25" />
      <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" strokeLinecap="round" />
    </svg>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, disabled, children, type, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button ref={ref} type={type ?? "button"} className={classes} disabled={disabled} aria-busy={loading || undefined} {...props}>
      {loading ? <OrbitRing /> : null}
      {children}
    </button>
  );
});

/** Icon-only button. `label` is required: it becomes the accessible name. */
export const IconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "children" | "size"> & { label: string; children: React.ReactNode; size?: "sm" | "md" | "lg" }>(
  function IconButton({ label, size = "md", className, children, ...props }, ref) {
    const box = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
    return (
      <Button ref={ref} aria-label={label} title={label} size={size} className={cn("!px-0 pointer-coarse:min-w-11", box, className)} {...props}>
        {children}
      </Button>
    );
  },
);
