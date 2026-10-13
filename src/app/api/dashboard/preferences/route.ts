import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DASHBOARD_METRICS, type DashboardMetricKey } from "@/lib/dashboard-constants";
import {
  getDashboardPreferenceKey,
  getDashboardShortcutOptions,
  getSavedDashboardPreferences,
  MAX_DASHBOARD_SHORTCUTS,
} from "@/lib/dashboard-customization";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return db.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { id: true, email: true },
  });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const shortcuts = await getDashboardShortcutOptions(user.email);
    const preferences = await getSavedDashboardPreferences(user.id, shortcuts);

    return NextResponse.json({ shortcuts, metrics: DASHBOARD_METRICS, preferences });
  } catch (error) {
    console.error("GET /api/dashboard/preferences error:", error);
    return NextResponse.json({ message: "Gagal memuat pengaturan dashboard." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const body = await request.json();
    const shortcutCodes = body.shortcutCodes;
    const metricKeys = body.metricKeys;
    if (!Array.isArray(shortcutCodes) || !Array.isArray(metricKeys)) {
      return NextResponse.json({ message: "Pilih shortcut dan metrics dashboard yang valid." }, { status: 400 });
    }
    if (shortcutCodes.length > MAX_DASHBOARD_SHORTCUTS || shortcutCodes.some((code) => typeof code !== "string")) {
      return NextResponse.json({ message: `Dashboard maksimal memiliki ${MAX_DASHBOARD_SHORTCUTS} shortcut.` }, { status: 400 });
    }

    const options = await getDashboardShortcutOptions(user.email);
    const allowedCodes = new Set(options.map((option) => option.code));
    if (new Set(shortcutCodes).size !== shortcutCodes.length || shortcutCodes.some((code) => !allowedCodes.has(code))) {
      return NextResponse.json({ message: "Ada shortcut yang tidak tersedia untuk akun ini." }, { status: 403 });
    }

    const allowedMetrics = new Set<string>(DASHBOARD_METRICS.map((metric) => metric.key));
    if (
      metricKeys.length === 0 ||
      new Set(metricKeys).size !== metricKeys.length ||
      metricKeys.some((key) => typeof key !== "string" || !allowedMetrics.has(key))
    ) {
      return NextResponse.json({ message: "Pilih minimal satu metrics dashboard yang valid." }, { status: 400 });
    }

    const preferences = {
      shortcutCodes: shortcutCodes as string[],
      metricKeys: metricKeys as DashboardMetricKey[],
    };
    await db.systemSetting.upsert({
      where: { key: getDashboardPreferenceKey(user.id) },
      update: { value: JSON.stringify(preferences) },
      create: { key: getDashboardPreferenceKey(user.id), value: JSON.stringify(preferences) },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error("POST /api/dashboard/preferences error:", error);
    return NextResponse.json({ message: "Gagal menyimpan pengaturan dashboard." }, { status: 500 });
  }
}