"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerReviews } from "@/lib/db/schema";

const reviewInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().max(80),
  body: z.string().trim().max(1200),
  photoId: z.uuid().nullable()
}).refine(value => Boolean(value.body || value.photoId), "Ajoutez une photo ou un texte.");

function refresh() {
  revalidateTag("reviews", { expire: 0 });
  revalidatePath("/lp/[angle]", "page");
  revalidatePath("/admin/reviews");
}

export async function saveReview(input: z.input<typeof reviewInput>) {
  await requireAdminPage();
  const { id, ...values } = reviewInput.parse(input);
  if (id) await db.update(customerReviews).set(values).where(eq(customerReviews.id, id));
  else await db.insert(customerReviews).values(values);
  refresh();
}

export async function removeReview(id: number) {
  await requireAdminPage();
  await db.delete(customerReviews).where(eq(customerReviews.id, z.number().int().positive().parse(id)));
  refresh();
}
