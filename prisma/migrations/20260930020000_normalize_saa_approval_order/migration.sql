WITH ranked_steps AS (
    SELECT
        relation."formConfigId",
        relation."stepId",
        ROW_NUMBER() OVER (
            PARTITION BY relation."formConfigId"
            ORDER BY
                CASE approval."role"
                    WHEN 'HOD' THEN 1
                    WHEN 'FO_LEADER' THEN 2
                    WHEN 'FINANCE_LEADER' THEN 3
                    WHEN 'HOTEL_MANAGER' THEN 4
                    WHEN 'IT_VERIFICATION' THEN 5
                    ELSE 99
                END,
                relation."step",
                relation."stepId"
        ) AS normalized_step
    FROM "SaaFormApprovalStep" AS relation
    JOIN "SaaApprovalStep" AS approval ON approval."id" = relation."stepId"
)
UPDATE "SaaFormApprovalStep" AS relation
SET "step" = ranked_steps.normalized_step
FROM ranked_steps
WHERE relation."formConfigId" = ranked_steps."formConfigId"
  AND relation."stepId" = ranked_steps."stepId";