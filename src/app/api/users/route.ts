import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// 1. GET ALL USERS
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        userRoles: {
          include: {
            SystemRole: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedUsers = users.map((u) => {
      const roles: string[] = [];

      // Ambil dari SystemRole (ADMIN / STAFF)
      if (u.userRoles && u.userRoles.length > 0) {
        u.userRoles.forEach((ur) => {
          if (ur.SystemRole?.code) {
            roles.push(ur.SystemRole.code);
          }
        });
      }

      // Ambil dari Boolean Flags dan cocokkan labelnya dengan UI Multi-Role Approval
      if (u.isDeptHead) roles.push("HOD");
      if (u.isFinanceLeader) roles.push("FINANCE");
      if (u.isHotelManager) roles.push("GM/HM");
      if (u.isFOLeader) roles.push("FO_LEADER");
      if (u.isIT) roles.push("IT");

      if (roles.length === 0) roles.push("STAFF");

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        position: u.position || "-",
        departmentId: u.departmentId,
        departmentName: u.department?.name || "",
        approvalRoles: roles, // Menyelaraskan field dengan komponen UI Approval Mapping
        roles,
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error GET /api/users:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data user." },
      { status: 500 }
    );
  }
}

// 2. CREATE NEW USER (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, position, departmentId, roles } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: "Nama dan Email wajib diisi." },
        { status: 400 }
      );
    }

    const rolesArray: string[] = Array.isArray(roles) ? roles : [];

    // Boolean Approval Flags (Mendukung alias dari UI: FINANCE / FINANCE_LEADER dan GM/HM / HOTEL_MANAGER)
    const isDeptHead = rolesArray.includes("HOD");
    const isFinanceLeader = rolesArray.includes("FINANCE") || rolesArray.includes("FINANCE_LEADER");
    const isHotelManager = rolesArray.includes("GM/HM") || rolesArray.includes("HOTEL_MANAGER");
    const isFOLeader = rolesArray.includes("FO_LEADER");
    const isIT = rolesArray.includes("IT");

    // System Roles (ADMIN / STAFF)
    const systemRoleCodes = rolesArray.filter((r) =>
      ["ADMIN", "STAFF"].includes(r)
    );
    if (systemRoleCodes.length === 0) systemRoleCodes.push("STAFF");

    // Pastikan SystemRole tersedia di database
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

    // Buat User baru
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        position: position || null,
        departmentId:
          departmentId && departmentId.trim() !== "" ? departmentId : null,
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

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error POST /api/users:", error);
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}