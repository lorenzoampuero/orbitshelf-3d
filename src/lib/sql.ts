import "server-only";

/** The small part of a Postgres driver the store needs, so production (`pg`) and tests (PGlite) run the same code. */
export type SqlRow = Record<string, unknown>;
export type Queryable = { query<T extends SqlRow = SqlRow>(text: string, params?: unknown[]): Promise<{ rows: T[] }> };
export type SqlClient = Queryable & { transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> };

/** Lazily loaded, so local development never needs the driver or a database. */
export function pgClient(connectionString: string): SqlClient {
  type Pool = import("pg").Pool;
  let pool: Pool | null = null;
  const getPool = async () => {
    if (pool) return pool;
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
    pool.on("error", (e) => console.error("[db] idle connection error:", e.message));
    return pool;
  };
  return {
    async query(text, params) {
      const p = await getPool();
      const res = await p.query(text, params as unknown[]);
      return { rows: res.rows };
    },
    async transaction(fn) {
      const p = await getPool();
      const client = await p.connect();
      try {
        await client.query("BEGIN");
        const result = await fn({
          async query(text, params) {
            const res = await client.query(text, params as unknown[]);
            return { rows: res.rows };
          },
        });
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
  };
}
