import Link from "next/link";
import { Check, Circle, LoaderCircle } from "lucide-react";
import { localePath } from "@/i18n/config";
import { TryExampleButton } from "@/components/try-example";
import { exampleById, FIRST_EXAMPLE } from "@/content/examples";
import { firstModelCopy } from "@/content/first-model-copy";
import { studioCopy } from "@/content/studio-copy";
import { FIRST_MODEL_STEPS, lowCredits, type FirstModelProgress, type FirstModelStep } from "@/lib/first-model";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The path from an empty workspace to a published model, as one slim band. Hidden for good once all four steps are real. */
export function FirstModelCard({ locale, progress, providerReady, balance }: { locale: Locale; progress: FirstModelProgress; providerReady: boolean; balance: number }) {
  const c = firstModelCopy[locale];
  const g = studioCopy[locale].gallery;
  const hrefs: Record<FirstModelStep, string> = {
    create: "/dashboard/create",
    ready: "/dashboard/models",
    approve: progress.focusModelId ? `/dashboard/models/${progress.focusModelId}` : "/dashboard/models",
    publish: "/dashboard/embeds",
  };
  const next = FIRST_MODEL_STEPS.find((s) => progress.steps[s] !== "done") ?? "publish";
  const nothingYet = progress.steps.create !== "done";

  return (
    <section aria-labelledby="first-model-h" className="space-y-3 rounded-[20px] border border-line bg-surface/70 p-3 sm:p-4" data-testid="first-model-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="first-model-h" className="font-display text-base font-semibold">{c.title}</h2>
            <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-muted" data-testid="first-model-progress">
              {c.progress(progress.done, progress.total)}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{c.steps[next].text}</p>
        </div>
        {nothingYet ? (
          <TryExampleButton locale={locale} example={exampleById(FIRST_EXAMPLE)!} label={c.tryExample} busyLabel={g.trying} errorText={g.tryError} />
        ) : (
          progress.steps[next] !== "done" && (
            <Link href={localePath(locale, hrefs[next])} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg">
              {c.steps[next].cta}
            </Link>
          )
        )}
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {FIRST_MODEL_STEPS.map((key) => {
          const state = progress.steps[key];
          const body = (
            <>
              {state === "done" ? (
                <Check className="h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
              ) : state === "waiting" ? (
                <LoaderCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              )}
              <span className="min-w-0 truncate">{c.steps[key].title}</span>
              <span className="sr-only">: {state === "done" ? c.stateDone : state === "waiting" ? c.stateWaiting : c.statePending}</span>
            </>
          );
          const shared = cn("flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium", key === next && state !== "done" ? "bg-accent/15 text-fg" : "bg-surface-2/60", state === "done" ? "text-muted" : "text-fg");
          return (
            <li key={key} data-step={key} data-state={state}>
              {state === "done" ? (
                <span className={shared}>{body}</span>
              ) : (
                <Link href={localePath(locale, hrefs[key])} data-testid={`first-model-${key}`} className={cn(shared, "hover:bg-surface-2")}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-xs leading-relaxed text-muted" data-testid="first-model-engine-note">
        {providerReady ? c.liveNote : c.demoNote}
      </p>

      {lowCredits(balance) && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-warn/50 bg-bg/60 p-4" data-testid="low-credits-notice">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warn">{c.lowCreditsTitle}</p>
            <p className="mt-0.5 text-xs text-muted">{c.lowCreditsText}</p>
          </div>
          <Link href={localePath(locale, "/dashboard/billing")} className="shrink-0 rounded-full border border-line px-4 py-2 text-xs font-semibold hover:border-accent">
            {c.lowCreditsCta}
          </Link>
        </div>
      )}
    </section>
  );
}
