"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  Building2,
  FileSignature,
  LayoutDashboard,
  Pencil,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import { useAppNotifications } from "@/components/AppNotificationProvider";
import { DASHBOARD_METRICS,
  type DashboardMetricKey,
  type DashboardPreferences,
  type DashboardShortcutOption,
} from "@/lib/dashboard-constants";

interface DashboardHomeProps {
  userName: string;
  shortcuts: DashboardShortcutOption[];
  preferences: DashboardPreferences;
  defaultPreferences: DashboardPreferences;
  metricValues: Record<DashboardMetricKey, number>;
}

const SHORTCUT_ICONS: Record<string, LucideIcon> = {
  DASHBOARD: LayoutDashboard,
  NOTIFICATIONS: Bell,
  IT_SAA: FileSignature,
  IT_FAILOVER: Activity,
  FO_FRONT_DESK: FileSignature,
  FO_CONCIERGE: Bell,
  FIN_LEADER: ShieldCheck,
  FIN_AP_CASHIER: Building2,
  FIN_PURCHASING: Building2,
  AG_HOTEL_MANAGER: ShieldCheck,
  DEPT_HR: Users,
  DEPT_SALES: Users,
  DEPT_ENG: Settings,
  DEPT_HK: Building2,
  DEPT_FB: Building2,
  DEPT_SEC: ShieldAlert,
  SETUP_USERS: Users,
  SETUP_ROLES: ShieldCheck,
  SETUP_DEPTS: Building2,
  SETUP_SAA_CONFIG: SlidersHorizontal,
  SETUP_THEME: SlidersHorizontal,
  SETUP_ACCESS_REQUESTS: ShieldCheck,
};

const METRIC_COLORS: Record<DashboardMetricKey, string> = {
  pendingSaa: "bg-cyan-700",
  approvedSaa: "bg-emerald-700",
  rejectedSaa: "bg-rose-700",
  totalSaa: "bg-indigo-700",
  users: "bg-slate-800",
  departments: "bg-amber-700",
};

