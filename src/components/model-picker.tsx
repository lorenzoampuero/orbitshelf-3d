"use client";

import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { StudioCopy } from "@/content/studio-copy";
import { ENGINE_TIERS, type EngineDto, type InputKind, type TextureResolution } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVELS: TextureResolution[] = ["none", "512", "1k", "2k"];

type Props = {
  copy: StudioCopy["picker"];
  /** Every engine in the registry, so the list shows what is coming as well as what is on. */
  catalog: EngineDto[];
  availableIds: string[];
  kind: InputKind;
  photoCount: number;
  /** null is "Automatic": the preset chooses. */
  engineId: string | null;
  texture: TextureResolution | null;
  /** What the button says while the choice is automatic, e.g. the engine the preset would use. */
  summary: string;
  onEngine: (id: string | null) => void;
  onTexture: (t: TextureResolution | null) => void;
};

/** The model and the quality, with what each one costs in credits. A choice only ever narrows what the server's preset would do, and the price is still quoted by the server. */
export function ModelPicker({ copy, catalog, availableIds, kind, photoCount, engineId, texture, summary, onEngine, onTexture }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const listed = catalog.filter((e) => e.listed);
  const selected = listed.find((e) => e.id === engineId) ?? null;
  const level = (e: EngineDto): TextureResolution => (texture && e.creditsByTexture[texture] !== undefined ? texture : "1k");

  const trait = (e: EngineDto) => (e.modes.length === 1 && e.modes[0] === "text" ? copy.textOnly : e.maxPhotos > 1 ? copy.photosUpTo(e.maxPhotos) : copy.onePhoto);
  const fits = (e: EngineDto) => e.modes.includes(kind) && (kind === "text" || photoCount <= e.maxPhotos);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="model-picker-toggle"
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg transition-colors hover:border-accent/60"
      >
        <span className="text-muted">{copy.modelTitle}:</span>
        <span className="font-medium">{selected ? selected.label : summary}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} data-testid="model-picker-panel" className="mt-2 space-y-4 rounded-[20px] border border-line bg-bg p-3">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-fg">{copy.modelTitle}</h3>
            <button
              type="button"
              onClick={() => onEngine(null)}
              aria-pressed={engineId === null}
              data-testid="model-option-auto"
              className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left", engineId === null ? "border-accent bg-accent/10" : "border-line hover:border-accent/50")}
            >
              <span>
                <span className="block text-sm font-medium">{copy.auto}</span>
                <span className="block text-xs text-muted">{copy.autoText}</span>
              </span>
              {engineId === null && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />}
            </button>

            {ENGINE_TIERS.map((tier) => {
              const rows = listed.filter((e) => e.tier === tier);
              if (rows.length === 0) return null;
              return (
                <div key={tier} className="space-y-1.5">
                  <h4 className="pt-1 text-xs font-medium uppercase tracking-wide text-muted">{copy.tiers[tier]}</h4>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {rows.map((e) => {
                      const on = availableIds.includes(e.id);
                      const ok = fits(e);
                      const disabled = !on || !ok;
                      const credits = e.creditsByTexture[level(e)];
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onEngine(e.id)}
                            aria-pressed={engineId === e.id}
                            data-testid={`model-option-${e.id}`}
                            className={cn(
                              "flex h-full w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                              engineId === e.id ? "border-accent bg-accent/10" : "border-line",
                              disabled ? "opacity-55" : "hover:border-accent/50",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{e.label}</span>
                              <span className="block text-xs text-muted">{!on ? copy.unavailable : !ok ? copy.needsMore : trait(e)}</span>
                            </span>
                            {credits !== undefined && <span className="shrink-0 font-mono text-xs text-fg">{copy.credits(credits)}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-fg">{copy.qualityTitle}</h3>
            <div role="group" aria-label={copy.qualityTitle} className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => {
                const supported = !selected || selected.creditsByTexture[l] !== undefined;
                const cost = selected?.creditsByTexture[l];
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={!supported}
                    onClick={() => onTexture(texture === l ? null : l)}
                    aria-pressed={texture === l}
                    data-testid={`quality-option-${l}`}
                    className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", texture === l ? "border-accent bg-accent/10 text-fg" : "border-line text-muted", supported ? "hover:border-accent/50 hover:text-fg" : "opacity-45")}
                  >
                    {copy.qualities[l]}
                    {cost !== undefined && <span className="ml-1.5 font-mono text-fg">· {cost}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">{copy.note}</p>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted hover:text-fg">
            {copy.close}
          </button>
        </div>
      )}
    </div>
  );
}
