import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/api";
import { updateOrderDetails } from "@/lib/orders";

export const PATCH = adminRoute<{ params: Promise<{ id: string }> }>(async (request, { params, admin }) => {
  const { id } = await params;
  await updateOrderDetails(Number(id), await readJson(request), admin.name);
  return NextResponse.json({ ok: true });
});
