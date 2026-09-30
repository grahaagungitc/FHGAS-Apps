import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  const [pendingRequests, approvedRequests] = await Promise.all([
    db.saaRequest.count({ where: { status: "PENDING" } }),
    db.saaRequest.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,243,255,1)] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            SYSTEM DASHBOARD
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            WELCOME BACK, {session?.user?.name?.toUpperCase() || "STAFF"}
          </p>
        </div>
        <div className="px-3 py-1 bg-cyan-100 border-2 border-cyan-500 text-cyan-900 text-xs font-mono font-bold rounded-md">
          SYSTEM ACTIVE
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-mono text-slate-500 uppercase font-bold">
            Pending SAA Requests
          </p>
          <p className="text-3xl font-black text-slate-900 mt-2">{pendingRequests}</p>
        </div>

        <div className="bg-white border-2 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-mono text-slate-500 uppercase font-bold">
            Approved Requests
          </p>
          <p className="text-3xl font-black text-slate-900 mt-2">{approvedRequests}</p>
        </div>

        <div className="bg-white border-2 border-slate-900 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-mono text-slate-500 uppercase font-bold">
            System Status
          </p>
          <p className="text-lg font-bold text-green-600 mt-2">NORMAL</p>
        </div>
      </div>
    </div>
  );
}