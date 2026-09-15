import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";

export async function GET() {
  const settings = await prisma.siteSetting.upsert({ where: { id: "site" }, update: {}, create: {} });
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const payload = settingsSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Paramètres invalides.", issues: payload.error.flatten() }, { status: 400 });
  }
  const settings = await prisma.siteSetting.update({ where: { id: "site" }, data: payload.data });
  return NextResponse.json({ settings });
}
