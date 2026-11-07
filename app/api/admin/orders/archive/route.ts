import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api";
import { archiveOrders } from "@/lib/orders";

const schema = z.object({
  ids: z.array(z.number().int().positive()).max(1000).optional(),
  allCancelled: z.boolean().optional(),
  archived: z.boolean().default(true)
});

export const POST = adminRoute(async (request, { admin }) => {
  const input = schema.parse(await readJson(request));
  return NextResponse.json(await archiveOrders(input, admin.name));
});
