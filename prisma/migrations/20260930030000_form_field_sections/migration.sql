ALTER TABLE "SaaFormField"
ADD COLUMN IF NOT EXISTS "section" TEXT NOT NULL DEFAULT 'DETAIL';

UPDATE "SaaFormField" AS assignment
SET "section" = field."section"
FROM "SaaField" AS field
WHERE assignment."fieldId" = field."id";

UPDATE "SaaFormField" AS assignment
SET "section" = 'DETAIL'
FROM "SaaField" AS field, "SaaFormConfig" AS form
WHERE assignment."fieldId" = field."id"
  AND form."id" = assignment."formConfigId"
  AND field."fieldKey" = 'idName'
  AND form."code" IN ('REQ-EMAIL', 'REQ-PMS');