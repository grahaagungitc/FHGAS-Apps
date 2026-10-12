"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Loader2, FileSignature, Building2, Users, ArrowRight, Compass, ShieldCheck, SlidersHorizontal } from "lucide-react";

interface SearchResultItem {
  type: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setOpen(true);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: string) => {
    if (type === "Menu Sistem") return <Compass className="w-4 h-4 text-indigo-600" />;
    if (type === "SAA Request") return <FileSignature className="w-4 h-4 text-purple-600" />;
    if (type === "Departemen") return <Building2 className="w-4 h-4 text-teal-600" />;
    if (type === "User Akun") return <Users className="w-4 h-4 text-rose-600" />;
    if (type === "Permohonan Akses") return <ShieldCheck className="w-4 h-4 text-amber-600" />;
    return <SlidersHorizontal className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-2 pl-5 shadow-soft focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Search anything ..."
          className="w-full text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent outline-none"
        />
        <button
          type="button"
          className="w-10 h-10 bg-[#5C61F4] hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-colors shrink-0 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {/* Results Dropdown Popup */}
      {open && query.trim().length >= 2 && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-white border border-slate-100 rounded-3xl shadow-soft-lg p-3 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Mencari data...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs font-semibold text-slate-400">
              Tidak ditemukan hasil untuk <span className="text-slate-800 font-bold">&quot;{query}&quot;</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Hasil Pencarian ({results.length})
              </p>
              {results.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-indigo-50 text-[#5C61F4]">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
