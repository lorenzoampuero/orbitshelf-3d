import { siBambulab, siBlender, siOctoprint, siShopify, siUnity } from "simple-icons";
import { Code2, Share2, Webhook } from "lucide-react";

const BRANDS = { shopify: siShopify, blender: siBlender, unity: siUnity, octoprint: siOctoprint, bambulab: siBambulab } as const;
const OWN = { embed: Share2, webhooks: Webhook, api: Code2 } as const;
/** Not in the icon set: shown as a plain letter rather than a hand-drawn imitation of their logo. */
const LETTERS = { woocommerce: "W", klipper: "K", prusa: "P" } as const;

export type BrandId = keyof typeof BRANDS | keyof typeof OWN | keyof typeof LETTERS;

/** One tile for every app, in a single colour, so no logo shouts louder than the others. */
export function BrandTile({ id }: { id: BrandId }) {
  let inner: React.ReactNode;
  if (id in BRANDS) {
    inner = (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-6 w-6 fill-current">
        <path d={BRANDS[id as keyof typeof BRANDS].path} />
      </svg>
    );
  } else if (id in OWN) {
    const Icon = OWN[id as keyof typeof OWN];
    inner = <Icon className="h-6 w-6" aria-hidden="true" />;
  } else {
    inner = (
      <span aria-hidden="true" className="font-display text-xl font-semibold">
        {LETTERS[id as keyof typeof LETTERS]}
      </span>
    );
  }
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-fg">{inner}</span>;
}
