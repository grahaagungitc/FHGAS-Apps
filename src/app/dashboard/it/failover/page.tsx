import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function FailoverProcedurePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            FAILOVER PROCEDURE
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            IT DEPARTMENT PROTOCOL
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
          COMING SOON
        </span>
      </div>

      <div className="bg-white border border-slate-100 p-12 rounded-3xl shadow-soft text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-[#FFB800]">
          <Activity className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Failover Protocol Under Construction
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-1 max-w-md">
            Dokumentasi dan Prosedur Failover IT System sedang dipersiapkan.
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
    </div>
  );
}