import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shield, CheckCircle2, Clock, Users, Building } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userCount = await prisma.user.count();
  const deptCount = await prisma.department.count();
  const saaPendingCount = await prisma.saaRequest.count({
    where: { status: { not: "APPROVED" } },
  });
  const saaApprovedCount = await prisma.saaRequest.count({
    where: { status: "APPROVED" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-500" />
          System Overview Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Selamat datang kembali, <strong>{session.user.name || session.user.email}</strong>!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-cyan-100 text-cyan-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total User</span>
            <p className="text-2xl font-black text-slate-900">{userCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-pink-100 text-pink-600">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</span>
            <p className="text-2xl font-black text-slate-900">{deptCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-100 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SAA Pending Approval</span>
            <p className="text-2xl font-black text-slate-900">{saaPendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SAA Approved</span>
            <p className="text-2xl font-black text-slate-900">{saaApprovedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
