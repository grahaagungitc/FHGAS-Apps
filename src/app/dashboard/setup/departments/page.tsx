"use client";

import { useState, useEffect } from "react";
import { Building, Plus, Trash2, Loader2, X } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code?: string | null;
}

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        console.error("Gagal mengambil data departemen");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput) return;

    setSaving(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput,
          code: codeInput.toUpperCase() || nameInput.substring(0, 3).toUpperCase(),
        }),
      });

      if (res.ok) {
        setNameInput("");
        setCodeInput("");
        setIsModalOpen(false);
        fetchDepartments();
      } else {
        const err = await res.json();
        alert(`Gagal menambah departemen: ${err.message || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus departemen "${name}"?`)) return;

    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDepartments(departments.filter((d) => d.id !== id));
        alert("Departemen berhasil dihapus.");
      } else {
        const err = await res.json();
        alert(`Gagal menghapus: ${err.message || "Departemen mungkin masih digunakan oleh user"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan server.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4] shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Department Management
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Kelola daftar departemen untuk opsi dropdown seluruh form dan hirarki approval.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-soft transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Departemen</span>
        </button>
      </div>

      {/* Tabel Department */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="p-4 pl-6">KODE</th>
              <th className="p-4">NAMA DEPARTEMEN</th>
              <th className="p-4 text-center pr-6">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-12 text-center text-slate-400 font-medium">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5C61F4]" />
                  <span>Memuat data departemen...</span>
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-12 text-center text-slate-400 font-medium">
                  Belum ada data departemen. Klik Tambah Departemen untuk menambah.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 pl-6 font-bold text-[#5C61F4]">{dept.code || "-"}</td>
                  <td className="p-4 font-bold text-slate-800">{dept.name}</td>
                  <td className="p-4 text-center pr-6">
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add Department */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-soft-lg space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-800 text-base">Tambah Departemen Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">KODE DEPARTEMEN *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: FO, HK, FIN"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">NAMA DEPARTEMEN *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Front Office"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl bg-[#5C61F4] hover:bg-indigo-600 text-white shadow-soft transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}