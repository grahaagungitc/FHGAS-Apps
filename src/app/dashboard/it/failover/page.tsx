import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function FailoverProcedurePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,243,255,1)] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            FAILOVER PROCEDURE
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            IT DEPARTMENT PROTOCOL
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 border-2 border-amber-500 text-amber-900 text-xs font-mono font-bold rounded-md">
          COMING SOON
        </span>
      </div>

      <div className="bg-white border-2 border-slate-900 p-12 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
        <div className="w-16 h-16 bg-cyan-100 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Activity className="w-8 h-8 text-slate-900" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            FAILOVER PROTOCOL UNDER CONSTRUCTION
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-1 max-w-md">
            Dokumentasi dan Prosedur Failover IT System sedang dipersiapkan.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-cyan-400 font-bold text-xs rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,243,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </Link>
      </div>
    </div>
  );
}