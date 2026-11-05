"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { checkPreset } from "@/lib/glb-presets";
import { OPTIMIZE_PRESETS, type AssetVersionDto, type MeshDiagnostics, type ModelDto, type OptimizePreset } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

const number = (n: number) => n.toLocaleString("en-US");

function Metrics({ d, t }: { d: MeshDiagnostics; t: Dictionary }) {
  const m = t.dash.tools.metrics;
  const rows: [string, string][] = [
    [m.triangles, number(d.triangles)],
    [m.vertices, number(d.vertices)],
    [m.meshes, `${d.meshes} / ${d.primitives}`],
    [m.materials, String(d.materials)],
    [m.textures, d.textures.length ? `${d.textures.length} · ${d.maxTextureSize} px · ${formatBytes(d.textureBytes)}` : "0"],
    [m.uv, d.hasUv ? t.dash.tools.yes : t.dash.tools.no],
    [m.normals, d.hasNormals ? t.dash.tools.yes : t.dash.tools.no],
    [m.size, d.sizeMeters.map((v) => v.toFixed(3)).join(" × ") + " m"],
    [m.file, formatBytes(d.bytes)],
  ];
  return (
    <dl className="grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2" data-testid="tools-metrics">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line py-1">
          <dt className="text-muted">{k}</dt>
          <dd className="font-medium tabular-nums text-fg">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AssetTools({ model, t, onModelChange }: { model: ModelDto; t: Dictionary; onModelChange: (m: ModelDto) => void }) {
  const c = t.dash.tools;
  const [versions, setVersions] = useState<AssetVersionDto[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState<OptimizePreset | "version" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState<string | null>(null);
  const base = `/api/models/${encodeURIComponent(model.id)}`;

  const fetchVersions = useCallback(async () => {
    const res = await fetch(`${base}/versions`).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    return res?.ok && body?.versions ? (body.versions as AssetVersionDto[]) : null;
  }, [base]);

  const load = useCallback(async () => {
    const next = await fetchVersions();
    if (next) setVersions(next);
    setLoadFailed(!next);
  }, [fetchVersions]);

  useEffect(() => {
    let stale = false;
    fetchVersions().then((next) => {
      if (stale) return;
      if (next) setVersions(next);
      setLoadFailed(!next);
    });
    return () => {
      stale = true;
    };
  }, [fetchVersions, model.currentVersionId]);

  async function optimize(preset: OptimizePreset) {
    setBusy(preset);
    setError(null);
    try {
      const res = await fetch(`${base}/versions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preset }) });
      if (!res.ok) setError(res.status === 429 ? t.dash.tools.tooMany : t.dash.tools.optimizeFailed);
      await load();
    } catch {
      setError(t.common.networkError);
    } finally {
      setBusy(null);
    }
  }

  async function activate(versionId: string) {
    setBusy("version");
    setError(null);
    try {
      const res = await fetch(`${base}/versions/${encodeURIComponent(versionId)}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.model) onModelChange(body.model);
      else setError(t.common.somethingWrong);
    } catch {
      setError(t.common.networkError);
    } finally {
      setBusy(null);
    }
  }

  async function remove(versionId: string) {
    setBusy("version");
    setError(null);
    try {
      const res = await fetch(`${base}/versions/${encodeURIComponent(versionId)}`, { method: "DELETE" });
      if (!res.ok) setError(t.common.somethingWrong);
      if (comparing === versionId) setComparing(null);
      await load();
    } catch {
      setError(t.common.networkError);
    } finally {
      setBusy(null);
    }
  }

  if (loadFailed) {
    return (
      <section className="rounded-[16px] border border-line bg-surface p-5 text-xs text-muted" data-testid="asset-tools">
        {c.loadFailed}
      </section>
    );
  }
  if (!versions) {
    return (
      <section className="rounded-[16px] border border-line bg-surface p-5 text-xs text-muted" data-testid="asset-tools">
        {c.loading}
      </section>
    );
  }

  const current = versions.find((v) => v.current) ?? versions[0];
  if (!current) return null;
  const original = versions.find((v) => v.preset === "original");
  const compared = versions.find((v) => v.id === comparing);

  return (
    <section aria-labelledby="tools-heading" className="space-y-5 rounded-[16px] border border-line bg-surface p-5" data-testid="asset-tools">
      <div>
        <h2 id="tools-heading" className="font-display text-sm font-semibold text-fg">
          {c.title}
        </h2>
        <p className="mt-1 text-xs text-muted">{c.intro}</p>
      </div>

      <Metrics d={current.diagnostics} t={t} />

      {current.diagnostics.warnings.length > 0 && (
        <ul className="space-y-1 text-xs text-amber" data-testid="tools-warnings">
          {current.diagnostics.warnings.map((w) => (
            <li key={w}>{c.warnings[w]}</li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="text-xs font-semibold text-fg">{c.presetsTitle}</h3>
        <p className="mt-1 text-xs text-muted">{c.presetsNote}</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {OPTIMIZE_PRESETS.map((preset) => {
            const result = checkPreset(current.diagnostics, preset);
            const failed = result.checks.filter((x) => !x.pass);
            return (
              <li key={preset} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs" data-testid={`preset-${preset}`}>
                <div className="min-w-0">
                  <div className="font-semibold text-fg">{c.presets[preset]}</div>
                  <div className={result.pass ? "text-accent" : "text-muted"} data-testid={`preset-${preset}-result`}>
                    {result.pass ? c.presetPass : `${c.presetFail}: ${failed.map((x) => c.checks[x.code]).join(", ")}`}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => optimize(preset)}
                  data-testid={`optimize-${preset}-btn`}
                  className="rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-medium text-fg hover:border-accent disabled:opacity-50"
                >
                  {busy === preset ? c.optimizing : c.optimize}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-fg">{c.versionsTitle}</h3>
        <p className="mt-1 text-xs text-muted">{c.versionsNote}</p>
        <ul className="mt-3 divide-y divide-line border-y border-line" data-testid="versions-list">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs" data-testid={`version-${v.preset}`}>
              <div>
                <div className="font-semibold text-fg">
                  {v.preset === "original" ? c.original : c.presets[v.preset]}
                  {v.current && <span className="ml-2 font-medium text-accent">{c.inUse}</span>}
                </div>
                <div className="tabular-nums text-muted">
                  {number(v.diagnostics.triangles)} {c.metrics.triangles.toLowerCase()} · {formatBytes(v.bytes)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!v.current && (
                  <button type="button" disabled={busy !== null} onClick={() => activate(v.id)} data-testid={`use-version-${v.preset}`} className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent disabled:opacity-50">
                    {c.use}
                  </button>
                )}
                {v.preset !== "original" && (
                  <button type="button" onClick={() => setComparing(comparing === v.id ? null : v.id)} data-testid={`compare-version-${v.preset}`} className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">
                    {comparing === v.id ? c.closeCompare : c.compare}
                  </button>
                )}
                {v.preset !== "original" && !v.current && (
                  <button type="button" disabled={busy !== null} onClick={() => remove(v.id)} data-testid={`delete-version-${v.preset}`} className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-danger hover:border-danger disabled:opacity-50">
                    {c.remove}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {compared && original && (
        <div className="grid gap-3 sm:grid-cols-2" data-testid="compare-panel">
          {[original, compared].map((v) => (
            <figure key={v.id} className="space-y-2">
              <ModelViewerBox
                src={`${base}/file?version=${encodeURIComponent(v.id)}`}
                alt={v.preset === "original" ? c.original : c.presets[v.preset]}
                hint={t.dash.detail.viewerHint}
                resetLabel={t.dash.detail.resetView}
                autoRotateLabel={t.dash.detail.autoRotate}
                autoRotateOffLabel={t.dash.detail.autoRotateOff}
                loadingLabel={t.dash.detail.viewerLoading}
                errorLabel={t.dash.detail.viewerError}
                wireframeLabel={t.dash.detail.wireframe}
                surfaceLabel={t.dash.detail.surface}
                heightClass="h-[240px]"
                testId={`compare-viewer-${v.preset}`}
              />
              <figcaption className="text-xs text-muted">
                {v.preset === "original" ? c.original : c.presets[v.preset]}: {number(v.diagnostics.triangles)} · {formatBytes(v.bytes)}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-fg">{c.exportTitle}</h3>
        <p className="mt-1 text-xs text-muted">{c.exportNote}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <a href={`${base}/file?download=1`} data-testid="export-glb" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">
            GLB
          </a>
          <a href={`${base}/export?format=obj`} data-testid="export-obj" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">
            OBJ
          </a>
          <a href={`${base}/export?format=stl`} data-testid="export-stl" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">
            STL
          </a>
        </div>
      </div>

      {error && (
        <div role="alert" data-testid="tools-error" className="rounded-xl border border-danger/50 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      )}
    </section>
  );
}
