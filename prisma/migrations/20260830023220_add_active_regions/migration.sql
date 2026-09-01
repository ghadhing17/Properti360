-- CreateTable
CREATE TABLE "active_regions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "active_regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "active_regions_code_key" ON "active_regions"("code");

-- CreateIndex
CREATE INDEX "active_regions_level_idx" ON "active_regions"("level");
