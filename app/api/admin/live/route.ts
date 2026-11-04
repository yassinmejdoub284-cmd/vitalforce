import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/api";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getLiveSummary, getLiveVisitors } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async (request) => {
  const withVisitors = new URL(request.url).searchParams.get("visitors") === "1";
  const [summary, latest, visitors] = await Promise.all([
    getLiveSummary(),
    db.select({ id: orders.id, number: orders.number, customerName: orders.customerName, total: orders.total, governorate: orders.governorate, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.id)).limit(1),
    withVisitors ? getLiveVisitors() : Promise.resolve(undefined)
  ]);
  return NextResponse.json({ summary, latestOrder: latest[0] ?? null, visitors }, { headers: { "Cache-Control": "no-store" } });
});
