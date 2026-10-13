import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getUserModuleAccess } from "@/lib/module-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const moduleAccess = await getUserModuleAccess(session.user?.email);

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <DashboardShell
      user={{
        name: session.user?.name,
        email: session.user?.email,
        systemRole: (session.user as any)?.systemRole,
        isIT: (session.user as any)?.isIT,
        moduleCodes: moduleAccess.moduleCodes,
        isFOLeader: moduleAccess.isFOLeader,
      }}
      signOutAction={handleSignOut}
    >
      {children}
    </DashboardShell>
  );
}