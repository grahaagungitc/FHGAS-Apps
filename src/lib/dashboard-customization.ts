import { db } from "@/lib/db";
import { getUserModuleAccess } from "@/lib/module-access";
import { DASHBOARD_METRICS, type DashboardMetricKey, type DashboardPreferences, type DashboardShortcutOption } from "@/lib/dashboard-constants";

export { DASHBOARD_METRICS } from "@/lib/dashboard-constants";
export type { DashboardMetricKey, DashboardPreferences, DashboardShortcutOption } from "@/lib/dashboard-constants";

const PREFERENCE_KEY_PREFIX = "USER_DASHBOARD_PREFERENCES:";
const DEFAULT_SHORTCUT_CODES = ["IT_SAA", "IT_FAILOVER", "SETUP_DEPTS", "SETUP_USERS"];
const DEFAULT_METRIC_KEYS: DashboardMetricKey[] = ["pendingSaa", "approvedSaa", "users", "departments"];
const MAX_SHORTCUTS = 8;

const BUILTIN_SHORTCUTS: DashboardShortcutOption[] = [
  { code: "DASHBOARD", name: "Dashboard", category: "General", path: "/dashboard" },
  { code: "NOTIFICATIONS", name: "Notifications", category: "General", path: "/dashboard/notifications" },
  { code: "SETUP_THEME", name: "UI & Branding", category: "System Setup", path: "/dashboard/setup/theme" },
  { code: "SETUP_ACCESS_REQUESTS", name: "Access Requests", category: "System Setup", path: "/dashboard/setup/access-requests" },
];

export async function getDashboardShortcutOptions(email?: string | null) {
  const access = await getUserModuleAccess(email);
  const modules = await db.appModule.findMany({
    where: { path: { not: null } },
    select: { code: true, name: true, category: true, path: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const options = new Map<string, DashboardShortcutOption>();
  for (const appModule of modules) {
    if (!appModule.path?.startsWith("/dashboard")) continue;
    const isSetup = appModule.path.startsWith("/dashboard/setup");
    const hasLegacyAccess =
      (appModule.code === "IT_SAA" && access.isIT) ||
      (appModule.code === "FO_FRONT_DESK" && access.isFOLeader);
    if (!access.isAdmin && (isSetup || (!hasLegacyAccess && !access.moduleCodes.includes(appModule.code)))) continue;
    options.set(appModule.code, { ...appModule, path: appModule.path });
  }

  for (const shortcut of BUILTIN_SHORTCUTS) {
    const isSetup = shortcut.path.startsWith("/dashboard/setup");
    if (!access.isAdmin && isSetup) continue;
    options.set(shortcut.code, shortcut);
  }

  return [...options.values()];
}

export function getDefaultDashboardPreferences(options: DashboardShortcutOption[]): DashboardPreferences {
  const availableCodes = new Set(options.map((option) => option.code));
  const preferredShortcuts = DEFAULT_SHORTCUT_CODES.filter((code) => availableCodes.has(code));
  return {
    shortcutCodes: (preferredShortcuts.length > 0
      ? preferredShortcuts
      : options.slice(0, 4).map((option) => option.code)
    ).slice(0, MAX_SHORTCUTS),
    metricKeys: [...DEFAULT_METRIC_KEYS],
  };
}

export async function getSavedDashboardPreferences(
  userId: string,
  options: DashboardShortcutOption[]
): Promise<DashboardPreferences> {
  const defaults = getDefaultDashboardPreferences(options);
  const setting = await db.systemSetting.findUnique({
    where: { key: `${PREFERENCE_KEY_PREFIX}${userId}` },
  });
  if (!setting) return defaults;

  try {
    const saved = JSON.parse(setting.value) as Partial<DashboardPreferences>;
    const availableCodes = new Set(options.map((option) => option.code));
    const validMetricKeys = new Set<string>(DASHBOARD_METRICS.map((metric) => metric.key));
    const shortcutCodes = Array.isArray(saved.shortcutCodes)
      ? [...new Set(saved.shortcutCodes.filter((code): code is string => typeof code === "string" && availableCodes.has(code)))].slice(0, MAX_SHORTCUTS)
      : defaults.shortcutCodes;
    const metricKeys = Array.isArray(saved.metricKeys)
      ? Array.from(new Set(saved.metricKeys.filter((key): key is DashboardMetricKey => typeof key === "string" && validMetricKeys.has(key))))
      : defaults.metricKeys;

    return { shortcutCodes, metricKeys: metricKeys.length > 0 ? metricKeys : defaults.metricKeys };
  } catch {
    return defaults;
  }
}

export function getDashboardPreferenceKey(userId: string) {
  return `${PREFERENCE_KEY_PREFIX}${userId}`;
}

export const MAX_DASHBOARD_SHORTCUTS = MAX_SHORTCUTS;