import { cn } from "@/lib/utils";

/**
 * The "orbit stage": a dark floor with contact shadow and one fine violet ring around the model.
 * The ring turns slowly (CSS only, off with reduced motion). Purely decorative: the model goes in as children.
 */
export function ModelStage({ children, className, ring = true }: { children: React.ReactNode; className?: string; ring?: boolean }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-stage", className)} data-testid="model-stage">
      <svg aria-hidden="true" viewBox="0 0 400 400" preserveAspectRatio="xMidYMax meet" className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
        <defs>
          <radialGradient id="stage-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6d4dff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6d4dff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="318" rx="170" ry="42" fill="url(#stage-floor)" />
        {ring ? (
          <ellipse className="stage-ring" cx="200" cy="318" rx="150" ry="30" fill="none" stroke="#a78bfa" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 7" />
        ) : null}
        <ellipse cx="200" cy="318" rx="150" ry="30" fill="none" stroke="#a78bfa" strokeOpacity="0.14" strokeWidth="1" />
      </svg>
      {children}
    </div>
  );
}
