import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function getSessionUserId() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const showAll = new URL(request.url).searchParams.get("all") === "true";
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId, ...(showAll ? {} : { readAt: null }) },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  const where = body.markAll
    ? { userId, readAt: null }
    : { userId, id: typeof body.id === "string" ? body.id : "", readAt: null };
  const result = await db.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });
  return NextResponse.json({ updated: result.count });
}
