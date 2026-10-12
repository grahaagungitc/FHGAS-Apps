import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { formatHelpDeskTicket } from "@/lib/saa-number";

export const dynamic = "force-dynamic";

// Menu & Route Navigation Registry
const systemNavigationItems = [
  { name: "Dashboard Utama", keywords: "dashboard home beranda statistik overview", href: "/dashboard", category: "Navigasi Menu" },
  { name: "SAA Requests (Permohonan SAA)", keywords: "saa request form pms email domain card akses permohonan it", href: "/dashboard/it/saa", category: "Navigasi Menu" },
  { name: "Buat Permohonan SAA Baru", keywords: "create saa buat pengajuan permohonan baru form", href: "/dashboard/it/saa/create", category: "Navigasi Menu" },
  { name: "Failover Procedure", keywords: "failover it darurat backup sistem disaster recovery", href: "/dashboard/it/failover", category: "Navigasi Menu" },
  { name: "Department: Admin & General (HM)", keywords: "admin general hotel manager hm departemen", href: "/dashboard/departments/admin-general/hm", category: "Navigasi Menu" },
  { name: "Department: Human Resource (HR)", keywords: "hr human resource sdmal personallia departemen", href: "/dashboard/departments/hr", category: "Navigasi Menu" },
  { name: "Department: Finance Leader", keywords: "finance leader akuntansi keuangan leader departemen", href: "/dashboard/departments/finance/leader", category: "Navigasi Menu" },
  { name: "Department: Account Payable / Cashier", keywords: "ap cashier kasir finance utang piutang departemen", href: "/dashboard/departments/finance/ap-cashier", category: "Navigasi Menu" },
  { name: "Department: Store Keeper / Purchasing", keywords: "purchasing store keeper gudang pengadaan barang finance", href: "/dashboard/departments/finance/purchasing", category: "Navigasi Menu" },
  { name: "Department: Front Desk", keywords: "front desk fo resepsionis kamar tamu front office", href: "/dashboard/departments/fo/front-desk", category: "Navigasi Menu" },
  { name: "Department: Concierge", keywords: "concierge fo bagasi koper tamu front office", href: "/dashboard/departments/fo/concierge", category: "Navigasi Menu" },
  { name: "Department: Sales & Marketing", keywords: "sales marketing pemasaran katering event", href: "/dashboard/departments/sales", category: "Navigasi Menu" },
  { name: "Department: Engineering", keywords: "engineering pemeliharaan teknisi perbaikan me", href: "/dashboard/departments/engineering", category: "Navigasi Menu" },
  { name: "Department: Housekeeping", keywords: "housekeeping kebersihan kamar linen hk", href: "/dashboard/departments/housekeeping", category: "Navigasi Menu" },
  { name: "Department: Food & Beverage", keywords: "food beverage fb restoran dapur chef waiter", href: "/dashboard/departments/fb", category: "Navigasi Menu" },
  { name: "Department: Security", keywords: "security keamanan satpam k3 pos", href: "/dashboard/departments/security", category: "Navigasi Menu" },
  { name: "User Management (Kelola Pengguna)", keywords: "user management pengguna akun staff admin kelola role", href: "/dashboard/setup/users", category: "Navigasi Menu" },
  { name: "Access Requests (Permohonan Akses Pendaftaran)", keywords: "access request approval pendaftaran user baru registrasi izin admin", href: "/dashboard/setup/access-requests", category: "Navigasi Menu" },
  { name: "Department Management (Kelola Departemen)", keywords: "department management kelola departemen struktur bagian hotel", href: "/dashboard/setup/departments", category: "Navigasi Menu" },
  { name: "SAA Configuration (Konfigurasi SAA)", keywords: "saa configuration setup master field approval step form config template", href: "/dashboard/setup/saa-config", category: "Navigasi Menu" },
  { name: "Pusat Notifikasi System", keywords: "notification bell notifikasi pemberitahuan pesan alert", href: "/dashboard/notifications", category: "Navigasi Menu" },
];

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const lowerQuery = query.toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // 1. Filter System Navigation Items
    const matchingNavResults = systemNavigationItems
      .filter(
        (nav) =>
          nav.name.toLowerCase().includes(lowerQuery) ||
          nav.keywords.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 4)
      .map((nav) => ({
        type: "Menu Sistem",
        title: nav.name,
        subtitle: `Buka halaman ${nav.name}`,
        href: nav.href,
      }));

    // 2. Parallel Search Database: SAA Requests, Departments, Users, AccessRequests, SaaFormConfigs, & SaaFields
    const [saaRequests, departments, users, accessRequests, saaConfigs, saaFields] = await Promise.all([
      db.saaRequest.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { position: { contains: query, mode: "insensitive" } },
            { department: { contains: query, mode: "insensitive" } },
            { formType: { contains: query, mode: "insensitive" } },
            { reason: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          requestNumber: true,
          name: true,
          email: true,
          department: true,
          formType: true,
          status: true,
        },
      }),
      db.department.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      db.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { position: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
        },
      }),
      db.accessRequest.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      }),
      db.saaFormConfig.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      db.saaField.findMany({
        where: {
          OR: [
            { label: { contains: query, mode: "insensitive" } },
            { fieldKey: { contains: query, mode: "insensitive" } },
            { section: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: {
          id: true,
          label: true,
          fieldKey: true,
        },
      }),
    ]);

    const results = [
      ...matchingNavResults,
      ...saaRequests.map((item) => ({
        type: "SAA Request",
        title: `${formatHelpDeskTicket(item.id)} (${item.formType})`,
        subtitle: `${item.name} • ${item.department} • Status: ${item.status}`,
        href: `/dashboard/it/saa/${item.id}`,
      })),
      ...departments.map((dept) => ({
        type: "Departemen",
        title: dept.name,
        subtitle: `Kode Departemen: ${dept.code}`,
        href: `/dashboard/setup/departments`,
      })),
      ...users.map((u) => ({
        type: "User Akun",
        title: u.name,
        subtitle: `${u.email} ${u.position ? `• ${u.position}` : ""}`,
        href: `/dashboard/setup/users`,
      })),
      ...accessRequests.map((req) => ({
        type: "Permohonan Akses",
        title: `Pendaftaran: ${req.name}`,
        subtitle: `${req.email} • Status: ${req.status}`,
        href: `/dashboard/setup/access-requests`,
      })),
      ...saaConfigs.map((cfg) => ({
        type: "Tipe Form SAA",
        title: cfg.name,
        subtitle: `Kode Form: ${cfg.code}`,
        href: `/dashboard/setup/saa-config`,
      })),
      ...saaFields.map((fld) => ({
        type: "Master Field SAA",
        title: fld.label,
        subtitle: `Key Field: ${fld.fieldKey}`,
        href: `/dashboard/setup/saa-config?tab=master`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ message: "Search failed" }, { status: 500 });
  }
}
