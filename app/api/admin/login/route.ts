import { NextResponse } from "next/server";
import { handleError, jsonError, readJson } from "@/lib/api";
import { login, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (typeof body.email !== "string" || typeof body.password !== "string") return jsonError("Email et mot de passe requis.");
  try {
    const result = await login(body.email, body.password);
    if (!result.ok) return jsonError(result.error, 401);
    const response = NextResponse.json({ ok: true, name: result.session.name });
    await setSessionCookie(response, result.session);
    return response;
  } catch (error) {
    return handleError(error);
  }
}
