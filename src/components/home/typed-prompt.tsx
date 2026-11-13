"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "./use-in-view";

/**
 * A description that types itself the first time it comes into view. The full text is always laid out,
 * invisibly, so the card never changes height while it types.
 */
export function TypedPrompt({ text }: { text: string }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(hostRef, 0.6);
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => {
      setTyped((n) => {
        if (n >= text.length) window.clearInterval(id);
        return Math.min(text.length, n + 1);
      });
    }, 38);
    return () => window.clearInterval(id);
  }, [inView, reduced, text]);

  const shown = reduced ? text.length : typed;
  return (
    <span ref={hostRef} className="relative block text-sm leading-snug text-fg">
      <span className="invisible">{text}</span>
      <span className="absolute inset-0">
        {text.slice(0, shown)}
        {!reduced && shown < text.length && <span className="type-caret" />}
      </span>
    </span>
  );
}
