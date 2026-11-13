import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared look of every text control: 12 px radius, surface-2 ground, accent ring on focus. */
const control =
  "w-full rounded-[var(--radius-field)] border border-line bg-surface-2 px-3.5 text-sm text-fg placeholder:text-subtle transition-[border-color,box-shadow] duration-[var(--t-control)] hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-11", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-24 resize-y py-3 leading-relaxed", className)} {...props} />;
});

/**
 * A native <select>, styled. Native on purpose: the create form's engine picker is a real select
 * (keyboard, mobile pickers and the end-to-end tests all rely on it).
 */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <span className="relative block w-full">
      <select ref={ref} className={cn(control, "h-11 cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </span>
  );
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-[13px] font-medium text-fg", className)} {...props} />;
}

/** Label + control + hint or error, wired with ids so screen readers read them together. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A real checkbox, drawn. The native input stays in the tree (visually hidden) so labels, forms and tests keep working. */
export const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: React.ReactNode }>(function Checkbox(
  { className, label, ...props },
  ref,
) {
  return (
    <label className={cn("group inline-flex cursor-pointer items-start gap-3 text-sm text-fg has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50", className)}>
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input ref={ref} type="checkbox" className="peer absolute inset-0 h-full w-full cursor-[inherit] opacity-0" {...props} />
        <span className="absolute inset-0 rounded-[6px] border border-line-strong bg-surface-2 transition-colors peer-checked:border-accent-fill peer-checked:bg-accent-fill peer-hover:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg" />
        <Check aria-hidden="true" className="pointer-events-none relative h-3.5 w-3.5 scale-50 text-white opacity-0 transition-[opacity,transform] duration-[var(--t-micro)] peer-checked:scale-100 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {label ? <span className="leading-snug">{label}</span> : null}
    </label>
  );
});

/**
 * A large selectable card that is really a radio input. Use inside a group with the same `name`.
 * The input keeps its own id and testid so forms and tests address it as before.
 */
export const RadioCard = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "title"> & { title: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; meta?: React.ReactNode }
>(function RadioCard({ className, title, description, icon, meta, ...props }, ref) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer gap-3 rounded-[var(--radius-card)] border border-line bg-surface-1 p-4 transition-[border-color,background-color,box-shadow] duration-[var(--t-control)] hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-surface-2 has-[:checked]:shadow-[0_0_0_1px_var(--accent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/60 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <input ref={ref} type="radio" className="peer sr-only" {...props} />
      {icon ? <span className="mt-0.5 text-accent">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{title}</span>
        {description ? <span className="mt-0.5 block text-[13px] leading-snug text-muted">{description}</span> : null}
      </span>
      {meta ? <span className="shrink-0 font-mono text-[12px] text-muted">{meta}</span> : null}
      <span aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 rounded-full border border-line-strong transition-colors peer-checked:border-[5px] peer-checked:border-accent-fill" />
    </label>
  );
});
