"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface GoogleSignInButtonProps {
  label?: string;
}

export default function GoogleSignInButton({ label = "Google" }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setPending(true);
    setError("");
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (signInError) {
      console.error("Google sign-in failed:", signInError);
      setError("Login Google gagal dimulai. Periksa koneksi dan coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300 active:scale-[0.99] disabled:opacity-60"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
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
        <span className="text-sm font-medium">{pending ? "Proses..." : label}</span>
      </button>
      {error && <p role="alert" className="mt-2 text-center text-xs text-rose-600 font-medium">{error}</p>}
    </>
  );
}
