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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <svg
          className="w-12 h-12 text-primary animate-pulse"
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
      <h1 className="text-2xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="px-3 py-1 bg-muted rounded-full text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Coming Soon
      </div>
    </div>
  );
}