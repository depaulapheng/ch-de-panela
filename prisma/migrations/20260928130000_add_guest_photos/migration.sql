CREATE TABLE "GuestPhoto" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuestPhoto_createdAt_idx" ON "GuestPhoto"("createdAt");
