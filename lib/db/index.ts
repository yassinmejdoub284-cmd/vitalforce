import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { vitalPool?: Pool; vitalDb?: NodePgDatabase<typeof schema> };

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL n'est pas configurée.");
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    // Serverless functions keep few connections; use the provider's pooled URL (Neon "-pooler").
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    ssl: local || /sslmode=disable/.test(connectionString) ? undefined : { rejectUnauthorized: false }
  });
}

export function getDb() {
  if (!globalForDb.vitalDb) {
    globalForDb.vitalPool = createPool();
    globalForDb.vitalDb = drizzle(globalForDb.vitalPool, { schema });
  }
  return globalForDb.vitalDb;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, property) {
    const instance = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = instance[property];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  }
});

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export { schema };
