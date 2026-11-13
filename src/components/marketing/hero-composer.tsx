"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui";
import { localePath } from "@/i18n/config";
import { setComposerHandoff, titleFromFile } from "@/lib/composer-handoff";
import type { HomeCopy } from "@/content/home-copy";
import type { Locale } from "@/lib/types";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MIN_PROMPT = 10;

/**
 * The hero's generator: a description or one photo, and a button that opens the real create wizard with it filled in.
 * Nothing is generated here, and the cost is shown in the wizard before anything runs.
 */
export function HeroComposer({ locale, copy, examples, signedIn }: { locale: Locale; copy: HomeCopy["composer"]; examples: string[]; signedIn: boolean }) {
  const router = useRouter();
  const fieldId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState(false);
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  /** A signed-out visitor goes through the sign-in first and comes back to the wizard, where the handoff is waiting. */
  function open(mode: "text" | "photos") {
    const dest = localePath(locale, `/dashboard/create?mode=${mode}`);
    router.push(signedIn ? dest : `${localePath(locale, "/login")}?next=${encodeURIComponent(dest)}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (photo) {
      setComposerHandoff({ files: { front: photo }, title: titleFromFile(photo.name) });
      return open("photos");
    }
    if (text.length < MIN_PROMPT) {
      setError(true);
      return;
    }
    setComposerHandoff({ prompt: text, title: text.slice(0, 60) });
    open("text");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl space-y-3" data-testid="hero-composer" noValidate>
      <div className="rounded-[var(--radius-panel)] border border-line-strong bg-surface-1 p-3 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.9)] transition-colors focus-within:border-accent">
        <label htmlFor={fieldId} className="sr-only">
          {copy.label}
        </label>
        <textarea
          id={fieldId}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setError(false);
          }}
          rows={3}
          maxLength={600}
          placeholder={copy.placeholder}
          aria-describedby={`${fieldId}-hint`}
          aria-invalid={error || undefined}
          className="block w-full resize-none rounded-xl bg-transparent px-3 py-2 text-base leading-relaxed text-fg placeholder:text-subtle focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              data-testid="hero-composer-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && IMAGE_TYPES.includes(file.type)) {
                  setPhoto(file);
                  setError(false);
                }
                e.target.value = "";
              }}
            />
            {photo && preview ? (
              <span className="flex min-w-0 items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-2 text-[13px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={preview} alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="min-w-0 truncate text-muted">
                  <span className="sr-only">{copy.photoReady} </span>
                  {photo.name}
                </span>
                <button type="button" onClick={() => setPhoto(null)} aria-label={copy.removePhoto} className="rounded-full p-1 text-muted transition-colors hover:text-fg pointer-coarse:p-2.5">
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                {copy.addPhoto}
              </Button>
            )}
          </div>
          <Button type="submit" variant="primary" size="md" data-testid="hero-composer-submit">
            {copy.generate}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p id={`${fieldId}-hint`} role={error ? "alert" : undefined} className={`px-2 text-[13px] leading-relaxed ${error ? "text-danger" : "text-muted"}`}>
        {error ? copy.tooShort : copy.hint}
      </p>
      {examples.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2 px-1" aria-label={copy.examples}>
          {examples.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => {
                  setPrompt(example);
                  setError(false);
                }}
                className="rounded-full border border-line px-3 py-1 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg pointer-coarse:min-h-11"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
