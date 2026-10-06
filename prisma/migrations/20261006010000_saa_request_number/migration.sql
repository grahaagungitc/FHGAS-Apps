ALTER TABLE "SaaRequest" ADD COLUMN "requestNumber" INTEGER;

CREATE SEQUENCE "SaaRequest_requestNumber_seq";

WITH numbered_requests AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS sequence
  FROM "SaaRequest"
)
UPDATE "SaaRequest" AS request
SET "requestNumber" = numbered_requests.sequence
FROM numbered_requests
WHERE request."id" = numbered_requests."id";

SELECT setval(
  '"SaaRequest_requestNumber_seq"',
  COALESCE(MAX("requestNumber"), 1),
  MAX("requestNumber") IS NOT NULL
)
FROM "SaaRequest";

ALTER SEQUENCE "SaaRequest_requestNumber_seq"
  OWNED BY "SaaRequest"."requestNumber";

ALTER TABLE "SaaRequest"
  ALTER COLUMN "requestNumber" SET DEFAULT nextval('"SaaRequest_requestNumber_seq"'),
  ALTER COLUMN "requestNumber" SET NOT NULL;

CREATE UNIQUE INDEX "SaaRequest_requestNumber_key"
  ON "SaaRequest"("requestNumber");