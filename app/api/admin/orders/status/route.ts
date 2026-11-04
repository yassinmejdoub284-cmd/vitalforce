import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api";
import { orderStatuses } from "@/lib/db/schema";
import { changeOrderStatus } from "@/lib/orders";

const schema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(500), status: z.enum(orderStatuses), reason: z.string().trim().max(200).optional() });

export const POST = adminRoute(async (request, { admin }) => {
  const { ids, status, reason } = schema.parse(await readJson(request));
  const results = await changeOrderStatus(ids, status, admin.name, reason);
  return NextResponse.json({ results, ok: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok) });
});
