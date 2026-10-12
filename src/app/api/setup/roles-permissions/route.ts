import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// Initial default modules for bootstrapping
const DEFAULT_MODULES = [
  // Front Office
  { code: "FO_FRONT_DESK", name: "Front Desk & Remittance", category: "Front Office", path: "/dashboard/departments/fo/front-desk", description: "Akses menu Front Desk dan Kasir Remittance" },
  { code: "FO_CONCIERGE", name: "Concierge", category: "Front Office", path: "/dashboard/departments/fo/concierge", description: "Akses menu operasional Concierge" },

  // IT & Helpdesk
  { code: "IT_SAA", name: "IT SAA Requests", category: "IT", path: "/dashboard/it/saa", description: "Pengajuan dan proses tiket System Access Authorization" },
  { code: "IT_FAILOVER", name: "IT Failover Procedure", category: "IT", path: "/dashboard/it/failover", description: "SOP dan simulasi failover system" },

  // Finance
  { code: "FIN_LEADER", name: "Finance Leader", category: "Finance", path: "/dashboard/departments/finance/leader", description: "Approval & laporan keuangan Finance Leader" },
  { code: "FIN_AP_CASHIER", name: "Account Payable / Cashier", category: "Finance", path: "/dashboard/departments/finance/ap-cashier", description: "Verifikasi kasir dan pembayaran AP" },
  { code: "FIN_PURCHASING", name: "Store Keeper / Purchasing", category: "Finance", path: "/dashboard/departments/finance/purchasing", description: "Pengadaan barang dan inventaris gudang" },

  // Admin & General
  { code: "AG_HOTEL_MANAGER", name: "Hotel Manager (HM)", category: "Admin & General", path: "/dashboard/departments/admin-general/hm", description: "Dashboard & approval General Manager / Hotel Manager" },

  // Other Departments
  { code: "DEPT_HR", name: "Human Resource", category: "Departments", path: "/dashboard/departments/hr", description: "Modul departemen Human Resource" },
  { code: "DEPT_SALES", name: "Sales & Marketing", category: "Departments", path: "/dashboard/departments/sales", description: "Modul departemen Sales & Marketing" },
  { code: "DEPT_ENG", name: "Engineering", category: "Departments", path: "/dashboard/departments/engineering", description: "Modul pemeliharaan dan teknis Engineering" },
  { code: "DEPT_HK", name: "Housekeeping", category: "Departments", path: "/dashboard/departments/housekeeping", description: "Modul status kamar dan operasional Housekeeping" },
  { code: "DEPT_FB", name: "Food & Beverage", category: "Departments", path: "/dashboard/departments/fb", description: "Modul Food & Beverage Service & Kitchen" },
  { code: "DEPT_SEC", name: "Security", category: "Departments", path: "/dashboard/departments/security", description: "Modul keamanan & insiden Security" },

  // System Setup
  { code: "SETUP_USERS", name: "User Management", category: "System Setup", path: "/dashboard/setup/users", description: "Kelola akun pengguna, posisi, dan role tagging" },
  { code: "SETUP_ROLES", name: "Roles & Permissions Matrix", category: "System Setup", path: "/dashboard/setup/roles", description: "Konfigurasi role dinamis dan matriks hak akses modul" },
  { code: "SETUP_DEPTS", name: "Department Setup", category: "System Setup", path: "/dashboard/setup/departments", description: "Kelola daftar departemen hotel" },
  { code: "SETUP_SAA_CONFIG", name: "SAA Form Configuration", category: "System Setup", path: "/dashboard/setup/saa-config", description: "Konfigurasi formulir dan tahapan persetujuan SAA" },
];

export async function GET() {
  try {
    // 1. Seed default modules if database is empty
    const existingCount = await db.appModule.count();
    if (existingCount === 0) {
      for (const mod of DEFAULT_MODULES) {
        await db.appModule.upsert({
          where: { code: mod.code },
          update: {},
          create: { ...mod, isSystem: true },
        });
      }
    }

    // 2. Fetch all modules & roles with their permission matrix
    const [modules, roles, permissions] = await Promise.all([
      db.appModule.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      db.systemRole.findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      }),
      db.roleModulePermission.findMany({
        include: {
          role: true,
          module: true,
        },
      }),
    ]);

    return NextResponse.json({
      modules,
      roles,
      permissions,
    });
  } catch (error) {
    console.error("GET /api/setup/roles-permissions error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data roles & permissions matrix." },
      { status: 500 }
    );
  }
}

// UPDATE PERMISSION MATRIX (Batch or Single)
export async function POST(request: Request) {
  try {
    const session = await auth();
    // Allow saving matrix
    const body = await request.json();

    // Check if updating module definition
    if (body.action === "CREATE_MODULE") {
      const { code, name, category, description, path } = body;
      if (!code || !name || !category) {
        return NextResponse.json({ message: "Code, Name, dan Category wajib diisi." }, { status: 400 });
      }
      const newModule = await db.appModule.create({
        data: {
          code: code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
          name: name.trim(),
          category: category.trim(),
          description: description?.trim() || null,
          path: path?.trim() || null,
          isSystem: false,
        },
      });
      return NextResponse.json(newModule, { status: 201 });
    }

    if (body.action === "UPDATE_MODULE") {
      const { id, name, category, description, path } = body;
      if (!id || !name || !category) {
        return NextResponse.json({ message: "ID, Name, dan Category wajib diisi." }, { status: 400 });
      }
      const updatedModule = await db.appModule.update({
        where: { id },
        data: {
          name: name.trim(),
          category: category.trim(),
          description: description?.trim() || null,
          path: path?.trim() || null,
        },
      });
      return NextResponse.json(updatedModule);
    }

    if (body.action === "DELETE_MODULE") {
      const { id } = body;
      if (!id) return NextResponse.json({ message: "Module ID wajib diisi." }, { status: 400 });
      const target = await db.appModule.findUnique({ where: { id } });
      if (!target) return NextResponse.json({ message: "Modul tidak ditemukan." }, { status: 404 });
      if (target.isSystem) return NextResponse.json({ message: "Modul bawaan sistem tidak dapat dihapus." }, { status: 409 });

      await db.appModule.delete({ where: { id } });
      return NextResponse.json({ message: "Modul berhasil dihapus." });
    }

    // Default: Batch or single permission update
    // Expected items: Array of { roleId, moduleId, accessLevel, canApprove }
    const items = Array.isArray(body.permissions) ? body.permissions : [body];

    const results = [];
    for (const item of items) {
      const { roleId, moduleId, accessLevel, canApprove } = item;
      if (!roleId || !moduleId) continue;

      if (accessLevel === "NONE") {
        // Remove permission record if explicitly none
        await db.roleModulePermission.deleteMany({
          where: { roleId, moduleId },
        });
        results.push({ roleId, moduleId, accessLevel: "NONE", canApprove: false });
      } else {
        const perm = await db.roleModulePermission.upsert({
          where: {
            roleId_moduleId: { roleId, moduleId },
          },
          update: {
            accessLevel: accessLevel || "READ_WRITE",
            canApprove: Boolean(canApprove),
          },
          create: {
            roleId,
            moduleId,
            accessLevel: accessLevel || "READ_WRITE",
            canApprove: Boolean(canApprove),
          },
        });
        results.push(perm);
      }
    }

    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    console.error("POST /api/setup/roles-permissions error:", error);
    return NextResponse.json(
      { message: error.message || "Gagal menyimpan konfigurasi permissions." },
      { status: 500 }
    );
  }
}
