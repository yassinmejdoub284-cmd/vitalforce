import "server-only";
import { desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, hasDatabase } from "@/lib/db";
import { customerReviews } from "@/lib/db/schema";

export const getReviews = unstable_cache(async () => {
  if (!hasDatabase()) return [];
  try {
    return await db.select().from(customerReviews).orderBy(desc(customerReviews.id)).limit(12);
  } catch (error) {
    console.error("[reviews] lecture impossible", error);
    return [];
  }
}, ["published-reviews"], { tags: ["reviews"], revalidate: 600 });
