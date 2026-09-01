-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONTACTED', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "listing_view_logs" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_view_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL DEFAULT 'RUMAH',
    "preferredDate" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_view_logs_date_idx" ON "listing_view_logs"("date");

-- CreateIndex
CREATE INDEX "listing_view_logs_listingId_idx" ON "listing_view_logs"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_view_logs_listingId_date_key" ON "listing_view_logs"("listingId", "date");

-- CreateIndex
CREATE INDEX "booking_requests_status_idx" ON "booking_requests"("status");

-- CreateIndex
CREATE INDEX "booking_requests_createdAt_idx" ON "booking_requests"("createdAt");

-- CreateIndex
CREATE INDEX "booking_requests_propertyType_idx" ON "booking_requests"("propertyType");

-- AddForeignKey
ALTER TABLE "listing_view_logs" ADD CONSTRAINT "listing_view_logs_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
