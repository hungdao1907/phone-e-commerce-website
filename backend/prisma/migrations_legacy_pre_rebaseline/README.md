# Imported Hùng migrations superseded by production rebaseline

The two October 2 migrations imported during the Hùng → Minh merge are archived here, outside Prisma's active `migrations` directory. Their original SQL bytes are preserved.

`0_rebaseline_current_production/migration.sql` already creates MarketingTag, BannerCampaignProduct, BannerCampaignProductTag, their indexes/FKs, and BannerCampaignProduct.bannerImage. Running the archived CREATE/ALTER statements after that baseline would duplicate existing objects.

Archived SHA-256:

- 20261002070000_add_banner_campaign_products: `87ebf7c26bdae6f3b084ad77fe01b1703fc6dde851c73cded466915921767168`
- 20261002070500_add_banner_image: `c1684982bce263d9c19c91d75094363fa66d4d6fa58f76d853bb9ff3704dcc8b`

No database was accessed or changed during this merge. Existing baseline, chat-context, quotation, pricing, checkout-idempotency and hard-delete-tombstone migrations remain unchanged. Do not deploy the archived SQL to a rebaselined database. The optional original tag seed is not automatically replayed; authorized users can manage tags through the campaign UI.
