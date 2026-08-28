CREATE TABLE "ip_controls" (
  "ipAddress" TEXT NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "scanCount" INTEGER NOT NULL DEFAULT 0,
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "blockReason" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ip_controls_pkey" PRIMARY KEY ("ipAddress")
);

CREATE TABLE "ip_access_logs" (
  "id" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "userAgent" TEXT,
  "referer" TEXT,
  "status" INTEGER,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ip_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ip_access_logs_ipAddress_createdAt_idx" ON "ip_access_logs"("ipAddress", "createdAt");
CREATE INDEX "ip_access_logs_path_createdAt_idx" ON "ip_access_logs"("path", "createdAt");

ALTER TABLE "ip_access_logs"
ADD CONSTRAINT "ip_access_logs_ipAddress_fkey"
FOREIGN KEY ("ipAddress") REFERENCES "ip_controls"("ipAddress") ON DELETE CASCADE ON UPDATE CASCADE;
