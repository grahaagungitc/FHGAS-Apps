import { auth } from "@/auth";
import { db } from "@/lib/db";
import DashboardHome from "@/components/DashboardHome";
import {
  getDashboardShortcutOptions,
  getDefaultDashboardPreferences,
  getSavedDashboardPreferences,
} from "@/lib/dashboard-customization";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";
  const email = session?.user?.email;
  const user = email
    ? await db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      })
    : null;

  const shortcuts = await getDashboardShortcutOptions(email);
  const defaults = getDefaultDashboardPreferences(shortcuts);
  const [preferences, pendingSaa, approvedSaa, rejectedSaa, totalSaa, users, departments] = await Promise.all([
    user ? getSavedDashboardPreferences(user.id, shortcuts) : Promise.resolve(defaults),
    db.saaRequest.count({ where: { status: "PENDING" } }),
    db.saaRequest.count({ where: { status: "APPROVED" } }),
    db.saaRequest.count({ where: { status: "REJECTED" } }),
    db.saaRequest.count(),
    db.user.count(),
    db.department.count(),
  ]);

  return (
    <DashboardHome
      userName={userName}
      shortcuts={shortcuts}
      preferences={preferences}
      defaultPreferences={getDefaultDashboardPreferences(shortcuts)}
      metricValues={{ pendingSaa, approvedSaa, rejectedSaa, totalSaa, users, departments }}
    />
  );
}