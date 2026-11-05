import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { BlobStore } from "@/lib/blob";
import type { SqlClient } from "@/lib/sql";

/** All migrations, applied in order, exactly as a new project would get them. */
export async function migrate(db: PGlite) {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const f of (await readdir(dir)).sort()) await db.exec(await readFile(path.join(dir, f), "utf8"));
}

export function pgliteClient(db: PGlite): SqlClient {
  return {
    async query(text, params) {
      const res = await db.query(text, params as never[]);
      return { rows: res.rows as never[] };
    },
    transaction(fn) {
      return db.transaction(async (tx) =>
        fn({
          async query(text, params) {
            const res = await tx.query(text, params as never[]);
            return { rows: res.rows as never[] };
          },
        }),
      ) as ReturnType<typeof fn>;
    },
  };
}

export function memoryBlobs(): BlobStore & { files: Map<string, Buffer> } {
  const files = new Map<string, Buffer>();
  return {
    files,
    async put(key, data) {
      files.set(key, data);
    },
    async get(key) {
      return files.get(key) ?? null;
    },
    async delete(key) {
      files.delete(key);
    },
  };
}
