import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RootPage() {
  const session = await auth();

  // Jika user belum login, redirect ke halaman login
  if (!session) {
    redirect("/login");
  }

  // Jika sudah login, redirect ke dashboard
  redirect("/dashboard");
}