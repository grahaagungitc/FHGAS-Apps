import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import GoogleOnboardingForm from "@/components/GoogleOnboardingForm";

export default async function CompleteSignupPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login?mode=signup");
  if ((session.user as any)?.registered !== false) redirect("/dashboard");

  const [departments, existingRequest] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.accessRequest.findUnique({
      where: { email: email.toLowerCase() },
      select: { name: true, requestedDepartmentId: true, status: true },
    }),
  ]);

  return (
    <GoogleOnboardingForm
      email={email}
      initialName={existingRequest?.name || session.user?.name || ""}
      initialDepartmentId={existingRequest?.requestedDepartmentId || ""}
      departments={departments}
    />
  );
}