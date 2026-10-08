"use client";

import { useState, useEffect } from "react";
import { UserPlus, Pencil, Trash2, ShieldCheck, Loader2, X } from "lucide-react";

export type UserRole = string;

interface RoleOption {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

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
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
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
      const [resUsers, resDepts, resRoles] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/departments"),
        fetch("/api/setup/saa-roles"),
      ]);

      if (resRoles.ok) setAvailableRoles(await resRoles.json());

      let fetchedDepts: Department[] = [];
      if (resDepts.ok) {
        fetchedDepts = await resDepts.json();
        setDepartments(fetchedDepts);
      }

      if (resUsers.ok) {
        const userData = await resUsers.json();

        const normalizedUsers = userData.map((u: any) => {
          let resolvedDeptId = u.departmentId || "";

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

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);

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

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      const currentRoles = prev.roles;
      let updatedRoles: string[];

      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) return prev;
        updatedRoles = currentRoles.filter((r) => r !== role);
      } else {
        updatedRoles = [...currentRoles, role];
      }

      return { ...prev, roles: updatedRoles };
    });
  };

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

  const renderRoleBadges = (roles: UserRole[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => {
          const roleOption = availableRoles.find((option) => option.code === role);
          const badgeClass = role === "ADMIN"
            ? "bg-rose-50 text-rose-600 border-rose-100"
            : role === "HOD"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-indigo-50 text-[#5C61F4] border-indigo-100";
          return (
            <span key={role} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
              {roleOption?.name || role}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            User Management & Approval Mapping
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Atur Departemen, Tambah User, dan tetapkan Multi-Role Approval untuk
            alur persetujuan SAA.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-soft transition-all active:scale-[0.99] whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 pl-6">USER / EMAIL</th>
                <th className="p-4">POSITION</th>
                <th className="p-4">ASSIGNED DEPARTMENT</th>
                <th className="p-4">APPROVAL ROLES</th>
                <th className="p-4 text-center pr-6">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5C61F4]" />
                    <span>Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    Belum ada data user. Klik Tambah User Baru untuk menambah.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const currentDeptVal = user.departmentId || "";
                  const matchedDept = departments.find(
                    (d) => d.id === currentDeptVal || d.name === currentDeptVal
                  );
                  const selectedTableVal = matchedDept ? matchedDept.id : currentDeptVal;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800">
                          {user.name}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400">
                          {user.email}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {user.position || "-"}
                      </td>
                      <td className="p-4">
                        <select
                          value={selectedTableVal}
                          onChange={(e) =>
                            handleDepartmentChange(user.id, e.target.value)
                          }
                          className="px-3.5 py-2 border border-slate-200 rounded-2xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="">-- UNASSIGNED --</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">{renderRoleBadges(user.roles)}</td>
                      <td className="p-4 text-center pr-6">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-slate-500 hover:text-[#5C61F4] rounded-xl hover:bg-slate-100 transition"
                            title="Edit User"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUser(user.id, user.name)
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
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
      <div className="bg-indigo-50/60 border border-indigo-100 p-5 rounded-3xl text-xs space-y-2">
        <div className="font-extrabold text-[#5C61F4] flex items-center gap-2 uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4 text-[#5C61F4]" />
          Multi-Role Approval Mapping:
        </div>
        <p className="text-slate-600 font-medium leading-relaxed">
          Satu akun dapat memegang beberapa peran sekaligus (contoh: seseorang
          bisa menjabat sebagai <strong>HOD</strong> sekaligus{" "}
          <strong>FINANCE LEADER</strong> atau <strong>IT</strong> dan{" "}
          <strong>ADMIN</strong>).
        </p>
      </div>

      {/* MODAL FORM ADD / EDIT USER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-white p-6 flex justify-between items-center border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NAMA LENGKAP *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Achmad R. Alvan"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-bold bg-white text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  APPROVAL ROLES (BISA PILIH LEBIH DARI 1) *
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  {availableRoles.map((role) => {
                    const isChecked = formData.roles.includes(role.code);
                    return (
                      <label
                        key={role.code}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                          isChecked
                            ? "bg-indigo-50 border-indigo-200 text-[#5C61F4]"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleRoleToggle(role.code)}
                          className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                        />
                        <span>{role.name} ({role.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C61F4] hover:bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-soft transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingUser ? "Simpan Perubahan" : "Simpan User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}