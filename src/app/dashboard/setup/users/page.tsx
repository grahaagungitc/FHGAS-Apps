"use client";

import { useState, useEffect } from "react";
import { UserPlus, Pencil, Trash2, ShieldCheck, Loader2, X } from "lucide-react";

export type UserRole =
  | "STAFF"
  | "HOD"
  | "FINANCE_LEADER"
  | "HOTEL_MANAGER"
  | "FO_LEADER"
  | "IT"
  | "ADMIN";

const AVAILABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "STAFF", label: "STAFF (Pemohon)" },
  { value: "HOD", label: "HEAD OF DEPT (HOD)" },
  { value: "FINANCE_LEADER", label: "FINANCE LEADER" },
  { value: "HOTEL_MANAGER", label: "HOTEL MANAGER" },
  { value: "FO_LEADER", label: "FRONT OFFICE LEADER" },
  { value: "IT", label: "IT TEAM" },
  { value: "ADMIN", label: "ADMINISTRATOR" },
];

interface Department {
  id: string;
  code?: string | null;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  departmentId: string | null;
  departmentName?: string;
  department?: Department | string | null;
  roles: UserRole[];
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State untuk Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    departmentId: "",
    roles: ["STAFF"] as UserRole[],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resUsers, resDepts] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/departments"),
      ]);

      let fetchedDepts: Department[] = [];
      if (resDepts.ok) {
        fetchedDepts = await resDepts.json();
        setDepartments(fetchedDepts);
      }

      if (resUsers.ok) {
        const userData = await resUsers.json();

        // Normalisasi data user agar departmentId selalu memakai ID/UUID valid
        const normalizedUsers = userData.map((u: any) => {
          let resolvedDeptId = u.departmentId || "";

          // Jika departmentId kosong, cek properti u.department
          if (!resolvedDeptId && u.department) {
            if (typeof u.department === "object" && u.department.id) {
              resolvedDeptId = u.department.id;
            } else if (typeof u.department === "string") {
              const matched = fetchedDepts.find(
                (d) => d.name === u.department || d.id === u.department
              );
              if (matched) resolvedDeptId = matched.id;
            }
          } else if (resolvedDeptId) {
            // Jika tersimpan nama string di departmentId, ubah ke UUID departemen
            const matchedByName = fetchedDepts.find(
              (d) => d.name === resolvedDeptId
            );
            if (matchedByName) {
              resolvedDeptId = matchedByName.id;
            }
          }

          return {
            ...u,
            departmentId: resolvedDeptId,
            roles: Array.isArray(u.roles)
              ? u.roles
              : u.role
              ? [u.role]
              : ["STAFF"],
          };
        });

        setUsers(normalizedUsers);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Open Modal Add (Otomatis memilih departemen pertama dari Department Management)
  const handleOpenAddModal = () => {
    setEditingUser(null);
    const defaultDeptId = departments.length > 0 ? departments[0].id : "";

    setFormData({
      name: "",
      email: "",
      position: "",
      departmentId: defaultDeptId,
      roles: ["STAFF"],
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);

    // Cari UUID departemen yang paling presisi dari daftar Department Management
    let activeDeptId = user.departmentId || "";

    if (!activeDeptId && user.department) {
      if (typeof user.department === "object" && user.department.id) {
        activeDeptId = user.department.id;
      } else if (typeof user.department === "string") {
        const matched = departments.find(
          (d) => d.name === user.department || d.id === user.department
        );
        if (matched) activeDeptId = matched.id;
        else activeDeptId = user.department;
      }
    } else if (activeDeptId) {
      const matchedByName = departments.find(
        (d) => d.name === activeDeptId || d.id === activeDeptId
      );
      if (matchedByName) activeDeptId = matchedByName.id;
    }

    // Jika masih tidak ditemukan, beri fallback ke departemen pertama jika ada
    if (!activeDeptId && departments.length > 0) {
      activeDeptId = departments[0].id;
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
      position: user.position || "",
      departmentId: activeDeptId,
      roles: user.roles && user.roles.length > 0 ? user.roles : ["STAFF"],
    });
    setIsModalOpen(true);
  };

  // Toggle Checkbox Multiple Roles
  const handleRoleToggle = (role: UserRole) => {
    setFormData((prev) => {
      const currentRoles = prev.roles;
      let updatedRoles: UserRole[];

      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) return prev;
        updatedRoles = currentRoles.filter((r) => r !== role);
      } else {
        updatedRoles = [...currentRoles, role];
      }

      return { ...prev, roles: updatedRoles };
    });
  };

  // Submit Form (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(
          editingUser
            ? "User berhasil diperbarui!"
            : "User baru berhasil ditambahkan!"
        );
        setIsModalOpen(false);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(`Gagal menyimpan user: ${err.message || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
        alert("User berhasil dihapus.");
      } else {
        alert("Gagal menghapus user.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const handleDepartmentChange = async (userId: string, newDeptId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: newDeptId }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, departmentId: newDeptId } : u
          )
        );
        fetchInitialData();
      }
    } catch (err) {
      console.error("Gagal mengupdate departemen user:", err);
    }
  };

  // Helper Render Multiple Badges
  const renderRoleBadges = (roles: UserRole[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => {
          switch (role) {
            case "HOD":
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-400"
                >
                  HOD
                </span>
              );
            case "FINANCE_LEADER":
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-400"
                >
                  FINANCE
                </span>
              );
            case "HOTEL_MANAGER":
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-400"
                >
                  GM/HM
                </span>
              );
            case "FO_LEADER":
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-400"
                >
                  FO LEADER
                </span>
              );
            case "IT":
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-400"
                >
                  IT
                </span>
              );
            case "ADMIN":
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-400"
                >
                  ADMIN
                </span>
              );
            default:
              return (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-300"
                >
                  STAFF
                </span>
              );
          }
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            USER MANAGEMENT & APPROVAL MAPPING
          </h1>
          <p className="text-xs font-mono text-slate-600 mt-1">
            Atur Departemen, Tambah User, dan tetapkan Multi-Role Approval untuk
            alur persetujuan SAA.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 text-slate-900 font-mono font-black text-xs rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-cyan-300 transition-all whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>ADD NEW USER</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-mono text-xs uppercase border-b-2 border-slate-900">
                <th className="p-4">USER / EMAIL</th>
                <th className="p-4">POSITION</th>
                <th className="p-4">ASSIGNED DEPARTMENT</th>
                <th className="p-4">APPROVAL ROLES</th>
                <th className="p-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 font-mono"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    <span>Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 font-mono"
                  >
                    Belum ada data user. Klik ADD NEW USER untuk menambah.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  // Match ID dari Department Management
                  const currentDeptVal = user.departmentId || "";
                  const matchedDept = departments.find(
                    (d) => d.id === currentDeptVal || d.name === currentDeptVal
                  );
                  const selectedTableVal = matchedDept ? matchedDept.id : currentDeptVal;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {user.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-700">
                        {user.position || "-"}
                      </td>
                      <td className="p-4">
                        <select
                          value={selectedTableVal}
                          onChange={(e) =>
                            handleDepartmentChange(user.id, e.target.value)
                          }
                          className="px-3 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value="">-- UNASSIGNED --</option>
                          {/* Hanya merender opsi dari Department Management */}
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">{renderRoleBadges(user.roles)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 bg-slate-100 border border-slate-900 rounded hover:bg-cyan-100 text-slate-800"
                            title="Edit User"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUser(user.id, user.name)
                            }
                            className="p-1.5 bg-red-100 border border-slate-900 rounded hover:bg-red-200 text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-cyan-50 border-2 border-cyan-400 p-4 rounded-xl text-xs space-y-2">
        <div className="font-bold font-mono text-cyan-900 flex items-center gap-1.5 uppercase">
          <ShieldCheck className="w-4 h-4 text-cyan-700" />
          MULTI-ROLE APPROVAL MAPPING:
        </div>
        <p className="text-slate-700 font-mono">
          Satu akun dapat memegang beberapa peran sekaligus (contoh: seseorang
          bisa menjabat sebagai <strong>HOD</strong> sekaligus{" "}
          <strong>FINANCE LEADER</strong> atau <strong>IT</strong> dan{" "}
          <strong>ADMIN</strong>).
        </p>
      </div>

      {/* MODAL FORM ADD / EDIT USER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-2 border-slate-900">
              <h3 className="text-sm font-black uppercase font-mono">
                {editingUser ? "EDIT USER" : "ADD NEW USER"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Achmad R. Alvan"
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="grahaagungitc@favehotels.com"
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  POSITION / JABATAN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="Contoh: IT Coordinator"
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* Department Dropdown (Hanya Mengambil dari Department Management) */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  DEPARTMENT *
                </label>
                <select
                  value={
                    departments.find(
                      (d) =>
                        d.id === formData.departmentId ||
                        d.name === formData.departmentId
                    )?.id || formData.departmentId
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="">-- UNASSIGNED --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Role Checkboxes */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-2">
                  APPROVAL ROLES (BISA PILIH LEBIH DARI 1) *
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border-2 border-slate-900 rounded-lg">
                  {AVAILABLE_ROLES.map((role) => {
                    const isChecked = formData.roles.includes(role.value);
                    return (
                      <label
                        key={role.value}
                        className={`flex items-center gap-2 p-2 rounded border-2 cursor-pointer text-xs font-mono font-bold transition-all ${
                          isChecked
                            ? "bg-cyan-100 border-slate-900 text-slate-900"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleRoleToggle(role.value)}
                          className="w-4 h-4 rounded border-slate-900 text-cyan-600 focus:ring-cyan-400"
                        />
                        <span>{role.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border-2 border-slate-900 hover:bg-slate-200"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-cyan-400 text-xs font-mono font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,243,255,1)] hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? "UPDATE USER" : "SAVE USER"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}