/**
 * Adds or removes credits for one workspace, once per key. Use it to reverse a refunded or disputed Whop payment.
 *   npx tsx --conditions=react-server scripts/adjust-credits.ts <org-id> <delta> <key> [reason]
 * Example (reverse the 150 credits of a refunded top-up):
 *   npx tsx --conditions=react-server scripts/adjust-credits.ts 0b9e... -150 whop-refund:pay_123 adjustment
 * Reads the same .env as the app (DATABASE_URL or the local data folder). Running it twice with the same key changes nothing the second time,
 * and it refuses to take the balance below zero.
 */
import { store } from "../src/lib/store";

const REASONS = ["adjustment", "expiry"] as const;

async function main() {
  const [orgId, deltaRaw, key, reasonRaw = "adjustment"] = process.argv.slice(2);
  const delta = Number(deltaRaw);
  if (!orgId || !key || !Number.isInteger(delta) || delta === 0 || !(REASONS as readonly string[]).includes(reasonRaw)) {
    console.error("Usage: adjust-credits.ts <org-id> <non-zero integer delta> <key> [adjustment|expiry]");
    process.exit(2);
  }
  if (!(await store.getOrg(orgId))) {
    console.error("No workspace with that id.");
    process.exit(1);
  }
  const result = await store.adjustBalance(orgId, delta, reasonRaw as (typeof REASONS)[number], key);
  console.log(`${result}: ${delta > 0 ? "+" : ""}${delta} credits, key adjust:${key}`);
  if (result === "insufficient") process.exit(1);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
