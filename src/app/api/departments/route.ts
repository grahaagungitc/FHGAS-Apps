import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET: Mengambil daftar departemen dari Database
export async function GET() {
  try {
    const departments = await db.department.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil data departemen" },
      { status: 500 }
    );
  }
}

// POST: Menambah Departemen Baru ke Database
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Nama departemen wajib diisi" },
        { status: 400 }
      );
    }

    const newDepartment = await db.department.create({
      data: {
        code: code || null,
        name: name,
      },
    });

    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menambahkan departemen" },
      { status: 500 }
    );
  }
}