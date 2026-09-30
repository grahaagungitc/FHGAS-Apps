ALTER TABLE "User"
ADD COLUMN "isFOLeader" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SaaRequest"
ADD COLUMN "currentStep" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "SaaApprovalTask" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "assignedToUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaApprovalTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaaApprovalTask_requestId_stepId_key"
ON "SaaApprovalTask"("requestId", "stepId");

CREATE INDEX "SaaApprovalTask_assignedToUserId_status_idx"
ON "SaaApprovalTask"("assignedToUserId", "status");

ALTER TABLE "SaaApprovalTask"
ADD CONSTRAINT "SaaApprovalTask_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "SaaRequest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaaApprovalTask"
ADD CONSTRAINT "SaaApprovalTask_stepId_fkey"
FOREIGN KEY ("stepId") REFERENCES "SaaApprovalStep"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaaApprovalTask"
ADD CONSTRAINT "SaaApprovalTask_assignedToUserId_fkey"
FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;