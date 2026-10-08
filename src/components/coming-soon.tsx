import React from "react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({
  title = "Halaman Dalam Pengembangan",
  description = "Fitur ini sedang dalam tahap pengerjaan dan akan segera hadir.",
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white border border-slate-100 rounded-3xl shadow-soft">
      <div className="bg-indigo-50 p-5 rounded-full mb-4">
        <svg
          className="w-10 h-10 text-[#5C61F4] animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">{title}</h1>
      <p className="text-slate-500 font-medium max-w-md text-sm mb-6">{description}</p>
      <div className="px-4 py-1.5 bg-indigo-50 text-[#5C61F4] rounded-full text-xs font-bold uppercase tracking-wider">
        Coming Soon
      </div>
    </div>
  );
}