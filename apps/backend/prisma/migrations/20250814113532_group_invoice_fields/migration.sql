-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "bic" TEXT,
ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "companyNumber" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "vatNumber" TEXT;
