-- CreateEnum
CREATE TYPE "PeriodeSewa" AS ENUM ('BULANAN', 'TAHUNAN', 'BULANAN_DAN_TAHUNAN');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "nego" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periodeSewa" "PeriodeSewa";
