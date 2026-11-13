import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ---------- Card and Panel ---------- */

const cardVariants = cva("rounded-[var(--radius-card)] transition-[border-color,background-color,transform] duration-[var(--t-control)] ease-[var(--ease-out)]", {
  variants: {
    variant: {
      default: "border border-line bg-surface-1",
      outline: "border border-line-strong bg-transparent",
      feature: "border border-line bg-gradient-to-b from-surface-2 to-surface-1",
      planned: "border border-dashed border-line-strong bg-transparent text-muted",
    },
    interactive: {
      true: "hover:-translate-y-1 hover:border-line-strong",
      false: "",
    },
  },
  defaultVariants: { variant: "default", interactive: false },
});

export type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

/** The card of the product. `planned` is the dashed style for things that do not exist yet. */
export function Card({ className, variant, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, interactive }), className)} {...props} />;
}

/** A larger container for a workspace area or a dialog body: 24 px radius. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-panel)] border border-line bg-surface-1 p-5 md:p-6", className)} {...props} />;
}

/* ---------- Chip and Badge ---------- */

/** A selectable or removable pill: filters, model and quality choices. Pass `pressed` for a toggle. */
export const Chip = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }>(function Chip(
  { className, pressed, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-[var(--t-control)] pointer-coarse:min-h-11",
        pressed ? "border-accent bg-accent-fill/20 text-fg" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-fg",
        className,
      )}
      {...props}
    />
  );
});

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none", {
  variants: {
    tone: {
      muted: "bg-surface-3 text-muted",
      accent: "bg-accent-fill/20 text-accent-strong",
      ok: "bg-ok/15 text-ok",
      warn: "bg-warn/15 text-warn",
      danger: "bg-danger/15 text-danger",
    },
  },
  defaultVariants: { tone: "muted" },
});

/** A status label. Always carries text, never colour alone. */
export function Badge({ className, tone, dot, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/* ---------- Loading and empty ---------- */

/** A block with the shape of what is loading. Never a loose spinner. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton rounded-[var(--radius-ctl)] bg-surface-2", className)} {...props} />;
}

export function EmptyState({
  title,
  description,
  action,
  visual,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** A render or an illustration. Optional. */
  visual?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-[var(--radius-panel)] border border-dashed border-line-strong px-6 py-12 text-center", className)}>
      {visual}
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- Page structure ---------- */

export function PageHeader({ title, description, actions, level = 1 }: { title: string; description?: string; actions?: React.ReactNode; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        <Heading className="text-2xl font-semibold leading-tight md:text-[1.75rem]">{title}</Heading>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ---------- Data ---------- */

/** A number in monospace with its label. For credits, triangles, sizes. */
export function Stat({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-subtle">{label}</p>
      <p className="font-mono text-2xl font-medium tabular-nums text-fg">{value}</p>
      {hint ? <p className="text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** One line of technical data: `2.0M → 60K tris · 1.1 MB · GLB`. Parts are joined with a dot. */
export function SpecLine({ parts, className }: { parts: Array<React.ReactNode | null | undefined | false>; className?: string }) {
  const shown = parts.filter((p) => p !== null && p !== undefined && p !== false);
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 font-mono text-[12px] tabular-nums text-muted", className)}>
      {shown.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <span aria-hidden="true" className="text-subtle">
              ·
            </span>
          ) : null}
          <span>{p}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-line-strong bg-surface-2 px-1.5 font-mono text-[12px] text-muted", className)} {...props} />;
}

/** Credits are never shown as money. An orbit coin and a number. */
export function CreditCost({ amount, label, className }: { amount: number | string; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-[13px] font-medium tabular-nums text-fg", className)}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6.25" />
        <ellipse cx="8" cy="8" rx="6.25" ry="2.4" transform="rotate(-24 8 8)" opacity="0.7" />
        <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
      </svg>
      <span>{amount}</span>
      {label ? <span className="font-sans text-[13px] font-normal text-muted">{label}</span> : null}
    </span>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Right-align and use monospace digits. */
  numeric?: boolean;
  className?: string;
};

/** A plain, accessible table. Scrolls sideways inside its own box on narrow screens. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  className,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  empty?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn("overflow-x-auto rounded-[var(--radius-card)] border border-line focus-visible:outline-2 focus-visible:outline-accent", className)}
    >
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-surface-1">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-4 py-3 text-[12px] font-medium uppercase tracking-[0.08em] text-subtle", c.numeric && "text-right", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {empty ?? "—"}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-surface-1">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle text-fg", c.numeric && "text-right font-mono tabular-nums", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
