"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSignature, Send, ShieldCheck, UserCheck } from "lucide-react";
import SaaRequestSections from "@/components/SaaRequestSections";

type FieldItem = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  source?: string | null;
  section?: string | null;
  options?: unknown;
  isRequired?: boolean;
  order?: number;
};

type ApprovalStepItem = {
  id: string;
  step: number;
  role: string;
  label: string;
};

type SaaFormConfig = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sections: string[];
  fields: FieldItem[];
  approvalSteps: ApprovalStepItem[];
};

type Department = { id: string; name: string; code?: string | null };
type UserProfile = {
  name?: string | null;
  email?: string | null;
  departmentId?: string | null;
};

function getInitialFormValues(
  fields: FieldItem[],
  profile: UserProfile,
  defaultDepartmentId: string
) {
  return Object.fromEntries(
    fields.flatMap((field) => {
      if (field.source === "REQUESTER_NAME") return [[field.fieldKey, profile.name || ""]];
      if (field.source === "REQUESTER_EMAIL") return [[field.fieldKey, profile.email || ""]];
      if (field.source === "DEPARTMENT") return [[field.fieldKey, defaultDepartmentId]];
      if (field.source === "REASON") return [[field.fieldKey, ""]];
      return [];
    })
  );
}

export default function SaaCreatePage() {
  const [forms, setForms] = useState<SaaFormConfig[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [formsResponse, departmentsResponse, userResponse] = await Promise.all([
        fetch("/api/setup/saa-config"),
        fetch("/api/departments"),
        fetch("/api/auth/me"),
      ]);
      if (!formsResponse.ok || !departmentsResponse.ok || !userResponse.ok) {
        throw new Error("Data form, departemen, atau profil pemohon gagal dimuat.");
      }

      const [formData, departmentData, userData] = await Promise.all([
        formsResponse.json(),
        departmentsResponse.json(),
        userResponse.json(),
      ]);
      const activeForms = (formData as SaaFormConfig[]).filter((form) => form.isActive);
      setForms(activeForms);
      setDepartments(departmentData);
      setUserProfile(userData);
      const ownDepartment = departmentData.find(
        (department: Department) => department.id === userData.departmentId
      );
      const defaultDepartmentId = ownDepartment?.id || departmentData[0]?.id || "";
      setSelectedDepartmentId(defaultDepartmentId);
      const firstForm = activeForms[0];
      if (firstForm) {
        setSelectedFormId(firstForm.id);
        setFormValues(getInitialFormValues(firstForm.fields, userData, defaultDepartmentId));
      }
    } catch (loadError) {
      console.error("Failed to load SAA form data:", loadError);
      setError("Gagal memuat data form. Muat ulang halaman untuk mencoba kembali.");
    } finally {
      setLoading(false);
    }
  };

  const selectedForm = forms.find((form) => form.id === selectedFormId);
  const fields = [...(selectedForm?.fields || [])].sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0)
  );
  const approvalSteps = [...(selectedForm?.approvalSteps || [])].sort(
    (left, right) => left.step - right.step
  );

  const handleFieldChange = (key: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const handleFormChange = (formId: string) => {
    setSelectedFormId(formId);
    const form = forms.find((item) => item.id === formId);
    setFormValues(form ? getInitialFormValues(form.fields, userProfile, selectedDepartmentId) : {});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFormId) {
      setError("Pilih tipe form SAA.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/setup/saa-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formConfigId: selectedFormId,
          targetDepartmentId: selectedDepartmentId,
          formData: formValues,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Pengajuan gagal dikirim.");
      setSubmitted(true);
      setFormValues({});
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Pengajuan gagal dikirim.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-sm font-bold text-slate-400">Memuat konfigurasi SAA...</p>;
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-2xl space-y-5 bg-white border border-emerald-100 rounded-3xl p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="text-2xl font-extrabold text-slate-800">Pengajuan SAA Terkirim</h1>
        <p className="text-sm font-medium text-slate-500">Approver pada tahap aktif sudah menerima notifikasi.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button onClick={() => setSubmitted(false)} className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold rounded-2xl transition">Buat Pengajuan Lain</button>
          <Link href="/dashboard/it/saa" className="bg-[#5C61F4] hover:bg-indigo-600 text-white px-5 py-2.5 text-xs font-bold rounded-2xl shadow-soft transition">Lihat Daftar SAA</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#5C61F4]">
          <FileSignature className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {selectedForm?.name || "System Access Authorization"}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Pilih tipe SAA; field dan approval mengikuti konfigurasi tipe tersebut.</p>
        </div>
      </header>

      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-4 rounded-2xl text-xs font-bold text-rose-800">{error}</p>}
      {forms.length === 0 ? (
        <p className="bg-white border border-slate-100 rounded-3xl py-12 text-center text-sm font-medium text-slate-400 shadow-soft">Belum ada tipe SAA aktif.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-3">
            <label className="block max-w-xl text-xs font-bold text-slate-700">
              TIPE FORM SAA <span className="text-rose-500">*</span>
              <select value={selectedFormId} onChange={(event) => handleFormChange(event.target.value)} required className="mt-2 w-full border border-slate-200 bg-white p-3 text-sm rounded-2xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
                {forms.map((form) => <option key={form.id} value={form.id}>[{form.code}] {form.name}</option>)}
              </select>
            </label>
            {selectedForm?.description && <p className="border-l-4 border-[#5C61F4] bg-indigo-50/50 p-3.5 rounded-r-2xl text-xs font-medium text-slate-600">{selectedForm.description}</p>}
          </div>

          <SaaRequestSections
            departments={departments}
            sections={selectedForm?.sections || []}
            fields={fields}
            values={formValues}
            onFieldChange={handleFieldChange}
          />

          <section className="space-y-4 bg-slate-900 rounded-3xl p-6 text-white shadow-soft">
            <h2 className="flex items-center gap-2 border-b border-slate-800 pb-4 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <ShieldCheck className="h-5 w-5 text-[#5C61F4]" /> Approval Workflow
            </h2>
            <div className="flex flex-wrap items-stretch gap-3">
              <div className="flex min-w-44 items-center gap-3 border border-slate-800 bg-slate-800/60 p-3.5 rounded-2xl">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-indigo-300">Request By</p>
                  <p className="text-xs font-bold">{userProfile.name || "Pemohon"}</p>
                </div>
              </div>
              {approvalSteps.map((step) => (
                <div key={step.id} className="min-w-44 border border-slate-800 bg-slate-800/60 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase text-indigo-300">Step {step.step} · {step.role}</p>
                  <p className="mt-1 text-xs font-bold">{step.label || step.role}</p>
                </div>
              ))}
              {approvalSteps.length === 0 && <p className="text-xs font-medium text-slate-400">Belum ada approval step di konfigurasi tipe SAA ini.</p>}
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting || approvalSteps.length === 0} className="inline-flex items-center gap-2 bg-[#5C61F4] hover:bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-xs font-bold shadow-soft hover:shadow-indigo-200 transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]">
              <Send className="h-4 w-4" />
              {submitting ? "MENGIRIM..." : "SUBMIT PENGAJUAN SAA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
