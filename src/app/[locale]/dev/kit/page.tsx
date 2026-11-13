import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitDemo } from "./kit-demo";

export const metadata: Metadata = { title: "UI kit", robots: { index: false, follow: false } };

/** Control page for the design system (docs/PLAN_REDISENO.md §3.3). Development only: it does not exist in a production build. */
export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitDemo />;
}
