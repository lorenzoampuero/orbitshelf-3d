"use client";

import * as React from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";

/**
 * Motion primitives. `LazyMotion` loads only the DOM animation features, and `reducedMotion="user"` makes every
 * transform and layout animation below collapse to its end state when the visitor asked for less motion.
 * Wrap a page once in <MotionRoot>; the rest are small, named patterns (plan §5): a spring for entries, a lift for cards.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

/** Enters with a short rise and fade. Use for cards, menus and the first paint of a panel. `delay` staggers siblings. */
export function Rise({ children, delay = 0, className, as: tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const Tag = m[tag];
  return (
    <Tag className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay }}>
      {children}
    </Tag>
  );
}

/** A card that lifts 4 px on hover and presses back on tap. Hover only on devices that have it (CSS handles the rest). */
export function Lift({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} whileHover={{ y: -4 }} whileTap={{ scale: 0.985 }} transition={SPRING}>
      {children}
    </m.div>
  );
}

/** A number that counts to its new value in ~400 ms. Monospace digits keep the width steady. */
export function CountTo({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = React.useState(value);
  const from = React.useRef(value);
  React.useEffect(() => {
    const start = from.current;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 420);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className ?? "font-mono tabular-nums"}>{shown}</span>;
}
