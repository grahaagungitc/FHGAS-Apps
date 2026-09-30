import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { name: true, email: true, position: true, departmentId: true },
  });
  if (!user) {
    return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json(user);
}
