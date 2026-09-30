"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Database, CheckSquare, ShieldCheck, ListFilter } from "lucide-react";

interface SaaFormConfigOption {
  id: string;
  code: string;
  name: string;
}

interface MasterField {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  section: string;
  options?: string[] | string | null;
  isRequired: boolean;
  assignedForms: { formConfig: SaaFormConfigOption }[];
}

interface MasterStep {
  id: string;
  role: string;
  label: string;
  assignedForms: { formConfig: SaaFormConfigOption }[];
}

export default function SaaMasterFieldsPage() {
  const [activeTab, setActiveTab] = useState<"fields" | "approvers">("fields");
  const [fields, setFields] = useState<MasterField[]>([]);
  const [steps, setSteps] = useState<MasterStep[]>([]);
  const [formConfigs, setFormConfigs] = useState<SaaFormConfigOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Field Form States
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [fieldOptions, setFieldOptions] = useState("");
  const [section, setSection] = useState("DETAIL");
  const [isRequired, setIsRequired] = useState(false);

  // Approver Form States
  const [stepRole, setStepRole] = useState("HOD");
  const [stepLabel, setStepLabel] = useState("");

  // Shared Assignment State
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFields, resSteps, resConfigs] = await Promise.all([
        fetch("/api/setup/saa-fields"),
        fetch("/api/setup/saa-steps"),
        fetch("/api/setup/saa-config"),
      ]);

      const fieldsData = await resFields.json();
      const stepsData = await resSteps.json();
      const configsData = await resConfigs.json();

      if (fieldsData.fields) setFields(fieldsData.fields);
      if (Array.isArray(stepsData)) setSteps(stepsData);
      if (Array.isArray(configsData)) setFormConfigs(configsData);
    } catch (err) {
      console.error("Gagal memuat Master Repository Data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFormAssignment = (formId: string) => {
    if (selectedFormIds.includes(formId)) {
      setSelectedFormIds(selectedFormIds.filter((id) => id !== formId));
    } else {
      setSelectedFormIds([...selectedFormIds, formId]);
    }
  };

  // --- FIELD HANDLERS ---
  const handleOpenFieldModal = (item?: MasterField) => {
    if (item) {
      setEditingId(item.id);
      setFieldKey(item.fieldKey);
      setFieldLabel(item.label);
      setFieldType(item.fieldType);
      const rawOptions = item.options;
      if (Array.isArray(rawOptions)) setFieldOptions(rawOptions.join(", "));
      else if (typeof rawOptions === "string") {
        try {
          const parsedOptions = JSON.parse(rawOptions);
          setFieldOptions(Array.isArray(parsedOptions) ? parsedOptions.join(", ") : rawOptions);
        } catch {
          setFieldOptions(rawOptions);
        }
      } else setFieldOptions("");
      setSection(item.section || "DETAIL");
      setIsRequired(item.isRequired);
      setSelectedFormIds(item.assignedForms.map((af) => af.formConfig.id));
    } else {
      setEditingId(null);
      setFieldKey("");
      setFieldLabel("");
      setFieldType("TEXT");
      setFieldOptions("");
      setSection("DETAIL");
      setIsRequired(false);
      setSelectedFormIds([]);
    }
    setIsFieldModalOpen(true);
  };

  const handleSubmitField = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const payload = {
      id: editingId,
      fieldKey,
      label: fieldLabel,
      fieldType,
      options: fieldOptions.split(",").map((option) => option.trim()).filter(Boolean),
      section,
      isRequired,
      assignedFormIds: selectedFormIds,
    };

    try {
      const res = await fetch("/api/setup/saa-fields", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFieldModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat menyimpan field.");
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("Hapus Master Field ini?")) return;
    await fetch(`/api/setup/saa-fields?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // --- APPROVER HANDLERS ---
  const handleOpenStepModal = (item?: MasterStep) => {
    if (item) {
      setEditingId(item.id);
      setStepRole(item.role);
      setStepLabel(item.label);
      setSelectedFormIds(item.assignedForms.map((af) => af.formConfig.id));
    } else {
      setEditingId(null);
      setStepRole("HOD");
      setStepLabel("");
      setSelectedFormIds([]);
    }
    setIsStepModalOpen(true);
  };

  const handleSubmitStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const payload = {
      id: editingId,
      role: stepRole,
      label: stepLabel,
      assignedFormIds: selectedFormIds,
    };

    try {
      const res = await fetch("/api/setup/saa-steps", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsStepModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat menyimpan approver step.");
    }
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm("Hapus Master Approver Step ini?")) return;
    await fetch(`/api/setup/saa-steps?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Master Repository SAA
          </h1>
          <p className="text-sm text-slate-500">
            Kelola Master Field Isian Form dan Master Alur Approver terpusat.
          </p>
        </div>

        {activeTab === "fields" ? (
          <button
            onClick={() => handleOpenFieldModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition"
          >
            <Plus size={16} /> Tambah Master Field
          </button>
        ) : (
          <button
            onClick={() => handleOpenStepModal()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition"
          >
            <Plus size={16} /> Tambah Master Approver
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("fields")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === "fields"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListFilter size={16} /> Master Fields ({fields.length})
        </button>
        <button
          onClick={() => setActiveTab("approvers")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === "approvers"
              ? "border-cyan-600 text-cyan-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck size={16} /> Master Approvers / Steps ({steps.length})
        </button>
      </div>

      {/* TAB 1: MASTER FIELDS TABLE */}
      {activeTab === "fields" && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Key ID</th>
                <th className="p-4">Label Field</th>
                <th className="p-4">Tipe Input</th>
                <th className="p-4">Section</th>
                <th className="p-4">Assigned SAA Forms</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Memuat data master...
                  </td>
                </tr>
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Belum ada Master Field. Klik &apos;Tambah Master Field&apos;.
                  </td>
                </tr>
              ) : (
                fields.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-800">
                      {item.fieldKey}
                    </td>
                    <td className="p-4 font-medium text-slate-900">{item.label}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700 font-medium">
                        {item.fieldType}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-blue-600">
                      {item.section}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.assignedForms?.map((af, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold"
                          >
                            {af.formConfig.code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenFieldModal(item)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 rounded-md hover:bg-slate-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteField(item.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 rounded-md hover:bg-slate-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MASTER APPROVERS TABLE */}
      {activeTab === "approvers" && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Role Code</th>
                <th className="p-4">Label Approver / Step Name</th>
                <th className="p-4">Assigned SAA Forms</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    Memuat data master approver...
                  </td>
                </tr>
              ) : steps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    Belum ada Master Approver. Klik &apos;Tambah Master Approver&apos;.
                  </td>
                </tr>
              ) : (
                steps.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono text-xs font-bold text-cyan-800">
                      <span className="px-2 py-1 bg-cyan-50 border border-cyan-200 rounded">
                        {item.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{item.label}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.assignedForms?.map((af, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded text-xs font-semibold"
                          >
                            {af.formConfig.code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenStepModal(item)}
                          className="p-1.5 text-slate-600 hover:text-cyan-600 rounded-md hover:bg-slate-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(item.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 rounded-md hover:bg-slate-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: FIELD FORM */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
              {editingId ? "Edit Master Field" : "Tambah Master Field Baru"}
            </h2>

            <form onSubmit={handleSubmitField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  FIELD KEY (Unik)
                </label>
                <input
                  type="text"
                  placeholder="Misal: idName, idPosition"
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LABEL TAMPILAN
                </label>
                <input
                  type="text"
                  placeholder="Misal: Name, Position"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    TIPE INPUT
                  </label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="TEXT">Input Text</option>
                    <option value="CHECKBOX">Checkbox Option</option>
                    <option value="SELECT">Dropdown Select</option>
                    <option value="TEXTAREA">Textarea</option>
                    <option value="NUMBER">Number</option>
                    <option value="RADIO">Radio Options</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SECTION
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="GENERAL">Section 1: Request By</option>
                    <option value="ACTION">Section 2: Access Requested</option>
                    <option value="DETAIL">Section 3: Access Details</option>
                  </select>
                </div>
              </div>

              {(fieldType === "SELECT" || fieldType === "RADIO") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PILIHAN (DIPISAH KOMA)
                  </label>
                  <input
                    type="text"
                    value={fieldOptions}
                    onChange={(event) => setFieldOptions(event.target.value)}
                    placeholder="Read, Write, Admin"
                    className="w-full border rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              )}

              <div className="border-t pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <CheckSquare size={14} className="text-blue-600" />
                  ASSIGN KE FORM SAA MANA SAJA:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border p-3 rounded-lg bg-slate-50">
                  {formConfigs.map((config) => (
                    <label
                      key={config.id}
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFormIds.includes(config.id)}
                        onChange={() => toggleFormAssignment(config.id)}
                        className="rounded text-blue-600"
                      />
                      {config.name} ({config.code})
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-blue-700"
                >
                  Simpan Master Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVER STEP FORM */}
      {isStepModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
              {editingId ? "Edit Master Approver Step" : "Tambah Master Approver Baru"}
            </h2>

            <form onSubmit={handleSubmitStep} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ROLE CODE / ID ROLE
                </label>
                <select
                  value={stepRole}
                  onChange={(e) => setStepRole(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-white font-mono"
                >
                  <option value="HOD">HOD (Head of Department)</option>
                  <option value="FINANCE_LEADER">FINANCE_LEADER (Finance Leader)</option>
                  <option value="HOTEL_MANAGER">HOTEL_MANAGER (Hotel Manager)</option>
                  <option value="IT_VERIFICATION">IT_VERIFICATION (IT Dept / Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LABEL APPROVER (Nama Tampilan Step)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Department Head Approval, IT Verification Step"
                  value={stepLabel}
                  onChange={(e) => setStepLabel(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div className="border-t pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <CheckSquare size={14} className="text-cyan-600" />
                  ASSIGN KE FORM SAA MANA SAJA:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border p-3 rounded-lg bg-slate-50">
                  {formConfigs.map((config) => (
                    <label
                      key={config.id}
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFormIds.includes(config.id)}
                        onChange={() => toggleFormAssignment(config.id)}
                        className="rounded text-cyan-600"
                      />
                      {config.name} ({config.code})
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsStepModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-cyan-700"
                >
                  Simpan Master Approver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}