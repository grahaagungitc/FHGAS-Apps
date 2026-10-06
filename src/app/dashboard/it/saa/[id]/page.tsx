"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import QRCode from "qrcode";
import SaaRequestSections from "@/components/SaaRequestSections";
import { formatSaaNumber } from "@/lib/saa-number";

type SaaRequestDetail = {
  id: string;
  requestNumber: number;
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
  requesterSignature?: string | null;
  requesterSignedAt?: string | null;
  requesterSignedByName?: string | null;
  requesterSignedByRole?: string | null;
  canApprove: boolean;
  canEdit: boolean;
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
    digitalSignature?: string | null;
    signedAt?: string | null;
    signedByName?: string | null;
    signedByRole?: string | null;
    approver: { name: string };
  }[];
  formConfig: {
    name: string;
    sections: string[];
    fields: {
      fieldKey: string;
      label: string;
      fieldType: string;
      source?: string | null;
      section?: string | null;
      order: number;
    }[];
  } | null;
};

export default function SaaRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<SaaRequestDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const buildEditValues = useCallback((data: SaaRequestDetail, departmentList: { id: string; name: string }[] = departments) => {
    const values = { ...(data.accessDetails ?? {}) };
    const configuredFields = [...(data.formConfig?.fields ?? [])].sort(
      (left, right) => left.order - right.order
    );

    configuredFields.forEach((field) => {
      if (field.source === "REQUESTER_NAME") {
        values[field.fieldKey] = data.name;
      } else if (field.source === "REQUESTER_EMAIL") {
        values[field.fieldKey] = data.email;
      } else if (field.source === "DEPARTMENT") {
        const storedValue = values[field.fieldKey];
        const matchedDepartment = departmentList.find(
          (department) =>
            department.id === storedValue || department.name === storedValue || department.name === data.department
        );
        values[field.fieldKey] = matchedDepartment?.id ?? (typeof storedValue === "string" ? storedValue : data.department || "");
      } else if (field.source === "REASON") {
        values[field.fieldKey] = data.reason;
      }
    });

    return values;
  }, [departments]);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/setup/saa-request/${id}`);
    const data = await response.json();
    if (response.ok) {
      setRequest(data);
      setEditValues(buildEditValues(data, departments));
    } else {
      setError(data.message || "Gagal memuat pengajuan.");
    }
    setLoading(false);
  }, [buildEditValues, departments, id]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  useEffect(() => {
    const loadDepartments = async () => {
      const response = await fetch("/api/departments");
      if (!response.ok) return;
      const data = await response.json();
      const nextDepartments = Array.isArray(data) ? data : [];
      setDepartments(nextDepartments);
    };

    void loadDepartments();
  }, []);

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

  const saveEdit = async () => {
    if (!request) return;

    setSaving(true);
    setError("");
    const response = await fetch(`/api/setup/saa-request/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData: editValues,
        requesterName: request.name,
        reason: request.reason,
        actionType: request.actionType,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Perubahan pengajuan gagal disimpan.");
      setSaving(false);
      return;
    }

    setIsEditing(false);
    await loadRequest();
    setSaving(false);
  };

  useEffect(() => {
    if (!request) return;

    const saaNumber = formatSaaNumber(request.formType, request.name, request.requestNumber);
    const signatures = [
      ...(request.requesterSignature ? [{
        id: `requester-${request.id}`,
        kind: "REQUESTER" as const,
        name: request.requesterSignedByName || request.name,
        timestamp: request.requesterSignedAt,
        signature: request.requesterSignature,
      }] : []),
      ...request.history.map((item) => ({
        id: `history-${item.id}`,
        kind: "APPROVER" as const,
        name: item.signedByName || item.approver.name,
        status: item.status,
        timestamp: item.signedAt || item.createdAt,
        signature: item.digitalSignature || "",
      })),
    ];

    void Promise.all(
      signatures
        .filter((item) => item.signature)
        .map(async (item) => {
          const verificationUrl = new URL("/api/saa/verify", window.location.origin);
          verificationUrl.searchParams.set("signature", item.signature);
          const encoded = await QRCode.toDataURL(verificationUrl.toString(), {
            width: 512,
            margin: 4,
            errorCorrectionLevel: "L",
          });
          setQrCodes((current) => ({ ...current, [item.id]: encoded }));
        })
    );
  }, [request]);

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
  const configuredFields = [...(request.formConfig?.fields ?? [])]
    .map((field) => ({ ...field, id: field.fieldKey }))
    .sort((left, right) => left.order - right.order);
  const fieldSectionNames = [...new Set(
    configuredFields.map((field) => field.section?.trim() || "Access Details")
  )];
  const sectionTitles = [
    ...request.formConfig?.sections ?? [],
    ...fieldSectionNames.filter((title) => !request.formConfig?.sections.includes(title)),
  ];
  const sections = sectionTitles.map((title) => [
    title,
    configuredFields.filter((field) => (field.section?.trim() || "Access Details") === title),
  ] as const);
  const configuredKeys = new Set(configuredFields.map((field) => field.fieldKey));
  const otherDetails = Object.entries(details).filter(([key]) => !configuredKeys.has(key));
  const activeTask = request.approvalTasks.find(
    (task) => task.status === "PENDING" && task.stepOrder === request.currentStep
  );

  const getConfiguredValue = (field: (typeof configuredFields)[number]) => {
    if (field.source === "REQUESTER_NAME") return request.name;
    if (field.source === "REQUESTER_EMAIL") return request.email;
    if (field.source === "DEPARTMENT") return request.department;
    if (field.source === "REASON") return request.reason;
    return details[field.fieldKey];
  };

  const formatValue = (value: unknown) => {
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    if (Array.isArray(value)) return value.join(", ");
    if (value && typeof value === "object") return JSON.stringify(value);
    return value === null || value === undefined || value === "" ? "-" : String(value);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/dashboard/it/saa" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-cyan-700">
        <ArrowLeft className="h-4 w-4" /> Daftar SAA
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
        <div>
          <p className="font-mono text-xs font-bold text-slate-600">{formatSaaNumber(request.formType, request.name, request.requestNumber)}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{request.formConfig?.name || request.formType}</h1>
          <p className="mt-1 text-sm text-slate-600">{request.actionType} · {request.status}</p>
        </div>
        <span className="inline-flex items-center gap-2 border-2 border-slate-900 px-3 py-2 text-xs font-bold">
          {request.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : request.status === "REJECTED" ? <XCircle className="h-4 w-4 text-rose-700" /> : <Clock className="h-4 w-4 text-amber-700" />}
          {request.status}
        </span>
      </header>

      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {request.canEdit && (
        <div className="flex flex-wrap gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setEditValues(buildEditValues(request));
                setIsEditing(true);
              }}
              className="border-2 border-slate-900 bg-cyan-300 px-4 py-2 text-sm font-black text-slate-900"
            >
              Edit Pengajuan
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="border-2 border-slate-900 bg-emerald-500 px-4 py-2 text-sm font-black text-slate-900 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditValues(buildEditValues(request));
                }}
                className="border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900"
              >
                Batal
              </button>
            </>
          )}
        </div>
      )}

      {isEditing ? (
        <SaaRequestSections
          departments={departments}
          sections={request.formConfig?.sections ?? []}
          fields={configuredFields}
          values={editValues}
          onFieldChange={(key, value) => {
            setEditValues((current) => ({ ...current, [key]: value }));
          }}
        />
      ) : (
        <SaaRequestSections
          departments={departments}
          sections={request.formConfig?.sections ?? []}
          fields={configuredFields}
          values={buildEditValues(request, departments)}
          onFieldChange={() => undefined}
          readOnly
        />
      )}

      <section className="space-y-4 border-t border-slate-300 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-800">Proses berurutan</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Alur Approval</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {activeTask ? `Menunggu ${activeTask.step.label}` : "Tidak ada approval yang menunggu"}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {request.requesterSignature && (
            <article className="flex min-w-0 flex-col border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-black text-white">1</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Pengajuan</p>
                  <p className="truncate text-sm font-black text-slate-950">Ditandatangani pemohon</p>
                </div>
              </div>
              <div className="flex min-h-28 items-center gap-3 border-t border-slate-200 pt-3">
                {qrCodes[`requester-${request.id}`] ? (
                  <Image src={qrCodes[`requester-${request.id}`]} alt="QR signature pemohon" width={176} height={176} unoptimized className="h-44 w-44 shrink-0 border border-slate-200 bg-white p-1" />
                ) : (
                  <div className="h-44 w-44 shrink-0 animate-pulse border border-slate-200 bg-white" />
                )}
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Nama Pemohon</p>
                  <p className="text-sm font-bold text-slate-900">{request.requesterSignedByName || request.name}</p>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">Waktu Request</p>
                  <p className="text-xs text-slate-600">
                    {request.requesterSignedAt ? new Date(request.requesterSignedAt).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
              </div>
            </article>
          )}
          {request.approvalTasks.map((task) => {
            const approvedHistory = request.history.find((item) =>
              item.status === task.status && item.signedByRole === task.step.role
            );
            const isActive = task.status === "PENDING" && task.stepOrder === request.currentStep;
            const statusTone = task.status === "APPROVED"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : task.status === "REJECTED"
                ? "border-rose-300 bg-rose-50 text-rose-800"
                : task.status === "WAITING"
                  ? "border-slate-200 bg-slate-100 text-slate-600"
                  : "border-cyan-300 bg-cyan-50 text-cyan-800";
            const qrData = approvedHistory ? qrCodes[`history-${approvedHistory.id}`] : undefined;

            return (
              <article key={task.id} className={`flex min-w-0 flex-col border bg-white p-4 ${isActive ? "border-cyan-700 ring-1 ring-cyan-700/20" : "border-slate-200"}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${task.status === "APPROVED" ? "bg-emerald-700 text-white" : isActive ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {task.stepOrder}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tahap {task.stepOrder}</p>
                      <p className="truncate text-sm font-black text-slate-950">{task.step.label}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusTone}`}>
                    {isActive ? "Pending" : task.status === "WAITING" ? "Menunggu" : task.status === "APPROVED" ? "Disetujui" : task.status === "REJECTED" ? "Ditolak" : task.status}
                  </span>
                </div>

                <div className="min-h-16 border-l-2 border-slate-200 pl-3 text-sm">
                  <p className="font-bold text-slate-900">{task.assignedTo?.name || "Approver belum ditugaskan"}</p>
                  {isActive ? (
                    <p className="mt-2 text-xs font-bold text-cyan-800">Menunggu approval Anda</p>
                  ) : !approvedHistory ? (
                    <p className="mt-2 text-xs text-slate-400">Belum diproses</p>
                  ) : null}
                </div>

                <div className="mt-4 flex min-h-28 items-center gap-3 border-t border-slate-100 pt-3">
                  {qrData ? (
                    <Image src={qrData} alt={`QR signature ${task.step.label}`} width={176} height={176} unoptimized className="h-44 w-44 shrink-0 border border-slate-200 bg-white p-1" />
                  ) : (
                    <div className="flex h-44 w-44 shrink-0 items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                      {task.status === "WAITING" || isActive ? "Belum ada" : "QR"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Digital signature</p>
                    {approvedHistory && (
                      <div className="mt-2 space-y-2 text-[10px]">
                        <div>
                          <p className="font-bold uppercase tracking-wide text-slate-500">Nama Approver</p>
                          <p className="mt-0.5 font-semibold text-slate-800">{approvedHistory.signedByName || approvedHistory.approver.name}</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-wide text-slate-500">
                            Waktu Approval
                          </p>
                          <p className="mt-0.5 text-slate-700">
                            {new Date(approvedHistory.signedAt || approvedHistory.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    )}
                    {approvedHistory?.digitalSignature ? (
                      <p className="mt-2 break-all font-mono text-[9px] leading-relaxed text-slate-500">{approvedHistory.digitalSignature}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">QR tampil setelah approver menandatangani.</p>
                    )}
                  </div>
                </div>

                {approvedHistory?.notes && <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">Catatan: {approvedHistory.notes}</p>}
                {!approvedHistory && isActive && (
                  <div className="mt-3 border-l-2 border-cyan-700 bg-cyan-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-cyan-800">Sedang menunggu approval</div>
                )}
              </article>
            );
          })}
        </div>
      </section>

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
