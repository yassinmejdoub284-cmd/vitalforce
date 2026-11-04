import { eq } from "drizzle-orm";
import { db, hasDatabase } from "@/lib/db";
import { media } from "@/lib/db/schema";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!hasDatabase() || !/^[0-9a-f-]{36}$/.test(id)) return new Response("Introuvable", { status: 404 });
  const [file] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!file) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.mime, "Content-Length": String(file.size), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" }
  });
}
