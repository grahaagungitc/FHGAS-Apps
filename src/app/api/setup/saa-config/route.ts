import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const prisma = db;
export const dynamic = "force-dynamic";

async function resolveConfigLinks(fields: any[] = [], steps: any[] = []) {
  const fieldLinks = await Promise.all(
    fields.map(async (field, index) => {
      const fieldMetadata = {
        order: field.order ?? index + 1,
        section: (field.section || "Access Details").trim(),
        source: field.source || null,
        label: field.label,
        fieldType: field.fieldType || "TEXT",
        isRequired: Boolean(field.isRequired),
        options: field.options ?? undefined,
      };

      if (field.fieldId || field.id) {
        return {
          fieldId: field.fieldId || field.id,
          ...fieldMetadata,
        };
      }

      const savedField = await prisma.saaField.upsert({
        where: { fieldKey: field.fieldKey },
        update: {},
        create: {
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType || "TEXT",
          section: field.section || "Access Details",
          options: field.options ?? undefined,
          isRequired: Boolean(field.isRequired),
        },
      });

      return {
        fieldId: savedField.id,
        ...fieldMetadata,
      };
    })
  );

  const stepLinks = await Promise.all(
    steps.map(async (step, index) => {
      if (step.stepId || step.id) {
        return {
          stepId: step.stepId || step.id,
          step: step.step ?? index + 1,
          role: step.role ?? null,
          label: step.label ?? null,
        };
      }

      const savedStep = await prisma.saaApprovalStep.create({
        data: { role: step.role, label: step.label },
      });
      return {
        stepId: savedStep.id,
        step: step.step ?? index + 1,
        role: step.role ?? savedStep.role,
        label: step.label ?? savedStep.label,
      };
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

function normalizeSectionName(section: string) {
  const value = section.trim();
  if (!value) return "Access Details";
  if (value.toLowerCase() === "detail") return "Access Details";
  if (value.toLowerCase() === "general") return "General Information";
  if (value.toLowerCase() === "action") return "Action Requested";
  return value;
}

function resolveSections(sections: unknown, fields: any[]) {
  const requestedSections = Array.isArray(sections)
    ? sections
    : [...new Set(fields.map((field) => field.section || "Access Details"))];

  if (!requestedSections.every((section) => typeof section === "string")) {
    return null;
  }

  const normalizedSections = Array.from(
    new Set(
      requestedSections.map((section: string) => normalizeSectionName(section)).filter(Boolean)
    )
  );

  if (!normalizedSections.some((section) => section.toLowerCase() === "access details")) {
    normalizedSections.push("Access Details");
  }

  if (new Set(normalizedSections).size !== normalizedSections.length) return null;
  if (fields.some((field) => !normalizedSections.includes(normalizeSectionName(field.section || "Access Details")))) {
    return null;
  }
  return normalizedSections;
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
      sections: [
        ...(Array.isArray(config.sections)
        ? config.sections.filter((section): section is string => typeof section === "string")
        : []),
        ...config.fields
          .map((field) => field.section)
          .filter((section, index, allSections) =>
            !allSections.slice(0, index).includes(section) &&
            !(Array.isArray(config.sections) && config.sections.includes(section))
          ),
      ],
      fields: config.fields.map((f) => ({
        id: f.field.id,
        fieldId: f.field.id,
        fieldKey: f.field.fieldKey,
        label: f.label ?? f.field.label,
        fieldType: f.fieldType ?? f.field.fieldType,
        section: f.section,
        source: f.source,
        options: f.options ?? f.field.options,
        isRequired: f.isRequired ?? f.field.isRequired,
        order: f.order,
      })),
      approvalSteps: config.approvalSteps.map((s) => ({
        id: s.approvalStep.id,
        step: s.step,
        role: s.role ?? s.approvalStep.role,
        label: s.label ?? s.approvalStep.label,
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

    const requestedFields = body.fields ?? body.fieldIds ?? [];
    const sections = resolveSections(body.sections, requestedFields);
    if (!sections) {
      return NextResponse.json(
        { message: "Setiap section harus unik dan semua field harus ditempatkan pada section yang tersedia." },
        { status: 400 }
      );
    }

    const { fieldLinks, stepLinks } = await resolveConfigLinks(
      requestedFields,
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
        sections,
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

    const requestedFields = body.fields ?? body.fieldIds ?? [];
    const sections = resolveSections(body.sections, requestedFields);
    if (!sections) {
      return NextResponse.json(
        { message: "Setiap section harus unik dan semua field harus ditempatkan pada section yang tersedia." },
        { status: 400 }
      );
    }

    const { fieldLinks, stepLinks } = await resolveConfigLinks(
      requestedFields,
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
          sections,
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