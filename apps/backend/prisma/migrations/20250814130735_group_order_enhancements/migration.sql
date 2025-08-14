/*
  Warnings:

  - You are about to drop the column `totalAmount` on the `Order` table. All the data in the column will be lost.
  - Added the required column `groupId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addedByUserId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "totalAmount",
ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "deliveryFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "isFinalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "serviceFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "tipAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "addedByUserId" TEXT NOT NULL,
ADD COLUMN     "comment" TEXT;

-- CreateIndex
CREATE INDEX "Order_groupId_idx" ON "public"."Order"("groupId");

-- CreateIndex
CREATE INDEX "Order_restaurantId_idx" ON "public"."Order"("restaurantId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_addedByUserId_idx" ON "public"."OrderItem"("addedByUserId");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
