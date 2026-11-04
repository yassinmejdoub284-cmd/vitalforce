import { randomBytes, scryptSync } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { admins } from "../lib/db/schema";

// Usage: npm run admin:create -- email@exemple.tn "MotDePasseSolide" "Nom"
async function main() {
  const [email, password, name = "Admin"] = process.argv.slice(2);
  if (!email || !password || password.length < 10) throw new Error('Usage: npm run admin:create -- email "mot-de-passe (10+ caractères)" "Nom"');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante.");
  const pool = new Pool({ connectionString: url, max: 1, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
  const salt = randomBytes(16);
  const passwordHash = `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 64).toString("hex")}`;
  await drizzle(pool).insert(admins).values({ email: email.trim().toLowerCase(), name, passwordHash })
    .onConflictDoUpdate({ target: admins.email, set: { passwordHash, name } });
  await pool.end();
  console.log(`Admin ${email} prêt.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