export default function DashboardHome({
  userName,
  shortcuts,
  preferences,
  defaultPreferences,
  metricValues,
}: DashboardHomeProps) {
  const { notify } = useAppNotifications();
  const [selectedPreferences, setSelectedPreferences] = useState(preferences);
  const [draftPreferences, setDraftPreferences] = useState(preferences);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const shortcutByCode = new Map(shortcuts.map((shortcut) => [shortcut.code, shortcut]));
  const selectedShortcuts = selectedPreferences.shortcutCodes
    .map((code) => shortcutByCode.get(code))
    .filter((shortcut): shortcut is DashboardShortcutOption => Boolean(shortcut));
  const selectedMetrics = DASHBOARD_METRICS.filter((metric) =>
    selectedPreferences.metricKeys.includes(metric.key)
  );

  const openEditor = () => {
    setDraftPreferences({
      shortcutCodes: [...selectedPreferences.shortcutCodes],
      metricKeys: [...selectedPreferences.metricKeys],
    });
    setIsEditorOpen(true);
  };

  const toggleShortcut = (code: string) => {
    setDraftPreferences((current) => {
      const selected = current.shortcutCodes.includes(code);
      if (!selected && current.shortcutCodes.length >= 8) {
        notify("Maksimal 8 shortcut dapat ditampilkan.", "warning");
        return current;
      }
      return {
        ...current,
        shortcutCodes: selected
          ? current.shortcutCodes.filter((item) => item !== code)
          : [...current.shortcutCodes, code],
      };
    });
  };

  const toggleMetric = (key: DashboardMetricKey) => {
    setDraftPreferences((current) => {
      const selected = current.metricKeys.includes(key);
      if (selected && current.metricKeys.length === 1) {
        notify("Pilih minimal satu metric untuk dashboard.", "warning");
        return current;
      }
      return {
        ...current,
        metricKeys: selected
          ? current.metricKeys.filter((item) => item !== key)
          : [...current.metricKeys, key],
      };
    });
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPreferences),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.message || "Pengaturan dashboard gagal disimpan.", "error");
        return;
      }
      setSelectedPreferences(result.preferences);
      setIsEditorOpen(false);
      notify("Dashboard berhasil diperbarui.", "success");
    } catch {
      notify("Tidak dapat menyimpan pengaturan dashboard.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-8">
      <div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-400">Howdy,</p>
          <h1 className="mt-0.5 break-words text-3xl font-extrabold text-slate-800">{userName}</h1>
        </div>
      </div>

      <button
        type="button"
        onClick={openEditor}
        aria-label="Edit dashboard"
        title="Edit dashboard"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 lg:bottom-6 lg:right-6"
      >
        <Pencil className="h-5 w-5" />
      </button>

      <GlobalSearchBar />

      <section className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">Quick Actions</h2>
          <span className="text-xs font-medium text-slate-400">{selectedShortcuts.length}/8 shortcut</span>
        </div>
        {selectedShortcuts.length > 0 ? (
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {selectedShortcuts.map((shortcut) => {
              const Icon = SHORTCUT_ICONS[shortcut.code] || LayoutDashboard;
              return (
                <Link
                  key={shortcut.code}
                  href={shortcut.path}
                  className="flex min-h-28 min-w-0 flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="w-full break-words text-xs font-bold text-slate-800">{shortcut.name}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm font-medium text-slate-500">Belum ada shortcut yang dipilih.</p>
            <button type="button" onClick={openEditor} className="mt-2 text-sm font-bold text-indigo-700 hover:underline">
              Pilih menu
            </button>
          </div>
        )}
      </section>

      <section className="min-w-0 space-y-4">
        <h2 className="text-base font-bold text-slate-800">System Overview & Metrics</h2>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {selectedMetrics.map((metric) => (
            <article key={metric.key} className={`${METRIC_COLORS[metric.key]} min-w-0 rounded-lg p-4 text-white shadow-sm sm:p-5`}>
              <p className="break-words text-xs font-semibold text-white/80">{metric.label}</p>
              <p className="mt-2 truncate text-2xl font-black tabular-nums sm:text-3xl">
                {metricValues[metric.key].toLocaleString("id-ID")}
              </p>
            </article>
          ))}
        </div>
      </section>

      {isEditorOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-editor-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="min-w-0">
                <h2 id="dashboard-editor-title" className="text-lg font-bold text-slate-900">Sesuaikan Dashboard</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih shortcut dan metrics yang ingin ditampilkan.</p>
              </div>
              <button
                type="button"
                aria-label="Tutup pengaturan dashboard"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-bold text-slate-800">Quick Actions <span className="font-medium text-slate-400">(maks. 8)</span></legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {shortcuts.map((shortcut) => {
                    const checked = draftPreferences.shortcutCodes.includes(shortcut.code);
                    const Icon = SHORTCUT_ICONS[shortcut.code] || LayoutDashboard;
                    return (
                      <label key={shortcut.code} className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleShortcut(shortcut.code)}
                          className="h-4 w-4 shrink-0 accent-indigo-600"
                        />
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-semibold text-slate-800">{shortcut.name}</span>
                          <span className="block break-words text-xs text-slate-500">{shortcut.category}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {shortcuts.length === 0 && <p className="text-sm text-slate-500">Tidak ada menu tambahan yang tersedia untuk akun ini.</p>}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-bold text-slate-800">System Overview</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DASHBOARD_METRICS.map((metric) => (
                    <label key={metric.key} className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={draftPreferences.metricKeys.includes(metric.key)}
                        onChange={() => toggleMetric(metric.key)}
                        className="h-4 w-4 shrink-0 accent-indigo-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-semibold text-slate-800">{metric.label}</span>
                        <span className="block text-xs text-slate-500">{metric.group}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setDraftPreferences(defaultPreferences)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Kembalikan default
              </button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saving || draftPreferences.metricKeys.length === 0}
                  onClick={savePreferences}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
