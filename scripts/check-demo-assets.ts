import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateGlb } from "../src/lib/glb";
import { DEMO_ASSETS } from "../src/lib/types";

async function main() {
  for (const name of DEMO_ASSETS) {
    const filePath = path.join(process.cwd(), "public", "demo", `${name}.glb`);
    const buf = await readFile(filePath);
    const info = validateGlb(buf);
    console.log(`[ok] ${name}.glb (${info.bytes} bytes, sha256=${info.sha256.slice(0, 12)}...)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
