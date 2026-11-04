import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminRoute, jsonError, readJson } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";

export const POST = adminRoute(async (request, { admin }) => {
  const { current, next } = await readJson(request);
  if (typeof next !== "string" || next.length < 10) return jsonError("Le nouveau mot de passe doit contenir au moins 10 caractères.");
  const [row] = await db.select().from(admins).where(eq(admins.id, admin.adminId)).limit(1);
  if (!row || !(await verifyPassword(String(current ?? ""), row.passwordHash))) return jsonError("Mot de passe actuel incorrect.", 403);
  await db.update(admins).set({ passwordHash: await hashPassword(next) }).where(eq(admins.id, admin.adminId));
  return NextResponse.json({ ok: true });
});
