"use client";

import SaaDynamicField from "@/components/SaaDynamicField";

type DepartmentOption = { id: string; name: string };
type FieldOption = {
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

interface SaaRequestSectionsProps {
  departments: DepartmentOption[];
  sections: string[];
  fields: FieldOption[];
  values: Record<string, unknown>;
  onFieldChange: (key: string, value: unknown) => void;
}

export default function SaaRequestSections(props: SaaRequestSectionsProps) {
  const groupedFields = new Map<string, FieldOption[]>();
  [...props.fields]
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .forEach((field) => {
      const section = field.section?.trim() || "Access Details";
      groupedFields.set(section, [...(groupedFields.get(section) || []), field]);
    });

  const sectionTitles = [
    ...props.sections,
    ...[...groupedFields.keys()].filter((title) => !props.sections.includes(title)),
  ];
  const sections = sectionTitles.map((title) => ({ title, fields: groupedFields.get(title) || [] }));

  return (
    <div className="space-y-5">
      {sections.map((section, index) => (
          <section key={section.title} className="space-y-4 border-y-2 border-slate-900 bg-white px-5 py-5">
            <h2 className="flex items-center gap-3 border-b border-slate-200 pb-3 text-sm font-black uppercase text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center border-2 border-slate-900 bg-cyan-300 text-xs">
                {index + 1}
              </span>
              {section.title}
            </h2>

            <div className="grid gap-4 md:grid-cols-4">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={
                    field.fieldType === "CHECKBOX"
                      ? "md:col-span-1"
                      : field.fieldType === "RADIO" ||
                          field.fieldType === "TEXTAREA" ||
                          field.source === "REASON"
                        ? "md:col-span-4"
                        : "md:col-span-2"
                  }
                >
                  <SaaDynamicField
                    field={field}
                    value={props.values[field.fieldKey]}
                    departments={props.departments}
                    onChange={props.onFieldChange}
                  />
                </div>
              ))}
            </div>
              </section>
          ))}
    </div>
  );
}
