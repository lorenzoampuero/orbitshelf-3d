/**
 * Copies the local JSON store and its files into the production database and bucket.
 *
 *   npx tsx scripts/migrate-json-to-postgres.ts            # dry run: only reports what it would copy
 *   npx tsx scripts/migrate-json-to-postgres.ts --apply    # copies. Safe to run twice: existing rows are left alone.
 *
 * Reads DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY and DATA_DIR from the environment.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { copyRows, filesToCopy, type LocalData } from "./migrate-rows";

const apply = process.argv.includes("--apply");
const dataDir = path.resolve(process.env.DATA_DIR || ".data");
const dbFile = path.join(dataDir, "db.json");

async function main() {
  if (!existsSync(dbFile)) throw new Error(`Nothing to migrate: ${dbFile} does not exist.`);
  const db = JSON.parse(readFileSync(dbFile, "utf8")) as LocalData;
  console.log(`Found ${db.orgs.length} workspaces, ${db.users.length} users, ${db.models.length} models, ${db.ledger.length} ledger rows in ${dbFile}.`);

  const files = filesToCopy(db, dataDir);
  console.log(`Found ${files.length} files to copy.`);
  if (!apply) {
    console.log("Dry run: nothing was changed. Run again with --apply to copy.");
    return;
  }

  const url = process.env.DATABASE_URL;
  const storageUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "orbitshelf-private";
  if (!url || !storageUrl || !secret) throw new Error("Set DATABASE_URL, SUPABASE_URL and SUPABASE_SECRET_KEY first.");

  for (const f of files) {
    const res = await fetch(`${storageUrl}/storage/v1/object/${bucket}/${f.key}`, {
      method: "POST",
      headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": f.mime, "x-upsert": "true" },
      body: new Uint8Array(readFileSync(f.file)),
    });
    if (!res.ok) throw new Error(`Upload failed for ${f.key}: HTTP ${res.status}`);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    await copyRows(db, client);
    await client.query("COMMIT");
    console.log("Done. Check the counts in the database before removing the local files.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
