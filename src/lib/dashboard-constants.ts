export const DASHBOARD_METRICS = [
  { key: "pendingSaa", label: "Pending SAA", group: "SAA" },
  { key: "approvedSaa", label: "Approved SAA", group: "SAA" },
  { key: "rejectedSaa", label: "Rejected SAA", group: "SAA" },
  { key: "totalSaa", label: "Total SAA Requests", group: "SAA" },
  { key: "users", label: "Active Users", group: "System" },
  { key: "departments", label: "Departments", group: "System" },
] as const;

export type DashboardMetricKey = (typeof DASHBOARD_METRICS)[number]["key"];

export type DashboardPreferences = {
  shortcutCodes: string[];
  metricKeys: DashboardMetricKey[];
};

export type DashboardShortcutOption = {
  code: string;
  name: string;
  category: string;
  path: string;
};