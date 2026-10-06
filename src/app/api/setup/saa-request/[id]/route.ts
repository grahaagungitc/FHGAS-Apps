import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; systemRole?: string; isIT?: boolean }
    | undefined;
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }
  const request = await db.saaRequest.findUnique({
    where: { id: params.id },
    include: {
      formConfig: {
        include: {
          fields: {
            include: { field: true },
            orderBy: { order: "asc" },
          },
          approvalSteps: {
            include: { approvalStep: true },
            orderBy: { step: "asc" },
          },
        },
      },
      user: { select: { id: true, name: true, email: true } },
      approvalTasks: {
        include: { step: true, assignedTo: { select: { id: true, name: true } } },
        orderBy: { stepOrder: "asc" },
      },
      history: {
        include: { approver: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
  }
  const isAssignedApprover = request.approvalTasks.some(
    (task) => task.assignedToUserId === user.id
  );
  if (
    user.systemRole !== "ADMIN" &&
    !user.isIT &&
    request.userId !== user.id &&
    !isAssignedApprover
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ...request,
    formConfig: request.formConfig
      ? {
          id: request.formConfig.id,
          name: request.formConfig.name,
          sections: Array.isArray(request.formConfig.sections)
            ? request.formConfig.sections.filter((section): section is string => typeof section === "string")
            : [],
          fields: request.formConfig.fields.map((field) => ({
            fieldKey: field.field.fieldKey,
            label: field.label ?? field.field.label,
            fieldType: field.fieldType ?? field.field.fieldType,
            source: field.source,
            section: field.section,
            order: field.order,
          })),
        }
      : null,
    approvalTasks: request.approvalTasks.map((task) => {
      const configuredStep = request.formConfig?.approvalSteps.find(
        (step) => step.stepId === task.stepId
      );
      return {
        ...task,
        step: {
          ...task.step,
          role: configuredStep?.role ?? task.step.role,
          label: configuredStep?.label ?? task.step.label,
        },
      };
    }),
    canApprove: request.approvalTasks.some(
      (task) =>
        task.assignedToUserId === user.id && task.status === "PENDING"
    ),
  });
}
