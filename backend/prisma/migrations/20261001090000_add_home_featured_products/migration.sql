-- CreateTable
CREATE TABLE "HomeFeaturedProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeFeaturedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeFeaturedProduct_productId_key" ON "HomeFeaturedProduct"("productId");

-- AddForeignKey
ALTER TABLE "HomeFeaturedProduct" ADD CONSTRAINT "HomeFeaturedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
