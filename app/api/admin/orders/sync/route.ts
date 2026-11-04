import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/api";
import { syncJetpackTracking } from "@/lib/orders";

export const maxDuration = 60;

export const POST = adminRoute(async (_request, { admin }) => NextResponse.json(await syncJetpackTracking({ maxRequests: 25, actor: admin.name })));
