CREATE TABLE "AuthRateLimit" (
  "key" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "AuthRateLimit_action_lockedUntil_idx" ON "AuthRateLimit"("action", "lockedUntil");
CREATE INDEX "AuthRateLimit_updatedAt_idx" ON "AuthRateLimit"("updatedAt");

ALTER TYPE "AuthAuditEventType" ADD VALUE 'register_failed';
ALTER TYPE "AuthAuditEventType" ADD VALUE 'password_change_failed';
ALTER TYPE "AuthAuditEventType" ADD VALUE 'session_rejected';
ALTER TYPE "AuthAuditEventType" ADD VALUE 'rate_limit_exceeded';
