"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw, Play, Pause, Box, Grid3x3 } from "lucide-react";

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
  /** Shows a button to see the mesh instead of the surface. Left out on pages where the mesh is of no use. */
  wireframeLabel?: string;
  surfaceLabel?: string;
  testId?: string;
  /** When false the wheel scrolls the page instead of zooming (marketing pages). */
  wheelZoom?: boolean;
  /** Frameless variant for use on a coloured field: transparent, no controls bar, no hint. Drag to rotate only. */
  bare?: boolean;
  /** Called once the model is on screen, with a way to capture what is shown. */
  onReady?: (capture: () => Promise<Blob | null>) => void;
};

type ModelViewerEl = HTMLElement & {
  cameraOrbit?: string;
  autoRotate?: boolean;
  resetTurntableRotation?: () => void;
  toBlob?: (options?: { mimeType?: string; qualityArgument?: number; idealAspect?: boolean }) => Promise<Blob>;
  getCameraOrbit?: () => { theta: number; phi: number; radius: number };
};

type SceneNode = { material?: { wireframe?: boolean } | { wireframe?: boolean }[] };
type ThreeScene = { traverse?: (visit: (node: SceneNode) => void) => void; queueRender?: () => void };

/**
 * model-viewer has no wireframe option, so this reaches its three.js scene through an internal symbol.
 * Returns false if a later version moves it, and the button then stays hidden rather than doing nothing.
 */
function applyWireframe(el: HTMLElement, on: boolean): boolean {
  const symbol = Object.getOwnPropertySymbols(el).find((s) => s.description === "scene");
  const scene = symbol ? (el as unknown as Record<symbol, ThreeScene | undefined>)[symbol] : undefined;
  if (!scene?.traverse || !scene.queueRender) return false;
  scene.traverse((node) => {
    for (const material of [node.material].flat()) if (material) material.wireframe = on;
  });
  scene.queueRender();
  return true;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
// The server (and the first client render) assume motion is allowed, so there is no hydration mismatch.
const getReducedMotionOnServer = () => false;

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
  wireframeLabel,
  surfaceLabel,
  testId = "model-viewer-box",
  wheelZoom = true,
  bare = false,
  onReady,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerEl | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const status: "loading" | "ready" | "error" =
    failedSrc === src ? "error" : loadedSrc === src ? "ready" : "loading";
  const [orbit, setOrbit] = useState("25deg 72deg 105%");
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [wireframeReady, setWireframeReady] = useState(false);
  const wireframeRef = useRef(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionOnServer);
  // The viewer (library and GLB) is only started once the box is near the screen, so models below the fold cost nothing.
  const [visible, setVisible] = useState(false);
  const dragRef = useRef<{ active: boolean; x: number; y: number; yaw: number; pitch: number; zoom: number }>({
    active: false,
    x: 0,
    y: 0,
    yaw: 25,
    pitch: 72,
    zoom: 105,
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Load the library only when the box is near the screen. A failed import is a failed preview.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    import("@google/model-viewer").catch(() => {
      if (!cancelled) setFailedSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, src]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    el.cameraOrbit = orbit;
  }, [orbit, status, visible]);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // The viewer's own events drive the state, so the GLB is requested once (by the viewer) and never by a second fetch.
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !visible) return;
    const onLoad = () => {
      setFailedSrc(null);
      setLoadedSrc(src);
      setWireframeReady(applyWireframe(el, wireframeRef.current));
      onReadyRef.current?.(async () => (el.toBlob ? el.toBlob({ mimeType: "image/png" }) : null));
    };
    const onError = () => setFailedSrc(src);
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [visible, src]);

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
    // Capturing the pointer on a button press would send its click to this box, and the button would do nothing.
    if ((e.target as Element).closest("button")) return;
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

  function toggleWireframe() {
    const el = viewerRef.current;
    if (!el) return;
    const next = !wireframe;
    if (!applyWireframe(el, next)) return setWireframeReady(false);
    wireframeRef.current = next;
    setWireframe(next);
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
          {wireframeLabel && wireframeReady && (
            <button
              type="button"
              onClick={toggleWireframe}
              aria-pressed={wireframe}
              aria-label={wireframe ? surfaceLabel : wireframeLabel}
              data-testid={`${testId}-wireframe`}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-bg px-2.5 py-1 text-xs font-medium text-fg hover:border-accent"
            >
              <Grid3x3 className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">{wireframe ? surfaceLabel : wireframeLabel}</span>
            </button>
          )}
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
          <div role="status" className="os-pulse pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted">
            {loadingLabel}
          </div>
        )}
        {status === "error" && (
          <div role="alert" className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-danger">
            {errorLabel}
          </div>
        )}
        {visible && status !== "error" && (
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
