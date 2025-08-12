-- CreateTable
CREATE TABLE "public"."GroupAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupAdmin_groupId_idx" ON "public"."GroupAdmin"("groupId");

-- CreateIndex
CREATE INDEX "GroupAdmin_userId_idx" ON "public"."GroupAdmin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupAdmin_userId_groupId_key" ON "public"."GroupAdmin"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "public"."GroupAdmin" ADD CONSTRAINT "GroupAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupAdmin" ADD CONSTRAINT "GroupAdmin_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
