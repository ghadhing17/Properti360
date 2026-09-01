-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "districtCode" TEXT,
ADD COLUMN     "districtName" TEXT,
ADD COLUMN     "provinceCode" TEXT,
ADD COLUMN     "provinceName" TEXT,
ADD COLUMN     "regencyCode" TEXT,
ADD COLUMN     "regencyName" TEXT,
ADD COLUMN     "regionCode" TEXT,
ADD COLUMN     "regionPath" TEXT,
ADD COLUMN     "villageCode" TEXT,
ADD COLUMN     "villageName" TEXT;

-- CreateTable
CREATE TABLE "wilayah" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("kode")
);

-- CreateIndex
CREATE INDEX "wilayah_nama_idx" ON "wilayah"("nama");

-- CreateIndex
CREATE INDEX "listings_provinceCode_idx" ON "listings"("provinceCode");

-- CreateIndex
CREATE INDEX "listings_regencyCode_idx" ON "listings"("regencyCode");

-- CreateIndex
CREATE INDEX "listings_districtCode_idx" ON "listings"("districtCode");

-- CreateIndex
CREATE INDEX "listings_villageCode_idx" ON "listings"("villageCode");

-- CreateIndex
CREATE INDEX "listings_regionCode_idx" ON "listings"("regionCode");
