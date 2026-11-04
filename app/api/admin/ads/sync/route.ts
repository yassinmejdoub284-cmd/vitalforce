import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/api";
import { syncAdInsights } from "@/lib/ads";
import { shiftDay, todayInTunis } from "@/lib/stats";

export const maxDuration = 60;

export const POST = adminRoute(async (request) => {
  const { days } = await readJson(request);
  const span = Math.min(90, Math.max(1, Number(days) || 30));
  const today = todayInTunis();
  return NextResponse.json(await syncAdInsights(shiftDay(today, -(span - 1)), today));
});
