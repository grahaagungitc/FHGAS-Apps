ALTER TABLE "SaaFormConfig"
ADD COLUMN "sections" JSONB;

UPDATE "SaaFormConfig" AS config
SET "sections" = COALESCE((
  SELECT jsonb_agg(
    section."section"
    ORDER BY
      CASE section."section"
        WHEN 'General Information' THEN 1
        WHEN 'Action Requested' THEN 2
        WHEN 'Access Details' THEN 3
        ELSE 4
      END,
      section."sectionOrder",
      section."section"
  )
  FROM (
    SELECT
      assignment."section",
      MIN(assignment."order") AS "sectionOrder"
    FROM "SaaFormField" AS assignment
    WHERE assignment."formConfigId" = config."id"
    GROUP BY assignment."section"
  ) AS section
), '[]'::jsonb);