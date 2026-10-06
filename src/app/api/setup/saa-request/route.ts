import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SaaRequestError, submitSaaRequest } from "@/lib/saa";

type SessionUser = {
  id?: string;
  email?: string | null;
  systemRole?: string;
  isIT?: boolean;
};

export async function GET() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }
  if (user.systemRole !== "ADMIN" && !user.isIT) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const requests = await db.saaRequest.findMany({
    include: { formConfig: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    requests.map((request) => ({
      id: request.id,
      ticketNumber: request.id,
      requesterName: request.name,
      requesterEmail: request.email,
      formConfig: request.formConfig
        ? { code: request.formConfig.code, name: request.formConfig.name }
        : null,
      department: { name: request.department },
      status: request.status,
      currentStep: String(request.currentStep),
      createdAt: request.createdAt,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (
      typeof body.formConfigId !== "string" ||
      !body.formData ||
      typeof body.formData !== "object" ||
      Array.isArray(body.formData)
    ) {
      return NextResponse.json({ message: "Data pengajuan tidak lengkap." }, { status: 400 });
    }

    const created = await submitSaaRequest({
      userId: user.id,
      formConfigId: body.formConfigId,
      targetDepartmentId: typeof body.targetDepartmentId === "string" ? body.targetDepartmentId : undefined,
      requesterName: typeof body.requesterName === "string" ? body.requesterName : undefined,
      actionType: typeof body.actionType === "string" ? body.actionType : undefined,
      formData: body.formData,
      reason: typeof body.reason === "string" ? body.reason : "",
    });

    return NextResponse.json(
      { message: "Pengajuan SAA berhasil dikirim.", requestId: created.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SaaRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error("Submit SAA request error:", error);
    return NextResponse.json({ message: "Gagal membuat pengajuan SAA." }, { status: 500 });
  }
}
