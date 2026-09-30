import GoogleSignInButton from "@/components/GoogleSignInButton";

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

          <div className="w-full">
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    </div>
  );
}