"use server";

import { requestUnregisteredAccess } from "@/lib/access-requests";
import { db } from "@/lib/db";

export async function submitSignUpAction(data: { name: string; email: string }) {
  try {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    if (!email || !name) {
      return { success: false, message: "Nama dan Email wajib diisi." };
    }

    // Check if user already exists in User table
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "Email ini sudah terdaftar. Silakan lakukan Login." };
    }

    await requestUnregisteredAccess({ email, name });

    return {
      success: true,
      message: "Pendaftaran berhasil dikirim! Mohon tunggu persetujuan dari Admin.",
    };
  } catch (error: any) {
    console.error("SignUp error:", error);
    return {
      success: false,
      message: error?.message || "Gagal mengajukan pendaftaran.",
    };
  }
}

