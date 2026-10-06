-- Safe/idempotent repair migration for HomeFeaturedProduct

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'HomeFeaturedProduct'
  ) THEN
    CREATE TABLE "HomeFeaturedProduct" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "HomeFeaturedProduct_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'HomeFeaturedProduct_productId_key' AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX "HomeFeaturedProduct_productId_key" ON "HomeFeaturedProduct"("productId");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HomeFeaturedProduct_productId_fkey'
  ) THEN
    ALTER TABLE "HomeFeaturedProduct" ADD CONSTRAINT "HomeFeaturedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
