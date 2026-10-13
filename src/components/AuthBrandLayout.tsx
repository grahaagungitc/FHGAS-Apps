"use client";

import type { ReactNode } from "react";
import { Building2, CalendarDays, CreditCard, ShieldCheck, Utensils, UserRound } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

const DEFAULT_HOTEL_LOGIN_BACKGROUND =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85";

export default function AuthBrandLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const appName = theme.appName || "FHGAS Portal";
  const appSubtitle = theme.appSubtitle || "Management System";
  const hotelModules = [
    { label: "Front Office", code: "FO", Icon: UserRound, className: "left-0 top-[12%]" },
    { label: "Rooms", code: "RM", Icon: Building2, className: "right-0 top-[12%]" },
    { label: "Food & Beverage", code: "F&B", Icon: Utensils, className: "left-0 bottom-[12%]" },
    { label: "Finance", code: "FN", Icon: CreditCard, className: "right-0 bottom-[12%]" },
  ];
  const loginBackground = theme.loginBackgroundUrl || DEFAULT_HOTEL_LOGIN_BACKGROUND;
  const mobileLoginBackground = theme.mobileLoginBackgroundUrl || loginBackground;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden text-slate-900 lg:block">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center bg-no-repeat lg:hidden"
        style={{
          backgroundImage: `url("${mobileLoginBackground}")`,
        }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 hidden bg-cover bg-center bg-no-repeat lg:block"
        style={{ backgroundImage: `url("${loginBackground}")` }}
      />
      <div aria-hidden="true" className="fixed inset-0 bg-slate-950/35 lg:bg-slate-950/15" />

      <div className="absolute left-[7vw] top-[6vh] z-20 hidden items-center gap-3 text-white lg:flex">
        <div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white"
          style={{ backgroundColor: theme.primaryColor || "#514eb8" }}
        >
          {theme.logoUrl ? <Image src={theme.logoUrl} alt="" fill sizes="40px" unoptimized className="object-cover" /> : <ShieldCheck className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="max-w-[18rem] truncate text-base font-bold drop-shadow">{appName}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{appSubtitle}</p>
        </div>
      </div>

      <header className="absolute left-1/2 top-5 z-10 flex w-full max-w-[26rem] -translate-x-1/2 flex-col items-center gap-2 px-5 text-center text-white lg:hidden">
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-sm"
          style={{ backgroundColor: theme.primaryColor || "#514eb8" }}
        >
          {theme.logoUrl ? <Image src={theme.logoUrl} alt="" fill sizes="44px" unoptimized className="object-cover" /> : <ShieldCheck className="h-5 w-5" />}
        </div>
        <p className="max-w-full break-words text-base font-bold text-white drop-shadow">{appName}</p>
        <p className="max-w-full break-words text-[10px] font-semibold uppercase tracking-[0.1em] text-white/90 drop-shadow">{appSubtitle}</p>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[26rem] flex-col justify-center gap-5 px-4 py-5 sm:px-6 lg:grid lg:min-h-screen lg:max-w-none lg:flex-none lg:grid-cols-[minmax(0,1fr)_minmax(25rem,31rem)] lg:items-center lg:gap-0 lg:px-[6vw] lg:py-8">
        <aside className="hidden">
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white"
              style={{ backgroundColor: theme.primaryColor || "#514eb8" }}
            >
              {theme.logoUrl ? <Image src={theme.logoUrl} alt="" fill sizes="36px" unoptimized className="object-cover" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="max-w-[15rem] truncate text-sm font-bold">{appName}</span>
              <span className="hidden border-l border-slate-200 pl-3 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 xl:block">
                {appSubtitle}
              </span>
            </div>
          </div>

          <div className="mt-5 max-w-md sm:mt-7 lg:mt-10">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl xl:text-3xl">All-in-one solutions<br className="hidden sm:block" /> for hotel operations</h1>
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              One connected workspace for your property teams, guest services, and business operations.
            </p>
          </div>

          <div className="relative mx-auto mt-3 h-[8.5rem] w-full max-w-lg sm:mt-5 sm:h-[12rem] lg:mt-2 lg:h-[23rem] lg:flex-1">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 420" preserveAspectRatio="none" aria-hidden="true">
              <path d="M400 210 C310 210 260 95 145 95" fill="none" stroke="#a5a4e7" strokeWidth="2" />
              <path d="M400 210 C500 210 540 95 655 95" fill="none" stroke="#a5a4e7" strokeWidth="2" />
              <path d="M400 210 C310 210 260 325 145 325" fill="none" stroke="#a5a4e7" strokeWidth="2" />
              <path d="M400 210 C500 210 540 325 655 325" fill="none" stroke="#a5a4e7" strokeWidth="2" />
              <circle cx="270" cy="153" r="4" fill="#514eb8" />
              <circle cx="530" cy="153" r="4" fill="#514eb8" />
              <circle cx="270" cy="267" r="4" fill="#514eb8" />
              <circle cx="530" cy="267" r="4" fill="#514eb8" />
            </svg>

            {hotelModules.map(({ label, code, Icon, className }) => (
              <div key={code} className={`absolute z-10 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 shadow-sm sm:gap-2 sm:px-3 sm:py-2 ${className}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-[8px] font-bold text-indigo-700 sm:h-8 sm:w-8 sm:text-[10px]">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <span className="text-[9px] font-semibold text-slate-700 sm:text-[11px]">{label}</span>
              </div>
            ))}

            <div className="absolute left-1/2 top-1/2 z-10 flex h-[5.5rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-indigo-100 bg-white text-center shadow-[0_0_0_10px_rgba(81,78,184,0.08)] sm:h-28 sm:w-28 lg:h-36 lg:w-36">
              <Building2 className="h-5 w-5 text-indigo-700 sm:h-7 sm:w-7" />
              <span className="mt-1.5 max-w-[4.5rem] break-words text-[8px] font-bold text-slate-800 sm:max-w-20 sm:text-[10px]">{appName}</span>
              <span className="mt-0.5 text-[6px] font-semibold uppercase tracking-wider text-indigo-500 sm:text-[8px]">Hotel platform</span>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2 self-center rounded-full bg-indigo-50 px-4 py-2 text-[9px] font-medium text-slate-600 sm:px-5 sm:text-[10px] lg:mt-2">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
            Connected teams. One hotel operation.
          </div>
        </aside>

        <main className="my-auto flex min-h-[25rem] w-full max-w-[26rem] flex-col self-center rounded-2xl border border-white/70 bg-white/95 px-5 py-7 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:min-h-[29rem] sm:px-9 sm:py-9 lg:col-start-2 lg:my-8 lg:max-w-none lg:min-h-0 lg:px-10 lg:py-12 xl:px-14">
          <div className="flex flex-1 flex-col justify-center py-3 lg:mx-auto lg:w-full lg:max-w-[22rem]">
            {children}
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[9px] text-slate-400 lg:mx-auto lg:w-full lg:max-w-[22rem] lg:text-[10px]">
            <span>{appSubtitle} · {new Date().getFullYear()}</span>
            <span className="text-slate-300">Secure Google authentication</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
