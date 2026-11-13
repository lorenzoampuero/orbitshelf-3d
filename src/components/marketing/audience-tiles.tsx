import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModelTrio } from "@/components/marketing/model-art";
import type { GalleryModel } from "@/lib/models";
import type { Locale } from "@/lib/types";

export type AudienceTile = {
  key: string;
  tag: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  /** The first render is the large one; the next two sit small beside it. */
  models: [GalleryModel, GalleryModel, GalleryModel];
};

/** Three tiles, one per audience. Each shows two renders breaking out of its picture area; the whole tile is the link. */
export function AudienceTiles({ tiles, locale }: { tiles: AudienceTile[]; locale: Locale }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <li key={t.key} className="min-w-0">
          <Link href={t.href} data-testid={`audience-${t.key}`} className="card card-lift group/tile flex h-full flex-col overflow-hidden">
            <ModelTrio models={t.models} locale={locale} />
            <div className="flex flex-1 flex-col gap-3 p-6">
              <span className="font-mono text-[13px] uppercase tracking-wider text-accent">{t.tag}</span>
              <h3 className="text-2xl font-semibold leading-tight">{t.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{t.text}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-fg">
                {t.cta}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover/tile:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
