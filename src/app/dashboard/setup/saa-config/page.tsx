"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Settings2, ArrowUp, ArrowDown, Layers3 } from "lucide-react";
import SaaMasterFieldsPage from "@/app/dashboard/setup/saa-fields/page";

interface FieldConfig {
  id?: string;
  fieldId?: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  source?: string | null;
  section: string;
  options?: string[];
  isRequired: boolean;
  order: number;
}

interface ApprovalStepConfig {
  id?: string;
  step: number;
  role: string;
  label: string;
}

interface ApprovalRoleOption {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

interface SaaFormConfig {
  id?: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  sections: string[];
  fields: FieldConfig[];
  approvalSteps: ApprovalStepConfig[];
}

type SetupTab = "forms" | "fields" | "sections" | "request-types" | "approvers" | "roles";

function parseFieldOptions(rawOptions: unknown): string[] {
  if (Array.isArray(rawOptions)) return rawOptions.map(String);
  if (typeof rawOptions !== "string" || !rawOptions) return [];

  try {
    const parsed: unknown = JSON.parse(rawOptions);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Older master fields may store options as comma-separated text.
  }

  return rawOptions.split(",").map((option) => option.trim()).filter(Boolean);
}

export default function SaaConfigPage() {
  const [activeTab, setActiveTab] = useState<SetupTab>("forms");
  const [configs, setConfigs] = useState<SaaFormConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [approvalRoles, setApprovalRoles] = useState<ApprovalRoleOption[]>([]);
  const [sectionsDraft, setSectionsDraft] = useState<string[]>([]);

  const normalizeSectionName = (section: string) => {
    const value = section.trim();
    if (!value) return "Access Details";
    if (value.toLowerCase() === "detail") return "Access Details";
    if (value.toLowerCase() === "general") return "General Information";
    if (value.toLowerCase() === "action") return "Action Requested";
    return value;
  };
  const [sectionFieldsDraft, setSectionFieldsDraft] = useState<FieldConfig[]>([]);
  const [requestTypeDrafts, setRequestTypeDrafts] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState<string[]>([]);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepConfig[]>([]);

  useEffect(() => {
    fetchConfigs();
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    const tabMap: Record<string, SetupTab> = {
      master: "fields",
      fields: "fields",
      sections: "sections",
      "request-types": "request-types",
      approvers: "approvers",
      roles: "roles",
    };
    if (tabParam && tabMap[tabParam]) {
      setActiveTab(tabMap[tabParam]);
    }
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const [res, rolesResponse] = await Promise.all([
        fetch("/api/setup/saa-config"),
        fetch("/api/setup/saa-roles"),
      ]);
      const [data, rolesData] = await Promise.all([res.json(), rolesResponse.json()]);
      if (Array.isArray(data)) {
        setConfigs(data);
        setSelectedConfigId((current) =>
          data.some((config) => config.id === current) ? current : data[0]?.id || ""
        );
      }
      if (Array.isArray(rolesData)) setApprovalRoles(rolesData.filter((role) => !role.isSystem));
    } catch (err) {
      console.error("Gagal memuat konfigurasi SAA", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedForm = configs.find((config) => config.id === selectedConfigId);

  useEffect(() => {
    const formFields = selectedForm?.fields || [];
    const normalizedSections = Array.from(
      new Set(
        [...(selectedForm?.sections || formFields.map((field) => field.section)), "Access Details"]
          .filter(Boolean)
          .map((section) => normalizeSectionName(section))
      )
    );
    setSectionsDraft(normalizedSections);
    setSectionFieldsDraft(formFields.map((field) => ({ ...field, options: parseFieldOptions(field.options) })));
    setRequestTypeDrafts(
      formFields
        .filter((field) => field.source === "REQUEST_TYPE")
        .map((field) => ({ ...field, options: parseFieldOptions(field.options) }))
    );
  }, [selectedConfigId, selectedForm?.fields, selectedForm?.sections]);

  const saveFormConfiguration = async (
    config: SaaFormConfig,
    updates: Partial<SaaFormConfig>
  ) => {
    const response = await fetch("/api/setup/saa-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, ...updates, id: config.id }),
    });
    if (!response.ok) {
      const result = await response.json();
      alert(result.message || "Gagal menyimpan konfigurasi SAA.");
      return false;
    }
    await fetchConfigs();
    return true;
  };

  const addManagedSection = () => {
    let sectionNumber = sectionsDraft.length + 1;
    let title = `Section ${sectionNumber}`;
    while (sectionsDraft.includes(title)) {
      sectionNumber += 1;
      title = `Section ${sectionNumber}`;
    }
    setSectionsDraft([...sectionsDraft, title]);
  };

  const renameManagedSection = (index: number, title: string) => {
    const previousTitle = sectionsDraft[index];
    setSectionsDraft(sectionsDraft.map((section, sectionIndex) => sectionIndex === index ? title : section));
    setSectionFieldsDraft(sectionFieldsDraft.map((field) =>
      field.section === previousTitle ? { ...field, section: title } : field
    ));
  };

  const moveManagedSection = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= sectionsDraft.length) return;
    const updated = [...sectionsDraft];
    [updated[index], updated[destination]] = [updated[destination], updated[index]];
    setSectionsDraft(updated);
  };

  const removeManagedSection = (index: number) => {
    const removedSection = sectionsDraft[index];
    const remaining = sectionsDraft.filter((_, sectionIndex) => sectionIndex !== index);
    if (remaining.length === 0 && sectionFieldsDraft.some((field) => field.section === removedSection)) {
      alert("Tambahkan section lain atau pindahkan field sebelum menghapus section ini.");
      return;
    }
    setSectionsDraft(remaining);
    setSectionFieldsDraft(sectionFieldsDraft.map((field) =>
      field.section === removedSection ? { ...field, section: remaining[0] } : field
    ));
  };

  const handleSaveManagedSections = async () => {
    if (!selectedForm) return;
    const normalizedSections = sectionsDraft.map((section) => section.trim());
    if (normalizedSections.some((section) => !section) || new Set(normalizedSections).size !== normalizedSections.length) {
      alert("Nama section wajib diisi dan harus unik.");
      return;
    }
    if (sectionFieldsDraft.some((field) => !normalizedSections.includes(field.section))) {
      alert("Pindahkan setiap field ke section yang masih tersedia.");
      return;
    }
    await saveFormConfiguration(selectedForm, {
      sections: normalizedSections,
      fields: sectionFieldsDraft,
    });
  };

  const addRequestTypeField = () => {
    if (!selectedForm) return;
    const prefix = selectedForm.code.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    let fieldKey = `${prefix}_request_type`;
    let keyIndex = 2;
    while (selectedForm.fields.some((field) => field.fieldKey === fieldKey) || requestTypeDrafts.some((field) => field.fieldKey === fieldKey)) {
      fieldKey = `${prefix}_request_type_${keyIndex}`;
      keyIndex += 1;
    }
    const section = selectedForm.sections.find((item) => item.toLowerCase().includes("action")) || selectedForm.sections[0] || "Access Details";
    setRequestTypeDrafts([
      ...requestTypeDrafts,
      {
        fieldKey,
        label: "Request Type",
        fieldType: "SELECT",
        source: "REQUEST_TYPE",
        section,
        options: [],
        isRequired: true,
        order: Math.max(0, ...selectedForm.fields.map((field) => field.order)) + requestTypeDrafts.length + 1,
      },
    ]);
  };

  const updateRequestTypeField = (index: number, updates: Partial<FieldConfig>) => {
    setRequestTypeDrafts(requestTypeDrafts.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, ...updates } : field
    ));
  };

  const saveRequestTypes = async () => {
    if (!selectedForm) return;
    if (requestTypeDrafts.some((field) => !field.label.trim() || field.options?.length === 0)) {
      alert("Setiap Request Type harus memiliki label dan minimal satu pilihan.");
      return;
    }
    const retainedFields = selectedForm.fields.filter((field) => field.source !== "REQUEST_TYPE");
    await saveFormConfiguration(selectedForm, { fields: [...retainedFields, ...requestTypeDrafts] });
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
    setSections(config.sections || [...new Set((config.fields || []).map((field) => field.section))]);
    setFields(
      (config.fields || []).map((field) => ({
        ...field,
        options: parseFieldOptions(field.options),
      }))
    );
    setApprovalSteps(config.approvalSteps || []);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setName("");
    setDescription("");
    setIsActive(true);
    setSections([]);
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
        source: "CUSTOM",
        section: sections[0] || "",
        isRequired: false,
        order: fields.length + 1,
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addSection = () => {
    let sectionNumber = sections.length + 1;
    let title = `Section ${sectionNumber}`;
    while (sections.includes(title)) {
      sectionNumber += 1;
      title = `Section ${sectionNumber}`;
    }
    setSections([...sections, title]);
  };

  const renameSection = (index: number, title: string) => {
    const previousTitle = sections[index];
    setSections(sections.map((section, sectionIndex) => sectionIndex === index ? title : section));
    setFields(fields.map((field) => field.section === previousTitle ? { ...field, section: title } : field));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[destination]] = [updated[destination], updated[index]];
    setSections(updated);
  };

  const removeSection = (index: number) => {
    const removedSection = sections[index];
    const remainingSections = sections.filter((_, sectionIndex) => sectionIndex !== index);
    if (fields.some((field) => field.section === removedSection) && remainingSections.length === 0) {
      alert("Buat section lain atau pindahkan field sebelum menghapus section ini.");
      return;
    }
    setFields(fields.map((field) =>
      field.section === removedSection ? { ...field, section: remainingSections[0] } : field
    ));
    setSections(remainingSections);
  };

  // Approval Handlers
  const addApprovalStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      {
        step: approvalSteps.length + 1,
        role: approvalRoles[0]?.code || "HOD",
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
    const normalizedSections = sections.map((section) => section.trim());
    if (normalizedSections.some((section) => !section) || new Set(normalizedSections).size !== normalizedSections.length) {
      alert("Nama section harus diisi dan tidak boleh duplikat.");
      return;
    }
    if (fields.some((field) => !normalizedSections.includes(field.section.trim()))) {
      alert("Tempatkan setiap field pada section yang tersedia.");
      return;
    }

    if (fields.some((field) => !field.fieldKey.trim() || !field.label.trim() || !field.section.trim())) {
      alert("Setiap field harus memiliki key, label, dan section.");
      return;
    }
    const fieldKeys = fields.map((field) => field.fieldKey.trim());
    if (new Set(fieldKeys).size !== fieldKeys.length) {
      alert("Setiap field dalam satu form harus memiliki key yang unik.");
      return;
    }

    const uniqueSources = ["REQUESTER_NAME", "REQUESTER_EMAIL", "DEPARTMENT", "REASON"];
    const duplicateSource = uniqueSources.find(
      (source) => fields.filter((field) => field.source === source).length > 1
    );
    if (duplicateSource) {
      alert(`Binding ${duplicateSource} hanya boleh digunakan satu kali dalam satu form.`);
      return;
    }

    const isEdit = !!editingId;
    const url = "/api/setup/saa-config";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      id: editingId,
      code,
      name,
      description,
      isActive,
      sections: normalizedSections,
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4] shrink-0">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              SAA Form Configuration
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Kelola tipe SAA, field isian form, dan alur bertingkat approval.
            </p>
          </div>
        </div>
        {activeTab === "forms" && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-soft transition-all active:scale-[0.99]"
          >
            <Plus size={16} /> <span>Tambah Tipe SAA</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto bg-white border border-slate-100 p-2 rounded-2xl shadow-soft">
        {([
          ["forms", `Form Types (${configs.length})`],
          ["fields", "Fields"],
          ["sections", "Sections"],
          ["request-types", "Request Types"],
          ["approvers", "Approvers"],
          ["roles", "Role Codes"],
        ] as [SetupTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === tab ? "bg-[#5C61F4] text-white shadow-soft" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "fields" && <SaaMasterFieldsPage key="fields" initialTab="fields" showTabs={false} />}
      {activeTab === "approvers" && <SaaMasterFieldsPage key="approvers" initialTab="approvers" showTabs={false} />}
      {activeTab === "roles" && <SaaMasterFieldsPage key="roles" initialTab="roles" showTabs={false} />}

      {activeTab === "sections" && (
        <section className="max-w-4xl space-y-5">
          <label className="block max-w-xl text-xs font-bold text-slate-700">
            TIPE FORM SAA
            <select value={selectedConfigId} onChange={(event) => setSelectedConfigId(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white p-3 text-sm rounded-2xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
              {configs.map((form) => <option key={form.id} value={form.id}>[{form.code}] {form.name}</option>)}
            </select>
          </label>
          {!selectedForm ? <p className="text-xs font-medium text-slate-400">Belum ada tipe form SAA.</p> : (
            <div className="space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Sections · {selectedForm.name}</h2>
                <button type="button" onClick={addManagedSection} className="inline-flex items-center gap-1.5 bg-indigo-50 text-[#5C61F4] hover:bg-indigo-100 px-4 py-2 text-xs font-bold rounded-xl transition">
                  <Plus size={14} /> Tambah Section
                </button>
              </div>
              {sectionsDraft.map((section, index) => (
                <div key={`${section}-${index}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <label className="min-w-0">
                    <span className="sr-only">Nama section {index + 1}</span>
                    <input value={section} onChange={(event) => renameManagedSection(index, event.target.value)} className="w-full border border-slate-200 bg-white p-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500" />
                  </label>
                  <span className="text-xs font-medium text-slate-400">{sectionFieldsDraft.filter((field) => field.section === section).length} field</span>
                  <button type="button" onClick={() => moveManagedSection(index, -1)} disabled={index === 0} title="Naikkan section" className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => moveManagedSection(index, 1)} disabled={index === sectionsDraft.length - 1} title="Turunkan section" className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removeManagedSection(index)} title="Hapus section" className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={handleSaveManagedSections} className="bg-[#5C61F4] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-soft transition">Simpan Sections</button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "request-types" && (
        <section className="max-w-4xl space-y-5">
          <label className="block max-w-xl text-xs font-bold text-slate-700">
            TIPE FORM SAA
            <select value={selectedConfigId} onChange={(event) => setSelectedConfigId(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white p-3 text-sm rounded-2xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
              {configs.map((form) => <option key={form.id} value={form.id}>[{form.code}] {form.name}</option>)}
            </select>
          </label>
          {!selectedForm ? <p className="text-xs font-medium text-slate-400">Belum ada tipe form SAA.</p> : (
            <div className="space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Request Types · {selectedForm.name}</h2>
                <button type="button" onClick={addRequestTypeField} className="inline-flex items-center gap-1.5 bg-indigo-50 text-[#5C61F4] hover:bg-indigo-100 px-4 py-2 text-xs font-bold rounded-xl transition">
                  <Plus size={14} /> Tambah Request Type
                </button>
              </div>
              {requestTypeDrafts.length === 0 && <p className="text-xs font-medium text-slate-400">Belum ada Request Type untuk form ini.</p>}
              {requestTypeDrafts.map((field, index) => (
                <div key={field.fieldKey} className="grid gap-3 border border-slate-100 bg-slate-50 p-4 rounded-2xl md:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700">Label
                    <input value={field.label} onChange={(event) => updateRequestTypeField(index, { label: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl bg-white p-2.5 text-xs font-medium text-slate-800" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Control
                    <select value={field.fieldType} onChange={(event) => updateRequestTypeField(index, { fieldType: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl bg-white p-2.5 text-xs font-medium text-slate-800">
                      <option value="SELECT">Dropdown</option>
                      <option value="RADIO">Radio</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 md:col-span-2">Choices (pisahkan dengan koma)
                    <input value={(field.options || []).join(", ")} onChange={(event) => updateRequestTypeField(index, { options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean) })} placeholder="Create Account, Modify Account" className="mt-1 w-full border border-slate-200 rounded-xl bg-white p-2.5 text-xs font-medium text-slate-800" />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input type="checkbox" checked={field.isRequired} onChange={(event) => updateRequestTypeField(index, { isRequired: event.target.checked })} className="h-4 w-4 rounded accent-indigo-600" /> Required
                  </label>
                  <button type="button" onClick={() => setRequestTypeDrafts(requestTypeDrafts.filter((_, fieldIndex) => fieldIndex !== index))} className="justify-self-end text-xs font-bold text-rose-600">Hapus Request Type</button>
                </div>
              ))}
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={saveRequestTypes} disabled={requestTypeDrafts.length === 0} className="bg-[#5C61F4] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-soft transition disabled:opacity-40">Simpan Request Types</button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "forms" && (
        <>
      {/* Grid List Tipe SAA */}
      {loading ? (
        <p className="text-center py-12 text-xs font-bold text-slate-400">Memuat data konfigurasi...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((config) => (
            <div
              key={config.id}
              className="border border-slate-100 rounded-3xl p-6 bg-white shadow-soft hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-[#5C61F4] rounded-full border border-indigo-100">
                    {config.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {config.isActive ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-rose-400" />
                    )}
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-800">
                  {config.name}
                </h3>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {config.description || "-"}
                </p>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
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
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(config)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-soft-lg border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-800">
                {editingId ? "Edit Konfigurasi SAA" : "Pengaturan Tipe SAA Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Info Utama */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    KODE TIPE (Unik)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PMS"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NAMA FORM SAA
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PMS ACCESS"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    DESKRIPSI
                  </label>
                  <textarea
                    placeholder="Contoh: Create / Modify / Suspend PMS User Account"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                    rows={2}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-slate-700">
                    Aktifkan Form Ini
                  </label>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                    <Layers3 className="h-4 w-4 text-[#5C61F4]" /> Sections
                  </h3>
                  <button
                    type="button"
                    onClick={addSection}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-[#5C61F4] hover:bg-indigo-100"
                  >
                    <Plus size={14} /> Tambah Section
                  </button>
                </div>
                {sections.map((section, index) => (
                  <div key={`${section}-${index}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                    <input
                      type="text"
                      value={section}
                      onChange={(event) => renameSection(index, event.target.value)}
                      aria-label={`Nama section ${index + 1}`}
                      className="min-w-0 border border-slate-200 bg-white p-2 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      title="Naikkan section"
                      aria-label="Naikkan section"
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                      className="border border-slate-200 bg-white p-2 rounded-xl text-slate-600 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Turunkan section"
                      aria-label="Turunkan section"
                      disabled={index === sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                      className="border border-slate-200 bg-white p-2 rounded-xl text-slate-600 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Hapus section"
                      aria-label="Hapus section"
                      onClick={() => removeSection(index)}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Dynamic Field Builder */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-slate-800">
                    1. Field & Modification Checklist
                  </h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="text-xs bg-indigo-50 text-[#5C61F4] hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold"
                  >
                    <Plus size={14} /> Tambah Field
                  </button>
                </div>

                {fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-slate-100 rounded-2xl bg-slate-50 grid grid-cols-12 gap-2 items-center"
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
                      className="col-span-2 border border-slate-200 rounded-xl p-2 text-xs bg-white font-medium text-slate-800"
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
                      className="col-span-2 border border-slate-200 rounded-xl p-2 text-xs bg-white font-medium text-slate-800"
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
                      className="col-span-2 border border-slate-200 rounded-xl p-2 text-xs bg-white font-medium text-slate-800"
                    >
                      <option value="TEXT">Input Text</option>
                      <option value="EMAIL">Input Email</option>
                      <option value="CHECKBOX">Checkbox Option</option>
                      <option value="SELECT">Dropdown Select</option>
                      <option value="TEXTAREA">Textarea</option>
                      <option value="NUMBER">Number</option>
                      <option value="DATE">Date</option>
                      <option value="TIME">Time</option>
                      <option value="TEL">Telephone</option>
                      <option value="URL">URL</option>
                      <option value="PASSWORD">Password</option>
                      <option value="RADIO">Radio Options</option>
                    </select>

                    {/* Binding */}
                    <select
                      value={field.source || "CUSTOM"}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].source = e.target.value;
                        setFields(updated);
                      }}
                      className="col-span-2 border border-slate-200 rounded-xl p-2 text-xs bg-white font-semibold text-[#5C61F4]"
                    >
                      <option value="CUSTOM">Custom field</option>
                      <option value="REQUEST_TYPE">Request type</option>
                      <option value="REQUESTER_NAME">Requester name</option>
                      <option value="REQUESTER_EMAIL">Login email (automatic)</option>
                      <option value="DEPARTMENT">Department</option>
                      <option value="REASON">Reason</option>
                    </select>

                    {/* Section */}
                    <select
                      value={field.section}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].section = e.target.value;
                        setFields(updated);
                      }}
                      className="col-span-2 border border-slate-200 rounded-xl p-2 text-xs bg-white font-medium text-slate-800"
                      required
                    >
                      <option value="">Pilih section</option>
                      {sections.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
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
                        className="w-12 border border-slate-200 rounded-xl p-1 text-xs text-center bg-white"
                        title="Urutan Tampilan"
                      />
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="col-span-12 flex flex-wrap items-center gap-3 pt-1">
                      {(field.fieldType === "SELECT" || field.fieldType === "RADIO") &&
                        field.source !== "DEPARTMENT" && (
                        <input
                          type="text"
                          value={parseFieldOptions(field.options).join(", ")}
                          onChange={(e) => {
                            const updated = [...fields];
                            updated[idx].options = e.target.value
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean);
                            setFields(updated);
                          }}
                          placeholder="Choices, separated by commas"
                          className="min-w-48 flex-1 border border-slate-200 rounded-xl p-2 text-xs bg-white"
                          required
                        />
                      )}
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={(e) => {
                            const updated = [...fields];
                            updated[idx].isRequired = e.target.checked;
                            setFields(updated);
                          }}
                          className="rounded text-indigo-600 accent-indigo-600"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Approval Workflow Builder */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-slate-800">
                    2. Urutan Approver (Approval Workflow)
                  </h3>
                  <button
                    type="button"
                    onClick={addApprovalStep}
                    className="text-xs bg-indigo-50 text-[#5C61F4] hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold"
                  >
                    <Plus size={14} /> Tambah Step Approval
                  </button>
                </div>

                {approvalSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-slate-100 rounded-2xl bg-slate-50 flex items-center gap-3"
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
                      className="border border-slate-200 rounded-xl p-2 text-xs bg-white flex-1 font-medium text-slate-800"
                    >
                      {approvalRoles.map((role) => (
                        <option key={role.id} value={role.code}>{role.name} ({role.code})</option>
                      ))}
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
                      className="border border-slate-200 rounded-xl p-2 text-xs bg-white flex-1 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeApprovalStep(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5C61F4] hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-soft transition"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Konfigurasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}