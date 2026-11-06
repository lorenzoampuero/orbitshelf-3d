import { useId } from "react";

/**
 * A flat drawing of one of the three demo models (vase, lamp, chair), used where a diagram needs "the 3D result".
 * It is always an illustration: aria-hidden, never presented as a render. `mesh` swaps the solid fill for a wireframe look.
 */
export type SilhouetteKind = "vase" | "lamp" | "chair";

const SHAPES: Record<SilhouetteKind, string[]> = {
  vase: ["M38 8H62V20C62 31 82 38 82 58C82 78 73 92 64 92H36C27 92 18 78 18 58C18 38 38 31 38 20Z"],
  lamp: ["M30 10H70L82 46H18Z", "M47 46H53V80H47Z", "M28 92Q28 80 50 80Q72 80 72 92Z"],
  chair: ["M28 8H72V44H28Z", "M20 48H80V59H20Z", "M24 59H33V92H24Z", "M67 59H76V92H67Z"],
};

export function ModelSilhouette({ kind, mesh = false, className = "h-16 w-16" }: { kind: SilhouetteKind; mesh?: boolean; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c01416" />
          <stop offset="1" stopColor="#5a0000" />
        </linearGradient>
        <pattern id={`${id}m`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke="#b79cff" strokeOpacity="0.75" strokeWidth="0.9" />
        </pattern>
      </defs>
      {SHAPES[kind].map((d) => (
        <path
          key={d}
          d={d}
          fill={mesh ? `url(#${id}m)` : `url(#${id}g)`}
          stroke={mesh ? "#b79cff" : "none"}
          strokeWidth={mesh ? 1.6 : 0}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
