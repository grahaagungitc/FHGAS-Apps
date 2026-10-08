import AuthForm from "./AuthForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; mode?: string };
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Soft Decorative Ambient Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Render Auth Form supporting Login & Sign Up */}
      <AuthForm
        initialError={searchParams?.error}
        initialMode={searchParams?.mode === "signup" ? "signup" : "login"}
      />
    </div>
  );
}