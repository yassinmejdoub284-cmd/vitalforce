import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const payload = productSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Données produit invalides.", issues: payload.error.flatten() }, { status: 400 });
  }
  const product = await prisma.product.create({ data: payload.data });
  return NextResponse.json({ product }, { status: 201 });
}
