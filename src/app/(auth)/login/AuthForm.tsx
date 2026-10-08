"use client";

import { useState } from "react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { submitSignUpAction } from "@/app/actions/register";
import { Lock, Mail, User, Building2, CheckCircle2, AlertCircle } from "lucide-react";

interface AuthFormProps {
  initialError?: string;
  initialMode?: "login" | "signup";
}

export default function AuthForm({ initialError, initialMode = "login" }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPosition, setSignUpPosition] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!signUpName.trim() || !signUpEmail.trim()) {
      setFormError("Nama dan Email wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await submitSignUpAction({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
      });

      if (res.success) {
        setFormSuccess(res.message);
        setSignUpName("");
        setSignUpEmail("");
        setSignUpPosition("");
      } else {
        setFormError(res.message);
      }
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan saat pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    // Standard credential login handler indicator
    if (!email.trim() || !password.trim()) {
      setFormError("Email dan password harus diisi.");
      return;
    }
    setFormError("Sistem otentikasi login utama menggunakan akun Google yang terverifikasi. Silakan klik tombol Google Sign In di bawah.");
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-soft-lg border border-slate-100 relative z-10 transition-all">
      {/* Tab Header Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setFormError("");
            setFormSuccess("");
          }}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            mode === "login"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setFormError("");
            setFormSuccess("");
          }}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            mode === "signup"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Sign Up
        </button>
      </div>

      {mode === "login" ? (
        /* LOGIN VIEW */
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Login to your account.
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Hello, welcome back to your account
            </p>
          </div>

          {/* Initial Error Banners */}
          {initialError === "NotRegistered" && !formError && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Email Belum Terdaftar</p>
                <p className="mt-0.5 text-amber-700">
                  Email Anda belum terdaftar di sistem. Silakan klik tombol{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-bold underline text-indigo-600 hover:text-indigo-800"
                  >
                    Sign Up
                  </button>{" "}
                  untuk mendaftar / mengajukan akses ke Admin.
                </p>
              </div>
            </div>
          )}

          {initialError === "AccessPending" && !formError && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900">Pendaftaran Dalam Proses</p>
                <p className="mt-0.5 text-blue-700">
                  Permintaan akses Anda sudah diterima dan sedang dalam tahap peninjauan oleh Admin.
                </p>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* E-mail Input with styled reference border & float label */}
            <div className="relative pt-2">
              <div className="relative border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
                <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-xs font-bold text-indigo-600">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-300 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative pt-2">
              <div className="relative border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
                <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-xs font-bold text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your Password"
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-300 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-500 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="font-semibold text-slate-400 hover:text-indigo-600 transition-colors">
                Forgot Password?
              </a>
            </div>

            {/* Login Primary Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-soft hover:shadow-indigo-200 transition-all active:scale-[0.99]"
            >
              Login
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-4 text-xs font-medium text-slate-400">
              or sign up with
            </span>
          </div>

          {/* Social Sign In Row matching reference UI */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
              title="Facebook"
            >
              <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            <div className="col-span-1">
              <GoogleSignInButton label="" />
            </div>

            <button
              type="button"
              className="flex items-center justify-center py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
              title="Apple"
            >
              <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.97 1.08.08 2.16-.56 2.81-1.37z" />
              </svg>
            </button>
          </div>

          {/* Toggle link */}
          <div className="text-center text-xs font-medium text-slate-500">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setFormError("");
                setFormSuccess("");
              }}
              className="font-bold text-indigo-600 hover:underline"
            >
              Sign Up di sini
            </button>
          </div>
        </div>
      ) : (
        /* SIGN UP VIEW */
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Create your account.
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Daftarkan email Anda untuk mengajukan akses sistem
            </p>
          </div>

          {formSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Pendaftaran Terkirim</p>
                <p className="mt-0.5 text-emerald-700">{formSuccess}</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="relative pt-2">
              <div className="relative border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
                <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-xs font-bold text-indigo-600">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="E.g. Leah White"
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-300 outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="relative pt-2">
              <div className="relative border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
                <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-xs font-bold text-indigo-600">
                  E-mail
                </label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-300 outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Position / Dept (Optional) */}
            <div className="relative pt-2">
              <div className="relative border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-white">
                <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-xs font-bold text-slate-400">
                  Jabatan / Departemen (Opsional)
                </label>
                <input
                  type="text"
                  value={signUpPosition}
                  onChange={(e) => setSignUpPosition(e.target.value)}
                  placeholder="UX Designer / Front Office"
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-300 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Sign Up Primary Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-soft hover:shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-60 mt-2"
            >
              {loading ? "Mengirim..." : "Sign Up / Ajukan Akses"}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-4 text-xs font-medium text-slate-400">
              or sign up with Google
            </span>
          </div>

          <div className="mb-6">
            <GoogleSignInButton label="Sign Up dengan Google" />
          </div>

          {/* Toggle link */}
          <div className="text-center text-xs font-medium text-slate-500">
            Sudah memiliki akun?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFormError("");
                setFormSuccess("");
              }}
              className="font-bold text-indigo-600 hover:underline"
            >
              Login di sini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

