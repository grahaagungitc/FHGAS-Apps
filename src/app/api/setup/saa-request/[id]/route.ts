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
      formConfig: true,
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
    canApprove: request.approvalTasks.some(
      (task) =>
        task.assignedToUserId === user.id && task.status === "PENDING"
    ),
  });
}
