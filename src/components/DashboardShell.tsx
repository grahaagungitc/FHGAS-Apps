"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { Menu, ShieldCheck, LogOut, User, ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    systemRole?: string;
    isIT?: boolean;
  };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

export default function DashboardShell({ user, signOutAction, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        signOutAction={signOutAction}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <div className="w-full max-w-full">
          {/* Top Bar Navigation for Mobile & Desktop */}
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* Mobile Hamburger & Logo Header */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-soft"
              >
                <Menu className="w-5 h-5" />
              </button>
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

              {/* User Profile Dropdown Trigger */}
              <div className="relative" ref={dropdownRef}>
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
    </div>
  );
}
