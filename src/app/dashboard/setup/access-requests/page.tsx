"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Loader2,
  X,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  RotateCw,
} from "lucide-react";

type AccessRequest = {
  id: string;
  email: string;
  name: string;
  requestedDepartmentId?: string | null;
  createdAt: string;
};

type Department = {
  id: string;
  name: string;
};

type SystemRole = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
};

type Assignment = {
  departmentId: string;
  position: string;
  roles: string[];
};

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");

  // State untuk Modal Pilih Role
  const [activeModalRequestId, setActiveModalRequestId] = useState<string | null>(null);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [tempSelectedRoles, setTempSelectedRoles] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [requestResponse, departmentResponse, roleResponse] = await Promise.all([
        fetch("/api/setup/access-requests"),
        fetch("/api/departments"),
        fetch("/api/setup/saa-roles"),
      ]);

      if (requestResponse.ok && departmentResponse.ok && roleResponse.ok) {
        const [requestData, departmentData, roleData] = await Promise.all([
          requestResponse.json(),
          departmentResponse.json(),
          roleResponse.json(),
        ]);

        const fetchedRoles: SystemRole[] = Array.isArray(roleData)
          ? roleData
          : roleData.roles || [];

        setRequests(requestData);
        setDepartments(departmentData);
        setRoles(fetchedRoles);

        setAssignments((current) => {
          const next = { ...current };
          for (const request of requestData as AccessRequest[]) {
            next[request.id] ??= {
              departmentId: departmentData.some(
                (department: Department) => department.id === request.requestedDepartmentId
              )
                ? request.requestedDepartmentId || ""
                : departmentData[0]?.id || "",
              position: "",
              roles: ["STAFF"], // Default initial role
            };
          }
          return next;
        });
      } else {
        setError("Gagal memuat data permintaan, departemen, atau role.");
      }
    } catch (err) {
      console.error("Error loading access requests data:", err);
      setError("Terjadi kesalahan koneksi saat memuat data.");
    } finally {
      setLoading(false);
    }
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
    try {
      const response = await fetch("/api/setup/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: accessRequest.id,
          decision,
          ...assignments[accessRequest.id],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Gagal memproses permintaan.");
      } else {
        setRequests((current) => current.filter((item) => item.id !== accessRequest.id));
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Terjadi kesalahan saat memproses tanggapan.");
    } finally {
      setProcessingId("");
    }
  };

  // Modal handlers
  const handleOpenRoleModal = (requestId: string) => {
    const currentRoles = assignments[requestId]?.roles || [];
    setTempSelectedRoles([...currentRoles]);
    setRoleSearchQuery("");
    setActiveModalRequestId(requestId);
  };

  const handleConfirmRoleSelection = () => {
    if (activeModalRequestId) {
      updateAssignment(activeModalRequestId, { roles: tempSelectedRoles });
    }
    setActiveModalRequestId(null);
  };

  const toggleRoleSelection = (roleCode: string) => {
    setTempSelectedRoles((prev) =>
      prev.includes(roleCode)
        ? prev.filter((code) => code !== roleCode)
        : [...prev, roleCode]
    );
  };

  const toggleSelectAllRoles = (filteredRoles: SystemRole[]) => {
    const filteredCodes = filteredRoles.map((r) => r.code);
    const allSelected = filteredCodes.every((code) => tempSelectedRoles.includes(code));

    if (allSelected) {
      setTempSelectedRoles((prev) => prev.filter((code) => !filteredCodes.includes(code)));
    } else {
      setTempSelectedRoles((prev) => Array.from(new Set([...prev, ...filteredCodes])));
    }
  };

  const removeSingleRole = (requestId: string, roleCode: string) => {
    const currentRoles = assignments[requestId]?.roles || [];
    updateAssignment(requestId, {
      roles: currentRoles.filter((code) => code !== roleCode),
    });
  };

  // Filtered roles for search in modal
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      role.code.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  return (
    <section className="w-full space-y-6">
      <header className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4] shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Approval Akses User</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Tinjau permintaan akses baru dan tetapkan departemen serta role sebelum akun dibuat.
          </p>
        </div>
      </header>

      {error && (
        <p role="alert" className="border border-rose-200 bg-rose-50 p-4 rounded-2xl text-xs font-bold text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center py-12 text-xs font-bold text-slate-400">Memuat permintaan...</p>
      ) : requests.length === 0 ? (
        <p className="bg-white border border-slate-100 rounded-3xl py-12 text-center text-sm font-medium text-slate-400 shadow-soft">
          Tidak ada permintaan akses yang menunggu.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const assignment = assignments[request.id] || { departmentId: "", position: "", roles: [] };
            const selectedRolesData = roles.filter((r) => assignment.roles.includes(r.code));

            return (
              <article key={request.id} className="space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">{request.name}</h2>
                  <p className="text-xs font-medium text-slate-500">{request.email}</p>
                  {request.requestedDepartmentId && (
                    <p className="mt-1 text-xs font-semibold text-indigo-700">
                      Department pilihan: {departments.find((department) => department.id === request.requestedDepartmentId)?.name || "Tidak tersedia"}
                    </p>
                  )}
                  <time className="text-[10px] font-medium text-slate-400 mt-1 block">
                    Diajukan {new Date(request.createdAt).toLocaleString("id-ID")}
                  </time>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700">
                    DEPARTEMEN
                    <select
                      value={assignment.departmentId}
                      onChange={(event) => updateAssignment(request.id, { departmentId: event.target.value })}
                      className="mt-1.5 w-full border border-slate-200 bg-white p-3 text-sm rounded-2xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      required
                    >
                      <option value="">Pilih departemen</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-bold text-slate-700">
                    JABATAN
                    <input
                      value={assignment.position}
                      onChange={(event) => updateAssignment(request.id, { position: event.target.value })}
                      className="mt-1.5 w-full border border-slate-200 p-3 text-sm rounded-2xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="Opsional"
                    />
                  </label>
                </div>

                {/* ROLE MANAGEMENT SECTION - Mengadopsi Tampilan Gambar Reference */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Role and Permission</h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Role ditetapkan untuk user <span className="font-bold text-slate-700">{request.name}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenRoleModal(request.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0092BA] hover:text-[#007A9B] bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add / Edit Role
                    </button>
                  </div>

                  {/* List Role yang Terpilih */}
                  {selectedRolesData.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Belum ada role yang dipilih. Klik tombol "+ Add / Edit Role" di atas.</p>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      <div className="bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                        <span>Name</span>
                        <span>Aksi</span>
                      </div>
                      {selectedRolesData.map((role) => (
                        <div key={role.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80 transition">
                          <span className="font-bold text-slate-800 tracking-wide">{role.name}</span>
                          <button
                            type="button"
                            onClick={() => removeSingleRole(request.id, role.code)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 rounded-lg"
                            title="Hapus Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    disabled={processingId === request.id || !assignment.departmentId}
                    onClick={() => void reviewRequest(request, "APPROVED")}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-soft transition disabled:opacity-50"
                  >
                    {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Setujui & Buat User
                  </button>
                  <button
                    disabled={processingId === request.id}
                    onClick={() => void reviewRequest(request, "REJECTED")}
                    className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Tolak
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL: CHOOSE ROLE (Sesuai Desain image_a70415.png) */}
      {activeModalRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
            {/* Header Modal Warna Biru Khas / Cyan */}
            <div className="bg-[#0092BA] text-white px-6 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base tracking-wide">Choose Role</h3>
              <button
                type="button"
                onClick={() => setActiveModalRequestId(null)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Header & Search Bar */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  placeholder="Search role..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0092BA] transition"
                />
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <button
                  type="button"
                  onClick={() => setRoleSearchQuery("")}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                  title="Refresh search"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List Table Role */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                    <th className="py-2.5 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredRoles.length > 0 &&
                          filteredRoles.every((r) => tempSelectedRoles.includes(r.code))
                        }
                        onChange={() => toggleSelectAllRoles(filteredRoles)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0092BA] focus:ring-[#0092BA] cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-4 uppercase tracking-wider">Role Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-400 text-xs">
                        Role tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => {
                      const isChecked = tempSelectedRoles.includes(role.code);
                      return (
                        <tr
                          key={role.id}
                          onClick={() => toggleRoleSelection(role.code)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? "bg-sky-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Diset di level row onClick
                              className="h-4 w-4 rounded border-slate-300 text-[#0092BA] focus:ring-[#0092BA] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-bold uppercase tracking-wide">
                            {role.name}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                1 - {filteredRoles.length} of {roles.length}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalRequestId(null)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleSelection}
                  className="px-6 py-2 bg-[#0092BA] hover:bg-[#007A9B] text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
} 