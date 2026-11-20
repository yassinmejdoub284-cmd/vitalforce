import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, hasDatabase } from "@/lib/db";
import { visitorActivity } from "@/lib/db/schema";
import { actions, maxSteps, sections, storefrontPath } from "@/lib/live-activity";
import { isBot } from "@/lib/tracking";

function keys<T extends string>(labels: Record<T, string>): [T, ...T[]] {
  return Object.keys(labels) as [T, ...T[]];
}

const section = z.enum(keys(sections));
const path = z.string().regex(storefrontPath);
const at = z.number().int().positive().max(8_640_000_000_000_000);
const snapshot = z.strictObject({
  view: z.uuid(), at, path, foreground: z.boolean(), section,
  seconds: z.number().int().min(0).max(86400), scroll: z.number().int().min(0).max(100),
  steps: z.array(z.strictObject({ at, path, section, action: z.enum(keys(actions)) })).max(maxSteps)
});
const input = z.strictObject({ vid: z.uuid(), activity: snapshot });

export async function POST(request: Request) {
  if (!hasDatabase() || isBot(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  const body = await request.text();
  if (body.length > 4800) return new Response(null, { status: 413 });
  let value: unknown;
  try { value = JSON.parse(body); } catch { return new Response(null, { status: 400 }); }
  const parsed = input.safeParse(value);
  if (!parsed.success) return new Response(null, { status: 400 });
  const { vid, activity } = parsed.data;
  // Foreground tabs take precedence. A delayed blur from a different tab cannot replace them.
  await db.insert(visitorActivity).values({ visitorId: vid, snapshot: activity }).onConflictDoUpdate({
    target: visitorActivity.visitorId,
    set: { snapshot: activity, seenAt: sql`now()` },
    setWhere: sql`${visitorActivity.seenAt} < now() - interval '60 seconds'
      or ((${visitorActivity.snapshot}->>'at')::bigint < ${activity.at}
      and (${activity.foreground} or ${visitorActivity.snapshot}->>'view' = ${activity.view}))`
  });
  return new Response(null, { status: 204 });
}
