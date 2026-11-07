import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/api";
import { syncAdInsights } from "@/lib/ads";
import { shiftDay, todayInTunis } from "@/lib/stats";

export const maxDuration = 60;

export const POST = adminRoute(async (request) => {
  const { days } = await readJson(request);
  const span = Math.min(90, Math.max(1, Number(days) || 30));
  const today = todayInTunis();
  try {
    return NextResponse.json(await syncAdInsights(shiftDay(today, -(span - 1)), today));
  } catch (error) {
    // Message réel (Meta ou base) pour savoir quoi corriger.
    console.error("[ads/sync]", error);
    const cause = (error as { cause?: { message?: string } }).cause?.message;
    return NextResponse.json({ error: `Synchronisation impossible: ${cause ?? (error as Error).message}`.slice(0, 300) }, { status: 502 });
  }
});
