"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Settings2 } from "lucide-react";

interface FieldConfig {
  id?: string;
  fieldKey: string;
  label: string;
  fieldType: "TEXT" | "CHECKBOX" | "SELECT" | "TEXTAREA" | "NUMBER" | "RADIO";
  section: "GENERAL" | "ACTION" | "DETAIL";
  options?: string[];
  isRequired: boolean;
  order: number;
}

interface ApprovalStepConfig {
  id?: string;
  step: number;
  role: "HOD" | "FO_LEADER" | "FINANCE_LEADER" | "HOTEL_MANAGER" | "IT_VERIFICATION";
  label: string;
}

interface SaaFormConfig {
  id?: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  fields: FieldConfig[];
  approvalSteps: ApprovalStepConfig[];
}

export default function SaaConfigPage() {
  const [configs, setConfigs] = useState<SaaFormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepConfig[]>([]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/saa-config");
      const data = await res.json();
      if (Array.isArray(data)) setConfigs(data);
    } catch (err) {
      console.error("Gagal memuat konfigurasi SAA", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (config: SaaFormConfig) => {
    setEditingId(config.id || null);
    setCode(config.code);
    setName(config.name);
    setDescription(config.description || "");
    setIsActive(config.isActive);
    setFields(config.fields || []);
    setApprovalSteps(config.approvalSteps || []);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setName("");
    setDescription("");
    setIsActive(true);
    setFields([]);
    setApprovalSteps([]);
  };

  // Field Handlers
  const addField = () => {
    setFields([
      ...fields,
      {
        fieldKey: "",
        label: "",
        fieldType: "TEXT",
        section: "DETAIL",
        isRequired: false,
        order: fields.length + 1,
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Approval Handlers
  const addApprovalStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      {
        step: approvalSteps.length + 1,
        role: "HOD",
        label: "Department Head Approval",
      },
    ]);
  };

  const removeApprovalStep = (index: number) => {
    const updated = approvalSteps.filter((_, i) => i !== index);
    setApprovalSteps(
      updated.map((step, idx) => ({ ...step, step: idx + 1 }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const url = "/api/setup/saa-config";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      id: editingId,
      code,
      name,
      description,
      isActive,
      fields,
      approvalSteps,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Konfigurasi SAA berhasil ${isEdit ? "diperbarui" : "disimpan"}!`);
        setIsModalOpen(false);
        resetForm();
        fetchConfigs();
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.message}`);
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Apakah Anda yakin ingin menghapus konfigurasi ini?")) return;

    try {
      const res = await fetch(`/api/setup/saa-config?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Konfigurasi berhasil dihapus.");
        fetchConfigs();
      } else {
        const errData = await res.json();
        alert(`Gagal menghapus: ${errData.message}`);
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus data.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-blue-600" />
            SAA Form Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Kelola tipe SAA, field isian form, dan alur bertingkat approval.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition"
        >
          <Plus size={16} /> Tambah Tipe SAA
        </button>
      </div>

      {/* Grid List Tipe SAA */}
      {loading ? (
        <p className="text-slate-500 text-sm">Memuat data konfigurasi...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((config) => (
            <div
              key={config.id}
              className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">
                    {config.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {config.isActive ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {config.name}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {config.description || "-"}
                </p>

                <div className="pt-2 border-t text-xs text-slate-500 space-y-1">
                  <div>
                    <strong className="text-slate-700">Jumlah Field:</strong>{" "}
                    {config.fields?.length || 0} Kolom
                  </div>
                  <div>
                    <strong className="text-slate-700">Alur Approval:</strong>{" "}
                    {config.approvalSteps?.length || 0} Step
                  </div>
                </div>
              </div>

              {/* Action Buttons (Edit & Delete) */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(config)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Konfigurasi SAA" : "Pengaturan Tipe SAA Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Info Utama */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KODE TIPE (Unik)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PMS"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NAMA FORM SAA
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PMS ACCESS"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DESKRIPSI
                  </label>
                  <textarea
                    placeholder="Contoh: Create / Modify / Suspend PMS User Account"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-slate-700">
                    Aktifkan Form Ini
                  </label>
                </div>
              </div>

              {/* Dynamic Field Builder */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800">
                    1. Field & Modification Checklist
                  </h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1 font-semibold"
                  >
                    <Plus size={14} /> Tambah Field
                  </button>
                </div>

                {fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-slate-50 grid grid-cols-12 gap-2 items-center"
                  >
                    {/* Key */}
                    <input
                      type="text"
                      placeholder="Key (misal: vhpUserId)"
                      value={field.fieldKey}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].fieldKey = e.target.value;
                        setFields(updated);
                      }}
                      className="col-span-2 border rounded p-1.5 text-xs bg-white font-mono"
                      required
                    />

                    {/* Label */}
                    <input
                      type="text"
                      placeholder="Label Tampilan"
                      value={field.label}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].label = e.target.value;
                        setFields(updated);
                      }}
                      className="col-span-3 border rounded p-1.5 text-xs bg-white"
                      required
                    />

                    {/* Type */}
                    <select
                      value={field.fieldType}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].fieldType = e.target.value as any;
                        setFields(updated);
                      }}
                      className="col-span-2 border rounded p-1.5 text-xs bg-white"
                    >
                      <option value="TEXT">Input Text</option>
                      <option value="CHECKBOX">Checkbox Option</option>
                      <option value="SELECT">Dropdown Select</option>
                      <option value="TEXTAREA">Textarea</option>
                      <option value="NUMBER">Number</option>
                      <option value="RADIO">Radio Options</option>
                    </select>

                    {/* Section */}
                    <select
                      value={field.section || "DETAIL"}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].section = e.target.value as any;
                        setFields(updated);
                      }}
                      className="col-span-3 border rounded p-1.5 text-xs bg-white font-semibold text-blue-700"
                    >
                      <option value="GENERAL">Section 1: Request By</option>
                      <option value="ACTION">Section 2: Access Requested</option>
                      <option value="DETAIL">Section 3: Access Details</option>
                    </select>

                    {/* Order & Remove */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={field.order ?? idx + 1}
                        onChange={(e) => {
                          const updated = [...fields];
                          updated[idx].order = Number(e.target.value);
                          setFields(updated);
                        }}
                        className="w-12 border rounded p-1 text-xs text-center bg-white"
                        title="Urutan Tampilan"
                      />
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {(field.fieldType === "SELECT" || field.fieldType === "RADIO") && (
                      <input
                        type="text"
                        value={(field.options || []).join(", ")}
                        onChange={(e) => {
                          const updated = [...fields];
                          updated[idx].options = e.target.value
                            .split(",")
                            .map((option) => option.trim())
                            .filter(Boolean);
                          setFields(updated);
                        }}
                        placeholder="Pilihan, dipisahkan koma"
                        className="col-span-12 border rounded p-1.5 text-xs bg-white"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Approval Workflow Builder */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800">
                    2. Urutan Approver (Approval Workflow)
                  </h3>
                  <button
                    type="button"
                    onClick={addApprovalStep}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1 font-semibold"
                  >
                    <Plus size={14} /> Tambah Step Approval
                  </button>
                </div>

                {approvalSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-slate-50 flex items-center gap-3"
                  >
                    <span className="text-xs font-bold w-12 text-slate-500">
                      Step {step.step}
                    </span>
                    <select
                      value={step.role}
                      onChange={(e) => {
                        const updated = [...approvalSteps];
                        updated[idx].role = e.target.value as any;
                        setApprovalSteps(updated);
                      }}
                      className="border rounded p-1.5 text-xs bg-white flex-1"
                    >
                      <option value="HOD">Department Head (HOD)</option>
                      <option value="FO_LEADER">Front Office Leader</option>
                      <option value="FINANCE_LEADER">Finance Leader</option>
                      <option value="HOTEL_MANAGER">Hotel Manager</option>
                      <option value="IT_VERIFICATION">IT Verification</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Label Step"
                      value={step.label}
                      onChange={(e) => {
                        const updated = [...approvalSteps];
                        updated[idx].label = e.target.value;
                        setApprovalSteps(updated);
                      }}
                      className="border rounded p-1.5 text-xs bg-white flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeApprovalStep(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Konfigurasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}