import { db } from "@/lib/db";
import { sendNewAccessRequestEmail } from "@/lib/email";

export async function requestUnregisteredAccess(input: {
  email: string;
  name: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existingRequest = await db.accessRequest.findUnique({ where: { email } });
  const accessRequest = await db.accessRequest.upsert({
    where: { email },
    update: {
      name: input.name,
      status: "PENDING",
      resolvedById: null,
      resolvedAt: null,
    },
    create: { email, name: input.name },
  });

  if (existingRequest?.status === "PENDING") return accessRequest;

  const admins = await db.user.findMany({
    where: {
      userRoles: {
        some: { SystemRole: { is: { code: "ADMIN" } } },
      },
    },
    select: { id: true, email: true },
  });

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      accessRequestId: accessRequest.id,
      title: "Permintaan akses baru",
      message: `${input.name} (${email}) meminta akses ke aplikasi.`,
      href: "/dashboard/setup/access-requests",
    })),
    skipDuplicates: true,
  });

  const recipients = [...new Set([
    ...admins.map((admin) => admin.email),
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || "",
  ].filter(Boolean))];

  try {
    const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const sent = await sendNewAccessRequestEmail({
      recipients,
      name: input.name,
      email,
      requestUrl: `${baseUrl}/dashboard/setup/access-requests`,
    });
    if (!sent) {
      console.warn("Access request saved, but SMTP settings are incomplete; in-app admin notification is available.");
    }
  } catch (error) {
    console.error("Access request saved, but email notification failed:", error);
  }

  return accessRequest;
}
