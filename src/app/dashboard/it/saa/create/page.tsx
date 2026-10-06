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
    return <p className="p-8 text-center text-sm font-bold text-slate-600">Memuat konfigurasi SAA...</p>;
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-2xl space-y-4 border-y-2 border-emerald-800 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
        <h1 className="text-xl font-black text-emerald-950">Pengajuan SAA terkirim</h1>
        <p className="text-sm text-emerald-900">Approver pada tahap aktif sudah menerima notifikasi.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => setSubmitted(false)} className="border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold">Buat pengajuan lain</button>
          <Link href="/dashboard/it/saa" className="border-2 border-slate-900 bg-slate-900 px-4 py-2 text-sm font-bold text-white">Lihat daftar SAA</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center gap-4 border-b-2 border-slate-900 pb-5">
        <div className="flex h-12 w-12 items-center justify-center border-2 border-slate-900 bg-cyan-300">
          <FileSignature className="h-6 w-6 text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase text-slate-900">
            {selectedForm?.name || "System Access Authorization"}
          </h1>
          <p className="mt-1 text-xs text-slate-600">Pilih tipe SAA; field dan approval mengikuti konfigurasi tipe tersebut.</p>
        </div>
      </header>

      {error && <p role="alert" className="border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {forms.length === 0 ? (
        <p className="border-y border-slate-300 py-8 text-center text-sm text-slate-600">Belum ada tipe SAA aktif.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block max-w-xl text-xs font-bold text-slate-700">
            TIPE FORM SAA <span className="text-red-600">*</span>
            <select value={selectedFormId} onChange={(event) => handleFormChange(event.target.value)} required className="mt-1 w-full border-2 border-slate-900 bg-white p-2.5 text-sm">
              {forms.map((form) => <option key={form.id} value={form.id}>[{form.code}] {form.name}</option>)}
            </select>
          </label>
          {selectedForm?.description && <p className="border-l-4 border-cyan-600 bg-cyan-50 p-3 text-sm text-slate-700">{selectedForm.description}</p>}

          <SaaRequestSections
            departments={departments}
            sections={selectedForm?.sections || []}
            fields={fields}
            values={formValues}
            onFieldChange={handleFieldChange}
          />

          <section className="space-y-4 border-y-2 border-slate-900 bg-slate-950 px-5 py-5 text-white">
            <h2 className="flex items-center gap-2 border-b border-slate-700 pb-3 text-sm font-black uppercase text-cyan-300">
              <ShieldCheck className="h-5 w-5" /> Approval Workflow
            </h2>
            <div className="flex flex-wrap items-stretch gap-3">
              <div className="flex min-w-44 items-center gap-3 border border-slate-600 bg-slate-900 p-3">
                <UserCheck className="h-4 w-4 text-cyan-300" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-cyan-300">Request By</p>
                  <p className="text-xs font-bold">{userProfile.name || "Pemohon"}</p>
                </div>
              </div>
              {approvalSteps.map((step) => (
                <div key={step.id} className="min-w-44 border border-slate-600 bg-slate-900 p-3">
                  <p className="text-[10px] font-bold uppercase text-cyan-300">Step {step.step} · {step.role}</p>
                  <p className="mt-1 text-xs font-bold">{step.label || step.role}</p>
                </div>
              ))}
              {approvalSteps.length === 0 && <p className="text-sm text-slate-300">Belum ada approval step di konfigurasi tipe SAA ini.</p>}
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting || approvalSteps.length === 0} className="inline-flex items-center gap-2 border-2 border-slate-900 bg-cyan-300 px-5 py-3 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" />
              {submitting ? "MENGIRIM..." : "SUBMIT PENGAJUAN SAA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
