import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.department.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Departemen berhasil dihapus." });
  } catch (error) {
    console.error("DELETE department error:", error);
    return NextResponse.json(
      { message: "Departemen tidak ditemukan atau masih digunakan oleh user." },
      { status: 409 }
    );
  }
}
