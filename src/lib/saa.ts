import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export class SaaRequestError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface SubmitSaaRequestInput {
  userId: string;
  formConfigId: string;
  targetDepartmentId: string;
  requesterName: string;
  actionType: string;
  formData: Record<string, unknown>;
  reason: string;
}

export async function submitSaaRequest(input: SubmitSaaRequestInput) {
  const [requester, targetDepartment, formConfig] = await Promise.all([
    db.user.findUnique({ where: { id: input.userId } }),
    db.department.findUnique({ where: { id: input.targetDepartmentId } }),
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
  if (!input.requesterName.trim()) throw new SaaRequestError("Nama pemohon wajib diisi.");
  if (!targetDepartment) throw new SaaRequestError("Departemen target tidak ditemukan.");
  if (!formConfig?.isActive) throw new SaaRequestError("Form SAA tidak aktif atau tidak ditemukan.");
  if (formConfig.approvalSteps.length === 0) {
    throw new SaaRequestError("Alur approval belum dikonfigurasi untuk form ini.");
  }
  if (!input.actionType.trim()) {
    throw new SaaRequestError("Field actionType belum dipilih.");
  }
  if (!input.reason.trim()) throw new SaaRequestError("Alasan pengajuan wajib diisi.");

  for (const configuredField of formConfig.fields) {
    const fieldValue = input.formData[configuredField.field.fieldKey];
    const isRequiredCheckbox = configuredField.field.fieldType === "CHECKBOX";
    if (
      configuredField.field.isRequired &&
      (isRequiredCheckbox
        ? fieldValue !== true
        : fieldValue === undefined || fieldValue === null || fieldValue === "")
    ) {
      throw new SaaRequestError(`Field '${configuredField.field.label}' wajib diisi.`);
    }
  }

  const assignedSteps = [];
  for (const formStep of formConfig.approvalSteps) {
    const role = formStep.approvalStep.role;
    let approver = null;

    if (role === "HOD") {
      approver = await db.user.findFirst({
        where: {
          departmentId: targetDepartment.id,
          isDeptHead: true,
          id: { not: requester.id },
        },
      });
    } else if (role === "FINANCE_LEADER") {
      approver = await db.user.findFirst({ where: { isFinanceLeader: true } });
    } else if (role === "HOTEL_MANAGER") {
      approver = await db.user.findFirst({ where: { isHotelManager: true } });
    } else if (role === "IT_VERIFICATION") {
      approver = await db.user.findFirst({ where: { isIT: true } });
    } else if (role === "FO_LEADER") {
      approver = await db.user.findFirst({ where: { isFOLeader: true } });
    } else {
      throw new SaaRequestError(`Role approval '${role}' belum didukung.`);
    }

    if (!approver) {
      throw new SaaRequestError(`Belum ada approver aktif untuk role ${role}.`, 409);
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
        name: input.requesterName.trim(),
        email: requester.email,
        position: requester.position ?? "",
        department: targetDepartment.name,
        formType: formConfig.code,
        actionType: input.actionType,
        accessDetails: input.formData as Prisma.InputJsonValue,
        reason: input.reason.trim(),
        currentStep: formConfig.approvalSteps[0].step,
        approvalTasks: { create: assignedSteps },
      },
      include: { approvalTasks: { orderBy: { stepOrder: "asc" } } },
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