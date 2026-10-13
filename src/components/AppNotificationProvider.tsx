"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type NoticeType = "success" | "error" | "warning" | "info";

type ToastNotice = {
  id: number;
  message: string;
  type: NoticeType;
};

type ConfirmRequest = {
  message: string;
  resolve: (confirmed: boolean) => void;
};

type AppNotificationContextValue = {
  notify: (message: string, type?: NoticeType) => void;
  confirmAction: (message: string) => Promise<boolean>;
};

const AppNotificationContext = createContext<AppNotificationContextValue | null>(null);

const noticeStyles: Record<NoticeType, { className: string; icon: typeof Info; title: string }> = {
  success: { className: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: CheckCircle2, title: "Berhasil" },
  error: { className: "border-rose-200 bg-rose-50 text-rose-950", icon: AlertCircle, title: "Terjadi kesalahan" },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-950", icon: AlertTriangle, title: "Perhatian" },
  info: { className: "border-sky-200 bg-sky-50 text-sky-950", icon: Info, title: "Informasi" },
};

export function useAppNotifications() {
  const context = useContext(AppNotificationContext);
  if (!context) {
    throw new Error("useAppNotifications must be used within AppNotificationProvider");
  }
  return context;
}

export default function AppNotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const nextToastId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NoticeType = "info") => {
    const id = ++nextToastId.current;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const confirmAction = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => setConfirmRequest({ message, resolve }));
  }, []);

  const resolveConfirmation = (confirmed: boolean) => {
    confirmRequest?.resolve(confirmed);
    setConfirmRequest(null);
  };

  return (
    <AppNotificationContext.Provider value={{ notify, confirmAction }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => {
          const style = noticeStyles[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg ${style.className}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{style.title}</p>
                <p className="mt-1 break-words text-sm leading-5">{toast.message}</p>
              </div>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => dismissToast(toast.id)}
                className="-mr-1 -mt-1 rounded p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {confirmRequest && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-action-title"
            aria-describedby="confirm-action-message"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 id="confirm-action-title" className="text-base font-bold text-slate-900">Konfirmasi tindakan</h2>
                <p id="confirm-action-message" className="mt-2 text-sm leading-6 text-slate-600">
                  {confirmRequest.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => resolveConfirmation(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => resolveConfirmation(true)}
                className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Ya, lanjutkan
              </button>
            </div>
          </section>
        </div>
      )}
    </AppNotificationContext.Provider>
  );
}