"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

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
    <section className="mx-auto max-w-5xl space-y-5">
      <header className="border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-black text-slate-900">Approval Akses User</h1>
        <p className="mt-1 text-sm text-slate-600">Tinjau permintaan akses baru dan tetapkan departemen serta role sebelum akun dibuat.</p>
      </header>

      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-600">Memuat permintaan...</p>
      ) : requests.length === 0 ? (
        <p className="border-y border-slate-300 py-8 text-center text-sm text-slate-500">Tidak ada permintaan akses yang menunggu.</p>
      ) : (
        <div className="divide-y-2 divide-slate-300 border-y-2 border-slate-300">
          {requests.map((request) => {
            const assignment = assignments[request.id] || { departmentId: "", position: "", roles: [] };
            return (
              <article key={request.id} className="space-y-4 py-5">
                <div>
                  <h2 className="font-black text-slate-900">{request.name}</h2>
                  <p className="text-sm text-slate-600">{request.email}</p>
                  <time className="text-xs text-slate-500">Diajukan {new Date(request.createdAt).toLocaleString("id-ID")}</time>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700">
                    DEPARTEMEN
                    <select value={assignment.departmentId} onChange={(event) => updateAssignment(request.id, { departmentId: event.target.value })} className="mt-1 w-full border-2 border-slate-900 bg-white p-2 text-sm" required>
                      <option value="">Pilih departemen</option>
                      {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    JABATAN
                    <input value={assignment.position} onChange={(event) => updateAssignment(request.id, { position: event.target.value })} className="mt-1 w-full border-2 border-slate-900 p-2 text-sm" placeholder="Opsional" />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-bold text-slate-700">ROLE</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {roleOptions.map((role) => (
                      <label key={role.value} className="flex items-center gap-2 text-xs text-slate-800">
                        <input
                          type="checkbox"
                          checked={assignment.roles.includes(role.value)}
                          onChange={(event) => {
                            const roles = event.target.checked
                              ? [...assignment.roles, role.value]
                              : assignment.roles.filter((value) => value !== role.value);
                            updateAssignment(request.id, { roles });
                          }}
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex flex-wrap gap-3">
                  <button disabled={processingId === request.id || !assignment.departmentId} onClick={() => void reviewRequest(request, "APPROVED")} className="inline-flex items-center gap-2 border-2 border-emerald-900 bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Setujui & buat user
                  </button>
                  <button disabled={processingId === request.id} onClick={() => void reviewRequest(request, "REJECTED")} className="inline-flex items-center gap-2 border-2 border-rose-900 bg-white px-4 py-2 text-xs font-bold text-rose-800 disabled:opacity-50">
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
