-- CreateEnum
CREATE TYPE "FacingDirection" AS ENUM ('UTARA', 'SELATAN', 'TIMUR', 'BARAT', 'TIMUR_LAUT', 'BARAT_LAUT', 'TIMUR_SELATAN', 'BARAT_SELATAN');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('SHM', 'HGB', 'SHP', 'SHSRS', 'GIRIK', 'LAINNYA');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DIJUAL', 'DISEWA', 'DIJUAL_DISEWA');

-- CreateEnum
CREATE TYPE "WaterSource" AS ENUM ('PDAM', 'SUMUR', 'SUMUR_BOR', 'LAINNYA');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "dayaListrik" INTEGER,
ADD COLUMN     "fasilitas" TEXT[],
ADD COLUMN     "garasi" INTEGER,
ADD COLUMN     "hadapRumah" "FacingDirection",
ADD COLUMN     "kamarMandi" INTEGER,
ADD COLUMN     "kamarTidur" INTEGER,
ADD COLUMN     "lantai" INTEGER,
ADD COLUMN     "luasBangunan" INTEGER,
ADD COLUMN     "luasTanah" INTEGER,
ADD COLUMN     "sertifikat" "CertificateType",
ADD COLUMN     "statusProperti" "PropertyStatus",
ADD COLUMN     "sumberAir" "WaterSource",
ADD COLUMN     "tahunDibangun" INTEGER;
