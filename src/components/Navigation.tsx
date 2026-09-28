import React from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Building2, Shield, FileText, Settings, LogOut, User as UserIcon, Lock } from "lucide-react";

export default async function Navigation() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-cyan-500 text-black p-2 rounded-lg font-bold flex items-center justify-center shadow-glow-cyan">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              HMS<span className="text-pink-500 font-normal">.Cyber</span>
            </span>
            <span className="block text-[10px] text-slate-500 tracking-wider uppercase font-semibold">
              Hotel Management System
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-700 hover:text-cyan-500 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-cyan-500" />
            Dashboard
          </Link>
          <Link
            href="/saa"
            className="text-sm font-medium text-slate-700 hover:text-pink-500 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-pink-500" />
            SAA Requests
          </Link>
          {user?.roles?.includes("ADMIN") && (
            <Link
              href="/setup"
              className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200"
            >
              <Settings className="w-4 h-4 text-cyan-600" />
              Setup (Config)
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.isGuestViewOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <Lock className="w-3 h-3" />
                  View Only
                </span>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-slate-500">
                  {user.roles && user.roles.length > 0
                    ? user.roles.join(", ")
                    : "Unregistered Guest"}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold text-sm px-4 py-2 rounded-lg shadow-glow-cyan transition-all"
            >
              <UserIcon className="w-4 h-4" />
              Login with Google
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
