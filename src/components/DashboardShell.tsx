"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { Menu, ShieldCheck } from "lucide-react";

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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Component (Handles desktop sticky & mobile drawer) */}
      <Sidebar
        user={user}
        signOutAction={signOutAction}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <div className="mx-auto max-w-7xl">
          {/* Top Bar Navigation for Mobile & Desktop */}
          <div className="mb-6 flex items-center justify-between gap-4">
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
                <div className="w-8 h-8 bg-[#5C61F4] rounded-xl flex items-center justify-center text-white shadow-soft">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight">HMS CORE</span>
              </div>
            </div>

            {/* Spacer for desktop layout */}
            <div className="hidden lg:block" />

            {/* Right side Notification Bell */}
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>

          {/* Children View */}
          {children}
        </div>
      </main>
    </div>
  );
}
