import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/setup") || pathname.startsWith("/api/setup")) {
    const isAdmin = session?.user?.roles?.includes("ADMIN");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }
  }

  if (session?.user?.isGuestViewOnly) {
    const isMutation = req.method !== "GET";
    const isSaaCreation = pathname === "/api/saa/request" && req.method === "POST";

    if (isMutation && !isSaaCreation) {
      return NextResponse.json(
        { error: "Account is in View-Only mode. Mutation not allowed." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/setup/:path*", "/api/:path*"],
};
