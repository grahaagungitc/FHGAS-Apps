import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

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
      }}
      signOutAction={handleSignOut}
    >
      {children}
    </DashboardShell>
  );
}