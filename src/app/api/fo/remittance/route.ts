import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// GET /api/fo/remittance
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil daftar user yang memiliki role FO_CASHIER atau CASHIER (dari setup User Management / SystemRole)
    const cashierUsers = await db.user.findMany({
      where: {
        userRoles: {
          some: {
            SystemRole: {
              code: { in: ["FO_CASHIER", "CASHIER"] },
            },
          },
        },
      },
      include: {
        department: true,
        userRoles: { include: { SystemRole: true } },
      },
      orderBy: [{ name: "asc" }],
    });

    // Fallback: Jika belum ada user yang diberi role FO Cashier di User Management,
    // ambil user dari departemen Front Office agar dropdown tidak kosong.
    let targetUsers = cashierUsers;
    if (targetUsers.length === 0) {
      targetUsers = await db.user.findMany({
        where: {
          OR: [
            { department: { name: { contains: "Front Office", mode: "insensitive" } } },
            { department: { code: { in: ["FO", "FRONT_OFFICE"] } } },
          ],
        },
        include: {
          department: true,
          userRoles: { include: { SystemRole: true } },
        },
        orderBy: [{ name: "asc" }],
      });
      // Jika departemen FO juga tidak ada user, ambil semua user
      if (targetUsers.length === 0) {
        targetUsers = await db.user.findMany({
          include: { department: true, userRoles: { include: { SystemRole: true } } },
          orderBy: [{ name: "asc" }],
        });
      }
    }

    const formattedStaffList = targetUsers.map((u) => {
      const roleNames = u.userRoles?.map((ur: any) => ur.SystemRole?.name || ur.SystemRole?.code).filter(Boolean) || [];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        position: u.position || "Staff",
        departmentName: u.department?.name || "Front Office",
        isFOLeader: u.isFOLeader || u.isDeptHead,
        roles: roleNames,
      };
    });

    // Cek user yang sedang login di database secara detail
    const currentDbUser = await db.user.findFirst({
      where: {
        OR: [
          ...(session.user?.id ? [{ id: session.user.id }] : []),
          ...(session.user?.email ? [{ email: { equals: session.user.email, mode: "insensitive" as const } }] : []),
        ],
      },
      include: {
        userRoles: { include: { SystemRole: true } },
      },
    });

    const currentRoleCodes = currentDbUser?.userRoles?.map((ur: any) => ur.SystemRole?.code) || [];
    const isFOLeader = !!(currentDbUser?.isFOLeader || currentDbUser?.isDeptHead || currentRoleCodes.includes("FO_LEADER") || currentRoleCodes.includes("HOD"));
    const isAdmin = !!(currentRoleCodes.includes("ADMIN") || (session.user as any)?.systemRole === "ADMIN");

    // Cek apakah role user memiliki Full Access terhadap module Remittance di matriks permission
    const hasFullAccessPerm = await db.roleModulePermission.findFirst({
      where: {
        role: {
          code: { in: currentRoleCodes.length > 0 ? currentRoleCodes : ["STAFF"] },
        },
        module: {
          code: { in: ["FO_FRONT_DESK", "FO_REMITTANCE"] },
        },
        accessLevel: { in: ["FULL", "READ_WRITE", "ADMIN"] },
      },
    });

    const hasRemittanceFullAccess = isAdmin || isFOLeader || !!hasFullAccessPerm;

    // Ambil riwayat Remittance dari database
    const historyData = await (db as any).remittanceRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const currentUserId = currentDbUser?.id || session.user?.id;
    const currentUserName = currentDbUser?.name || session.user?.name || "";

    const formattedHistory = historyData.map((item: any) => {
      const isOwner = (item.userId && currentUserId && item.userId === currentUserId) ||
                      (item.staffName && currentUserName && item.staffName.trim().toLowerCase() === currentUserName.trim().toLowerCase());
      const canEdit = hasRemittanceFullAccess || isOwner;

      return {
        id: item.id,
        userId: item.userId,
        canEdit,
        timestamp: new Date(item.createdAt).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        tanggal: item.tanggal,
        staff: item.staffName,
        shift: item.shift,
        outlet: item.outlet,
        received: item.received,
        paidOut: item.paidOut,
        net: item.net,
        overage: item.overage,
        amountToRemit: item.amountToRemit,
        grandTotal: item.grandTotal,
        others: item.others,
        totalEnclosed: item.totalEnclosed,
        l100k: item.l100k,
        l50k: item.l50k,
        l20k: item.l20k,
        l10k: item.l10k,
        l5k: item.l5k,
        l2k: item.l2k,
        l1k: item.l1k,
        k1k: item.k1k,
        k500: item.k500,
        k200: item.k200,
        k100: item.k100,
      };
    });

    return NextResponse.json({
      staffList: formattedStaffList,
      history: formattedHistory,
      currentUser: {
        id: currentUserId,
        name: currentUserName,
        email: currentDbUser?.email || session.user?.email,
        isFOLeader,
        hasRemittanceFullAccess,
      },
    });
  } catch (error: any) {
    console.error("GET /api/fo/remittance error:", error);
    return NextResponse.json({ message: error.message || "Failed to load remittance data" }, { status: 500 });
  }
}

