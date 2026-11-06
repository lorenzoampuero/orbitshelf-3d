import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

/**
 * Shared building blocks for every public page, so the home, the feature pages, the trade pages,
 * the integrations page, pricing and the guides all look like one product.
 * Server components only: nothing here needs the browser.
 */

/** Page width wrapper with the vertical rhythm every section uses. */
export function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <div className="container-page space-y-10">{children}</div>
    </section>
  );
}

/** Section title: one centred line, no eyebrow, with an optional supporting line. */
export function SectionTitle({ children, sub, level = 2 }: { children: React.ReactNode; sub?: string; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="reveal mx-auto max-w-2xl space-y-3 text-center">
      <Heading className="text-[clamp(1.75rem,3.4vw,2.45rem)] font-semibold leading-tight">{children}</Heading>
      {sub ? <p className="text-base leading-relaxed text-muted">{sub}</p> : null}
    </div>
  );
}

/**
 * A label inside a card. Plain by default: a pill with no arrow, because an arrow square reads as a button.
 * Pass `href` only when the whole tag really is a link; it then gets the arrow square.
 * `w-fit self-start` keeps it from stretching across a flex column.
 */
export function Tag({ children, href }: { children: React.ReactNode; href?: string }) {
  if (href) {
    return (
      <Link href={href} className="tag-pill w-fit self-start transition-colors hover:border-accent">
        {children}
        <span className="tag-arrow" aria-hidden="true">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }
  return <span className="tag-pill w-fit self-start !pr-4">{children}</span>;
}

/** A plain label pill with no arrow, for status and context. */
export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="tag-pill !pr-4">{children}</span>;
}

/** A drawn tile for diagrams: an icon in a rounded square. Never a screenshot, never presented as a result. */
export function Tile({ children, label, tone = "dark" }: { children: React.ReactNode; label?: string; tone?: "dark" | "blood" }) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone === "blood" ? "bg-blood text-white" : "border border-line bg-surface-2 text-fg"}`}
      >
        {children}
      </span>
      {label ? <span className="text-xs text-muted">{label}</span> : null}
    </span>
  );
}

/** Small status badge: "Disponible", "En pruebas", "Próximamente". */
export function StatusBadge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ok" | "warn" }) {
  const color = tone === "ok" ? "bg-ok/15 text-ok" : tone === "warn" ? "bg-warn/15 text-warn" : "bg-white/10 text-muted";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{children}</span>;
}

/**
 * Card looks, so a page is not ten identical panels:
 *  - default: the solid surface card.
 *  - outline: no fill, a visible border. For secondary notes.
 *  - red: a deep red gradient. For the one card a section is built around.
 *  - planned: dashed and transparent. For things that do not exist yet, so live items lead.
 * All share the 24px radius.
 */
export type CardTone = "default" | "outline" | "red" | "planned";
const CARD_TONE: Record<CardTone, string> = {
  default: "",
  outline: "bg-transparent border-white/20",
  red: "bg-[linear-gradient(135deg,#2e0709_0%,#14090a_70%)] border-[#5a1618]",
  planned: "bg-transparent border-dashed border-white/25",
};
/** Pass `lift` for the hover rise on cards that are links or invite a look. */
export function Card({
  children,
  className = "",
  lift = false,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
  tone?: CardTone;
}) {
  return <article className={`card reveal p-7 md:p-8 ${lift ? "card-lift" : ""} ${CARD_TONE[tone]} ${className}`}>{children}</article>;
}

/** Tone classes for cards that are not built with <Card> (list items). Same looks as <Card tone>. */
export const cardToneClass = (tone: CardTone) => CARD_TONE[tone];

/** A tag, a title and a text: the content of most cards. */
export function CardBody({ tag, title, text, children }: { tag?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {tag ? <Tag>{tag}</Tag> : null}
      <h3 className="text-xl font-semibold leading-tight">{title}</h3>
      {text ? <p className="text-sm leading-relaxed text-muted">{text}</p> : null}
      {children}
    </div>
  );
}

/** Ticked list used inside cards. */
export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted">
      {items.map((p) => (
        <li key={p} className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          {p}
        </li>
      ))}
    </ul>
  );
}

/**
 * Hero for every inner page: pill, giant title, one supporting line, up to two buttons.
 * The floating navbar is fixed, so the top padding clears it. `visual` goes under the buttons.
 */
export function PageHero({
  pill,
  title,
  text,
  primary,
  secondary,
  visual,
}: {
  pill?: string;
  title: string;
  text?: string;
  primary?: { href: string; label: string; testId?: string };
  secondary?: { href: string; label: string };
  visual?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-10 pt-32 md:pt-40">
      <div className="container-page flex flex-col items-center text-center">
        {pill ? <Pill>{pill}</Pill> : null}
        <h1 className="hero-title mt-6 max-w-4xl text-[clamp(2.2rem,5.2vw,4rem)]">{title}</h1>
        {text ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{text}</p> : null}
        {primary || secondary ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primary ? (
              <Link href={primary.href} data-testid={primary.testId} className="btn-pill btn-solid py-3.5">
                {primary.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            {secondary ? (
              <Link href={secondary.href} className="btn-pill btn-outline py-3.5">
                {secondary.label}
              </Link>
            ) : null}
          </div>
        ) : null}
        {visual ? <div className="mt-12 w-full">{visual}</div> : null}
      </div>
    </section>
  );
}

/** Questions and answers as native details elements inside cards. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((f) => (
        <details key={f.q} className="card reveal group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold">
            <span>{f.q}</span>
            <span aria-hidden="true" className="text-2xl font-normal leading-none text-accent">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Closing banner on a starfield: two-line title, the second in gradient, one button. */
export function ClosingBanner({ titleA, titleB, cta, href, note }: { titleA: string; titleB: string; cta: string; href: string; note?: string }) {
  return (
    <section className="pb-20 pt-8 md:pb-28">
      <div className="container-page">
      <div
        className="reveal relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-[var(--radius-card)] px-6 py-20 text-center md:py-28"
        style={{
          backgroundColor: "#1a0506",
          backgroundImage: [
            "radial-gradient(ellipse 70% 90% at 50% 120%, #8b0000 0%, rgb(139 0 0 / 0) 70%)",
            "radial-gradient(1.5px 1.5px at 12% 24%, #fff, transparent)",
            "radial-gradient(1px 1px at 27% 68%, #fff, transparent)",
            "radial-gradient(1.5px 1.5px at 41% 15%, #fff, transparent)",
            "radial-gradient(1px 1px at 58% 78%, #fff, transparent)",
            "radial-gradient(2px 2px at 73% 30%, #fff, transparent)",
            "radial-gradient(1px 1px at 86% 62%, #fff, transparent)",
            "radial-gradient(1.5px 1.5px at 92% 14%, #fff, transparent)",
            "radial-gradient(1px 1px at 6% 82%, #fff, transparent)",
            "radial-gradient(1px 1px at 66% 10%, #fff, transparent)",
            "radial-gradient(1.5px 1.5px at 34% 88%, #fff, transparent)",
          ].join(","),
        }}
      >
        <h2 className="text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.05]">
          {titleA}
          <br />
          <span className="bg-gradient-to-r from-white to-[#ffb3b3] bg-clip-text text-transparent">{titleB}</span>
        </h2>
        <Link href={href} className="btn-pill btn-ink py-3.5">
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {note ? <p className="max-w-md text-sm text-white/70">{note}</p> : null}
      </div>
      </div>
    </section>
  );
}
