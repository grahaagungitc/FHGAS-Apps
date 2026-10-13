"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import AppNotificationProvider from "@/components/AppNotificationProvider";
import { Home, Menu, ShieldCheck, LogOut, User, ChevronDown, ShieldAlert, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    systemRole?: string;
    isIT?: boolean;
    isFOLeader?: boolean;
    moduleCodes?: string[];
  };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

export default function DashboardShell({ user, signOutAction, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [accessDeniedModule, setAccessDeniedModule] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deniedModule = searchParams.get("accessDenied") === "1" ? searchParams.get("module") : null;

  useEffect(() => {
    if (deniedModule) setAccessDeniedModule(deniedModule);
  }, [deniedModule]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedDesktopDropdown = dropdownRef.current?.contains(event.target as Node);
      const clickedMobileDropdown = mobileDropdownRef.current?.contains(event.target as Node);
      if (!clickedDesktopDropdown && !clickedMobileDropdown) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <AppNotificationProvider>
    <div className="flex min-h-screen w-full min-w-0 overflow-x-clip" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        onAccessDenied={setAccessDeniedModule}
        signOutAction={signOutAction}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
        <div className="w-full min-w-0 max-w-full">
          {/* Top Bar Navigation for Mobile & Desktop */}
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* Mobile Brand Header */}
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-soft shrink-0 overflow-hidden"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {theme.logoUrl ? (
                    <img src={theme.logoUrl} alt={theme.appName} className="w-full h-full object-cover" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight truncate">
                  {theme.appName || "FHGAS Portal"}
                </span>
              </div>
            </div>

            {/* Spacer for desktop layout */}
            <div className="hidden lg:block" />

            {/* Right Header Area: Notification Bell + Interactive User Profile Dropdown */}
            <div className="flex items-center gap-3 ml-auto">
              <NotificationBell />

              {/* Desktop User Profile Dropdown Trigger */}
              <div className="relative hidden lg:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-soft transition-all active:scale-[0.98]"
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-[#5C61F4] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                      {user.name || "User"}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                      {user.systemRole || "STAFF"}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu Popup */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 bg-white rounded-3xl border border-slate-100 shadow-soft-lg p-4 space-y-3">
                    {/* User Info Header */}
                    <div className="pb-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {user.email}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-[#5C61F4] text-[10px] font-bold rounded-md border border-indigo-100">
                          Role: {user.systemRole || "STAFF"}
                        </span>
                        {user.isIT && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md border border-purple-100">
                            IT Member
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sign Out Action Button */}
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl border border-rose-200 transition-all active:scale-[0.99]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>SIGN OUT</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Children View */}
          {children}
        </div>
      </main>

      <nav
        aria-label="Navigasi utama mobile"
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        <div className="grid h-16 grid-cols-3">
          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setUserDropdownOpen(false);
              setMobileMenuOpen((open) => !open);
            }}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${mobileMenuOpen ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
          <Link
            href="/dashboard"
            onClick={() => {
              setMobileMenuOpen(false);
              setUserDropdownOpen(false);
            }}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${pathname === "/dashboard" ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <div className="relative flex justify-center" ref={mobileDropdownRef}>
            {userDropdownOpen && (
              <div className="absolute bottom-full right-2 z-[70] mb-3 w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-3 border-b border-slate-100 pb-3">
                  <p className="truncate text-sm font-bold text-slate-800">{user.name || "User"}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">
                      Role: {user.systemRole || "STAFF"}
                    </span>
                    {user.isIT && (
                      <span className="rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                        IT Member
                      </span>
                    )}
                  </div>
                </div>
                <form action={signOutAction}>
                  <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100">
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </form>
              </div>
            )}
            <button
              type="button"
              aria-label="Buka profil"
              aria-expanded={userDropdownOpen}
              onClick={() => {
                setMobileMenuOpen(false);
                setUserDropdownOpen((open) => !open);
              }}
              className={`flex w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold ${userDropdownOpen ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"}`}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {accessDeniedModule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="access-denied-title"
            aria-describedby="access-denied-description"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="access-denied-title" className="text-base font-bold text-slate-900">
                  Akses ditolak
                </h2>
                <p className="mt-1 text-sm font-semibold text-rose-700">{accessDeniedModule}</p>
                <p id="access-denied-description" className="mt-2 text-sm leading-6 text-slate-600">
                  Akun Anda belum memiliki izin untuk membuka modul atau fungsi ini. Hubungi administrator untuk meminta akses.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup notifikasi akses ditolak"
                onClick={() => setAccessDeniedModule(null)}
                className="-mr-2 -mt-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setAccessDeniedModule(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Mengerti
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
    </AppNotificationProvider>
  );
}
