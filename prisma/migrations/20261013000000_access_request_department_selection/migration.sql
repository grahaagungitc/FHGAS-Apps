ALTER TABLE "AccessRequest"
ADD COLUMN "requestedDepartmentId" TEXT;

CREATE INDEX "AccessRequest_requestedDepartmentId_idx"
ON "AccessRequest"("requestedDepartmentId");

ALTER TABLE "AccessRequest"
ADD CONSTRAINT "AccessRequest_requestedDepartmentId_fkey"
FOREIGN KEY ("requestedDepartmentId") REFERENCES "Department"("id")
ON DELETE SET NULL ON UPDATE CASCADE;