import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api";
import { sendOrdersToJetpack } from "@/lib/orders";

export const maxDuration = 60;
const schema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) });

export const POST = adminRoute(async (request, { admin }) => {
  const { ids } = schema.parse(await readJson(request));
  const results = await sendOrdersToJetpack(ids, admin.name);
  return NextResponse.json({ results, ok: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok) });
});
