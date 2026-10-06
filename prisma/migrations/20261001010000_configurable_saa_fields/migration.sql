ALTER TABLE "SaaFormField"
ADD COLUMN "source" TEXT,
ADD COLUMN "label" TEXT,
ADD COLUMN "fieldType" TEXT,
ADD COLUMN "isRequired" BOOLEAN;

UPDATE "SaaFormField" AS assignment
SET "label" = field."label",
    "fieldType" = field."fieldType",
    "isRequired" = field."isRequired"
FROM "SaaField" AS field
WHERE assignment."fieldId" = field."id";

UPDATE "SaaFormField"
SET "section" = CASE "section"
  WHEN 'GENERAL' THEN 'General Information'
  WHEN 'ACTION' THEN 'Action Requested'
  WHEN 'DETAIL' THEN 'Access Details'
  ELSE "section"
END;

UPDATE "SaaFormField"
SET "order" = "order" + 3
WHERE "section" = 'General Information';

UPDATE "SaaFormField" AS assignment
SET "source" = 'REQUEST_TYPE'
FROM "SaaField" AS field
WHERE assignment."fieldId" = field."id"
  AND assignment."section" = 'Action Requested';

INSERT INTO "SaaField" (
  "id", "fieldKey", "label", "fieldType", "section", "isRequired", "createdAt", "updatedAt"
)
VALUES
  ('system-saa-requester-name', 'system_requester_name', 'Name', 'TEXT', 'GENERAL', TRUE, NOW(), NOW()),
  ('system-saa-requester-email', 'system_requester_email', 'Email', 'EMAIL', 'GENERAL', TRUE, NOW(), NOW()),
  ('system-saa-department', 'system_department', 'Department', 'SELECT', 'GENERAL', TRUE, NOW(), NOW()),
  ('system-saa-reason', 'system_reason', 'Reason', 'TEXTAREA', 'DETAIL', TRUE, NOW(), NOW())
ON CONFLICT ("fieldKey") DO NOTHING;

INSERT INTO "SaaFormField" (
  "id", "formConfigId", "fieldId", "order", "section", "source", "label", "fieldType", "isRequired"
)
SELECT
  'system-saa-name-' || config."id", config."id", field."id", 1,
  'General Information', 'REQUESTER_NAME', 'Name', 'TEXT', TRUE
FROM "SaaFormConfig" AS config
CROSS JOIN "SaaField" AS field
WHERE field."fieldKey" = 'system_requester_name'
ON CONFLICT ("formConfigId", "fieldId") DO NOTHING;

INSERT INTO "SaaFormField" (
  "id", "formConfigId", "fieldId", "order", "section", "source", "label", "fieldType", "isRequired"
)
SELECT
  'system-saa-email-' || config."id", config."id", field."id", 2,
  'General Information', 'REQUESTER_EMAIL', 'Email', 'EMAIL', TRUE
FROM "SaaFormConfig" AS config
CROSS JOIN "SaaField" AS field
WHERE field."fieldKey" = 'system_requester_email'
ON CONFLICT ("formConfigId", "fieldId") DO NOTHING;

INSERT INTO "SaaFormField" (
  "id", "formConfigId", "fieldId", "order", "section", "source", "label", "fieldType", "isRequired"
)
SELECT
  'system-saa-department-' || config."id", config."id", field."id", 3,
  'General Information', 'DEPARTMENT', 'Department', 'SELECT', TRUE
FROM "SaaFormConfig" AS config
CROSS JOIN "SaaField" AS field
WHERE field."fieldKey" = 'system_department'
ON CONFLICT ("formConfigId", "fieldId") DO NOTHING;

INSERT INTO "SaaFormField" (
  "id", "formConfigId", "fieldId", "order", "section", "source", "label", "fieldType", "isRequired"
)
SELECT
  'system-saa-reason-' || config."id", config."id", field."id",
  COALESCE((
    SELECT MAX(existing."order") + 1
    FROM "SaaFormField" AS existing
    WHERE existing."formConfigId" = config."id"
      AND existing."section" = 'Access Details'
  ), 1),
  'Access Details', 'REASON', 'Reason', 'TEXTAREA', TRUE
FROM "SaaFormConfig" AS config
CROSS JOIN "SaaField" AS field
WHERE field."fieldKey" = 'system_reason'
ON CONFLICT ("formConfigId", "fieldId") DO NOTHING;