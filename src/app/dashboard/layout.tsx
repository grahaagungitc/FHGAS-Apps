import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";

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
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        user={{
          name: session.user?.name,
          email: session.user?.email,
          systemRole: (session.user as any)?.systemRole,
          isIT: (session.user as any)?.isIT,
        }}
        signOutAction={handleSignOut}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex justify-end">
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}