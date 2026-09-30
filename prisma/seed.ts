import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { code: "ADMIN", name: "Administrator" },
    { code: "STAFF", name: "Staff" },
  ];
  for (const role of roles) {
    await prisma.systemRole.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: { ...role, isSystem: true },
    });
  }

  const departments = [
    ["ADMIN", "Admin & General"],
    ["HR", "Human Resource"],
    ["FIN", "Finance & Accounting"],
    ["FO", "Front Office"],
    ["SALES", "Sales & Marketing"],
    ["ENG", "Engineering"],
    ["HK", "Housekeeping"],
    ["IT", "IT Department"],
    ["FB", "Food & Beverage"],
    ["SEC", "Security"],
  ];
  for (const [code, name] of departments) {
    const [departmentWithCode, departmentWithName] = await Promise.all([
      prisma.department.findUnique({ where: { code } }),
      prisma.department.findUnique({ where: { name } }),
    ]);
    if (!departmentWithCode && !departmentWithName) {
      await prisma.department.create({ data: { code, name } });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: process.env.ADMIN_NAME?.trim() || "System Administrator",
      },
    });
    const adminRole = await prisma.systemRole.findUniqueOrThrow({
      where: { code: "ADMIN" },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  } else {
    console.warn("ADMIN_EMAIL is not set; no bootstrap administrator was created.");
  }

  const actionTypeField = await prisma.saaField.upsert({
    where: { fieldKey: "actionType" },
    update: {},
    create: {
      fieldKey: "actionType",
      label: "Request type",
      fieldType: "SELECT",
      section: "ACTION",
      options: ["Create Account", "Modify Account", "Suspend Account", "Delete Account"],
      isRequired: true,
    },
  });
  const activeForms = await prisma.saaFormConfig.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  for (const activeForm of activeForms) {
    await prisma.saaFormField.upsert({
      where: {
        formConfigId_fieldId: {
          formConfigId: activeForm.id,
          fieldId: actionTypeField.id,
        },
      },
      update: { order: 1, section: "ACTION" },
      create: {
        formConfigId: activeForm.id,
        fieldId: actionTypeField.id,
        order: 1,
        section: "ACTION",
      },
    });
  }

  console.log("Seeded roles, departments, and action type for active SAA forms.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });