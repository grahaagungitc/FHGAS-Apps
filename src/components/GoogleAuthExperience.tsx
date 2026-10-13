"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthBrandLayout from "@/components/AuthBrandLayout";

interface GoogleAuthExperienceProps {
  initialError?: string;
  initialMode?: "login" | "signup";
}

function GoogleAuthContent({ initialError, initialMode = "login" }: GoogleAuthExperienceProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || initialError;
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  return (
    <AuthBrandLayout>
      <div className="w-full">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[11px] font-semibold text-sky-800">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Anda akan melanjutkan ke aplikasi
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {mode === "login" ? "Selamat datang kembali" : "Buat permintaan akses"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {mode === "login"
            ? "Masuk menggunakan akun Google Anda."
            : "Lanjutkan dengan Google, lalu isi nama dan Department Anda."}
        </p>

        {error === "AccessPending" && (
          <div role="status" className="mt-5 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <span>Permintaan akses sudah dikirim dan sedang menunggu persetujuan admin.</span>
          </div>
        )}
        {(error === "Callback" || error === "OAuthCallback" || error === "NotRegistered") && (
          <div role="alert" className="mt-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
            <span>{error === "NotRegistered" ? "Pendaftaran belum dapat diproses. Silakan coba lagi." : "Autentikasi Google gagal. Silakan coba lagi."}</span>
          </div>
        )}

        <div className="mt-6">
          <GoogleSignInButton
            label="Lanjutkan dengan Google"
            mode={mode}
          />
        </div>

        <div className="mt-5 text-center text-sm text-slate-500 lg:text-left">
          {mode === "login" ? "Belum punya akses? " : "Sudah punya akun? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-sky-700 hover:text-sky-900 hover:underline"
          >
            {mode === "login" ? "Daftar" : "Login"}
          </button>
        </div>
      </div>
    </AuthBrandLayout>
  );
}

export default function GoogleAuthExperience(props: GoogleAuthExperienceProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Memuat...</div>}>
      <GoogleAuthContent {...props} />
    </Suspense>
  );
}