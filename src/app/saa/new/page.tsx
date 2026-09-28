import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FilePlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SaaFormType, SaaActionType } from "@prisma/client";

export default async function NewSaaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  async function submitSaaRequest(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;

    const formType = formData.get("formType") as SaaFormType;
    const actionType = formData.get("actionType") as SaaActionType;
    const reason = formData.get("reason") as string;

    const ticketNo = `SAA-${Date.now().toString().slice(-6)}`;

    await prisma.saaRequest.create({
      data: {
        ticketNo,
        formType,
        actionType,
        reason,
        requesterId: session.user.id,
        status: "PENDING_DEPT_HEAD",
      },
    });

    redirect("/saa");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/saa"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar SAA
      </Link>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FilePlus className="w-6 h-6 text-pink-500" /> Form Pengajuan SAA Baru
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Pengajuan System Access Authorization (Dapat dibuat oleh User biasa maupun Mode View Only).
          </p>
        </div>

        <form action={submitSaaRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pemohon (Requester)
            </label>
            <input
              type="text"
              disabled
              value={`${session.user.name || session.user.email} (${session.user.email})`}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe Form (Form Type)
              </label>
              <select
                name="formType"
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
              >
                <option value="NEW_ACCOUNT">New Account Access</option>
                <option value="MODIFY_ACCESS">Modify Existing Access</option>
                <option value="REVOKE_ACCESS">Revoke / Delete Access</option>
                <option value="SYSTEM_CHANGE">System / Configuration Change</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe Aksi (Action Type)
              </label>
              <select
                name="actionType"
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
              >
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alasan Pengajuan / Deskripsi Akses Sistem
            </label>
            <textarea
              name="reason"
              rows={4}
              required
              placeholder="Jelaskan kebutuhan sistem, modul hotel yang membutuhkan hak akses, dan alasan pembuatannya..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-xl shadow-glow-pink transition-all text-sm flex items-center justify-center gap-2"
          >
            <FilePlus className="w-5 h-5" /> Submit SAA Request
          </button>
        </form>
      </div>
    </div>
  );
}
