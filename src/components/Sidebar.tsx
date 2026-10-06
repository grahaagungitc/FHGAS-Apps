"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Folder,
  FileSignature,
  Activity,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    systemRole?: string;
    isIT?: boolean;
  };
  signOutAction: () => Promise<void>;
}

export default function Sidebar({ user, signOutAction }: SidebarProps) {
  const pathname = usePathname();

  // State Toggle Dropdown
  const [openDept, setOpenDept] = useState(true);
  const [openSubDept, setOpenSubDept] = useState<Record<string, boolean>>({
    "admin-general": false,
    finance: false,
    fo: false,
    it: true, // Auto open IT department agar SAA Requests langsung terlihat
  });
  const [openSetup, setOpenSetup] = useState(true);

  const toggleSubDept = (key: string) => {
    setOpenSubDept((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Data Struktur Departemen & Sub-menu
  const departmentsData: {
    key: string;
    name: string;
    href?: string;
    subItems?: { name: string; href: string; icon?: LucideIcon }[];
  }[] = [
    {
      key: "admin-general",
      name: "Admin & General",
      subItems: [{ name: "Hotel Manager", href: "/dashboard/departments/admin-general/hm" }],
    },
    { key: "hr", name: "Human Resource", href: "/dashboard/departments/hr" },
    {
      key: "finance",
      name: "Finance & Accounting",
      subItems: [
        { name: "Finance Leader", href: "/dashboard/departments/finance/leader" },
        { name: "Account Payable / Cashier", href: "/dashboard/departments/finance/ap-cashier" },
        { name: "Store Keeper / Purchasing", href: "/dashboard/departments/finance/purchasing" },
      ],
    },
    {
      key: "fo",
      name: "Front Office",
      subItems: [
        { name: "Front Desk", href: "/dashboard/departments/fo/front-desk" },
        { name: "Concierge", href: "/dashboard/departments/fo/concierge" },
      ],
    },
    { key: "sales", name: "Sales & Marketing", href: "/dashboard/departments/sales" },
    { key: "engineering", name: "Engineering", href: "/dashboard/departments/engineering" },
    { key: "housekeeping", name: "Housekeeping", href: "/dashboard/departments/housekeeping" },
    {
      key: "it",
      name: "Information Technology",
      subItems: [
        { name: "SAA Requests", href: "/dashboard/it/saa", icon: FileSignature },
        { name: "Failover Procedure", href: "/dashboard/it/failover", icon: Activity },
      ],
    },
    { key: "fb", name: "Food & Beverage", href: "/dashboard/departments/fb" },
    { key: "security", name: "Security", href: "/dashboard/departments/security" },
  ];

  return (
    <aside className="w-72 bg-white border-r-2 border-slate-900 flex flex-col justify-between h-screen sticky top-0 text-slate-900 font-sans">
      <div className="overflow-y-auto flex-1">
        {/* Brand Header */}
        <div className="p-5 border-b-2 border-slate-900 flex items-center gap-3 sticky top-0 bg-white z-10">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border-2 border-cyan-400 shadow-[2px_2px_0px_0px_rgba(0,243,255,1)]">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-none tracking-tight">
              HMS CORE
            </h1>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              SAA PROTOCOL V1.0
            </p>
          </div>
        </div>

        {/* Nav Group */}
        <nav className="p-3 space-y-1 text-xs">
          {/* Dashboard Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-bold transition-all border-2 ${
              pathname === "/dashboard"
                ? "bg-slate-900 text-cyan-400 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,243,255,1)]"
                : "text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Department Parent Dropdown */}
          <div className="pt-2">
            <button
              onClick={() => setOpenDept(!openDept)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-100 border-2 border-transparent hover:border-slate-900 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-slate-800" />
                <span>Department</span>
              </div>
              {openDept ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Department Items List */}
            {openDept && (
              <div className="ml-3 pl-3 border-l-2 border-slate-200 mt-1 space-y-1">
                {departmentsData.map((dept) => {
                  if (dept.subItems) {
                    const isSubOpen = openSubDept[dept.key];
                    return (
                      <div key={dept.key}>
                        <button
                          onClick={() => toggleSubDept(dept.key)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <span className="truncate">{dept.name}</span>
                          {isSubOpen ? (
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          )}
                        </button>

                        {/* Sub-Items */}
                        {isSubOpen && (
                          <div className="ml-2 pl-2 border-l border-cyan-400 my-1 space-y-1">
                            {dept.subItems
                              .filter(
                                (sub) =>
                                  sub.name !== "SAA Requests" ||
                                  user.isIT ||
                                  user.systemRole === "ADMIN"
                              )
                              .map((sub) => {
                              const isActive = pathname === sub.href;
                              const Icon = sub.icon || Folder;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded font-medium transition-all ${
                                    isActive
                                      ? "bg-slate-900 text-cyan-400 font-bold"
                                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={dept.key}
                      href={dept.href || "#"}
                      className={`block px-2 py-1.5 rounded font-semibold transition-all ${
                        pathname === dept.href
                          ? "bg-slate-900 text-cyan-400 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {dept.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Setup Group Dropdown */}
          <div className="pt-2">
            <button
              onClick={() => setOpenSetup(!openSetup)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-slate-700 hover:bg-slate-100 border-2 border-transparent hover:border-slate-900 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-800" />
                <span>Setup</span>
              </div>
              {openSetup ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {openSetup && (
              <div className="ml-3 pl-3 border-l-2 border-slate-200 mt-1 space-y-1">
                <Link
                  href="/dashboard/setup/users"
                  className={`flex items-center gap-2 px-2 py-1.5 rounded font-semibold transition-all ${
                    pathname === "/dashboard/setup/users"
                      ? "bg-slate-900 text-cyan-400 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>User Management</span>
                </Link>

                {user.systemRole === "ADMIN" && (
                  <Link
                    href="/dashboard/setup/access-requests"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded font-semibold transition-all ${
                      pathname === "/dashboard/setup/access-requests"
                        ? "bg-slate-900 text-cyan-400 font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Access Requests</span>
                  </Link>
                )}

                <Link
                  href="/dashboard/setup/departments"
                  className={`flex items-center gap-2 px-2 py-1.5 rounded font-semibold transition-all ${
                    pathname === "/dashboard/setup/departments"
                      ? "bg-slate-900 text-cyan-400 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Department Management</span>
                </Link>

                {/* SAA Configuration Menu Item */}
                <Link
                  href="/dashboard/setup/saa-config"
                  className={`flex items-center gap-2 px-2 py-1.5 rounded font-semibold transition-all ${
                    pathname === "/dashboard/setup/saa-config"
                      ? "bg-slate-900 text-cyan-400 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>SAA Configuration</span>
                </Link>

              </div>
            )}
          </div>
        </nav>
      </div>

      {/* User Info Footer */}
      <div className="p-4 border-t-2 border-slate-900 bg-slate-50 sticky bottom-0">
        <div className="mb-3 px-1">
          <p className="text-xs font-black text-slate-900 truncate">
            {user.name || "User"}
          </p>
          <p className="text-[10px] font-mono text-slate-500 truncate">
            {user.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 bg-cyan-100 border border-cyan-500 text-cyan-900 text-[10px] font-mono font-bold rounded">
              {user.systemRole || "STAFF"}
            </span>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        </form>
      </div>
    </aside>
  );
}