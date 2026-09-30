import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const prisma = db;

async function resolveConfigLinks(fields: any[] = [], steps: any[] = []) {
  const fieldLinks = await Promise.all(
    fields.map(async (field, index) => {
      if (field.fieldId) {
        return {
          fieldId: field.fieldId,
          order: field.order ?? index + 1,
          section: field.section || "DETAIL",
        };
      }

      const savedField = await prisma.saaField.upsert({
        where: { fieldKey: field.fieldKey },
        update: {
          label: field.label,
          fieldType: field.fieldType || "TEXT",
          options: field.options ?? undefined,
          isRequired: Boolean(field.isRequired),
        },
        create: {
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType || "TEXT",
          section: field.section || "DETAIL",
          options: field.options ?? undefined,
          isRequired: Boolean(field.isRequired),
        },
      });

      return {
        fieldId: savedField.id,
        order: field.order ?? index + 1,
        section: field.section || "DETAIL",
      };
    })
  );

  const stepLinks = await Promise.all(
    steps.map(async (step, index) => {
      if (step.stepId) {
        return { stepId: step.stepId, step: step.step ?? index + 1 };
      }

      const savedStep = await prisma.saaApprovalStep.create({
        data: { role: step.role, label: step.label },
      });
      return { stepId: savedStep.id, step: step.step ?? index + 1 };
    })
  );

  return { fieldLinks, stepLinks };
}

function hasValidApprovalOrder(steps: any[]) {
  if (!Array.isArray(steps) || steps.length === 0) return false;
  const order = steps.map((step, index) => step.step ?? index + 1);
  return (
    order.every((value) => Number.isInteger(value) && value > 0) &&
    new Set(order).size === order.length &&
    order.every((value) => value <= order.length)
  );
}

// GET: Ambil daftar SAA Config beserta Master Field & Approval Steps terhubung
export async function GET() {
  try {
    const configs = await db.saaFormConfig.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    // Format output JSON agar rapi untuk consumed Frontend
    const formatted = configs.map((config) => ({
      id: config.id,
      code: config.code,
      name: config.name,
      description: config.description,
      isActive: config.isActive,
      fields: config.fields.map((f) => ({
        id: f.field.id,
        fieldKey: f.field.fieldKey,
        label: f.field.label,
        fieldType: f.field.fieldType,
        section: f.section,
        options: f.field.options,
        isRequired: f.field.isRequired,
        order: f.order,
      })),
      approvalSteps: config.approvalSteps.map((s) => ({
        id: s.approvalStep.id,
        step: s.step,
        role: s.approvalStep.role,
        label: s.approvalStep.label,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET SAA Config Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data konfigurasi SAA" },
      { status: 500 }
    );
  }
}

// POST: Buat Tipe SAA Baru & Relasikan ke Master Field/Approval ID
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { message: "Kode dan Nama Form wajib diisi." },
        { status: 400 }
      );
    }

    const requestedSteps = body.approvalSteps ?? body.stepIds ?? [];
    if (!hasValidApprovalOrder(requestedSteps)) {
      return NextResponse.json(
        { message: "Form harus memiliki approval step dengan nomor urut unik dan berurutan." },
        { status: 400 }
      );
    }

    const existingCode = await prisma.saaFormConfig.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { message: `Kode form '${code}' sudah digunakan.` },
        { status: 400 }
      );
    }

    const { fieldLinks, stepLinks } = await resolveConfigLinks(
      body.fields ?? body.fieldIds,
      body.approvalSteps ?? body.stepIds
    );

    // fieldIds: array of { fieldId: string, order: number }
    // stepIds: array of { stepId: string, step: number }
    const newConfig = await prisma.saaFormConfig.create({
      data: {
        code,
        name,
        description,
        isActive: body.isActive ?? true,
        fields: {
          create: fieldLinks,
        },
        approvalSteps: {
          create: stepLinks,
        },
      },
      include: {
        fields: { include: { field: true } },
        approvalSteps: { include: { approvalStep: true } },
      },
    });

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    console.error("POST SAA Config Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat menyimpan data." },
      { status: 500 }
    );
  }
}

// PUT: Perbarui Relasi Field & Approval Steps per Tipe SAA
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, code, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID Konfigurasi tidak ditemukan." },
        { status: 400 }
      );
    }

    const requestedSteps = body.approvalSteps ?? body.stepIds ?? [];
    if (!hasValidApprovalOrder(requestedSteps)) {
      return NextResponse.json(
        { message: "Form harus memiliki approval step dengan nomor urut unik dan berurutan." },
        { status: 400 }
      );
    }

    const { fieldLinks, stepLinks } = await resolveConfigLinks(
      body.fields ?? body.fieldIds,
      body.approvalSteps ?? body.stepIds
    );

    const updatedConfig = await prisma.$transaction(async (tx) => {
      // Hapus relasi pivot lama
      await tx.saaFormField.deleteMany({ where: { formConfigId: id } });
      await tx.saaFormApprovalStep.deleteMany({ where: { formConfigId: id } });

      // Re-create relasi pivot baru
      return await tx.saaFormConfig.update({
        where: { id },
        data: {
          code,
          name,
          description,
          isActive: isActive !== undefined ? isActive : true,
          fields: {
            create: fieldLinks,
          },
          approvalSteps: {
            create: stepLinks,
          },
        },
        include: {
          fields: { include: { field: true } },
          approvalSteps: { include: { approvalStep: true } },
        },
      });
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("PUT SAA Config Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat memperbarui data." },
      { status: 500 }
    );
  }
}

// DELETE: Hapus SAA Form Config
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID parameter diperlukan" },
        { status: 400 }
      );
    }

    await prisma.saaFormConfig.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Konfigurasi berhasil dihapus" });
  } catch (error) {
    console.error("DELETE SAA Config Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus konfigurasi." },
      { status: 500 }
    );
  }
}