# Order request idempotency — design only

Status: NOT IMPLEMENTED. No Direct Checkout API contract or database schema is changed by this note.

## Direct Checkout replay risk

`POST /api/orders` currently has no durable request idempotency key. The order-code collision retry added in Phase 2B.2E only handles a failed unique insert; it does not deduplicate a client replay after the first request committed. A repeated checkout can therefore create another Order if stock and business rules still permit it.

## Proposal for a separately approved change

- Accept an `Idempotency-Key` header only after the API contract is approved; scope it by authenticated `customerId` and enforce a database unique key on `(customerId, key)`.
- Persist a canonical request hash and the resulting Order reference/response. Reuse of a key with the same hash returns the original result; reuse with a different hash returns `409`.
- Claim the key, reserve stock, create Order/Payment, and persist the result in one database transaction. A failed transaction must not leave a claim that prevents a legitimate retry.
- Keep email and Admin notification delivery after commit. For durable exactly-once intent, add an outbox row in the Order transaction with a unique `(orderId, eventType)` key; dispatch asynchronously and make consumers deduplicate by event ID.
- Do not place external payment/network calls inside the Order transaction.

## Tests required before enabling that proposal

- Concurrent identical requests with the same key and payload return one Order ID and decrement stock/promo usage once.
- Reusing a key with a different canonical payload returns `409` and leaves the first Order unchanged.
- A transaction failure leaves no persisted key claim, Order, Payment, stock decrement, or promo-use increment; a retry with the same key can then succeed.
- Concurrent notification dispatch produces one outbox event per `(orderId, eventType)` and duplicate delivery is harmless.
- Preserve existing checkout behavior for requests not covered by the approved idempotency policy; decide explicitly whether a missing key is accepted before changing the contract.

Quotation conversion already has a unique `Order.quotationId`, a unique `QuotationReview.idempotencyKey`, and a serializable approval transaction. Those constraints prevent another Order for the same quotation when present in the database; they do not make Direct Checkout request replay idempotent.

No migration or endpoint change is authorized by this design note.
