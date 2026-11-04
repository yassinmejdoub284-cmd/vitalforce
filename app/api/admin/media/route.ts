import { NextResponse } from "next/server";
import { adminRoute, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 3 * 1024 * 1024;

export const POST = adminRoute(async (request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Aucun fichier reçu.");
  if (!allowed.has(file.type)) return jsonError("Format accepté: JPG, PNG, WebP ou AVIF.");
  if (file.size > MAX_BYTES) return jsonError("Image trop lourde (3 Mo maximum). Compressez-la en WebP.");
  const [saved] = await db.insert(media).values({ mime: file.type, size: file.size, data: Buffer.from(await file.arrayBuffer()) }).returning({ id: media.id });
  return NextResponse.json({ url: `/api/media/${saved.id}` }, { status: 201 });
});
