/** Shown while any dashboard page loads: blocks shaped like the page, not a spinner. */
export function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="skeleton bg-surface-2 h-10 w-64 rounded-xl" />
      <div className="skeleton bg-surface-2 h-40 w-full rounded-[var(--radius-card)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton bg-surface-2 aspect-[4/3] rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}
