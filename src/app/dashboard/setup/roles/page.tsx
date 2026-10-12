"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sliders,
  Layers,
  Lock,
  Unlock,
  Save,
  Check,
  Search,
  AlertCircle,
  HelpCircle,
  FolderPlus,
  Info,
} from "lucide-react";

interface SystemRole {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
}

interface AppModule {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  path?: string | null;
  isSystem: boolean;
}

interface RolePermission {
  id: string;
  roleId: string;
  moduleId: string;
  accessLevel: "NONE" | "READ_ONLY" | "READ_WRITE" | "FULL_ACCESS";
  canApprove: boolean;
  role?: SystemRole;
  module?: AppModule;
}

const ACCESS_LEVELS = [
  { value: "NONE", label: "No Access", color: "bg-slate-100 text-slate-400 border-slate-200" },
  { value: "READ_ONLY", label: "Read Only", color: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" },
  { value: "READ_WRITE", label: "Read / Write", color: "bg-indigo-50 text-[#5C61F4] border-indigo-200 font-bold" },
  { value: "FULL_ACCESS", label: "Full Access", color: "bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold" },
] as const;

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [modules, setModules] = useState<AppModule[]>([]);
  // Key: `${roleId}_${moduleId}` => { accessLevel, canApprove }
  const [matrix, setMatrix] = useState<Record<string, { accessLevel: string; canApprove: boolean }>>({});
  const [initialMatrix, setInitialMatrix] = useState<Record<string, { accessLevel: string; canApprove: boolean }>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"matrix" | "roles" | "modules">("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Drag-to-scroll ref & states for horizontal matrix table
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking on select/checkbox/input/button
    const target = e.target as HTMLElement;
    if (["SELECT", "INPUT", "BUTTON", "LABEL"].includes(target.tagName) || target.closest("select, input, button, label")) {
      return;
    }
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = "grabbing";
    scrollContainerRef.current.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // multiplier for smooth feel
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "default";
      scrollContainerRef.current.style.removeProperty("user-select");
    }
  };

  // Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
  const [roleForm, setRoleForm] = useState({ code: "", name: "", description: "" });

  // Module Modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AppModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ code: "", name: "", category: "General", description: "", path: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/roles-permissions");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setModules(data.modules || []);

        const matrixMap: Record<string, { accessLevel: string; canApprove: boolean }> = {};
        if (Array.isArray(data.permissions)) {
          data.permissions.forEach((p: RolePermission) => {
            matrixMap[`${p.roleId}_${p.moduleId}`] = {
              accessLevel: p.accessLevel || "NONE",
              canApprove: Boolean(p.canApprove),
            };
          });
        }
        setMatrix(matrixMap);
        setInitialMatrix(JSON.parse(JSON.stringify(matrixMap)));
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPermission = (roleId: string, moduleId: string) => {
    return matrix[`${roleId}_${moduleId}`] || { accessLevel: "NONE", canApprove: false };
  };

  const handleAccessChange = (roleId: string, moduleId: string, accessLevel: string) => {
    setMatrix((prev) => {
      const current = prev[`${roleId}_${moduleId}`] || { accessLevel: "NONE", canApprove: false };
      return {
        ...prev,
        [`${roleId}_${moduleId}`]: {
          ...current,
          accessLevel,
        },
      };
    });
  };

  const handleApproveChange = (roleId: string, moduleId: string, canApprove: boolean) => {
    setMatrix((prev) => {
      const current = prev[`${roleId}_${moduleId}`] || { accessLevel: "NONE", canApprove: false };
      return {
        ...prev,
        [`${roleId}_${moduleId}`]: {
          ...current,
          canApprove,
        },
      };
    });
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      const permissionsToSave = [];

      for (const role of roles) {
        for (const mod of modules) {
          const key = `${role.id}_${mod.id}`;
          const current = matrix[key] || { accessLevel: "NONE", canApprove: false };
          const initial = initialMatrix[key] || { accessLevel: "NONE", canApprove: false };

          // Check if changed
          if (
            current.accessLevel !== initial.accessLevel ||
            current.canApprove !== initial.canApprove
          ) {
            permissionsToSave.push({
              roleId: role.id,
              moduleId: mod.id,
              accessLevel: current.accessLevel,
              canApprove: current.canApprove,
            });
          }
        }
      }

      if (permissionsToSave.length === 0) {
        alert("Tidak ada perubahan yang perlu disimpan.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/setup/roles-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsToSave }),
      });

      if (res.ok) {
        alert("Konfigurasi Hak Akses & Matriks Permission berhasil disimpan!");
        setInitialMatrix(JSON.parse(JSON.stringify(matrix)));
      } else {
        const err = await res.json();
        alert(`Gagal menyimpan: ${err.message || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  // Role CRUD Handlers
  const handleOpenRoleModal = (role?: SystemRole) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ code: role.code, name: role.name, description: role.description || "" });
    } else {
      setEditingRole(null);
      setRoleForm({ code: "", name: "", description: "" });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/setup/saa-roles";
      const method = editingRole ? "PUT" : "POST";
      const payload = editingRole
        ? { id: editingRole.id, name: roleForm.name, description: roleForm.description }
        : roleForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsRoleModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role "${name}"?`)) return;
    try {
      const res = await fetch(`/api/setup/saa-roles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  // Module CRUD Handlers
  const handleOpenModuleModal = (mod?: AppModule) => {
    if (mod) {
      setEditingModule(mod);
      setModuleForm({
        code: mod.code,
        name: mod.name,
        category: mod.category,
        description: mod.description || "",
        path: mod.path || "",
      });
    } else {
      setEditingModule(null);
      setModuleForm({
        code: "",
        name: "",
        category: "General",
        description: "",
        path: "",
      });
    }
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = editingModule ? "UPDATE_MODULE" : "CREATE_MODULE";
      const payload = editingModule
        ? { action, id: editingModule.id, ...moduleForm }
        : { action, ...moduleForm };

      const res = await fetch("/api/setup/roles-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModuleModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const handleDeleteModule = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus modul "${name}"?`)) return;
    try {
      const res = await fetch("/api/setup/roles-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_MODULE", id }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  // Filtered modules
  const categories = Array.from(new Set(modules.map((m) => m.category)));
  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const hasUnsavedChanges = JSON.stringify(matrix) !== JSON.stringify(initialMatrix);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Banner */}
      <header className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#5C61F4] rounded-2xl flex items-center justify-center text-white shadow-soft">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Roles & Permission Matrix
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Atur hak akses tiap Role ke modul/menu sistem (Read, Write, Full Access, Approval) via GUI
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 animate-pulse flex items-center gap-1.5">
              <AlertCircle size={14} /> Ada perubahan belum disimpan
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-[#5C61F4] text-white hover:bg-indigo-600 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-soft transition disabled:opacity-40"
          >
            <Save size={16} />
            {saving ? "Menyimpan..." : "Simpan Perubahan Matrix"}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "matrix"
                ? "border-[#5C61F4] text-[#5C61F4]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sliders size={15} />
            Matriks Hak Akses Modul
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "roles"
                ? "border-[#5C61F4] text-[#5C61F4]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldCheck size={15} />
            Kelola Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "modules"
                ? "border-[#5C61F4] text-[#5C61F4]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Layers size={15} />
            Daftar Modul & Menu ({modules.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PERMISSION MATRIX */}
      {activeTab === "matrix" && (
        <div className="space-y-4 w-full">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-soft flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari modul atau menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Legend & Drag hint */}
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 font-normal">
                🖱️ <em>Klik & geser (drag) mouse atau gunakan scroll horizontal</em>
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> None</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Read</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Read/Write</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Full Access</span>
              </div>
            </div>
          </div>

          {/* Matrix Table with Drag-to-Scroll Container */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden w-full">
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="overflow-x-auto select-none cursor-grab active:cursor-grabbing transition-colors"
            >
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold uppercase text-slate-500">
                    <th className="py-4 px-5 sticky left-0 bg-slate-50 z-20 min-w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      Modul / Menu Sistem
                    </th>
                    <th className="py-4 px-3 w-32">Kategori</th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className="py-4 px-4 text-center min-w-[155px] border-l border-slate-100"
                      >
                        <div className="font-extrabold text-slate-800 text-xs">{role.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">{role.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredModules.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Module Info Column */}
                      <td className="py-3.5 px-5 sticky left-0 bg-white hover:bg-slate-50/60 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        <div className="font-bold text-slate-800 text-xs">{mod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{mod.code} {mod.path ? `· ${mod.path}` : ""}</div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {mod.category}
                        </span>
                      </td>

                      {/* Role Columns Matrix */}
                      {roles.map((role) => {
                        const perm = getPermission(role.id, mod.id);
                        return (
                          <td
                            key={role.id}
                            className="py-3 px-3 text-center border-l border-slate-100"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              {/* Access Level Selector */}
                              <select
                                value={perm.accessLevel}
                                onChange={(e) => handleAccessChange(role.id, mod.id, e.target.value)}
                                className={`text-[11px] px-2.5 py-1 rounded-xl border text-center cursor-pointer transition-all focus:outline-none ${
                                  ACCESS_LEVELS.find((l) => l.value === perm.accessLevel)?.color || "bg-white"
                                }`}
                              >
                                {ACCESS_LEVELS.map((lvl) => (
                                  <option key={lvl.value} value={lvl.value}>
                                    {lvl.label}
                                  </option>
                                ))}
                              </select>

                              {/* Approver Checkbox */}
                              <label
                                className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer select-none transition-opacity ${
                                  perm.accessLevel === "NONE" ? "opacity-30 pointer-events-none" : "opacity-100 text-slate-600"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={perm.canApprove}
                                  disabled={perm.accessLevel === "NONE"}
                                  onChange={(e) => handleApproveChange(role.id, mod.id, e.target.checked)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                                />
                                Approver
                              </label>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredModules.length === 0 && (
                    <tr>
                      <td colSpan={roles.length + 2} className="text-center py-10 text-xs font-semibold text-slate-400">
                        Tidak ada modul yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES MANAGEMENT (COMPACT TABLE/LIST VIEW) */}
      {activeTab === "roles" && (
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              Daftar seluruh Role sistem. Anda dapat menambah, mengedit, atau menghapus role secara langsung di tabel ini.
            </p>
            <button
              type="button"
              onClick={() => handleOpenRoleModal()}
              className="flex items-center gap-2 bg-[#5C61F4] text-white hover:bg-indigo-600 px-4 py-2 rounded-2xl text-xs font-bold shadow-soft transition"
            >
              <Plus size={16} /> Tambah Role Baru
            </button>
          </div>

          {/* Table List View */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Kode Role</th>
                    <th className="py-3.5 px-4">Nama Role</th>
                    <th className="py-3.5 px-4">Deskripsi / Wewenang</th>
                    <th className="py-3.5 px-4 text-center">Tipe Role</th>
                    <th className="py-3.5 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-5 font-mono font-bold text-indigo-600">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100">
                          {role.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{role.name}</td>
                      <td className="py-3 px-4 text-slate-500">{role.description || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        {role.isSystem ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            System Default
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Custom Role
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(role)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                            title="Edit Role"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!role.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role.id, role.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                              title="Hapus Role"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-xs font-semibold text-slate-400">
                        Belum ada data Role.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODULES MANAGEMENT */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              Daftar seluruh menu dan modul sistem. Anda dapat mendaftarkan modul baru secara GUI kapan saja.
            </p>
            <button
              type="button"
              onClick={() => handleOpenModuleModal()}
              className="flex items-center gap-2 bg-[#5C61F4] text-white hover:bg-indigo-600 px-4 py-2 rounded-2xl text-xs font-bold shadow-soft transition"
            >
              <FolderPlus size={16} /> Tambah Modul Baru
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Kode Modul</th>
                    <th className="py-3.5 px-4">Nama Modul</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Path URL</th>
                    <th className="py-3.5 px-4">Deskripsi</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{m.name}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-[#5C61F4]">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{m.path || "-"}</td>
                      <td className="py-3 px-4 text-slate-500">{m.description || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenModuleModal(m)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!m.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteModule(m.id, m.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ROLE */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b border-slate-100 pb-3">
              {editingRole ? "Edit Role" : "Tambah Role Baru"}
            </h3>
            <form onSubmit={handleSaveRole} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">KODE ROLE *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingRole)}
                  value={roleForm.code}
                  onChange={(e) =>
                    setRoleForm({
                      ...roleForm,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                    })
                  }
                  placeholder="Contoh: CASHIER"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NAMA ROLE *</label>
                <input
                  type="text"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Contoh: Front Office Cashier"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DESKRIPSI</label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Wewenang atau deskripsi peran..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C61F4] text-white rounded-xl font-bold shadow-soft hover:bg-indigo-600"
                >
                  Simpan Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODULE */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b border-slate-100 pb-3">
              {editingModule ? "Edit Modul Sistem" : "Tambah Modul / Menu Baru"}
            </h3>
            <form onSubmit={handleSaveModule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">KODE MODUL *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingModule)}
                  value={moduleForm.code}
                  onChange={(e) =>
                    setModuleForm({
                      ...moduleForm,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                    })
                  }
                  placeholder="Contoh: FO_REMITTANCE"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NAMA MODUL / MENU *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  placeholder="Contoh: Front Desk Remittance"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">KATEGORI *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.category}
                  onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}
                  placeholder="Contoh: Front Office, Finance, IT, System Setup"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PATH URL (OPSIONAL)</label>
                <input
                  type="text"
                  value={moduleForm.path}
                  onChange={(e) => setModuleForm({ ...moduleForm, path: e.target.value })}
                  placeholder="/dashboard/departments/fo/front-desk"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DESKRIPSI (OPSIONAL)</label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Fungsi dan wewenang modul..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C61F4] text-white rounded-xl font-bold shadow-soft hover:bg-indigo-600"
                >
                  Simpan Modul
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

