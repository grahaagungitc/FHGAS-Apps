"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications?all=true");
    if (response.ok) {
      const data = await response.json();
      setItems(data.notifications);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4] shrink-0">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Notifikasi</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Riwayat pemberitahuan dan aktivitas permohonan</p>
          </div>
        </div>
        <button onClick={markAllRead} className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 transition shadow-soft">
          <CheckCheck className="h-4 w-4" /> Tandai Semua Dibaca
        </button>
      </header>

      {loading ? (
        <p className="text-center py-12 text-xs font-bold text-slate-400">Memuat notifikasi...</p>
      ) : items.length === 0 ? (
        <p className="bg-white border border-slate-100 rounded-3xl py-12 text-center text-sm font-medium text-slate-400 shadow-soft">Belum ada notifikasi.</p>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-soft divide-y divide-slate-100 overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className={`flex items-start justify-between gap-4 p-5 hover:bg-slate-50/60 transition ${item.readAt ? "opacity-60" : ""}`}>
              <Link href={item.href} onClick={() => void markRead(item.id)} className="min-w-0 flex-1">
                <span className="flex items-center gap-2.5 text-sm font-extrabold text-slate-800">
                  {!item.readAt && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#5C61F4]" />}
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-slate-600 font-medium">{item.message}</span>
                <time className="mt-1.5 block text-[10px] text-slate-400 font-medium">{new Date(item.createdAt).toLocaleString("id-ID")}</time>
              </Link>
              {!item.readAt && (
                <button onClick={() => void markRead(item.id)} className="shrink-0 text-xs font-bold text-[#5C61F4] hover:underline">
                  Tandai dibaca
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
