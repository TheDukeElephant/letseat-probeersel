/*
  Warnings:

  - A unique constraint covering the columns `[vatNumber]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CuisineType" AS ENUM ('UNSPECIFIED', 'BURGER', 'PIZZA', 'SUSHI', 'INDIAN', 'CHINESE', 'THAI', 'MEXICAN', 'MEDITERRANEAN', 'DESSERT', 'VEGAN', 'HEALTHY');

-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "avgPrepTimeMins" INTEGER,
ADD COLUMN     "cuisine" "public"."CuisineType" DEFAULT 'UNSPECIFIED',
ADD COLUMN     "deliveryRadiusKm" INTEGER,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "minOrderAmount" DECIMAL(65,30),
ADD COLUMN     "ratingAverage" DECIMAL(65,30),
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serviceFeePercent" DECIMAL(65,30),
ADD COLUMN     "vatNumber" VARCHAR(64),
ADD COLUMN     "websiteUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_vatNumber_key" ON "public"."Restaurant"("vatNumber");

-- CreateIndex
CREATE INDEX "Restaurant_isActive_idx" ON "public"."Restaurant"("isActive");

-- CreateIndex
CREATE INDEX "Restaurant_cuisine_idx" ON "public"."Restaurant"("cuisine");

-- CreateIndex
CREATE INDEX "Restaurant_isFeatured_idx" ON "public"."Restaurant"("isFeatured");
