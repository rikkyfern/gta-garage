-- CreateTable
CREATE TABLE "password_reset_rate_limits" (
    "emailHash" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_rate_limits_pkey" PRIMARY KEY ("emailHash")
);
