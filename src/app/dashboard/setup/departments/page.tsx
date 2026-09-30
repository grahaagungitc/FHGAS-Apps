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

  // 1. Load Data dari Database saat komponen pertama kali dimuat
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

  // 2. Tambah Departemen ke Database via API POST
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
        // Refresh data dari database
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

  // 3. Hapus Departemen dari Database via API DELETE
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
      <div className="flex justify-between items-center bg-white border-2 border-slate-900 p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <Building className="w-6 h-6 text-cyan-600" />
            DEPARTMENT MANAGEMENT
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Kelola daftar departemen untuk opsi dropdown seluruh form dan hirarki approval.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-cyan-400 font-bold text-xs px-4 py-2.5 rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,243,255,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
        >
          <Plus className="w-4 h-4" />
          <span>ADD DEPARTMENT</span>
        </button>
      </div>

      {/* Tabel Department */}
      <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-mono text-xs border-b-2 border-slate-900">
              <th className="p-3 border-r border-slate-700">CODE</th>
              <th className="p-3 border-r border-slate-700">DEPARTMENT NAME</th>
              <th className="p-3 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100 text-xs font-medium">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500 font-mono">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                  <span>Memuat data departemen...</span>
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500 font-mono">
                  Belum ada data departemen. Klik ADD DEPARTMENT untuk menambah.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-cyan-700">{dept.code || "-"}</td>
                  <td className="p-3 font-bold text-slate-800">{dept.name}</td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 bg-red-100 text-red-700 border border-red-500 rounded hover:bg-red-200"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-slate-900 rounded-xl p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
              <h3 className="font-black text-sm uppercase">TAMBAH DEPARTEMEN BARU</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold mb-1">KODE DEPARTEMEN *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: FO, HK, FIN"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full p-2 border-2 border-slate-900 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold mb-1">NAMA DEPARTEMEN *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Front Office"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-2 border-2 border-slate-900 rounded text-xs font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border-2 border-slate-900 rounded bg-white hover:bg-slate-100"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-2 border-slate-900 rounded bg-slate-900 text-cyan-400 shadow-[2px_2px_0px_0px_rgba(0,243,255,1)] disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>SIMPAN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}