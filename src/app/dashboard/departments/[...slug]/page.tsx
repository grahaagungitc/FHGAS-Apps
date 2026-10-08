import Link from "next/link";
import { Wrench, ArrowLeft } from "lucide-react";

type PageProps = {
  params: {
    slug: string[];
  };
};

export default function ComingSoonDepartmentPage({ params }: PageProps) {
  const departmentName = (params?.slug || [])
    .map((s) => s.replace(/-/g, " ").toUpperCase())
    .join(" / ");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">
            {departmentName || "DEPARTMENT"}
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            HMS MODULE PROTOCOL
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
          UNDER DEVELOPMENT
        </span>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white border border-slate-100 p-12 rounded-3xl shadow-soft text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4]">
          <Wrench className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Module Coming Soon
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-1 max-w-md">
            Fitur untuk modul <strong className="text-slate-800">{departmentName || "Department"}</strong> sedang dalam tahap pengembangan dan konfigurasi sistem.
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