-- Migration: add_banner_campaign_products
-- Adds BannerCampaignProduct, MarketingTag, BannerCampaignProductTag tables

-- MarketingTag
CREATE TABLE "MarketingTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingTag_name_key" ON "MarketingTag"("name");

-- BannerCampaignProduct
CREATE TABLE "BannerCampaignProduct" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "categorySlug" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BannerCampaignProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BannerCampaignProduct_campaignId_productId_categorySlug_key"
    ON "BannerCampaignProduct"("campaignId", "productId", "categorySlug");

CREATE INDEX "BannerCampaignProduct_campaignId_categorySlug_sortOrder_idx"
    ON "BannerCampaignProduct"("campaignId", "categorySlug", "sortOrder");

-- BannerCampaignProductTag (pivot)
CREATE TABLE "BannerCampaignProductTag" (
    "id" TEXT NOT NULL,
    "bannerCampaignProductId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "BannerCampaignProductTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BannerCampaignProductTag_bannerCampaignProductId_tagId_key"
    ON "BannerCampaignProductTag"("bannerCampaignProductId", "tagId");

-- Foreign Keys
ALTER TABLE "BannerCampaignProduct"
    ADD CONSTRAINT "BannerCampaignProduct_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BannerCampaignProduct"
    ADD CONSTRAINT "BannerCampaignProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BannerCampaignProduct"
    ADD CONSTRAINT "BannerCampaignProduct_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BannerCampaignProductTag"
    ADD CONSTRAINT "BannerCampaignProductTag_bannerCampaignProductId_fkey"
    FOREIGN KEY ("bannerCampaignProductId") REFERENCES "BannerCampaignProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BannerCampaignProductTag"
    ADD CONSTRAINT "BannerCampaignProductTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "MarketingTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default marketing tags
INSERT INTO "MarketingTag" ("id", "name", "color", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'HOT', '#ef4444', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BEST SELLER', '#f97316', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'NEW', '#3b82f6', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TRENDING', '#8b5cf6', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'LIMITED', '#ec4899', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SALE', '#10b981', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
