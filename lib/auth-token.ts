import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "vf_admin";
export const SESSION_DAYS = 30;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET doit contenir au moins 32 caractères.");
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(secret);
}

export type AdminSession = { adminId: number; email: string; name: string };

export async function signSession(session: AdminSession) {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.adminId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const adminId = Number(payload.sub);
    if (!Number.isInteger(adminId)) return null;
    return { adminId, email: String(payload.email ?? ""), name: String(payload.name ?? "Admin") };
  } catch {
    return null;
  }
}
