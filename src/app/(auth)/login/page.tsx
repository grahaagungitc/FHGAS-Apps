import { signIn } from "@/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const accessPending = searchParams?.error === "AccessPending";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Grid Pattern Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Cyberpunk Card */}
      <div className="relative z-10 w-full max-w-md bg-white border-2 border-slate-900 rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(0,243,255,1)]">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center border-2 border-cyber-cyan shadow-cyber-cyan">
            <span className="text-cyber-cyan font-mono text-2xl font-black">HMS</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            HOTEL MANAGEMENT SYSTEM
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            AUTHORIZED PERSONNEL ONLY • ACCESS CONTROL
          </p>

          {accessPending && (
            <p role="status" className="w-full border border-amber-400 bg-amber-50 p-3 text-left text-sm text-amber-900">
              Email Anda belum terdaftar. Permintaan akses sudah dikirim ke admin untuk ditinjau.
            </p>
          )}

          <div className="w-full h-[1px] bg-slate-200 my-2" />

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-lg border-2 border-cyber-cyan shadow-cyber-cyan transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.4-.7-.8-1.7-.8-2.7z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"
                />
              </svg>
              <span>SIGN IN WITH GOOGLE</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}