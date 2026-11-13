"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Turn } from "@/content/landing-art";
import { useInView, useReducedMotion } from "./use-in-view";

/**
 * A model turning, as a short looping video. It loads nothing until it is on screen, stops when it leaves,
 * stays on its poster for visitors who asked for less motion, and can always be paused.
 */
export function Turntable({
  turn,
  label,
  pauseLabel,
  playLabel,
  className = "",
  videoClassName = "",
}: {
  turn: Turn;
  label: string;
  pauseLabel: string;
  playLabel: string;
  className?: string;
  videoClassName?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(hostRef);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView && !reduced && !paused) void video.play().catch(() => undefined);
    else video.pause();
  }, [inView, reduced, paused]);

  return (
    <div ref={hostRef} className={`relative ${className}`} data-testid="turntable">
      <video
        ref={videoRef}
        poster={turn.poster}
        aria-label={label}
        muted
        loop
        playsInline
        preload="none"
        width={turn.size}
        height={turn.size}
        className={`h-full w-full object-contain ${videoClassName}`}
      >
        <source src={turn.webm} type="video/webm" />
        <source src={turn.mp4} type="video/mp4" />
      </video>
      {!reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? playLabel : pauseLabel}
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg/80 text-fg transition-colors hover:border-accent"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
