import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Charge .env (VPS) ou .env.local (poste de dev) si présents.
for (const file of [".env", ".env.local"]) {
  try { process.loadEnvFile(file); } catch { /* fichier absent */ }
}

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.warn("[migrate] DATABASE_URL absente: migration ignorée.");
    return;
  }
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({ connectionString: url, max: 1, ssl: local || /sslmode=disable/.test(url) ? undefined : { rejectUnauthorized: false } });
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("[migrate] base à jour.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
