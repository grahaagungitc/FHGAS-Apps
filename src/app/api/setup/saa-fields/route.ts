import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const newField = await db.saaField.create({
      data: {
        fieldKey,
        label,
        fieldType: fieldType || "TEXT",
        section: section || "DETAIL",
        options: options ? JSON.stringify(options) : null,
        isRequired: Boolean(isRequired),
        assignedForms: {
          create: (assignedFormIds || []).map((formId: string, idx: number) => ({
            formConfigId: formId,
            order: idx + 1,
            section: section || "DETAIL",
          })),
        },
      },
      include: { assignedForms: true },
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
      await tx.saaFormField.deleteMany({ where: { fieldId: id } });

      return await tx.saaField.update({
        where: { id },
        data: {
          fieldKey,
          label,
          fieldType,
          section,
          options: options ? JSON.stringify(options) : null,
          isRequired: Boolean(isRequired),
          assignedForms: {
            create: (assignedFormIds || []).map((formId: string, idx: number) => ({
              formConfigId: formId,
              order: idx + 1,
              section: section || "DETAIL",
            })),
          },
        },
        include: { assignedForms: true },
      });
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