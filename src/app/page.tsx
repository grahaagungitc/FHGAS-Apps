import Link from "next/link";
import { auth } from "@/auth";
import { ShieldAlert, FilePlus, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="py-10 space-y-12">
      <section className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-cyan-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
            Hotel Management System 2.0
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Seamless Control with{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-pink-500 bg-clip-text text-transparent">
              Cyberpunk Precision
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Kelola otorisasi akses sistem (SAA), department, dan multi-role karyawan dalam satu platform terpadu. Dukungan alur approval multi-tier (Dept Head $\rightarrow$ Finance $\rightarrow$ GM $\rightarrow$ IT Verification).
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            {session ? (
              <Link
                href="/saa/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-glow-cyan hover:opacity-95 transition-all"
              >
                <FilePlus className="w-5 h-5" />
                Buat Request SAA Baru
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-glow-cyan hover:opacity-95 transition-all"
              >
                Login via Google untuk Memulai
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {session?.user?.isGuestViewOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">
              Mode View Only Aktif (User Luar / Belum Terdaftar)
            </h4>
            <p className="text-amber-700 text-xs sm:text-sm">
              Akun Google Anda (<strong>{session.user.email}</strong>) terautentikasi sebagai Guest. Anda memiliki hak akses <strong>Read-Only</strong> di seluruh modul, namun Anda diperbolehkan untuk <strong>Membuat Pengajuan SAA Request Baru</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">
            01
          </div>
          <h3 className="font-bold text-slate-900">Multi-Role Tagging</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Satu user dapat ditagging ke banyak role sekaligus (misal: Admin + Dept Head + Finance).
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
            02
          </div>
          <h3 className="font-bold text-slate-900">Multi-Tier Approval SAA</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Alur pengajuan SAA berjenjang: Dept Head $\rightarrow$ Finance $\rightarrow$ GM $\rightarrow$ Eksekusi IT.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            03
          </div>
          <h3 className="font-bold text-slate-900">Full Setup & Configuration</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Admin memiliki kontrol penuh untuk CRUD Department, Dynamic System Role, dan Manajement User.
          </p>
        </div>
      </div>
    </div>
  );
}