// POST /api/fo/remittance (Simpan laporan Remittance)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const {
      tanggal,
      staffName,
      userId,
      shift,
      outlet,
      received,
      paidOut,
      net,
      overage,
      others,
      amountToRemit,
      grandTotal,
      totalEnclosed,
      l100k,
      l50k,
      l20k,
      l10k,
      l5k,
      l2k,
      l1k,
      k1k,
      k500,
      k200,
      k100,
    } = payload;

    if (!tanggal || !staffName) {
      return NextResponse.json({ message: "Tanggal dan Nama Kasir wajib diisi." }, { status: 400 });
    }

    const newRecord = await (db as any).remittanceRecord.create({
      data: {
        tanggal: tanggal.trim(),
        staffName: staffName.trim(),
        userId: userId || session.user?.id || null,
        shift: shift || "Morning",
        outlet: outlet || "FO",
        received: Number(received) || 0,
        paidOut: Number(paidOut) || 0,
        net: Number(net) || 0,
        overage: Number(overage) || 0,
        others: Number(others) || 0,
        amountToRemit: Number(amountToRemit) || 0,
        grandTotal: Number(grandTotal) || 0,
        totalEnclosed: Number(totalEnclosed) || Number(amountToRemit) || 0,
        l100k: Number(l100k) || 0,
        l50k: Number(l50k) || 0,
        l20k: Number(l20k) || 0,
        l10k: Number(l10k) || 0,
        l5k: Number(l5k) || 0,
        l2k: Number(l2k) || 0,
        l1k: Number(l1k) || 0,
        k1k: Number(k1k) || 0,
        k500: Number(k500) || 0,
        k200: Number(k200) || 0,
        k100: Number(k100) || 0,
      },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/fo/remittance error:", error);
    return NextResponse.json({ message: error.message || "Gagal menyimpan laporan Remittance." }, { status: 500 });
  }
}

// PUT /api/fo/remittance (Edit laporan Remittance)
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const {
      id,
      tanggal,
      staffName,
      userId,
      shift,
      outlet,
      received,
      paidOut,
      net,
      overage,
      others,
      amountToRemit,
      grandTotal,
      totalEnclosed,
      l100k,
      l50k,
      l20k,
      l10k,
      l5k,
      l2k,
      l1k,
      k1k,
      k500,
      k200,
      k100,
    } = payload;

    if (!id) {
      return NextResponse.json({ message: "ID Remittance wajib disertakan." }, { status: 400 });
    }

    const existingRecord = await (db as any).remittanceRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ message: "Data Remittance tidak ditemukan." }, { status: 404 });
    }

    // Ambil data user yang sedang login untuk memverifikasi hak akses edit
    const currentDbUser = await db.user.findFirst({
      where: {
        OR: [
          ...(session.user?.id ? [{ id: session.user.id }] : []),
          ...(session.user?.email ? [{ email: { equals: session.user.email, mode: "insensitive" as const } }] : []),
        ],
      },
      include: {
        userRoles: { include: { SystemRole: true } },
      },
    });

    const currentRoleCodes = currentDbUser?.userRoles?.map((ur: any) => ur.SystemRole?.code) || [];
    const isFOLeader = !!(currentDbUser?.isFOLeader || currentDbUser?.isDeptHead || currentRoleCodes.includes("FO_LEADER") || currentRoleCodes.includes("HOD"));
    const isAdmin = !!(currentRoleCodes.includes("ADMIN") || (session.user as any)?.systemRole === "ADMIN");

    const hasFullAccessPerm = await db.roleModulePermission.findFirst({
      where: {
        role: { code: { in: currentRoleCodes.length > 0 ? currentRoleCodes : ["STAFF"] } },
        module: { code: { in: ["FO_FRONT_DESK", "FO_REMITTANCE"] } },
        accessLevel: { in: ["FULL", "READ_WRITE", "ADMIN"] },
      },
    });

    const hasRemittanceFullAccess = isAdmin || isFOLeader || !!hasFullAccessPerm;
    const currentUserId = currentDbUser?.id || session.user?.id;
    const currentUserName = currentDbUser?.name || session.user?.name || "";

    const isOwner = (existingRecord.userId && currentUserId && existingRecord.userId === currentUserId) ||
                    (existingRecord.staffName && currentUserName && existingRecord.staffName.trim().toLowerCase() === currentUserName.trim().toLowerCase());

    if (!hasRemittanceFullAccess && !isOwner) {
      return NextResponse.json(
        { message: "Anda tidak memiliki izin untuk mengedit laporan Remittance ini. Hanya penginput, FO Leader, atau Admin yang diizinkan." },
        { status: 403 }
      );
    }

    const updatedRecord = await (db as any).remittanceRecord.update({
      where: { id },
      data: {
        tanggal: tanggal?.trim() || existingRecord.tanggal,
        staffName: staffName?.trim() || existingRecord.staffName,
        userId: userId || existingRecord.userId,
        shift: shift || existingRecord.shift,
        outlet: outlet || existingRecord.outlet,
        received: Number(received) || 0,
        paidOut: Number(paidOut) || 0,
        net: Number(net) || 0,
        overage: Number(overage) || 0,
        others: Number(others) || 0,
        amountToRemit: Number(amountToRemit) || 0,
        grandTotal: Number(grandTotal) || 0,
        totalEnclosed: Number(totalEnclosed) || Number(amountToRemit) || 0,
        l100k: Number(l100k) || 0,
        l50k: Number(l50k) || 0,
        l20k: Number(l20k) || 0,
        l10k: Number(l10k) || 0,
        l5k: Number(l5k) || 0,
        l2k: Number(l2k) || 0,
        l1k: Number(l1k) || 0,
        k1k: Number(k1k) || 0,
        k500: Number(k500) || 0,
        k200: Number(k200) || 0,
        k100: Number(k100) || 0,
      },
    });

    return NextResponse.json(updatedRecord);
  } catch (error: any) {
    console.error("PUT /api/fo/remittance error:", error);
    return NextResponse.json({ message: error.message || "Gagal memperbarui laporan Remittance." }, { status: 500 });
  }
}

