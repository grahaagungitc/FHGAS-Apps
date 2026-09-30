"use client";

import SaaDynamicField from "@/components/SaaDynamicField";

type DepartmentOption = { id: string; name: string };
type FieldOption = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  section?: string | null;
  options?: unknown;
  isRequired?: boolean;
  order?: number;
};

interface SaaRequestSectionsProps {
  requesterName: string;
  setRequesterName: (name: string) => void;
  requesterEmail: string;
  departmentId: string;
  departments: DepartmentOption[];
  setDepartmentId: (id: string) => void;
  reason: string;
  setReason: (reason: string) => void;
  fields: FieldOption[];
  values: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
}

const sections = [
  { key: "GENERAL", title: "Request By", number: "1" },
  { key: "ACTION", title: "Access Requested", number: "2" },
  { key: "DETAIL", title: "Access Details", number: "3" },
] as const;

export default function SaaRequestSections(props: SaaRequestSectionsProps) {
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const fields = props.fields.filter(
          (field) => (field.section || "DETAIL") === section.key
        );

        return (
          <section key={section.key} className="space-y-4 border-y-2 border-slate-900 bg-white px-5 py-5">
            <h2 className="flex items-center gap-3 border-b border-slate-200 pb-3 text-sm font-black uppercase text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center border-2 border-slate-900 bg-cyan-300 text-xs">
                {section.number}
              </span>
              {section.title}
            </h2>

            {section.key === "GENERAL" && (
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-xs font-bold text-slate-700">
                  NAME <span className="text-red-600">*</span>
                  <input
                    type="text"
                    value={props.requesterName}
                    onChange={(event) => props.setRequesterName(event.target.value)}
                    required
                    className="mt-1 w-full border-2 border-slate-900 p-2.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  EMAIL <span className="text-red-600">*</span>
                  <input
                    type="email"
                    value={props.requesterEmail}
                    readOnly
                    required
                    className="mt-1 w-full border-2 border-slate-300 bg-slate-100 p-2.5 text-sm text-slate-600"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  DEPARTMENT <span className="text-red-600">*</span>
                  <select
                    value={props.departmentId}
                    onChange={(event) => props.setDepartmentId(event.target.value)}
                    required
                    className="mt-1 w-full border-2 border-slate-900 bg-white p-2.5 text-sm"
                  >
                    <option value="">Pilih departemen</option>
                    {props.departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {section.key === "DETAIL" && (
              <label className="block text-xs font-bold text-slate-700">
                REASON <span className="text-red-600">*</span>
                <textarea
                  value={props.reason}
                  onChange={(event) => props.setReason(event.target.value)}
                  required
                  rows={3}
                  className="mt-1 w-full border-2 border-slate-900 p-2.5 text-sm"
                />
              </label>
            )}

            {fields.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <SaaDynamicField
                    key={field.id}
                    field={field}
                    value={props.values[field.fieldKey]}
                    onChange={props.onFieldChange}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
