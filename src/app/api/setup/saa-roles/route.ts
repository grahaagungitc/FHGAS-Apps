import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const roles = await db.systemRole.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("GET SAA roles error:", error);
    return NextResponse.json({ message: "Gagal mengambil daftar role." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!/^[A-Z][A-Z0-9_]*$/.test(code) || !name) {
      return NextResponse.json(
        { message: "Role code hanya boleh berisi huruf kapital, angka, dan underscore; nama wajib diisi." },
        { status: 400 }
      );
    }

    const role = await db.systemRole.create({
      data: { code, name, description: description || null, isSystem: false },
    });
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("POST SAA role error:", error);
    return NextResponse.json(
      { message: "Role code atau nama sudah digunakan." },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.id !== "string") {
      return NextResponse.json({ message: "Role ID wajib diisi." }, { status: 400 });
    }

    const currentRole = await db.systemRole.findUnique({ where: { id: body.id } });
    if (!currentRole) return NextResponse.json({ message: "Role tidak ditemukan." }, { status: 404 });
    if (currentRole.isSystem) {
      return NextResponse.json({ message: "Role sistem tidak dapat diubah." }, { status: 409 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ message: "Nama role wajib diisi." }, { status: 400 });

    const role = await db.systemRole.update({
      where: { id: body.id },
      data: {
        name,
        description: typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null,
      },
    });
    return NextResponse.json(role);
  } catch (error) {
    console.error("PUT SAA role error:", error);
    return NextResponse.json({ message: "Gagal memperbarui role." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "Role ID wajib diisi." }, { status: 400 });

    const role = await db.systemRole.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ message: "Role tidak ditemukan." }, { status: 404 });
    if (role.isSystem) {
      return NextResponse.json({ message: "Role sistem tidak dapat dihapus." }, { status: 409 });
    }

    const [userCount, approvalCount] = await Promise.all([
      db.userRole.count({ where: { roleId: id } }),
      db.saaApprovalStep.count({ where: { role: role.code } }),
    ]);
    if (userCount || approvalCount) {
      return NextResponse.json(
        { message: "Role masih digunakan oleh user atau workflow approval." },
        { status: 409 }
      );
    }

    await db.systemRole.delete({ where: { id } });
    return NextResponse.json({ message: "Role berhasil dihapus." });
  } catch (error) {
    console.error("DELETE SAA role error:", error);
    return NextResponse.json({ message: "Gagal menghapus role." }, { status: 500 });
  }
}