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
  X,
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
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, signOutAction, isOpen = false, onClose }: SidebarProps) {
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

  const handleLinkClick = () => {
    if (onClose) onClose();
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`w-72 bg-white border-r border-slate-100 flex flex-col justify-between h-screen fixed lg:sticky top-0 left-0 text-slate-800 font-sans shadow-xl lg:shadow-sm z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-[#5C61F4] rounded-2xl flex items-center justify-center text-white shadow-soft">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                  HMS CORE
                </h1>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  SAA PROTOCOL V1.0
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar menu"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Nav Group */}
          <nav className="p-4 space-y-1.5 text-xs font-medium">
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                pathname === "/dashboard"
                  ? "bg-[#5C61F4] text-white font-bold shadow-soft"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Department Parent Dropdown */}
            <div className="pt-2">
              <button
                onClick={() => setOpenDept(!openDept)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Department</span>
                </div>
                {openDept ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Department Items List */}
              {openDept && (
                <div className="ml-4 pl-3 border-l border-slate-200 mt-1 space-y-1">
                  {departmentsData.map((dept) => {
                    if (dept.subItems) {
                      const isSubOpen = openSubDept[dept.key];
                      return (
                        <div key={dept.key}>
                          <button
                            onClick={() => toggleSubDept(dept.key)}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                            <div className="ml-2 pl-2.5 border-l-2 border-indigo-400 my-1 space-y-1">
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
                                    onClick={handleLinkClick}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all ${
                                      isActive
                                        ? "bg-indigo-50 text-[#5C61F4] font-bold"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
                        onClick={handleLinkClick}
                        className={`block px-2.5 py-2 rounded-lg font-medium transition-all ${
                          pathname === dept.href
                            ? "bg-indigo-50 text-[#5C61F4] font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Setup</span>
                </div>
                {openSetup ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openSetup && (
                <div className="ml-4 pl-3 border-l border-slate-200 mt-1 space-y-1">
                  <Link
                    href="/dashboard/setup/users"
                    onClick={handleLinkClick}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-all ${
                      pathname === "/dashboard/setup/users"
                        ? "bg-indigo-50 text-[#5C61F4] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>User Management</span>
                  </Link>

                  {user.systemRole === "ADMIN" && (
                    <Link
                      href="/dashboard/setup/access-requests"
                      onClick={handleLinkClick}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-all ${
                        pathname === "/dashboard/setup/access-requests"
                          ? "bg-indigo-50 text-[#5C61F4] font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Access Requests</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard/setup/departments"
                    onClick={handleLinkClick}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-all ${
                      pathname === "/dashboard/setup/departments"
                        ? "bg-indigo-50 text-[#5C61F4] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Department Management</span>
                  </Link>

                  <Link
                    href="/dashboard/setup/saa-config"
                    onClick={handleLinkClick}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-all ${
                      pathname === "/dashboard/setup/saa-config"
                        ? "bg-indigo-50 text-[#5C61F4] font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="truncate mr-2">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user.name || "User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.email}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-indigo-50 text-[#5C61F4] text-[10px] font-bold rounded-md border border-indigo-100 shrink-0">
              {user.systemRole || "STAFF"}
            </span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-all active:scale-[0.99]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SIGN OUT</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}