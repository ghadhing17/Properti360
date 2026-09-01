-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "nearbyPlaces" JSONB,
ADD COLUMN     "nearbyPlacesAt" TIMESTAMP(3);
