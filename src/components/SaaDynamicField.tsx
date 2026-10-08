"use client";

interface SaaDynamicFieldProps {
  field: {
    id: string;
    fieldKey: string;
    label: string;
    fieldType: string;
    source?: string | null;
    options?: unknown;
    isRequired?: boolean;
  };
  value: unknown;
  departments?: { id: string; name: string }[];
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

function getOptions(rawOptions: unknown): string[] {
  if (Array.isArray(rawOptions)) return rawOptions.map(String);
  if (typeof rawOptions !== "string" || !rawOptions) return [];
  try {
    const parsed: unknown = JSON.parse(rawOptions);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    return rawOptions.split(",").map((option) => option.trim()).filter(Boolean);
  }
  return [];
}

export default function SaaDynamicField({
  field,
  value,
  departments = [],
  onChange,
  readOnly = false,
}: SaaDynamicFieldProps) {
  const options = getOptions(field.options);
  const requiredMark = field.isRequired && <span className="text-rose-500"> *</span>;
  const controlClass = "w-full border border-slate-200 bg-white p-3 text-sm rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800 placeholder-slate-400";
  
  const handleChange = (nextValue: unknown) => {
    if (!readOnly) {
      onChange(field.fieldKey, nextValue);
    }
  };

  if (field.source === "REQUESTER_EMAIL") {
    return (
      <label className="block text-xs font-bold text-slate-700">
        {field.label}{requiredMark}
        <input
          type="email"
          value={typeof value === "string" ? value : ""}
          readOnly={readOnly || true}
          disabled={readOnly}
          required={field.isRequired}
          className={`${controlClass} mt-1.5 border-slate-200 bg-slate-50 text-slate-500`}
        />
      </label>
    );
  }

  if (field.source === "DEPARTMENT") {
    return (
      <label className="block text-xs font-bold text-slate-700">
        {field.label}{requiredMark}
        <select
          value={typeof value === "string" ? value : ""}
          required={field.isRequired}
          disabled={readOnly}
          onChange={(event) => onChange(field.fieldKey, event.target.value)}
          className={`${controlClass} mt-1.5`}
        >
          <option value="">Pilih {field.label}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.source === "REASON") {
    return (
      <label className="block text-xs font-bold text-slate-700">
        {field.label}{requiredMark}
        <textarea
          rows={3}
          value={typeof value === "string" ? value : ""}
          required={field.isRequired}
          disabled={readOnly}
          onChange={(event) => onChange(field.fieldKey, event.target.value)}
          className={`${controlClass} mt-1.5`}
        />
      </label>
    );
  }

  if (field.source === "REQUESTER_NAME") {
    return (
      <label className="block text-xs font-bold text-slate-700">
        {field.label}{requiredMark}
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          required={field.isRequired}
          disabled={readOnly}
          onChange={(event) => handleChange(event.target.value)}
          className={`${controlClass} mt-1.5`}
        />
      </label>
    );
  }

  if (field.fieldType === "CHECKBOX") {
    return (
      <label className="flex items-center gap-2.5 py-2 text-sm font-semibold text-slate-800 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value === true}
          required={field.isRequired}
          disabled={readOnly}
          onChange={(event) => handleChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
        />
        {field.label}{requiredMark}
      </label>
    );
  }

  if (field.fieldType === "SELECT" || field.fieldType === "DROPDOWN") {
    return (
      <label className="block text-xs font-bold text-slate-700">
        {field.label}{requiredMark}
        <select
          value={typeof value === "string" ? value : ""}
          required={field.isRequired}
          disabled={readOnly}
          onChange={(event) => onChange(field.fieldKey, event.target.value)}
          className={`${controlClass} mt-1.5`}
        >
          <option value="">Pilih {field.label}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  if (field.fieldType === "RADIO") {
    return (
      <fieldset className="space-y-2">
        <legend className="text-xs font-bold text-slate-700">{field.label}{requiredMark}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer select-none">
              <input
                type="radio"
                name={field.fieldKey}
                value={option}
                checked={value === option}
                required={field.isRequired}
                disabled={readOnly}
                onChange={() => handleChange(option)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.fieldType === "TEXTAREA") {
    return (
      <label className="block text-xs font-bold text-slate-700">
        {field.label}{requiredMark}
        <textarea
          rows={3}
          value={typeof value === "string" ? value : ""}
          required={field.isRequired}
          disabled={readOnly}
          onChange={(event) => onChange(field.fieldKey, event.target.value)}
          className={`${controlClass} mt-1.5`}
        />
      </label>
    );
  }

  return (
    <label className="block text-xs font-bold text-slate-700">
      {field.label}{requiredMark}
      <input
        type={
          field.source === "REQUESTER_NAME"
            ? "text"
            : ["EMAIL", "NUMBER", "DATE", "TIME", "TEL", "URL", "PASSWORD"].includes(field.fieldType)
              ? field.fieldType.toLowerCase()
              : "text"
        }
        value={
          typeof value === "string" || typeof value === "number"
            ? value
            : value instanceof Date
              ? value.toISOString().slice(0, 10)
              : ""
        }
        required={field.isRequired}
        disabled={readOnly}
        onChange={(event) => handleChange(event.target.value)}
        className={`${controlClass} mt-1.5`}
      />
    </label>
  );
}
