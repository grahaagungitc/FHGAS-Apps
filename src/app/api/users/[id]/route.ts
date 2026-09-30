import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db as prisma } from "@/lib/db";

// PUT /api/users/[id] - UPDATE USER
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { name, email, position, departmentId, roles } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID wajib disertakan." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { SystemRole: true } } },
    });
    if (!existingUser) {
      return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
    }

    const rolesArray: string[] = Array.isArray(roles)
      ? roles
      : [
          ...existingUser.userRoles.map((userRole) => userRole.SystemRole.code),
          ...(existingUser.isDeptHead ? ["HOD"] : []),
          ...(existingUser.isFinanceLeader ? ["FINANCE_LEADER"] : []),
          ...(existingUser.isHotelManager ? ["HOTEL_MANAGER"] : []),
          ...(existingUser.isFOLeader ? ["FO_LEADER"] : []),
          ...(existingUser.isIT ? ["IT"] : []),
        ];

    // 1. Mapping Boolean Flags
    const isDeptHead = rolesArray.includes("HOD");
    const isFinanceLeader = rolesArray.includes("FINANCE_LEADER");
    const isHotelManager = rolesArray.includes("HOTEL_MANAGER");
    const isFOLeader = rolesArray.includes("FO_LEADER");
    const isIT = rolesArray.includes("IT") || rolesArray.includes("IT TEAM");

    // 2. Mapping SystemRole (Hanya ADMIN dan STAFF)
    const systemRoleCodes = rolesArray.filter((r) =>
      ["ADMIN", "STAFF"].includes(r)
    );
    if (systemRoleCodes.length === 0) systemRoleCodes.push("STAFF");

    const isCurrentAdmin = existingUser.userRoles.some(
      (userRole) => userRole.SystemRole.code === "ADMIN"
    );
    if (isCurrentAdmin && !systemRoleCodes.includes("ADMIN")) {
      const adminCount = await prisma.user.count({
        where: { userRoles: { some: { SystemRole: { is: { code: "ADMIN" } } } } },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: "Administrator terakhir tidak dapat diturunkan role-nya." },
          { status: 409 }
        );
      }
    }

    // Pastikan SystemRole ada di Database
    const systemRoleIds: string[] = [];
    for (const code of systemRoleCodes) {
      const sysRole = await prisma.systemRole.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: code === "ADMIN" ? "Administrator" : "Staff",
          isSystem: true,
        },
      });
      systemRoleIds.push(sysRole.id);
    }

    // 3. Update User & Relasi UserRole menggunakan Transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Hapus relasi UserRole lama agar tidak bentrok / duplicate primary key
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Update data user utama dan buat ulang relasi UserRole baru
      return await tx.user.update({
        where: { id: userId },
        data: {
          name: name ?? existingUser.name,
          email: email ?? existingUser.email,
          position: position === undefined ? existingUser.position : position || null,
          departmentId:
            departmentId === undefined
              ? existingUser.departmentId
              : departmentId && departmentId.trim() !== ""
                ? departmentId
                : null,
          isDeptHead,
          isFinanceLeader,
          isHotelManager,
          isFOLeader,
          isIT,
          userRoles: {
            create: systemRoleIds.map((roleId) => ({
              roleId,
            })),
          },
        },
        include: {
          department: true,
          userRoles: {
            include: {
              SystemRole: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error PUT /api/users/[id]:", error);
    return NextResponse.json(
      { message: error.message || "Gagal mengupdate user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - DELETE USER
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const session = await auth();
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    if (sessionUserId === userId) {
      return NextResponse.json(
        { message: "Anda tidak dapat menghapus akun sendiri." },
        { status: 409 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { SystemRole: true } } },
    });
    if (!targetUser) {
      return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
    }

    const isAdmin = targetUser.userRoles.some(
      (userRole) => userRole.SystemRole.code === "ADMIN"
    );
    if (isAdmin) {
      const admins = await prisma.user.count({
        where: { userRoles: { some: { SystemRole: { is: { code: "ADMIN" } } } } },
      });
      if (admins <= 1) {
        return NextResponse.json(
          { message: "Administrator terakhir tidak dapat dihapus." },
          { status: 409 }
        );
      }
    }

    const pendingTasks = await prisma.saaApprovalTask.count({
      where: { assignedToUserId: userId, status: { in: ["PENDING", "WAITING"] } },
    });
    if (pendingTasks > 0) {
      return NextResponse.json(
        { message: "User masih memiliki tugas approval aktif." },
        { status: 409 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error: any) {
    console.error("Error DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { message: "Gagal menghapus user" },
      { status: 500 }
    );
  }
}