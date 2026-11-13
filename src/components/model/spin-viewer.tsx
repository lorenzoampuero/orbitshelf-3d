"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useInView, useReducedMotion } from "@/components/home/use-in-view";
import type { GalleryModel } from "@/lib/models";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

const COPY = {
  en: { label: "Rotate the model", drag: "Drag to rotate", pause: "Pause rotation", play: "Resume rotation", angle: (a: number) => `${a} degrees` },
  es: { label: "Girar el modelo", drag: "Arrastra para girarlo", pause: "Pausar el giro", play: "Reanudar el giro", angle: (a: number) => `${a} grados` },
} as const;

type Connection = { saveData?: boolean };

/**
 * A model you can turn with no WebGL: a sheet of pre-rendered frames drawn on a 2D canvas.
 * Drag (with inertia), arrow keys, and an optional slow turn that can be paused. The sheet loads when the viewer
 * comes near the screen, or on the first touch when the visitor asked to save data. Until then the still render shows.
 */
export function SpinViewer({
  model,
  locale,
  autoRotate = false,
  showHint = true,
  className,
}: {
  model: GalleryModel;
  locale: Locale;
  /** Turns by itself, slowly, while on screen (never with reduced motion). */
  autoRotate?: boolean;
  showHint?: boolean;
  className?: string;
}) {
  const t = COPY[locale];
  const { frames, cols, frameWidth, frameHeight, src } = model.spin;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const drag = useRef({ active: false, x: 0, last: 0, velocity: 0 });
  const raf = useRef(0);
  const inView = useInView(rootRef, 0.1);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [angle, setAngle] = useState(0);
  const [turning, setTurning] = useState(autoRotate);
  const [wantsLoad, setWantsLoad] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const sheet = sheetRef.current;
    if (!canvas || !sheet) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const index = ((Math.round(frameRef.current) % frames) + frames) % frames;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sheet, (index % cols) * frameWidth, Math.floor(index / cols) * frameHeight, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);
    setAngle(Math.round((index / frames) * 360) % 360);
  }, [frames, cols, frameWidth, frameHeight]);

  // Load the sheet near the screen, or on first touch with data saving on.
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: Connection }).connection?.saveData;
    if (!(inView && !saveData) && !wantsLoad) return;
    if (sheetRef.current) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    sheetRef.current = img;
    img.decode().then(
      () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const rect = canvas.getBoundingClientRect();
          canvas.width = Math.min(frameWidth, Math.max(1, Math.round(rect.width * dpr)));
          canvas.height = Math.round(canvas.width * (frameHeight / frameWidth));
        }
        setReady(true);
        draw();
      },
      () => {
        sheetRef.current = null;
      },
    );
  }, [inView, wantsLoad, src, frameWidth, frameHeight, draw]);

  const stop = () => cancelAnimationFrame(raf.current);

  // Slow turn while on screen and not being dragged.
  useEffect(() => {
    if (!ready || !turning || reduced || !inView) return;
    let last = performance.now();
    const tick = (now: number) => {
      if (!drag.current.active) {
        frameRef.current = (frameRef.current + ((now - last) / 1000) * (frames / 18)) % frames;
        draw();
      }
      last = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return stop;
  }, [ready, turning, reduced, inView, frames, draw]);

  const inertia = useCallback(() => {
    const step = () => {
      if (Math.abs(drag.current.velocity) < 0.002) return;
      frameRef.current += drag.current.velocity;
      drag.current.velocity *= 0.93;
      draw();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [draw]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as Element).closest("button")) return;
    setWantsLoad(true);
    stop();
    drag.current = { active: true, x: e.clientX, last: e.clientX, velocity: 0 };
    setTurning(false);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointers in tests have no active id */
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active || !ready) return;
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    // One full width of travel is about three quarters of a turn.
    const delta = (-(e.clientX - drag.current.last) / width) * frames * 0.75;
    drag.current.last = e.clientX;
    drag.current.velocity = delta;
    frameRef.current += delta;
    draw();
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (!reduced) inertia();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home") return;
    e.preventDefault();
    setWantsLoad(true);
    stop();
    setTurning(false);
    frameRef.current = key === "Home" ? 0 : frameRef.current + (key === "ArrowRight" ? 1 : -1);
    draw();
  }

  useEffect(() => stop, []);

  return (
    <div
      ref={rootRef}
      role="slider"
      tabIndex={0}
      aria-label={t.label}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={angle}
      aria-valuetext={t.angle(angle)}
      aria-orientation="horizontal"
      data-testid="spin-viewer"
      data-ready={ready}
      className={cn("relative touch-pan-y select-none rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", ready ? "cursor-grab active:cursor-grabbing" : "cursor-pointer", className)}
      style={{ aspectRatio: `${frameWidth} / ${frameHeight}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      {/* The still shows until the sheet is drawn, so there is never an empty box. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-built WebP */}
      <img src={model.beauty.srcSmall} alt="" aria-hidden="true" draggable={false} className={cn("absolute inset-0 h-full w-full object-contain", ready && "invisible")} />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      {showHint ? <span className="pointer-events-none absolute inset-x-0 -bottom-7 text-center text-[13px] text-muted">{t.drag}</span> : null}
      {autoRotate && ready && !reduced ? (
        <button
          type="button"
          onClick={() => setTurning((v) => !v)}
          aria-label={turning ? t.pause : t.play}
          aria-pressed={!turning}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-2/80 text-muted backdrop-blur transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent pointer-coarse:h-11 pointer-coarse:w-11"
        >
          {turning ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}
