import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateGlb } from "../src/lib/glb";
import { showcase } from "../src/config/showcase";

/** Hero model budget: it loads on the first screen of the home page. */
const HERO_MAX_BYTES = 5 * 1024 * 1024;

async function main() {
  if (showcase.length === 0) {
    console.log("[ok] showcase is empty: the site shows no real results yet (sections that need them are hidden).");
    return;
  }

  const problems: string[] = [];
  const heroes = showcase.filter((s) => s.hero);
  if (heroes.length > 1) problems.push(`more than one entry has hero: true (${heroes.map((h) => h.id).join(", ")})`);

  for (const s of showcase) {
    const files = [s.glb, s.poster.src, ...s.photos.map((p) => p.src)];
    for (const f of files) {
      if (!f.startsWith("/showcase/")) problems.push(`${s.id}: ${f} must live under /showcase/`);
    }
    if (s.kind === "text" && !s.prompt) problems.push(`${s.id}: text entries must carry the prompt they were generated from`);
    if (s.kind === "multi-image" && s.photos.length < 2) problems.push(`${s.id}: multi-image entries need at least two photos`);
    if (s.kind === "image" && s.photos.length !== 1) problems.push(`${s.id}: image entries need exactly one photo`);

    try {
      const glb = await readFile(path.join(process.cwd(), "public", s.glb));
      const info = validateGlb(glb);
      if (s.hero && info.bytes > HERO_MAX_BYTES) problems.push(`${s.id}: hero GLB is ${info.bytes} bytes, over the ${HERO_MAX_BYTES} byte budget`);
      console.log(`[ok] ${s.id}.glb (${info.bytes} bytes, sha256=${info.sha256.slice(0, 12)}...)`);
    } catch (err) {
      problems.push(`${s.id}: GLB unreadable or invalid (${err instanceof Error ? err.message : String(err)})`);
    }

    for (const f of [s.poster.src, ...s.photos.map((p) => p.src)]) {
      try {
        await readFile(path.join(process.cwd(), "public", f));
      } catch {
        problems.push(`${s.id}: missing file ${f}`);
      }
    }
  }

  if (problems.length) {
    for (const p of problems) console.error(`[fail] ${p}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
