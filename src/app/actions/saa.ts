"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { submitSaaRequest } from "@/lib/saa";

interface CreateSaaInput {
  formConfigCode: string; // Misal: "PMS", "EMAIL", "ACCESS_CARD"
  userId?: string;
  targetDepartmentId?: string;
  name?: string;
  email?: string;
  position?: string;
  departmentName?: string;
  actionType: "Create Account" | "Modify Account" | "Suspend Account" | "Delete Account";
  accessDetails: Record<string, any>; // Menampung isian dinamis
  reason: string;
}

export async function createSaaRequest(data: CreateSaaInput) {
  try {
    const session = await auth();
    const sessionUser = session?.user as
      | { id?: string; email?: string | null }
      | undefined;
    if (!sessionUser?.id) {
      return { success: false, message: "Silakan login terlebih dahulu." };
    }

    const requester = await db.user.findUnique({
      where: { id: sessionUser.id },
    });
    if (!requester) {
      return { success: false, message: "Data pemohon tidak ditemukan." };
    }

    const formConfig = await db.saaFormConfig.findUnique({
      where: { code: data.formConfigCode.toUpperCase() },
    });
    if (!formConfig) {
      return { success: false, message: "Tipe SAA tidak ditemukan." };
    }

    const request = await submitSaaRequest({
      userId: requester.id,
      formConfigId: formConfig.id,
      targetDepartmentId:
        data.targetDepartmentId || requester.departmentId || "",
      requesterName: data.name?.trim() || requester.name,
      actionType: data.actionType,
      formData: data.accessDetails,
      reason: data.reason,
    });

    return {
      success: true,
      message: "Permintaan SAA berhasil diajukan.",
      data: request,
    };
  } catch (error: any) {
    console.error("Error createSaaRequest:", error);
    return {
      success: false,
      message: error?.message || "Gagal membuat permohonan SAA.",
    };
  }
}