# Phase 2C.4B — manual website E2E checklist

For the user to run after Chatbot WebPhone is complete and after database activation is separately approved. This is a checklist only; no test database or business records were created by this phase.

## Before testing

- Confirm the website environment is explicitly approved for test orders. Prefer designated test Customer/Staff accounts, test products/variants, and a non-live payment mode. Do not test bank transfers by sending real money.
- Confirm backup/restore readiness, migration status, generated Prisma Client, deployed backend/frontend versions, and coordinated `CHECKOUT_IDEMPOTENCY_ENABLED` / `VITE_CHECKOUT_IDEMPOTENCY_ENABLED` flags with the release owner.
- Confirm the Chatbot uses Backend-created quotation snapshots and does not calculate or submit trusted prices itself.
- Record the test Customer, assigned Staff, quote/order codes, expected current Backend price, inventory and promo usage before each scenario. Use only records whose cleanup/reconciliation is approved.
- Do not run these scenarios against production inventory or payment rails unless the owner explicitly approves the resulting real Order and downstream effects.

## Quotation and authorization

1. Customer A requests a quotation through the completed Chatbot. Confirm the quote number, items/quantities, Backend prices, discounts, shipping, grand total and 24-hour expiry match the quotation API response.
2. Customer B attempts to open Customer A's quotation and PDF URL. Both must be denied/not found; no filename or quotation-ID guessing should reveal the file.
3. Admin assigns the quotation to Staff A. Staff A can view and approve it; unassigned Staff B cannot view, download or approve it. Admin access follows the current authorization policy.
4. Generate/download the private PDF. Confirm its version and snapshot match the quote, it is served with `Cache-Control: private, no-store`, and a guessed `/uploads/quotations/...` URL remains inaccessible. Do not test or alter deployed reverse-proxy configuration without its owner.
5. Trigger a price/discount/shipping change before conversion. Approval must return `NEEDS_REQUOTE`, create/show the new Backend-issued version, and create no Order/Payment. Customer must explicitly confirm the new version before Staff can approve it. The old version/PDF must remain associated with the old snapshot.
6. Submit the same Staff approval twice (same idempotency key) and, if authorized, from two Staff sessions concurrently. Confirm only one Order is associated with the Quotation and stock/promo usage changes once. Record this as website E2E evidence, not a substitute for a PostgreSQL concurrency test outside the user's policy.

## Direct Checkout pricing and idempotency

1. Add a known test variant to cart and use Backend price preview. Compare sale price/campaign best-offer behavior, one-of promo/reward discounting, shipping/pickup and grand total to the approved Pricing V1 source values.
2. Change an applicable price or total after preview but before submitting. The first checkout attempt must receive the current-price confirmation requirement (409) and create no Order, Payment, stock decrement or promo usage. Review the new amount, confirm it, then submit.
3. For a designated test checkout, record the `Idempotency-Key` request header in browser developer tools without sharing the key publicly. Simulate a response timeout after request submission, then retry the same unchanged checkout. The retry must return HTTP 200 `ORDER_REPLAYED` with the same Order code; there must be one Order, at most one expected Payment, one stock decrement, and one promo usage increment.
4. Reuse the same key with a changed cart/address/payment/promo payload in an API test harness. Expect HTTP 409 `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` and no writes. The website should rotate the key when the checkout intent changes.
5. Start a new intentional checkout with a new key only if the owner approves a second test Order. It should create a new Order (201 `ORDER_CREATED`), distinct from the replayed one.
6. Check that the replay did not resend the order email or duplicate the notification. A crash between commit and post-commit dispatch may still lose a notification until an outbox is implemented; exactly-once delivery is not promised.
7. Check COD and the approved test/sandbox bank-transfer path without completing a real payment. Ensure the Bank Transfer Payment belongs to the single Order and uses the Backend amount.

## Chatbot / integration checks and evidence

- Verify n8n/Gemini only sends customer intent/product references; Backend returns authoritative prices and state. Do not import, activate, or publish any MAIN workflow as part of this checklist.
- Confirm legacy `/api/chatbot/quotation-files` upload/download behavior is understood by the workflow owner before using the Quotation PDF path. Do not re-enable public file endpoints.
- Save sanitized request/response codes, quote/order IDs, expected versus actual totals, status transitions, and before/after inventory/promo counters. Redact access tokens, idempotency keys, addresses, phone numbers, emails and bank details.
- Stop and report any duplicate Order/Payment, repeated stock/promo decrement, stale-price approval, authorization leak, public PDF access, missing replay response, or mismatch between Backend and UI. Do not manually edit the database to make the test pass.
- Use the site's approved cancellation/refund/restock and test-data cleanup process only after recording evidence and getting approval. Never delete financial history to clean up a test.
