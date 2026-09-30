import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Izinkan request static assets, favicon, & next-auth internal
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // 2. Ambil JWT Token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const isApiRoute = pathname.startsWith("/api");

  // 3. Jika pengguna tidak membawa Token / Session (Belum Login)
  if (!token) {
    if (isApiRoute) {
      // Jika request API, kembalikan JSON status 401 Unauthorized (JANGAN REROUTE/REDIRECT)
      return NextResponse.json(
        { message: "Unauthenticated: Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }
    // Jika request halaman web dashboard, redirect ke halaman login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isSaaSetupPath =
    /^\/api\/setup\/saa-(config|fields|steps)(\/|$)/.test(pathname);
  const isPublicSaaConfigRead =
    req.method === "GET" && pathname === "/api/setup/saa-config";
  const isAdminPath =
    pathname.startsWith("/dashboard/setup") ||
    /^\/api\/users(\/|$)/.test(pathname) ||
    (req.method !== "GET" && /^\/api\/departments(\/|$)/.test(pathname)) ||
    (isSaaSetupPath && !isPublicSaaConfigRead) ||
    pathname === "/api/setup/access-requests";

  if (isAdminPath && token.systemRole !== "ADMIN") {
    if (isApiRoute) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    pathname === "/dashboard/it/saa" &&
    token.systemRole !== "ADMIN" &&
    token.isIT !== true
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Pengguna sudah login -> Bebaskan navigasi ke semua halaman /dashboard
  // Halaman yang belum ada isinya akan menampilkan komponen "Coming Soon" masing-masing.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};