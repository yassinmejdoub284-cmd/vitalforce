import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdminApi } from "@/lib/auth";
import type { AdminSession } from "@/lib/auth-token";
import { OrderError } from "@/lib/orders";

type Handler<C> = (request: Request, context: C & { admin: AdminSession }) => Promise<Response>;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof OrderError) return jsonError(error.message, error.status);
  if (error instanceof ZodError) return jsonError(error.issues[0]?.message ?? "Données invalides.");
  // Les erreurs inattendues (SQL, réseau) sont journalisées mais jamais renvoyées telles quelles au navigateur.
  console.error(error);
  return jsonError("Erreur serveur. Réessayez; si le problème continue, consultez les logs.", 500);
}

export function isUniqueViolation(error: unknown) {
  const value = error as { code?: string; cause?: { code?: string } };
  return value?.code === "23505" || value?.cause?.code === "23505";
}

/** Route API réservée à l'admin connecté. */
export function adminRoute<C = object>(handler: Handler<C>) {
  return async (request: Request, context: C) => {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    try {
      return await handler(request, { ...context, admin: auth.admin });
    } catch (error) {
      return handleError(error);
    }
  };
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
