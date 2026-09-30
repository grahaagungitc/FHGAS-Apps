CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessRequestId" TEXT,
    "saaRequestId" TEXT,
    "referenceKey" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessRequest_email_key" ON "AccessRequest"("email");
CREATE INDEX "AccessRequest_status_createdAt_idx" ON "AccessRequest"("status", "createdAt");
CREATE UNIQUE INDEX "Notification_userId_accessRequestId_key" ON "Notification"("userId", "accessRequestId");
CREATE UNIQUE INDEX "Notification_userId_saaRequestId_referenceKey_key" ON "Notification"("userId", "saaRequestId", "referenceKey");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

ALTER TABLE "AccessRequest"
ADD CONSTRAINT "AccessRequest_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_accessRequestId_fkey"
FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_saaRequestId_fkey"
FOREIGN KEY ("saaRequestId") REFERENCES "SaaRequest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;