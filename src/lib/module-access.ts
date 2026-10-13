import { db } from "@/lib/db";

const ACCESSIBLE_LEVELS = ["READ_ONLY", "READ_WRITE", "FULL", "FULL_ACCESS", "ADMIN"];

export async function getUserModuleAccess(email?: string | null) {
  if (!email) {
    return { isAdmin: false, isIT: false, isFOLeader: false, moduleCodes: [] as string[] };
  }

  const user = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      isIT: true,
      isFOLeader: true,
      isDeptHead: true,
      userRoles: { select: { roleId: true, SystemRole: { select: { code: true } } } },
    },
  });

  const roleIds = user?.userRoles.map((userRole) => userRole.roleId) || [];
  const roleCodes = user?.userRoles.map((userRole) => userRole.SystemRole.code) || [];
  const isAdmin = roleCodes.includes("ADMIN");
  const isIT = user?.isIT === true;
  const isFOLeader = !!(
    user?.isFOLeader ||
    user?.isDeptHead ||
    roleCodes.includes("FO_LEADER") ||
    roleCodes.includes("HOD")
  );

  if (isAdmin || roleIds.length === 0) {
    return { isAdmin, isIT, isFOLeader, moduleCodes: [] as string[] };
  }

  const permissions = await db.roleModulePermission.findMany({
    where: {
      roleId: { in: roleIds },
      accessLevel: { in: ACCESSIBLE_LEVELS },
    },
    select: { module: { select: { code: true } } },
  });

  return {
    isAdmin,
    isIT,
    isFOLeader,
    moduleCodes: [...new Set(permissions.map((permission) => permission.module.code))],
  };
}