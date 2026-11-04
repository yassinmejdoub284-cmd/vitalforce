import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth-token";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);
const PUBLIC_ADMIN_API = new Set(["/api/admin/login"]);

function isAdminHost(host: string) {
  const adminHost = process.env.ADMIN_HOST?.toLowerCase();
  const hostname = host.toLowerCase().split(":")[0];
  return adminHost ? hostname === adminHost : hostname.startsWith("admin.");
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const adminHost = isAdminHost(host);
  const target = pathname;

  if (adminHost) {
    // Sur admin.vitalforce-bioactive.com, toutes les pages vivent sous /admin (la boutique n'y est pas servie).
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL(pathname === "/" ? "/admin" : `/admin${pathname}`, request.url));
    }
  } else if (process.env.ADMIN_HOST && (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"))) {
    // Sur le domaine public, l'admin n'existe pas: on renvoie vers le sous-domaine.
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, `https://${process.env.ADMIN_HOST}`));
  }

  const needsPage = target.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.has(target);
  const needsApi = target.startsWith("/api/admin") && !PUBLIC_ADMIN_API.has(target);
  if (needsPage || needsApi) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      if (needsApi) return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });
      const login = new URL("/admin/login", request.url);
      if (target !== "/admin") login.searchParams.set("next", target);
      return NextResponse.redirect(login);
    }
  }

  const response = NextResponse.next();
  if (target.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("X-Frame-Options", "DENY");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"]
};
