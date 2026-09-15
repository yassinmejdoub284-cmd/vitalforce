import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.META_CONVERSIONS_API_TOKEN;
  const datasetId = process.env.META_DATASET_ID;
  const body = await request.json().catch(() => null);

  if (!token || !datasetId) {
    return NextResponse.json({ ok: true, mode: "disabled", reason: "Meta Conversions API credentials are not configured." });
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${datasetId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [body],
      test_event_code: process.env.META_TEST_EVENT_CODE || undefined
    })
  });

  return NextResponse.json({ ok: response.ok, status: response.status, response: await response.json().catch(() => null) });
}
