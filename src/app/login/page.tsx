import { signIn } from "@/auth";
import { Building2, LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-cyan-100 text-cyan-600 shadow-glow-cyan">
          <Building2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Hotel Management System</h2>
          <p className="text-slate-500 text-sm">
            Masuk dengan Akun Google Perusahaan / Email Anda. User terdaftar maupun belum terdaftar dapat masuk secara langsung.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all"
          >
            <LogIn className="w-5 h-5 text-cyan-400" />
            Lanjutkan dengan Google Provider
          </button>
        </form>

        <p className="text-xs text-slate-400">
          Unregistered accounts will be assigned <strong>View Only</strong> permission.
        </p>
      </div>
    </div>
  );
}
