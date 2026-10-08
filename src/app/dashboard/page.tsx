import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Search,
  FileSignature,
  Activity,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const [pendingRequests, approvedRequests, totalUsers, totalDepts] = await Promise.all([
    db.saaRequest.count({ where: { status: "PENDING" } }),
    db.saaRequest.count({ where: { status: "APPROVED" } }),
    db.user.count(),
    db.department.count(),
  ]);

  // Generate initials for avatar
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header Row matching Reference UI: "Howdy, [User Name]" with Avatar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-400">Howdy,</p>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-0.5">
            {userName}
          </h1>
        </div>

        {/* Rounded User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-soft ring-4 ring-white">
            {initials}
          </div>
        </div>
      </div>

      {/* Search Bar matching Reference UI */}
      <div className="relative">
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-2 pl-5 shadow-soft focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="text"
            placeholder="Search SAA requests, departments, users..."
            className="w-full text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent outline-none"
          />
          <button
            type="button"
            className="w-10 h-10 bg-[#5C61F4] hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-colors shrink-0 shadow-sm"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Module Categories matching the 4 Pastel Square Cards in reference image */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">
          Quick Actions & Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: SAA Requests (Soft Indigo/Purple) */}
          <Link
            href="/dashboard/it/saa"
            className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-soft hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-purple-100 text-[#8B5CF6] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileSignature className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">SAA Requests</span>
          </Link>

          {/* Card 2: Failover (Soft Yellow/Amber) */}
          <Link
            href="/dashboard/it/failover"
            className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-soft hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-amber-100 text-[#FFB800] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Failover</span>
          </Link>

          {/* Card 3: Department Setup (Soft Teal/Cyan) */}
          <Link
            href="/dashboard/setup/departments"
            className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-soft hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-teal-100 text-[#2DD4BF] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Departments</span>
          </Link>

          {/* Card 4: Users Setup (Soft Pink/Rose) */}
          <Link
            href="/dashboard/setup/users"
            className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-soft hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-rose-100 text-[#FB7185] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Users</span>
          </Link>
        </div>
      </div>

      {/* Main Status Cards matching reference course layout */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">
          System Overview & Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: SAA Overview */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#5C61F4]">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">SAA Request Protocol</h3>
                  <p className="text-xs text-slate-400 font-medium">Access Authorization</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">
                Active System
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#2DD4BF] text-white p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-2xl font-black">{pendingRequests}</span>
                <span className="text-xs font-bold opacity-90">Pending SAA</span>
              </div>
              <div className="bg-gradient-to-r from-rose-400 to-pink-500 text-white p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-2xl font-black">{approvedRequests}</span>
                <span className="text-xs font-bold opacity-90">Approved SAA</span>
              </div>
            </div>
          </div>

          {/* Card 2: System Health */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">HMS Infrastructure</h3>
                  <p className="text-xs text-slate-400 font-medium">Database & Departments</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                Normal Operational
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#8B5CF6] text-white p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-2xl font-black">{totalUsers}</span>
                <span className="text-xs font-bold opacity-90">Active Users</span>
              </div>
              <div className="bg-[#FFB800] text-white p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-2xl font-black">{totalDepts}</span>
                <span className="text-xs font-bold opacity-90">Departments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}