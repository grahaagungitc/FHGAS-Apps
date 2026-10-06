import { Prisma } from "@prisma/client";
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
    canEdit:
      (request.userId === user.id || user.systemRole === "ADMIN" || user.isIT) &&
      request.status === "PENDING",
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; systemRole?: string; isIT?: boolean }
    | undefined;
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  if (!body || typeof body.formData !== "object" || Array.isArray(body.formData)) {
    return NextResponse.json({ message: "Data pengajuan tidak lengkap." }, { status: 400 });
  }

  const saaRequest = await db.saaRequest.findUnique({
    where: { id: params.id },
    include: {
      formConfig: {
        include: {
          fields: {
            include: { field: true },
            orderBy: { order: "asc" },
          },
        },
      },
      approvalTasks: true,
    },
  });

  if (!saaRequest) {
    return NextResponse.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
  }

  const canManageRequest =
    user.systemRole === "ADMIN" || user.isIT || saaRequest.userId === user.id;
  if (!canManageRequest) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (saaRequest.status !== "PENDING") {
    return NextResponse.json({ message: "Pengajuan yang sudah diproses tidak bisa diedit." }, { status: 400 });
  }

  if (!saaRequest.formConfig) {
    return NextResponse.json({ message: "Konfigurasi form tidak ditemukan." }, { status: 400 });
  }

  const formData = { ...body.formData };
  for (const configuredField of saaRequest.formConfig.fields) {
    const fieldValue = formData[configuredField.field.fieldKey];
    const fieldType = configuredField.fieldType ?? configuredField.field.fieldType;
    const isRequired = configuredField.isRequired ?? configuredField.field.isRequired;
    const isRequiredCheckbox = fieldType === "CHECKBOX";
    const resolvedValue =
      configuredField.source === "REQUESTER_EMAIL"
        ? saaRequest.email
        : fieldValue;

    if (
      isRequired &&
      (isRequiredCheckbox
        ? resolvedValue !== true
        : resolvedValue === undefined ||
          resolvedValue === null ||
          resolvedValue === "" ||
          (typeof resolvedValue === "string" && !resolvedValue.trim()))
    ) {
      return NextResponse.json(
        { message: `Field '${configuredField.label ?? configuredField.field.label}' wajib diisi.` },
        { status: 400 }
      );
    }
  }

  const requesterName =
    typeof body.requesterName === "string" && body.requesterName.trim()
      ? body.requesterName.trim()
      : saaRequest.name;
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : saaRequest.reason;
  const actionType =
    typeof body.actionType === "string" && body.actionType.trim()
      ? body.actionType.trim()
      : saaRequest.actionType;

  const accessDetails = { ...formData };
  const departmentId =
    typeof formData["department"] === "string" && formData["department"]
      ? formData["department"]
      : typeof body.targetDepartmentId === "string" && body.targetDepartmentId
        ? body.targetDepartmentId
        : undefined;

  for (const configuredField of saaRequest.formConfig.fields) {
    switch (configuredField.source) {
      case "REQUESTER_NAME":
        accessDetails[configuredField.field.fieldKey] = requesterName;
        break;
      case "REQUESTER_EMAIL":
        accessDetails[configuredField.field.fieldKey] = saaRequest.email;
        break;
      case "DEPARTMENT":
        accessDetails[configuredField.field.fieldKey] = departmentId || "";
        break;
      case "REASON":
        accessDetails[configuredField.field.fieldKey] = reason;
        break;
      default:
        break;
    }
  }

  const updated = await db.saaRequest.update({
    where: { id: saaRequest.id },
    data: {
      name: requesterName,
      actionType,
      reason,
      accessDetails: accessDetails as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    message: "Pengajuan SAA berhasil diperbarui.",
    requestId: updated.id,
  });
}
