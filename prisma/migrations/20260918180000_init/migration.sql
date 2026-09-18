CREATE TYPE "Priority" AS ENUM ('HIGH', 'NORMAL', 'OPTIONAL');
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'CANCELLED', 'DELIVERED');
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');
CREATE TYPE "InstallmentStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'CANCELLED');

CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

CREATE TABLE "EventSettings" (
  "id" TEXT NOT NULL DEFAULT 'main',
  "coupleName" TEXT NOT NULL DEFAULT 'Pedro & Larissa',
  "showerDate" TIMESTAMP(3) NOT NULL DEFAULT '2026-11-21T15:00:00.000Z'::timestamp,
  "weddingDate" TIMESTAMP(3) NOT NULL DEFAULT '2027-03-20T15:00:00.000Z'::timestamp,
  "showerTime" TEXT,
  "venue" TEXT,
  "address" TEXT,
  "mapsUrl" TEXT,
  "homeText" TEXT NOT NULL DEFAULT 'Escolhemos algumas coisinhas para deixar nossa casa ainda mais especial. Fique à vontade para escolher o presente que mais combinar com você. 💛',
  "storyText" TEXT NOT NULL DEFAULT 'Este espaço é editável no painel administrativo para Pedro e Larissa contarem um pouco da história deles.',
  "guestMessage" TEXT NOT NULL DEFAULT 'Nosso grande dia está chegando e queremos celebrar essa nova fase ao lado de pessoas especiais.',
  "heroImageUrl" TEXT,
  "coupleImageUrl" TEXT,
  "pixEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pixKey" TEXT,
  "pixRecipient" TEXT,
  "pixQrCodeUrl" TEXT,
  "instagram" TEXT,
  "whatsapp" TEXT,
  "seoTitle" TEXT NOT NULL DEFAULT 'Chá de Panela | Pedro & Larissa',
  "seoDescription" TEXT NOT NULL DEFAULT 'Chá de Panela de Pedro & Larissa — 21 de novembro de 2026.',
  "shareImageUrl" TEXT,
  "rsvpAllowCompanions" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Color" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hex" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

CREATE TABLE "Gift" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "categoryId" TEXT NOT NULL,
  "imageUrl" TEXT,
  "approximateValue" DECIMAL(10,2),
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "desiredQuantity" INTEGER NOT NULL DEFAULT 1,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "brand" TEXT,
  "model" TEXT,
  "note" TEXT,
  "purchaseUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "spotlight" BOOLEAN NOT NULL DEFAULT false,
  "acceptsInstallments" BOOLEAN NOT NULL DEFAULT false,
  "installmentCount" INTEGER,
  "installmentValue" DECIMAL(10,2),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Gift_categoryId_active_priority_sortOrder_idx" ON "Gift"("categoryId", "active", "priority", "sortOrder");

CREATE TABLE "GiftColor" (
  "giftId" TEXT NOT NULL,
  "colorId" TEXT NOT NULL,
  CONSTRAINT "GiftColor_pkey" PRIMARY KEY ("giftId", "colorId")
);

CREATE TABLE "GiftReservation" (
  "id" TEXT NOT NULL,
  "giftId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "message" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "tokenHash" TEXT NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftReservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GiftReservation_tokenHash_key" ON "GiftReservation"("tokenHash");
CREATE INDEX "GiftReservation_giftId_status_idx" ON "GiftReservation"("giftId", "status");
CREATE INDEX "GiftReservation_createdAt_idx" ON "GiftReservation"("createdAt");

CREATE TABLE "GiftInstallment" (
  "id" TEXT NOT NULL,
  "giftId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "status" "InstallmentStatus" NOT NULL DEFAULT 'AVAILABLE',
  "reservationId" TEXT,
  CONSTRAINT "GiftInstallment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GiftInstallment_reservationId_key" ON "GiftInstallment"("reservationId");
CREATE UNIQUE INDEX "GiftInstallment_giftId_number_key" ON "GiftInstallment"("giftId", "number");

CREATE TABLE "Rsvp" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "attending" BOOLEAN NOT NULL,
  "companions" INTEGER NOT NULL DEFAULT 0,
  "companionNames" TEXT,
  "dietaryRestriction" TEXT,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Rsvp_phone_idx" ON "Rsvp"("phone");
CREATE INDEX "Rsvp_attending_idx" ON "Rsvp"("attending");

CREATE TABLE "GuestMessage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuestMessage_status_createdAt_idx" ON "GuestMessage"("status", "createdAt");

CREATE TABLE "SiteContent" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "Gift" ADD CONSTRAINT "Gift_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GiftColor" ADD CONSTRAINT "GiftColor_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftColor" ADD CONSTRAINT "GiftColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftReservation" ADD CONSTRAINT "GiftReservation_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GiftInstallment" ADD CONSTRAINT "GiftInstallment_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftInstallment" ADD CONSTRAINT "GiftInstallment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "GiftReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
