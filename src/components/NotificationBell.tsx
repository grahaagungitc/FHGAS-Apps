"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data = await response.json();
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((current) => current.filter((item) => item.id !== id));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center border-2 border-slate-900 bg-white text-slate-900 hover:bg-cyan-50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full border border-slate-900 bg-rose-600 px-1 text-center text-[10px] font-black leading-5 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] border-2 border-slate-900 bg-white shadow-lg">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-black">Notifikasi</h2>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-cyan-800 underline"
            >
              Lihat semua
            </Link>
          </header>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Tidak ada notifikasi baru.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-200 overflow-y-auto">
              {items.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      void markAsRead(item.id);
                    }}
                    className="block px-4 py-3 hover:bg-cyan-50"
                  >
                    <span className="block text-xs font-black text-slate-900">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-600">{item.message}</span>
                    <time className="mt-1 block text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
