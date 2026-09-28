import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Settings, Plus, Users, Shield, Building } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function SetupPage() {
  const session = await auth();

  if (!session?.user?.roles?.includes("ADMIN")) {
    redirect("/");
  }

  const departments = await prisma.department.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });

  const roles = await prisma.systemRole.findMany({
    include: { _count: { select: { userRoles: true } } },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({
    include: {
      department: true,
      roles: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  async function createDepartment(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;

    if (name && code) {
      await prisma.department.create({
        data: { name, code: code.toUpperCase(), description },
      });
      revalidatePath("/setup");
    }
  }

  async function createSystemRole(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;

    if (name && code) {
      await prisma.systemRole.create({
        data: { name, code: code.toUpperCase(), description },
      });
      revalidatePath("/setup");
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-500" />
            Admin Configuration & Setup
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola Master Department, Dynamic Roles, dan Multi-Role Assignment User.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-cyan-500" />
              Department Management
            </h2>
          </div>

          <form action={createDepartment} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Department Baru</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="name"
                placeholder="Nama (Misal: Finance)"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <input
                type="text"
                name="code"
                placeholder="Kode (Misal: FIN)"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <input
              type="text"
              name="description"
              placeholder="Keterangan singkat..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-bold text-xs py-2 rounded-lg transition-all shadow-glow-cyan flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Simpan Department
            </button>
          </form>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {departments.map((dept) => (
              <div key={dept.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{dept.name}</span>{" "}
                  <span className="text-slate-400">({dept.code})</span>
                  <p className="text-slate-500 text-[11px]">{dept.description || "Tidak ada keterangan"}</p>
                </div>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                  {dept._count.users} Users
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-500" />
              Dynamic System Role Management
            </h2>
          </div>

          <form action={createSystemRole} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Dynamic Role Baru</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="name"
                placeholder="Nama Role (Misal: General Manager)"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="text"
                name="code"
                placeholder="Kode Role (Misal: GENERAL_MANAGER)"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <input
              type="text"
              name="description"
              placeholder="Deskripsi hak akses role..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-glow-pink flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Simpan Dynamic Role
            </button>
          </form>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {roles.map((role) => (
              <div key={role.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{role.name}</span>{" "}
                  <span className="text-pink-500 font-mono text-[11px]">[{role.code}]</span>
                  <p className="text-slate-500 text-[11px]">{role.description || "Tidak ada deskripsi"}</p>
                </div>
                <span className="bg-pink-50 px-2 py-0.5 rounded text-pink-700 font-medium border border-pink-200">
                  {role._count.userRoles} Users
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            User Management & Multi-Role Tagging
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="p-3">User / Email</th>
                <th className="p-3">Department</th>
                <th className="p-3">Assigned Roles (Multi-Role Tagging)</th>
                <th className="p-3">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-900">
                    {u.name || "No Name"}
                    <span className="block text-[11px] font-normal text-slate-400">{u.email}</span>
                  </td>
                  <td className="p-3">
                    {u.department ? (
                      <span className="bg-cyan-50 text-cyan-700 font-semibold px-2.5 py-1 rounded-md border border-cyan-200">
                        {u.department.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Belum diset</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length > 0 ? (
                        u.roles.map((r) => (
                          <span
                            key={r.id}
                            className="bg-slate-100 text-slate-800 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200"
                          >
                            {r.role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No Role Assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {u.isGuestViewOnly ? (
                      <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px] border border-amber-300">
                        Guest View Only
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[10px] border border-emerald-300">
                        Full Registered
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
