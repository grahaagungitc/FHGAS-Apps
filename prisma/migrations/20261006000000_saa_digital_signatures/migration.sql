ALTER TABLE "SaaRequest"
  ADD COLUMN "requesterSignature" TEXT,
  ADD COLUMN "requesterSignedAt" TIMESTAMP(3),
  ADD COLUMN "requesterSignedByName" TEXT,
  ADD COLUMN "requesterSignedByRole" TEXT;

ALTER TABLE "SaaApprovalHistory"
  ADD COLUMN "digitalSignature" TEXT,
  ADD COLUMN "signedAt" TIMESTAMP(3),
  ADD COLUMN "signedByName" TEXT,
  ADD COLUMN "signedByRole" TEXT;
