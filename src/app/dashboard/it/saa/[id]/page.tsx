"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

type SaaRequestDetail = {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  formType: string;
  actionType: string;
  reason: string;
  accessDetails: Record<string, unknown> | null;
  status: string;
  currentStep: number;
  canApprove: boolean;
  approvalTasks: {
    id: string;
    stepOrder: number;
    status: string;
    notes: string | null;
    step: { role: string; label: string };
    assignedTo: { name: string } | null;
  }[];
  history: {
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    approver: { name: string };
  }[];
  formConfig: { name: string } | null;
};

export default function SaaRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<SaaRequestDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRequest = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/setup/saa-request/${id}`);
    const data = await response.json();
    if (response.ok) setRequest(data);
    else setError(data.message || "Gagal memuat pengajuan.");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  const submitDecision = async (decision: "APPROVED" | "REJECTED") => {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/setup/saa-request/${id}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.message || "Approval gagal diproses.");
    else await loadRequest();
    setSaving(false);
  };

  if (loading) return <p className="p-6 text-sm text-slate-600">Memuat pengajuan...</p>;
  if (!request) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-rose-700">{error || "Pengajuan tidak ditemukan."}</p>
        <Link href="/dashboard/it/saa" className="inline-flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>
    );
  }

  const details = request.accessDetails ?? {};
  const activeTask = request.approvalTasks.find(
    (task) => task.status === "PENDING" && task.stepOrder === request.currentStep
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/dashboard/it/saa" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-cyan-700">
        <ArrowLeft className="h-4 w-4" /> Daftar SAA
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
        <div>
          <p className="font-mono text-xs text-slate-500">TIKET #{request.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{request.formConfig?.name || request.formType}</h1>
          <p className="mt-1 text-sm text-slate-600">{request.actionType} · {request.status}</p>
        </div>
        <span className="inline-flex items-center gap-2 border-2 border-slate-900 px-3 py-2 text-xs font-bold">
          {request.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : request.status === "REJECTED" ? <XCircle className="h-4 w-4 text-rose-700" /> : <Clock className="h-4 w-4 text-amber-700" />}
          {request.status}
        </span>
      </header>

      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase">Pemohon</h2>
          <p className="text-sm">{request.name} · {request.email}</p>
          <p className="text-sm text-slate-600">{request.position || "-"} · {request.department}</p>
          <h2 className="pt-3 text-sm font-black uppercase">Alasan</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{request.reason}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase">Detail Akses</h2>
          <dl className="divide-y divide-slate-200 border-y border-slate-200">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[minmax(8rem,1fr)_2fr] gap-3 py-2 text-sm">
                <dt className="font-semibold text-slate-600">{key}</dt>
                <dd className="break-words text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-300 pt-5">
        <h2 className="text-sm font-black uppercase">Alur Approval</h2>
        <ol className="divide-y divide-slate-200">
          {request.approvalTasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span><strong>{task.stepOrder}. {task.step.label}</strong><span className="ml-2 text-slate-500">{task.assignedTo?.name || "Approver tidak tersedia"}</span></span>
              <span className="font-mono text-xs">{task.status}</span>
            </li>
          ))}
        </ol>
      </section>

      {request.history.length > 0 && (
        <section className="space-y-3 border-t border-slate-300 pt-5">
          <h2 className="text-sm font-black uppercase">Riwayat</h2>
          {request.history.map((item) => (
            <p key={item.id} className="text-sm text-slate-700">
              {item.approver.name} · {item.status} · {new Date(item.createdAt).toLocaleString("id-ID")}
              {item.notes ? ` · ${item.notes}` : ""}
            </p>
          ))}
        </section>
      )}

      {request.canApprove && activeTask && (
        <section className="space-y-3 border-t-2 border-slate-900 pt-5">
          <label htmlFor="approval-notes" className="block text-sm font-bold">Catatan approval</label>
          <textarea id="approval-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full border-2 border-slate-900 p-3 text-sm" />
          <div className="flex flex-wrap gap-3">
            <button disabled={saving} onClick={() => submitDecision("APPROVED")} className="inline-flex items-center gap-2 border-2 border-emerald-800 bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" /> Setujui
            </button>
            <button disabled={saving || !notes.trim()} onClick={() => submitDecision("REJECTED")} className="inline-flex items-center gap-2 border-2 border-rose-900 bg-rose-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Tolak
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
