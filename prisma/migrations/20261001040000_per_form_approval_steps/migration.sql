ALTER TABLE "SaaFormApprovalStep"
ADD COLUMN "role" TEXT,
ADD COLUMN "label" TEXT;

UPDATE "SaaFormApprovalStep" AS assignment
SET "role" = step."role",
    "label" = step."label"
FROM "SaaApprovalStep" AS step
WHERE assignment."stepId" = step."id";