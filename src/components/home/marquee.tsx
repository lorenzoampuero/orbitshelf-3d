/** A moving strip of plain names. The second copy is only there to make the loop seamless, so it is hidden from screen readers. */
export function Marquee({ title, items }: { title: string; items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((item) => (
        <li key={item} className="whitespace-nowrap font-display text-lg font-semibold text-white/55 transition-colors hover:text-fg">
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={title} className="border-y border-line py-6" data-testid="home-marquee">
      <div className="container-page flex flex-col items-center gap-4 md:flex-row md:gap-10">
        <p className="shrink-0 text-xs font-medium text-muted">{title}</p>
        <div className="marquee min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex w-max">
            {row(false)}
            {row(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
