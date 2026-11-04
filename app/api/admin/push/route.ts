import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, jsonError, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";

const schema = z.object({ endpoint: z.string().url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

export const POST = adminRoute(async (request, { admin }) => {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Abonnement invalide.");
  const { endpoint, keys } = parsed.data;
  await db.insert(pushSubscriptions).values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, adminId: admin.adminId, userAgent: request.headers.get("user-agent")?.slice(0, 200) })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh: keys.p256dh, auth: keys.auth, adminId: admin.adminId } });
  return NextResponse.json({ ok: true });
});

export const DELETE = adminRoute(async (request) => {
  const { endpoint } = await readJson(request);
  if (typeof endpoint === "string") await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return NextResponse.json({ ok: true });
});
