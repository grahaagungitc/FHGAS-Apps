import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const assignableRoles = new Set([
  "STAFF",
  "ADMIN",
  "HOD",
  "FINANCE_LEADER",
  "HOTEL_MANAGER",
  "FO_LEADER",
  "IT",
]);

async function getAdminId() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; systemRole?: string }
    | undefined;
  return user?.systemRole === "ADMIN" ? user.id : undefined;
}

export async function GET() {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const requests = await db.accessRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, decision, departmentId, position } = body;
    if (typeof id !== "string" || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ message: "Data keputusan tidak valid." }, { status: 400 });
    }

    const roles = Array.isArray(body.roles)
      ? [...new Set(body.roles.filter((role: unknown): role is string =>
          typeof role === "string" && assignableRoles.has(role)
        ))]
      : ["STAFF"];

    if (decision === "APPROVED" && typeof departmentId !== "string") {
      return NextResponse.json({ message: "Departemen wajib dipilih." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const accessRequest = await tx.accessRequest.findUnique({ where: { id } });
      if (!accessRequest || accessRequest.status !== "PENDING") {
        return { error: "Permintaan tidak ditemukan atau sudah diproses.", errorStatus: 409 };
      }

      if (decision === "REJECTED") {
        await tx.accessRequest.update({
          where: { id },
          data: { status: "REJECTED", resolvedById: adminId, resolvedAt: new Date() },
        });
        await tx.notification.updateMany({
          where: { accessRequestId: id, userId: adminId, readAt: null },
          data: { readAt: new Date() },
        });
        return { status: "REJECTED" };
      }

      const department = await tx.department.findUnique({ where: { id: departmentId } });
      if (!department) return { error: "Departemen tidak ditemukan.", errorStatus: 400 };
      const existingUser = await tx.user.findUnique({ where: { email: accessRequest.email } });
      if (existingUser) return { error: "Email ini sudah memiliki akun.", errorStatus: 409 };

      const systemRoleCodes = roles.filter((role: string) => role === "ADMIN" || role === "STAFF");
      if (systemRoleCodes.length === 0) systemRoleCodes.push("STAFF");
      const systemRoles = await Promise.all(
        systemRoleCodes.map((code: string) =>
          tx.systemRole.upsert({
            where: { code },
            update: {},
            create: {
              code,
              name: code === "ADMIN" ? "Administrator" : "Staff",
              isSystem: true,
            },
          })
        )
      );

      const createdUser = await tx.user.create({
        data: {
          name: accessRequest.name,
          email: accessRequest.email,
          departmentId,
          position: typeof position === "string" && position.trim() ? position.trim() : null,
          isDeptHead: roles.includes("HOD"),
          isFinanceLeader: roles.includes("FINANCE_LEADER"),
          isHotelManager: roles.includes("HOTEL_MANAGER"),
          isFOLeader: roles.includes("FO_LEADER"),
          isIT: roles.includes("IT"),
          userRoles: { create: systemRoles.map((role) => ({ roleId: role.id })) },
        },
      });

      await tx.accessRequest.update({
        where: { id },
        data: { status: "APPROVED", resolvedById: adminId, resolvedAt: new Date() },
      });
      await tx.notification.updateMany({
        where: { accessRequestId: id, userId: adminId, readAt: null },
        data: { readAt: new Date() },
      });
      return { status: "APPROVED", userId: createdUser.id };
    });

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.errorStatus });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Access request review error:", error);
    return NextResponse.json({ message: "Gagal memproses permintaan akses." }, { status: 500 });
  }
}
