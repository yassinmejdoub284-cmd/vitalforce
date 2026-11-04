import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, count, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins, loginAttempts } from "@/lib/db/schema";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type AdminSession } from "@/lib/auth-token";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export async function clientIp() {
  const list = await headers();
  return (list.get("x-forwarded-for")?.split(",")[0] ?? list.get("x-real-ip") ?? "local").trim();
}

const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

export async function login(email: string, password: string): Promise<{ ok: true; session: AdminSession } | { ok: false; error: string }> {
  const ip = await clientIp();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const [{ failures }] = await db.select({ failures: count() }).from(loginAttempts).where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, since)));
  if (failures >= MAX_FAILURES) return { ok: false, error: `Trop de tentatives. Réessayez dans ${WINDOW_MINUTES} minutes.` };

  const normalized = email.trim().toLowerCase();
  let [admin] = await db.select().from(admins).where(eq(admins.email, normalized)).limit(1);

  // Premier lancement: le compte défini dans ADMIN_EMAIL / ADMIN_PASSWORD est créé à la première connexion.
  if (!admin) {
    const [{ total }] = await db.select({ total: count() }).from(admins);
    const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const bootstrapPassword = process.env.ADMIN_PASSWORD;
    if (total === 0 && bootstrapEmail && bootstrapPassword && bootstrapPassword.length >= 10 && normalized === bootstrapEmail && password === bootstrapPassword) {
      [admin] = await db.insert(admins).values({ email: normalized, name: "Admin", passwordHash: await hashPassword(password) }).returning();
    }
  }

  const valid = admin ? await verifyPassword(password, admin.passwordHash) : false;
  await db.insert(loginAttempts).values({ ip, email: normalized, success: valid });
  if (!admin || !valid) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }
  return { ok: true, session: { adminId: admin.id, email: admin.email, name: admin.name } };
}

export async function setSessionCookie(response: NextResponse, session: AdminSession) {
  response.cookies.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400
  });
}

export async function getAdmin() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Pour les pages admin: redirige vers la connexion si la session est absente. */
export async function requireAdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Pour les routes API admin. */
export async function requireAdminApi(): Promise<{ admin: AdminSession; error?: never } | { admin?: never; error: NextResponse }> {
  const admin = await getAdmin();
  if (!admin) return { error: NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 }) };
  return { admin };
}
