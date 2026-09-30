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
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-black text-slate-900">Notifikasi</h1>
        </div>
        <button onClick={markAllRead} className="inline-flex items-center gap-2 border-2 border-slate-900 bg-white px-3 py-2 text-xs font-bold hover:bg-cyan-50">
          <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600">Memuat notifikasi...</p>
      ) : items.length === 0 ? (
        <p className="border-y border-slate-300 py-8 text-center text-sm text-slate-500">Belum ada notifikasi.</p>
      ) : (
        <ul className="divide-y divide-slate-300 border-y border-slate-300">
          {items.map((item) => (
            <li key={item.id} className={`flex items-start justify-between gap-4 py-4 ${item.readAt ? "opacity-60" : ""}`}>
              <Link href={item.href} onClick={() => void markRead(item.id)} className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                  {!item.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-600" />}
                  {item.title}
                </span>
                <span className="mt-1 block text-sm text-slate-700">{item.message}</span>
                <time className="mt-1 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("id-ID")}</time>
              </Link>
              {!item.readAt && (
                <button onClick={() => void markRead(item.id)} className="shrink-0 text-xs font-bold text-cyan-800 underline">
                  Tandai dibaca
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
