-- AlterTable
ALTER TABLE "public"."MenuItem" ADD COLUMN     "allergyTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "allergyTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
