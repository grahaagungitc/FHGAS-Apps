import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

function canonicalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, canonicalizeValue(nestedValue)]),
    );
  }
  return value;
}

export function createDigitalSignature(
  payload: Record<string, unknown>,
  timestampOverride?: string,
) {
  const timestamp = timestampOverride ?? new Date().toISOString();
  const normalized = JSON.stringify(canonicalizeValue({
    ...payload,
    timestamp,
  }));

  return {
    timestamp,
    signature: crypto.createHash("sha256").update(normalized).digest("hex"),
  };
}

export class SaaRequestError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface SubmitSaaRequestInput {
  userId: string;
  formConfigId: string;
  formData: Record<string, unknown>;
  targetDepartmentId?: string;
  requesterName?: string;
  actionType?: string;
  reason?: string;
}

export async function submitSaaRequest(input: SubmitSaaRequestInput) {
  const [requester, formConfig] = await Promise.all([
    db.user.findUnique({ where: { id: input.userId } }),
    db.saaFormConfig.findUnique({
      where: { id: input.formConfigId },
      include: {
        fields: { include: { field: true } },
        approvalSteps: {
          include: { approvalStep: true },
          orderBy: { step: "asc" },
        },
      },
    }),
  ]);

  if (!requester) throw new SaaRequestError("Akun pemohon tidak ditemukan.", 401);
  if (!formConfig?.isActive) throw new SaaRequestError("Form SAA tidak aktif atau tidak ditemukan.");
  if (formConfig.approvalSteps.length === 0) {
    throw new SaaRequestError("Alur approval belum dikonfigurasi untuk form ini.");
  }

  for (const configuredField of formConfig.fields) {
    const fieldValue = input.formData[configuredField.field.fieldKey];
    const fieldType = configuredField.fieldType ?? configuredField.field.fieldType;
    const isRequired = configuredField.isRequired ?? configuredField.field.isRequired;
    const isRequiredCheckbox = fieldType === "CHECKBOX";
    const resolvedValue =
      configuredField.source === "REQUESTER_EMAIL"
        ? requester.email
        : fieldValue;
    if (
      isRequired &&
      (isRequiredCheckbox
        ? resolvedValue !== true
        : resolvedValue === undefined || resolvedValue === null || resolvedValue === "" ||
          (typeof resolvedValue === "string" && !resolvedValue.trim()))
    ) {
      throw new SaaRequestError(`Field '${configuredField.label ?? configuredField.field.label}' wajib diisi.`);
    }
  }

  const departmentField = formConfig.fields.find((field) => field.source === "DEPARTMENT");
  const configuredDepartmentId = departmentField
    ? input.formData[departmentField.field.fieldKey]
    : undefined;
  const targetDepartmentId =
    (typeof configuredDepartmentId === "string" && configuredDepartmentId) ||
    input.targetDepartmentId ||
    requester.departmentId ||
    "";
  const targetDepartment = targetDepartmentId
    ? await db.department.findUnique({ where: { id: targetDepartmentId } })
    : null;
  if (!targetDepartment) {
    throw new SaaRequestError("Pilih departemen pada form atau minta Admin mengatur binding Department.");
  }

  const requesterNameField = formConfig.fields.find((field) => field.source === "REQUESTER_NAME");
  const configuredName = requesterNameField
    ? input.formData[requesterNameField.field.fieldKey]
    : undefined;
  const requesterName =
    (typeof configuredName === "string" && configuredName.trim()) ||
    input.requesterName?.trim() ||
    requester.name;
  if (!requesterName.trim()) throw new SaaRequestError("Nama pemohon wajib diisi.");

  const reasonField = formConfig.fields.find((field) => field.source === "REASON");
  const configuredReason = reasonField ? input.formData[reasonField.field.fieldKey] : undefined;
  const reason =
    (typeof configuredReason === "string" && configuredReason.trim()) ||
    input.reason?.trim() ||
    "";

  const actionType = formConfig.fields
    .filter((field) => field.source === "REQUEST_TYPE")
    .flatMap((field) => {
      const value = input.formData[field.field.fieldKey];
      const fieldType = field.fieldType ?? field.field.fieldType;
      if (fieldType === "CHECKBOX") return value === true ? [field.label ?? field.field.label] : [];
      if (typeof value === "string" && value.trim()) return [value.trim()];
      if (typeof value === "number") return [String(value)];
      return [];
    })
    .join(", ") || input.actionType?.trim() || formConfig.name;

  const accessDetails = { ...input.formData };
  for (const configuredField of formConfig.fields) {
    switch (configuredField.source) {
      case "REQUESTER_NAME":
        accessDetails[configuredField.field.fieldKey] = requesterName;
        break;
      case "REQUESTER_EMAIL":
        accessDetails[configuredField.field.fieldKey] = requester.email;
        break;
      case "DEPARTMENT":
        accessDetails[configuredField.field.fieldKey] = targetDepartment.id;
        break;
      case "REASON":
        accessDetails[configuredField.field.fieldKey] = reason;
        break;
    }
  }

  const assignedSteps = [];
  for (const formStep of formConfig.approvalSteps) {
    const role = formStep.role ?? formStep.approvalStep.role;
    const stepLabel = formStep.label ?? formStep.approvalStep.label;
    const approver = await db.user.findFirst({
      where: {
        id: { not: requester.id },
        ...(role === "HOD" ? { departmentId: targetDepartment.id } : {}),
        userRoles: { some: { SystemRole: { is: { code: role } } } },
      },
    });

    if (!approver) {
      throw new SaaRequestError(`Belum ada approver aktif untuk role ${stepLabel} (${role}).`, 409);
    }

    assignedSteps.push({
      stepId: formStep.stepId,
      stepOrder: formStep.step,
      assignedToUserId: approver.id,
      status: assignedSteps.length === 0 ? "PENDING" : "WAITING",
    });
  }

  return db.$transaction(async (tx) => {
    const request = await tx.saaRequest.create({
      data: {
        userId: requester.id,
        formConfigId: formConfig.id,
        name: requesterName.trim(),
        email: requester.email,
        position: requester.position ?? "",
        department: targetDepartment.name,
        formType: formConfig.code,
        actionType,
        accessDetails: accessDetails as Prisma.InputJsonValue,
        reason,
        currentStep: formConfig.approvalSteps[0].step,
        approvalTasks: { create: assignedSteps },
      },
      include: { approvalTasks: { orderBy: { stepOrder: "asc" } } },
    });

    const requesterSignature = createDigitalSignature({
      requestId: request.id,
      requestNumber: request.requestNumber,
      signerName: requesterName.trim(),
      signerRole: "PEMOHON",
      action: "REQUEST_SUBMITTED",
      decision: "SUBMITTED",
    });

    await tx.saaRequest.update({
      where: { id: request.id },
      data: {
        requesterSignature: requesterSignature.signature,
        requesterSignedAt: new Date(requesterSignature.timestamp),
        requesterSignedByName: requesterName.trim(),
        requesterSignedByRole: "PEMOHON",
      },
    });

    await tx.notification.create({
      data: {
        userId: assignedSteps[0].assignedToUserId,
        saaRequestId: request.id,
        referenceKey: `step-${assignedSteps[0].stepOrder}`,
        title: "SAA menunggu approval Anda",
        message: `${request.name} meminta akses ${formConfig.name}; giliran Anda untuk meninjau.`,
        href: `/dashboard/it/saa/${request.id}`,
      },
    });
    return request;
  });
}