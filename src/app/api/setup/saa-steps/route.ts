import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function isConfigurableRole(roleCode: unknown) {
  if (typeof roleCode !== "string") return false;
  const role = await db.systemRole.findUnique({ where: { code: roleCode } });
  return Boolean(role && !role.isSystem);
}

// GET: Ambil semua Master Approval Steps
export async function GET() {
  try {
    const steps = await db.saaApprovalStep.findMany({
      include: {
        assignedForms: {
          include: {
            formConfig: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error("GET Master Approval Steps Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data master approval steps" },
      { status: 500 }
    );
  }
}

// POST: Buat Master Approval Step Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, label, assignedFormIds } = body;

    if (!role || !label) {
      return NextResponse.json(
        { message: "Role ID dan Label Approver wajib diisi." },
        { status: 400 }
      );
    }
    if (!(await isConfigurableRole(role))) {
      return NextResponse.json({ message: "Pilih role approver yang terdaftar di Setup." }, { status: 400 });
    }

    const newStep = await db.saaApprovalStep.create({
      data: {
        role,
        label,
        assignedForms: {
          create: (assignedFormIds || []).map((formId: string, idx: number) => ({
            formConfigId: formId,
            step: idx + 1,
          })),
        },
      },
      include: { assignedForms: true },
    });

    return NextResponse.json(newStep, { status: 201 });
  } catch (error) {
    console.error("POST Master Step Error:", error);
    return NextResponse.json(
      { message: "Gagal membuat Master Approval Step." },
      { status: 500 }
    );
  }
}

// PUT: Perbarui Master Approval Step
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, role, label, assignedFormIds } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID Approval Step diperlukan." },
        { status: 400 }
      );
    }
    if (!(await isConfigurableRole(role))) {
      return NextResponse.json({ message: "Pilih role approver yang terdaftar di Setup." }, { status: 400 });
    }

    const updatedStep = await db.$transaction(async (tx) => {
      await tx.saaFormApprovalStep.deleteMany({ where: { stepId: id } });

      return await tx.saaApprovalStep.update({
        where: { id },
        data: {
          role,
          label,
          assignedForms: {
            create: (assignedFormIds || []).map((formId: string, idx: number) => ({
              formConfigId: formId,
              step: idx + 1,
            })),
          },
        },
        include: { assignedForms: true },
      });
    });

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error("PUT Master Step Error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui Master Approval Step." },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Master Approval Step
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });
    }

    await db.saaApprovalStep.delete({ where: { id } });
    return NextResponse.json({ message: "Master Approval Step berhasil dihapus" });
  } catch (error) {
    console.error("DELETE Master Step Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus Master Approval Step." },
      { status: 500 }
    );
  }
}