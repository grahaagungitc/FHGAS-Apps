import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requestUnregisteredAccess } from "@/lib/access-requests";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ message: "Sesi Google tidak ditemukan. Silakan mulai ulang pendaftaran." }, { status: 401 });
    }

    const existingUser = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ message: "Email ini sudah terdaftar. Silakan login." }, { status: 409 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const departmentId = typeof body.departmentId === "string" ? body.departmentId : "";
    if (!name || name.length > 120 || !departmentId) {
      return NextResponse.json({ message: "Nama dan Department wajib diisi." }, { status: 400 });
    }

    const department = await db.department.findUnique({ where: { id: departmentId }, select: { id: true } });
    if (!department) {
      return NextResponse.json({ message: "Department yang dipilih tidak ditemukan." }, { status: 400 });
    }

    await requestUnregisteredAccess({ email, name, requestedDepartmentId: department.id });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/signup/complete error:", error);
    return NextResponse.json({ message: "Pendaftaran gagal dikirim. Silakan coba lagi." }, { status: 500 });
  }
}