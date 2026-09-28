import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { FileText, Plus, Clock } from "lucide-react";

export default async function SaaListPage() {
  const session = await auth();

  const requests = await prisma.saaRequest.findMany({
    include: {
      requester: true,
      approvalHistories: { include: { approver: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-pink-500" />
            System Access Authorization (SAA)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Daftar pengajuan izin akses sistem hotel dan alur persetujuan multi-tier.
          </p>
        </div>

        {session && (
          <Link
            href="/saa/new"
            className="inline-flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-glow-pink transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Buat Request Baru
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="p-4">Ticket No</th>
                <th className="p-4">Requester</th>
                <th className="p-4">Form / Action Type</th>
                <th className="p-4">Alasan / Note</th>
                <th className="p-4">Status Approval</th>
                <th className="p-4">Tanggal Pengajuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    Belum ada pengajuan SAA Request. Silakan klik tombol &quot;Buat Request Baru&quot;.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-pink-600">{req.ticketNo}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{req.requester.name || req.requester.email}</div>
                      <div className="text-[11px] text-slate-400">{req.requester.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{req.formType}</span>
                      <span className="block text-[10px] text-slate-400 uppercase font-mono">{req.actionType}</span>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
