import { and, eq, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { db, hasDatabase } from "@/lib/db";
import { blacklist, callbackDrafts } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings";
import { normalizeTunisianPhone } from "@/lib/tunisia";

const key = z.object({ id: z.uuid(), revision: z.number().int().min(1).max(2147483647) });
const snapshot = key.extend({
  consent: z.literal(true),
  phone: z.string().max(30).transform(normalizeTunisianPhone).pipe(z.string()),
  customerName: z.string().trim().max(80),
  governorate: z.string().trim().max(80),
  city: z.string().trim().max(80),
  address: z.string().trim().max(250),
  items: z.array(z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) })).min(1).max(10),
  angle: z.string().max(60),
  website: z.literal("")
});

export async function POST(request: Request) {
  if (!hasDatabase()) return new Response(null, { status: 503 });
  const body = await request.json().catch(() => null);
  const parsed = z.discriminatedUnion("consent", [snapshot, key.extend({ consent: z.literal(false) })]).safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  const input = parsed.data;
  if (!input.consent) {
    // Leave an empty tombstone in case an earlier autosave is still in flight.
    const clear = { phone: null, customerName: null, governorate: null, city: null, address: null, items: null, angle: null, closedAt: new Date() };
    await db.insert(callbackDrafts).values({ id: input.id, ...clear }).onConflictDoUpdate({
      target: callbackDrafts.id, set: clear, setWhere: isNull(callbackDrafts.closedAt)
    });
  } else {
    const { store, orders } = await getSettings();
    if (!store.callbackEnabled || !store.ordersEnabled) return new Response(null, { status: 409 });
    if (orders.blockBlacklisted) {
      const [blocked] = await db.select({ phone: blacklist.phone }).from(blacklist).where(eq(blacklist.phone, input.phone)).limit(1);
      if (blocked) return new Response(null, { status: 204 });
    }
    const { id, revision, phone, customerName, governorate, city, address, items, angle } = input;
    const data = { revision, phone, customerName, governorate, city, address, items, angle, updatedAt: new Date() };
    await db.insert(callbackDrafts).values({ id, ...data }).onConflictDoUpdate({
      target: callbackDrafts.id, set: data,
      setWhere: and(isNull(callbackDrafts.closedAt), lt(callbackDrafts.revision, revision))
    });
  }
  return new Response(null, { status: 204 });
}
