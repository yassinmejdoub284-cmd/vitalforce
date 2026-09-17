import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderUpdateSchema } from "@/lib/validations";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.VERCEL) return NextResponse.json({ error: "Administration indisponible sans base persistante." }, { status: 503 });
  const { id } = await context.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.VERCEL) return NextResponse.json({ error: "Administration indisponible sans base persistante." }, { status: 503 });
  const { id } = await context.params;
  const payload = orderUpdateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Statut invalide.", issues: payload.error.flatten() }, { status: 400 });
  }
  const order = await prisma.order.update({ where: { id }, data: payload.data, include: { items: true } });
  return NextResponse.json({ order });
}
