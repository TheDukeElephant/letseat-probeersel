-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "bic" VARCHAR(32),
ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT DEFAULT 'NL',
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "companyNumber" VARCHAR(64),
ADD COLUMN     "iban" VARCHAR(64);
