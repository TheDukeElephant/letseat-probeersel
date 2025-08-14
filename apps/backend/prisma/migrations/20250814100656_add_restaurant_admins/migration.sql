-- CreateTable
CREATE TABLE "public"."RestaurantAdmin" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestaurantAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestaurantAdmin_userId_idx" ON "public"."RestaurantAdmin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantAdmin_restaurantId_userId_key" ON "public"."RestaurantAdmin"("restaurantId", "userId");

-- AddForeignKey
ALTER TABLE "public"."RestaurantAdmin" ADD CONSTRAINT "RestaurantAdmin_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RestaurantAdmin" ADD CONSTRAINT "RestaurantAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
