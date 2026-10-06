import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

async function ensureFormSection(
  tx: Prisma.TransactionClient,
  formConfigId: string,
  section: string
) {
  const config = await tx.saaFormConfig.findUnique({
    where: { id: formConfigId },
    select: { sections: true, fields: { select: { section: true } } },
  });
  if (!config) return;

  const sections = Array.isArray(config.sections)
    ? config.sections.filter((value): value is string => typeof value === "string")
    : [...new Set(config.fields.map((field) => field.section))];
  if (!sections.includes(section)) {
    await tx.saaFormConfig.update({
      where: { id: formConfigId },
      data: { sections: [...sections, section] },
    });
  }
}

// GET: Ambil daftar Master Fields & Master Steps
export async function GET() {
  try {
    const fields = await db.saaField.findMany({
      include: {
        assignedForms: {
          include: {
            formConfig: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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

    return NextResponse.json({ fields, steps });
  } catch (error) {
    console.error("GET Master Fields Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data master fields" },
      { status: 500 }
    );
  }
}

// POST: Buat Master Field Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fieldKey, label, fieldType, section, options, isRequired, assignedFormIds } = body;

    if (!fieldKey || !label) {
      return NextResponse.json(
        { message: "Field Key dan Label wajib diisi." },
        { status: 400 }
      );
    }

    const sectionName = typeof section === "string" && section.trim() ? section.trim() : "Access Details";
    const formIds = Array.isArray(assignedFormIds) ? assignedFormIds : [];
    const newField = await db.$transaction(async (tx) => {
      const field = await tx.saaField.create({
        data: {
          fieldKey,
          label,
          fieldType: fieldType || "TEXT",
          section: sectionName,
          options: options ? JSON.stringify(options) : null,
          isRequired: Boolean(isRequired),
          assignedForms: {
            create: formIds.map((formId: string, idx: number) => ({
              formConfigId: formId,
              order: idx + 1,
              section: sectionName,
            })),
          },
        },
        include: { assignedForms: true },
      });
      for (const formId of formIds) await ensureFormSection(tx, formId, sectionName);
      return field;
    });

    return NextResponse.json(newField, { status: 201 });
  } catch (error) {
    console.error("POST Master Field Error:", error);
    return NextResponse.json(
      { message: "Gagal membuat Master Field baru." },
      { status: 500 }
    );
  }
}

// PUT: Update Master Field
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, fieldKey, label, fieldType, section, options, isRequired, assignedFormIds } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID Master Field diperlukan." },
        { status: 400 }
      );
    }

    const updatedField = await db.$transaction(async (tx) => {
      const existingAssignments = await tx.saaFormField.findMany({
        where: { fieldId: id },
        select: {
          formConfigId: true,
          order: true,
          section: true,
          source: true,
          label: true,
          fieldType: true,
          isRequired: true,
          options: true,
        },
      });
      const assignmentsByFormId = new Map(
        existingAssignments.map((assignment) => [assignment.formConfigId, assignment])
      );
      const formIds = Array.isArray(assignedFormIds) ? assignedFormIds : [];
      const sectionByFormId = new Map(
        formIds.map((formId: string) => [
          formId,
          assignmentsByFormId.get(formId)?.section || section || "Access Details",
        ])
      );

      await tx.saaFormField.deleteMany({ where: { fieldId: id } });

      const updated = await tx.saaField.update({
        where: { id },
        data: {
          fieldKey,
          label,
          fieldType,
          section,
          options: options ? JSON.stringify(options) : null,
          isRequired: Boolean(isRequired),
          assignedForms: {
            create: formIds.map((formId: string, idx: number) => ({
              formConfigId: formId,
              order: assignmentsByFormId.get(formId)?.order ?? idx + 1,
              section: sectionByFormId.get(formId) || "Access Details",
              source: assignmentsByFormId.get(formId)?.source ?? null,
              label: assignmentsByFormId.get(formId)?.label ?? null,
              fieldType: assignmentsByFormId.get(formId)?.fieldType ?? null,
              isRequired: assignmentsByFormId.get(formId)?.isRequired ?? null,
              options: assignmentsByFormId.get(formId)?.options ?? undefined,
            })),
          },
        },
        include: { assignedForms: true },
      });
      for (const formId of formIds) {
        await ensureFormSection(tx, formId, sectionByFormId.get(formId) || "Access Details");
      }
      return updated;
    });

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error("PUT Master Field Error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui Master Field." },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Master Field
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });
    }

    await db.saaField.delete({ where: { id } });
    return NextResponse.json({ message: "Master Field berhasil dihapus" });
  } catch (error) {
    console.error("DELETE Master Field Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus Master Field." },
      { status: 500 }
    );
  }
}