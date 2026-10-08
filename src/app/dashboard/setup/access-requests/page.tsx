"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X, ShieldCheck } from "lucide-react";

const roleOptions = [
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
  { value: "HOD", label: "Head of Department" },
  { value: "FINANCE_LEADER", label: "Finance Leader" },
  { value: "HOTEL_MANAGER", label: "Hotel Manager" },
  { value: "FO_LEADER", label: "Front Office Leader" },
  { value: "IT", label: "IT" },
];

type AccessRequest = { id: string; email: string; name: string; createdAt: string };
type Department = { id: string; name: string };
type Assignment = { departmentId: string; position: string; roles: string[] };

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [requestResponse, departmentResponse] = await Promise.all([
      fetch("/api/setup/access-requests"),
      fetch("/api/departments"),
    ]);
    if (requestResponse.ok && departmentResponse.ok) {
      const [requestData, departmentData] = await Promise.all([
        requestResponse.json(),
        departmentResponse.json(),
      ]);
      setRequests(requestData);
      setDepartments(departmentData);
      setAssignments((current) => {
        const next = { ...current };
        for (const request of requestData as AccessRequest[]) {
          next[request.id] ??= {
            departmentId: departmentData[0]?.id || "",
            position: "",
            roles: ["STAFF"],
          };
        }
        return next;
      });
    } else {
      setError("Gagal memuat permintaan atau departemen.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateAssignment = (id: string, update: Partial<Assignment>) => {
    setAssignments((current) => ({
      ...current,
      [id]: { ...current[id], ...update },
    }));
  };

  const reviewRequest = async (accessRequest: AccessRequest, decision: "APPROVED" | "REJECTED") => {
    setProcessingId(accessRequest.id);
    setError("");
    const response = await fetch("/api/setup/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: accessRequest.id, decision, ...assignments[accessRequest.id] }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Gagal memproses permintaan.");
    } else {
      setRequests((current) => current.filter((item) => item.id !== accessRequest.id));
    }
    setProcessingId("");
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4] shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Approval Akses User</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Tinjau permintaan akses baru dan tetapkan departemen serta role sebelum akun dibuat.</p>
        </div>
      </header>

      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-4 rounded-2xl text-xs font-bold text-rose-800">{error}</p>}
      {loading ? (
        <p className="text-center py-12 text-xs font-bold text-slate-400">Memuat permintaan...</p>
      ) : requests.length === 0 ? (
        <p className="bg-white border border-slate-100 rounded-3xl py-12 text-center text-sm font-medium text-slate-400 shadow-soft">Tidak ada permintaan akses yang menunggu.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const assignment = assignments[request.id] || { departmentId: "", position: "", roles: [] };
            return (
              <article key={request.id} className="space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">{request.name}</h2>
                  <p className="text-xs font-medium text-slate-500">{request.email}</p>
                  <time className="text-[10px] font-medium text-slate-400 mt-1 block">Diajukan {new Date(request.createdAt).toLocaleString("id-ID")}</time>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700">
                    DEPARTEMEN
                    <select value={assignment.departmentId} onChange={(event) => updateAssignment(request.id, { departmentId: event.target.value })} className="mt-1.5 w-full border border-slate-200 bg-white p-3 text-sm rounded-2xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer" required>
                      <option value="">Pilih departemen</option>
                      {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    JABATAN
                    <input value={assignment.position} onChange={(event) => updateAssignment(request.id, { position: event.target.value })} className="mt-1.5 w-full border border-slate-200 p-3 text-sm rounded-2xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all" placeholder="Opsional" />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-bold text-slate-700">ROLE</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {roleOptions.map((role) => (
                      <label key={role.value} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={assignment.roles.includes(role.value)}
                          onChange={(event) => {
                            const roles = event.target.checked
                              ? [...assignment.roles, role.value]
                              : assignment.roles.filter((value) => value !== role.value);
                            updateAssignment(request.id, { roles });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button disabled={processingId === request.id || !assignment.departmentId} onClick={() => void reviewRequest(request, "APPROVED")} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-soft transition disabled:opacity-50">
                    {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Setujui & Buat User
                  </button>
                  <button disabled={processingId === request.id} onClick={() => void reviewRequest(request, "REJECTED")} className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 transition disabled:opacity-50">
                    <X className="h-4 w-4" /> Tolak
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
