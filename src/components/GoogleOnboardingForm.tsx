"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Building2, Loader2 } from "lucide-react";
import AuthBrandLayout from "@/components/AuthBrandLayout";

type DepartmentOption = { id: string; name: string };

export default function GoogleOnboardingForm({
  email,
  initialName,
  initialDepartmentId,
  departments,
}: {
  email: string;
  initialName: string;
  initialDepartmentId: string;
  departments: DepartmentOption[];
}) {
  const [name, setName] = useState(initialName);
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, departmentId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Pendaftaran gagal dikirim.");
        return;
      }
      await signOut({ redirectTo: "/login?error=AccessPending" });
    } catch {
      setError("Tidak dapat menghubungi server. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBrandLayout>
      <div className="w-full">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[11px] font-semibold text-sky-800">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Permintaan akses akun baru
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lengkapi pendaftaran</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Admin akan meninjau Department dan nama yang Anda kirim.</p>
        <p className="mt-4 truncate text-xs text-slate-500">Akun Google: <span className="font-semibold text-slate-700">{email}</span></p>

        <form onSubmit={submitRequest} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Department
            <span className="relative mt-1.5 block">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                required
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Pilih Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Nama lengkap
            <input
              autoComplete="name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              placeholder="Nama sesuai identitas"
            />
          </label>

          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

          <button
            type="submit"
            disabled={submitting || departments.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Mengirim permintaan..." : "Kirim permintaan akses"}
          </button>
          {departments.length === 0 && <p className="text-xs text-rose-700">Belum ada Department yang dapat dipilih. Hubungi administrator.</p>}
        </form>
      </div>
    </AuthBrandLayout>
  );
}