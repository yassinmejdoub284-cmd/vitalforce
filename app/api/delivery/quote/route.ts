import { NextResponse } from "next/server";
import { getDeliveryQuotes } from "@/lib/delivery";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ subtotal: 0 }));
  const settings = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  return NextResponse.json({ quotes: getDeliveryQuotes(Number(body.subtotal) || 0, settings ?? undefined) });
}
