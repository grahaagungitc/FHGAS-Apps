import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserModuleAccess } from "@/lib/module-access";
import { Wrench, ArrowLeft, Receipt, FileText, CreditCard, ShieldCheck } from "lucide-react";

type PageProps = {
  params: {
    slug: string[];
  };
};

const DEFAULT_DEPARTMENT_MODULES: Record<string, { code: string; name: string }> = {
  "admin-general/hm": { code: "AG_HOTEL_MANAGER", name: "Hotel Manager" },
  "hr": { code: "DEPT_HR", name: "Human Resource" },
  "finance/leader": { code: "FIN_LEADER", name: "Finance Leader" },
  "finance/ap-cashier": { code: "FIN_AP_CASHIER", name: "Account Payable / Cashier" },
  "finance/purchasing": { code: "FIN_PURCHASING", name: "Store Keeper / Purchasing" },
  "fo/front-desk": { code: "FO_FRONT_DESK", name: "Front Desk & Remittance" },
  "fo/concierge": { code: "FO_CONCIERGE", name: "Concierge" },
  "sales": { code: "DEPT_SALES", name: "Sales & Marketing" },
  "engineering": { code: "DEPT_ENG", name: "Engineering" },
  "housekeeping": { code: "DEPT_HK", name: "Housekeeping" },
  "fb": { code: "DEPT_FB", name: "Food & Beverage" },
  "security": { code: "DEPT_SEC", name: "Security" },
};

export default async function DepartmentPage({ params }: PageProps) {
  const slugPath = (params?.slug || []).join("/");
  const modulePath = `/dashboard/departments/${slugPath}`;
  const session = await auth();
  const [configuredModule, access] = await Promise.all([
    db.appModule.findFirst({
      where: { path: modulePath },
      select: { code: true, name: true },
    }),
    getUserModuleAccess(session?.user?.email),
  ]);
  const departmentModule = configuredModule || DEFAULT_DEPARTMENT_MODULES[slugPath];

  const hasLegacyModuleAccess =
    (departmentModule?.code === "FO_FRONT_DESK" && access.isFOLeader) ||
    (departmentModule?.code === "IT_SAA" && access.isIT);
  if (departmentModule && !access.isAdmin && !access.moduleCodes.includes(departmentModule.code) && !hasLegacyModuleAccess) {
    redirect(`/dashboard?accessDenied=1&module=${encodeURIComponent(departmentModule.name)}`);
  }

  const departmentName = (params?.slug || [])
    .map((s) => s.replace(/-/g, " ").toUpperCase())
    .join(" / ");

  const isFrontDesk = slugPath === "fo/front-desk";

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">
            {departmentName || "DEPARTMENT"}
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Department System
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-50 text-[#5C61F4] text-xs font-bold rounded-full border border-indigo-100">
          ACTIVE MODULE
        </span>
      </div>

      {isFrontDesk ? (
        /* Front Desk Module Hub / Dashboard Cards */
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-800">
            Front Desk Modules & Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: FO Cashier Remittance System */}
            <Link
              href="/dashboard/departments/fo/remittance"
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-rose-50 text-[#8b2550] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform border border-rose-100">
                  <Receipt className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                  Ready & Active
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-800 group-hover:text-[#5C61F4] transition-colors">
                  FO Remittance System
                </h3>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Laporan setoran tunai kasir Front Office, kalkulasi denominasi pecahan uang, dan cetak amplop remittance.
                </p>
              </div>

              <div className="pt-2 flex items-center text-xs font-bold text-[#5C61F4] group-hover:translate-x-1 transition-transform">
                <span>Buka Module Remittance &rarr;</span>
              </div>
            </Link>

            {/* Card 2: Guest Registration (Coming Soon Placeholder) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft opacity-70 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">
                  Under Development
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-700">Guest Check-In Card</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Registrasi kedatangan tamu hotel dan pengisian data registrasi.
                </p>
              </div>
            </div>

            {/* Card 3: Keycard Management */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft opacity-70 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">
                  Under Development
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-700">Keycard Access Logs</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  Pencatatan dan pembuatan kartu kunci kamar tamu.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Coming Soon Placeholder untuk Departemen Lain */
        <div className="bg-white border border-slate-100 p-12 rounded-3xl shadow-soft text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4]">
            <Wrench className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Module Coming Soon
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-1 max-w-md">
              Fitur untuk modul <strong className="text-slate-800">{departmentName || "Department"}</strong> sedang dalam tahap pengembangan dan konfigurasi sistem.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-soft transition-all active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      )}
    </div>
  );
}