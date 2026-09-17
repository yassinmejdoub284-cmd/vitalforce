import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.VERCEL) return NextResponse.json({ error: "Administration indisponible sans base persistante." }, { status: 503 });
  const { id } = await context.params;
  const payload = productUpdateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Données produit invalides.", issues: payload.error.flatten() }, { status: 400 });
  }
  const product = await prisma.product.update({ where: { id }, data: payload.data });
  return NextResponse.json({ product });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.VERCEL) return NextResponse.json({ error: "Administration indisponible sans base persistante." }, { status: 503 });
  const { id } = await context.params;
  await prisma.product.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
