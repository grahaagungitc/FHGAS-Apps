INSERT INTO "SystemRole" (
  "id", "name", "code", "isSystem", "createdAt", "updatedAt"
)
VALUES
  ('saa-role-hod', 'Head of Department', 'HOD', FALSE, NOW(), NOW()),
  ('saa-role-finance-leader', 'Finance Leader', 'FINANCE_LEADER', FALSE, NOW(), NOW()),
  ('saa-role-hotel-manager', 'Hotel Manager', 'HOTEL_MANAGER', FALSE, NOW(), NOW()),
  ('saa-role-fo-leader', 'Front Office Leader', 'FO_LEADER', FALSE, NOW(), NOW()),
  ('saa-role-it-verification', 'IT Verification', 'IT_VERIFICATION', FALSE, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "isSystem" = FALSE,
    "updatedAt" = NOW();

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'legacy-saa-hod-' || user_record."id", user_record."id", role_record."id", NOW()
FROM "User" AS user_record
CROSS JOIN "SystemRole" AS role_record
WHERE user_record."isDeptHead" = TRUE
  AND role_record."code" = 'HOD'
  AND NOT EXISTS (
    SELECT 1 FROM "UserRole" AS assignment
    WHERE assignment."userId" = user_record."id" AND assignment."roleId" = role_record."id"
  );

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'legacy-saa-finance-' || user_record."id", user_record."id", role_record."id", NOW()
FROM "User" AS user_record
CROSS JOIN "SystemRole" AS role_record
WHERE user_record."isFinanceLeader" = TRUE
  AND role_record."code" = 'FINANCE_LEADER'
  AND NOT EXISTS (
    SELECT 1 FROM "UserRole" AS assignment
    WHERE assignment."userId" = user_record."id" AND assignment."roleId" = role_record."id"
  );

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'legacy-saa-hotel-manager-' || user_record."id", user_record."id", role_record."id", NOW()
FROM "User" AS user_record
CROSS JOIN "SystemRole" AS role_record
WHERE user_record."isHotelManager" = TRUE
  AND role_record."code" = 'HOTEL_MANAGER'
  AND NOT EXISTS (
    SELECT 1 FROM "UserRole" AS assignment
    WHERE assignment."userId" = user_record."id" AND assignment."roleId" = role_record."id"
  );

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'legacy-saa-fo-leader-' || user_record."id", user_record."id", role_record."id", NOW()
FROM "User" AS user_record
CROSS JOIN "SystemRole" AS role_record
WHERE user_record."isFOLeader" = TRUE
  AND role_record."code" = 'FO_LEADER'
  AND NOT EXISTS (
    SELECT 1 FROM "UserRole" AS assignment
    WHERE assignment."userId" = user_record."id" AND assignment."roleId" = role_record."id"
  );

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'legacy-saa-it-' || user_record."id", user_record."id", role_record."id", NOW()
FROM "User" AS user_record
CROSS JOIN "SystemRole" AS role_record
WHERE user_record."isIT" = TRUE
  AND role_record."code" = 'IT_VERIFICATION'
  AND NOT EXISTS (
    SELECT 1 FROM "UserRole" AS assignment
    WHERE assignment."userId" = user_record."id" AND assignment."roleId" = role_record."id"
  );