import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
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
  const decision = body.decision;
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return NextResponse.json({ message: "Keputusan approval tidak valid." }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const saaRequest = await tx.saaRequest.findUnique({
        where: { id: params.id },
      });
      if (!saaRequest || saaRequest.status !== "PENDING") {
        return { error: "Pengajuan tidak ditemukan atau sudah selesai.", errorStatus: 404 };
      }

      const task = await tx.saaApprovalTask.findFirst({
        where: {
          requestId: saaRequest.id,
          stepOrder: saaRequest.currentStep,
          assignedToUserId: user.id,
          status: "PENDING",
        },
        include: { step: true },
      });
      if (!task) {
        return { error: "Anda tidak ditugaskan untuk approval ini.", errorStatus: 403 };
      }

      await tx.saaApprovalTask.update({
        where: { id: task.id },
        data: { status: decision, notes: typeof body.notes === "string" ? body.notes : null },
      });
      await tx.saaApprovalHistory.create({
        data: {
          saaRequestId: saaRequest.id,
          approverId: user.id,
          status: decision,
          notes: body.notes ? `${task.step.role}: ${String(body.notes)}` : task.step.role,
        },
      });
      await tx.notification.updateMany({
        where: { userId: user.id, saaRequestId: saaRequest.id, readAt: null },
        data: { readAt: new Date() },
      });

      if (decision === "REJECTED") {
        await tx.saaRequest.update({
          where: { id: saaRequest.id },
          data: { status: "REJECTED" },
        });
        if (saaRequest.userId) {
          await tx.notification.create({
            data: {
              userId: saaRequest.userId,
              saaRequestId: saaRequest.id,
              referenceKey: "requester-status",
              title: "Permintaan SAA ditolak",
              message: "Permintaan SAA Anda ditolak oleh approver.",
              href: `/dashboard/it/saa/${saaRequest.id}`,
            },
          });
        }
        return { status: "REJECTED" };
      }

      const nextTask = await tx.saaApprovalTask.findFirst({
        where: {
          requestId: saaRequest.id,
          status: "WAITING",
          stepOrder: { gt: task.stepOrder },
        },
        orderBy: { stepOrder: "asc" },
      });

      if (nextTask) {
        await tx.saaApprovalTask.update({
          where: { id: nextTask.id },
          data: { status: "PENDING" },
        });
        if (nextTask.assignedToUserId) {
          const nextStep = await tx.saaApprovalStep.findUnique({
            where: { id: nextTask.stepId },
          });
          await tx.notification.create({
            data: {
              userId: nextTask.assignedToUserId,
              saaRequestId: saaRequest.id,
              referenceKey: `step-${nextTask.stepOrder}`,
              title: "SAA menunggu approval Anda",
              message: `Permintaan ${saaRequest.name} kini menunggu review ${nextStep?.label || "Anda"}.`,
              href: `/dashboard/it/saa/${saaRequest.id}`,
            },
          });
        }
      } else if (saaRequest.userId) {
        await tx.notification.create({
          data: {
            userId: saaRequest.userId,
            saaRequestId: saaRequest.id,
            referenceKey: "requester-status",
            title: "Permintaan SAA disetujui",
            message: "Semua tahap approval permintaan SAA Anda telah selesai.",
            href: `/dashboard/it/saa/${saaRequest.id}`,
          },
        });
      }
      await tx.saaRequest.update({
        where: { id: saaRequest.id },
        data: {
          currentStep: nextTask?.stepOrder ?? saaRequest.currentStep,
          status: nextTask ? "PENDING" : "APPROVED",
        },
      });
      return { status: nextTask ? "PENDING" : "APPROVED" };
    });

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.errorStatus });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("SAA approval error:", error);
    return NextResponse.json({ message: "Gagal memproses approval." }, { status: 500 });
  }
}
