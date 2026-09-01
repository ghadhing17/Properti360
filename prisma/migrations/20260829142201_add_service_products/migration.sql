-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "service_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_products_slug_key" ON "service_products"("slug");

-- CreateIndex
CREATE INDEX "service_products_isActive_idx" ON "service_products"("isActive");

-- CreateIndex
CREATE INDEX "service_products_order_idx" ON "service_products"("order");

-- CreateIndex
CREATE INDEX "booking_requests_productId_idx" ON "booking_requests"("productId");

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "service_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
