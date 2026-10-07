-- AlterTable
ALTER TABLE "City" ADD COLUMN "search" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "reachKm" INTEGER;

-- CreateIndex
CREATE INDEX "City_search_idx" ON "City"("search");

-- Ajuste de textos dos dados iniciais
UPDATE "Opportunity" SET "title" = replace("title", ' — ', ', ') WHERE "title" LIKE '% — %';
UPDATE "Opportunity" SET "address" = replace("address", ' — ', ', ') WHERE "address" LIKE '% — %';
