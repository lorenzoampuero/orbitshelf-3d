"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Play, Pause, Box } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  hint?: string;
  provenanceBadge?: string;
  heightClass?: string;
  resetLabel?: string;
  autoRotateLabel?: string;
  autoRotateOffLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
  testId?: string;
  /** When false the wheel scrolls the page instead of zooming (marketing pages). */
  wheelZoom?: boolean;
  /** Frameless variant for use on a coloured field: transparent, no controls bar, no hint. Drag to rotate only. */
  bare?: boolean;
};

type ModelViewerEl = HTMLElement & {
  cameraOrbit?: string;
  autoRotate?: boolean;
  resetTurntableRotation?: () => void;
  getCameraOrbit?: () => { theta: number; phi: number; radius: number };
};

export function ModelViewerBox({
  src,
  alt,
  hint,
  provenanceBadge,
  heightClass = "h-[400px]",
  resetLabel = "Reset view",
  autoRotateLabel = "Auto-rotate",
  autoRotateOffLabel = "Stop rotating",
  loadingLabel = "Loading 3D model…",
  errorLabel = "3D preview unavailable",
  testId = "model-viewer-box",
  wheelZoom = true,
  bare = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerEl | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const status: "loading" | "ready" | "error" =
    failedSrc === src ? "error" : loadedSrc === src ? "ready" : "loading";
  const [orbit, setOrbit] = useState("25deg 72deg 105%");
  const [autoRotate, setAutoRotate] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false,
  );
  const dragRef = useRef<{ active: boolean; x: number; y: number; yaw: number; pitch: number; zoom: number }>({
    active: false,
    x: 0,
    y: 0,
    yaw: 25,
    pitch: 72,
    zoom: 105,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) setAutoRotate(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await import("@google/model-viewer");
        const probe = await fetch(src, { credentials: "same-origin" });
        if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
        const buf = await probe.arrayBuffer();
        if (buf.byteLength < 20) throw new Error("Invalid GLB");
        const magic = new DataView(buf).getUint32(0, true);
        if (magic !== 0x46546c67) throw new Error("Bad GLB header");
        if (!cancelled) {
          setFailedSrc(null);
          setLoadedSrc(src);
        }
      } catch {
        if (!cancelled) {
          setFailedSrc(src);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    el.cameraOrbit = orbit;
  }, [orbit, status]);

  useEffect(() => {
    if (!autoRotate || reducedMotion) return;
    const id = window.setInterval(() => {
      dragRef.current.yaw = (dragRef.current.yaw + 2) % 360;
      const next = `${Math.round(dragRef.current.yaw)}deg ${Math.round(dragRef.current.pitch)}deg ${Math.round(dragRef.current.zoom)}%`;
      setOrbit(next);
    }, 60);
    return () => window.clearInterval(id);
  }, [autoRotate, reducedMotion]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current.active = true;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events in headless tests may not have an active pointerId */
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    dragRef.current.yaw = Math.round((dragRef.current.yaw - dx * 0.45) * 10) / 10;
    dragRef.current.pitch = Math.max(15, Math.min(165, Math.round((dragRef.current.pitch - dy * 0.35) * 10) / 10));
    const next = `${dragRef.current.yaw}deg ${dragRef.current.pitch}deg ${dragRef.current.zoom}%`;
    setOrbit(next);
  }

  function onPointerUp() {
    dragRef.current.active = false;
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    dragRef.current.zoom = Math.max(60, Math.min(180, Math.round(dragRef.current.zoom + e.deltaY * 0.08)));
    setOrbit(`${dragRef.current.yaw}deg ${dragRef.current.pitch}deg ${dragRef.current.zoom}%`);
  }

  function resetCamera() {
    dragRef.current = { active: false, x: 0, y: 0, yaw: 25, pitch: 72, zoom: 105 };
    setOrbit("25deg 72deg 105%");
    viewerRef.current?.resetTurntableRotation?.();
  }

  return (
    <div
      ref={hostRef}
      data-testid={testId}
      data-status={status}
      data-orbit={orbit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={wheelZoom ? onWheel : undefined}
      className={`relative flex flex-col justify-between select-none ${bare ? "" : "overflow-hidden rounded-xl border border-line bg-surface"} ${heightClass}`}
    >
      {!bare && (
      <div className="pointer-events-none z-10 flex items-center justify-between gap-2 p-3">
        {provenanceBadge ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-1 text-xs font-medium text-accent">
            <Box className="h-3.5 w-3.5" aria-hidden="true" />
            {provenanceBadge}
          </span>
        ) : (
          <span />
        )}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setAutoRotate((v) => !v)}
              aria-pressed={autoRotate}
              aria-label={autoRotate ? autoRotateOffLabel : autoRotateLabel}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-2.5 py-1 text-xs font-medium text-fg hover:border-accent"
            >
              {autoRotate ? <Pause className="h-3 w-3" aria-hidden="true" /> : <Play className="h-3 w-3" aria-hidden="true" />}
              <span className="hidden sm:inline">{autoRotate ? autoRotateOffLabel : autoRotateLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={resetCamera}
            aria-label={resetLabel}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-2.5 py-1 text-xs font-medium text-fg hover:border-accent"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span className="hidden sm:inline">{resetLabel}</span>
          </button>
        </div>
      </div>
      )}

      <div className="relative flex-1 min-h-0">
        {status === "loading" && (
          <div className={`absolute inset-0 flex items-center justify-center text-xs ${bare ? "text-ink" : "text-muted"}`}>
            {loadingLabel}
          </div>
        )}
        {status === "error" && (
          <div role="alert" className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-danger">
            {errorLabel}
          </div>
        )}
        {status !== "error" && (
          // @ts-expect-error Custom element registered by @google/model-viewer
          <model-viewer
            ref={(node: ModelViewerEl | null) => {
              viewerRef.current = node;
            }}
            src={src}
            alt={alt}
            camera-controls=""
            disable-zoom={wheelZoom ? undefined : ""}
            camera-orbit={orbit}
            shadow-intensity={bare ? "0.7" : "0.6"}
            shadow-softness={bare ? "1" : undefined}
            exposure="1.0"
            interaction-prompt="none"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>

      {hint && !bare && (
        <div className="z-10 flex items-center justify-between border-t border-line bg-bg px-3.5 py-2 text-xs text-muted">
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}
