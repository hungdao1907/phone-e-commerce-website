# WebPhone Render readiness (2026-10-13)

Preparation only. No deploy, migration, commit/push, or n8n publish is performed by this document.

## Current fast-path release gate

MAIN is published at `cd22a99b-6fb0-4d16-bfcc-3d3ebd6d7714` (66 nodes). Original pinned 16/16 and additional 7/7 PASS; Backend 200/200 mock/isolated tests + build PASS; Frontend working-tree 70/70 tests PASS. No official Quotation/Order/Payment/PDF is created by these chatbot checks.

Latest public Gemini-dependent search retest failed: execution 1205, Service unavailable at Gemini - Product Response, transport HTTP 200 with an empty body (82.915 s). Retry stopped. Fast-only local/public greeting and warranty FAQ pass, Header Auth negatives return 403. Full live HTTP regression is PARTIAL. Backend still uses localhost webhook; no Cloudflare cutover/restart was performed. Commit/push of the reviewed fast-path source is authorized independently of the upstream outage; remote verification is reported in the task result.

Deploy readiness remains HOLD: temporary public tunnel/local catalog dependencies, unverified full public/Backend roundtrip, production secrets/TLS, explicit CORS allowlist, persistent PDF/image storage and Linux runtime verification are still required. No Render/Vercel deploy or change to the six catalog nodes is authorized in this task.

## Historical measured FAQ gate

The owner's replacement HTTP/2 Quick Tunnel passed local/public `/healthz` (200), missing/invalid Header Auth (403), and valid-auth JSON requests (200).
The earlier 8/9 public run exposed execution 1102: warranty FAQ was misrouted to product_detail and selected Apple Watch instead of the selected iPhone.
The fix was published as MAIN revision `2ab56c6c-7105-4df8-811e-a0b65cb336ff`. The final public regression passed 14/14 conversation turns (executions 1124–1137), including FAQ/resume, explicit Apple Watch, topic change and session isolation. Missing/wrong Header Auth returned 403.
Catalog lookup verified the actual iPhone product/variant IDs, unit prices and stock for the quotation selection; nonexistent-product and isolated-session checks passed.
No official Quotation, Order, or PDF was created by these checks.
Local Backend URL/process were left unchanged and still use the localhost webhook. The direct public webhook tests do not establish a Backend-to-public-webhook roundtrip.
The owner has authorized pushing the existing Webhook commit and the FAQ source package in the current release task; Git push/remote verification are reported separately.
Deployment decision: HOLD pending production configuration/storage gates below. The FAQ gate is resolved.

## Service settings verified from source

| Setting | Value |
| --- | --- |
| Branch | `Minh` |
| Root Directory | `backend` |
| Package manager | npm; `backend/package-lock.json` |
| Node version | Source has no pin. Local validated runtime is `22.21.0`; use `NODE_VERSION=22.21.0` to reproduce it, subject to a Linux build check. |
| Build Command (proposed) | `npm ci --include=dev && npx --no-install prisma generate --schema prisma/schema.prisma && npm run build` |
| Start Command | `npm start` (`node dist/src/index.js`) |
| Health check | `/health` (process liveness, not database readiness) |
| Port | `process.env.PORT || 3001`; keep Render's injected PORT rather than copying local PORT=3001. Host is not limited to localhost. |
| Auto-deploy | Leave disabled during preparation. |

Do not add migrate deploy/dev/reset/resolve or db push to the build/start commands.
Prisma Client must be generated for Render's Linux runtime; do not upload the Windows engine or local dist.
The proposed Render build and database TLS connection have not been tested on Render.

## Server-only environment

Core: `NODE_ENV=production`, `NODE_VERSION`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `N8N_CHAT_WEBHOOK_URL`, `N8N_CHAT_AUTH_HEADER`, `N8N_CHAT_AUTH_VALUE`.
Optional runtime override: `PRISMA_RUNTIME_URL`.
Feature activation: `QUOTATION_API_ENABLED=true`, `CHECKOUT_IDEMPOTENCY_ENABLED=true`, only against the already-migrated intended database.
Private files: `QUOTATION_PRIVATE_STORAGE_ROOT`, e.g. `/var/data/webphone/quotations` on a persistent disk mounted at `/var/data`.
Frontend links: `FRONTEND_URL`; some legacy links also read `VITE_APP_URL` or `VITE_API_URL` in Backend. Review actual public frontend/API URLs rather than copying localhost values.
Quotation bank transfer: `VIETQR_BANK_ID`, `VIETQR_ACCOUNT_NO`, `VIETQR_ACCOUNT_NAME`; configure real account values instead of code defaults.
Email/OTP: `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`, or a reachable SMTP configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_EMAIL`, `SMTP_PASSWORD`). Delivery on the chosen Render plan is not verified.
Images: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` if Cloudinary is selected; disk-backed image history still needs a preservation plan.
Conditional existing integrations: `N8N_ADMIN_CHAT_WEBHOOK_URL`, `SEPAY_WEBHOOK_SECRET` / `BANK_WEBHOOK_SECRET`, `GOOGLE_CALENDAR_ID` and any associated credential file used by the selected calendar configuration.

Keep all credentials in Render environment/secret files, not Git. Never put the n8n Header Auth value in Vite environment or browser requests.
`N8N_CHAT_AUTH_HEADER` must match the credential header `X-WebPhone-Chatbot-Key`.
Use a verified, stable public tunnel URL in `N8N_CHAT_WEBHOOK_URL`; this document intentionally does not store a temporary Cloudflare hostname.

## Database and authentication

Prisma schema requires `DATABASE_URL` and `DIRECT_URL`.
Runtime precedence: `PRISMA_RUNTIME_URL` -> `DIRECT_URL` -> `DATABASE_URL`.
The local configuration uses Supabase session pooler port 5432 for DIRECT_URL, transaction pooler port 6543 for DATABASE_URL, database postgres, schema public.
Local URLs currently have no explicit sslmode/sslrootcert/sslaccept parameters. Local runtime success is not proof of verified TLS on Render.
Configure verified PostgreSQL TLS for Linux and confirm it on Render without disabling verification. If a project CA is required, provision it as a secret file, e.g. `/etc/secrets/supabase-ca.crt`; do not copy a Windows CA path or commit the file.
JWT authentication uses Authorization Bearer tokens. JWT_SECRET is mandatory; keep it stable to avoid invalidating all existing sessions unintentionally.

## CORS

Current `backend/src/index.ts` calls `cors()` with unrestricted origins.
There is no existing CORS allowlist environment variable. Setting FRONTEND_URL alone does not restrict CORS.
Before production, choose the permitted Vercel/custom origins and implement an explicit allowlist with Authorization and Idempotency-Key support. This review does not change CORS code.

## Uploads and private PDF

Quotation PDFs use PDFKit and bundled `@fontsource/inter` Latin/Vietnamese WOFF font assets; no Gotenberg/browser PDF service is required.
PDF size limit is 5 MiB; private storage is checked against public upload roots, paths and SHA-256 integrity.
Default PDF storage resolves under the compiled backend tree; set QUOTATION_PRIVATE_STORAGE_ROOT explicitly to the persistent disk outside all public upload roots.
Local image uploads can resolve to `backend/dist/uploads`, with a separate `backend/uploads` static fallback. Do not assume mounting just one directory preserves every existing upload route/history.
Prefer the already-supported Cloudinary path for new images, and separately inventory/preserve legacy local images. This review does not upload, move, or delete files.
Render's ephemeral filesystem alone is not sufficient for persistent private PDFs. Disk persistence does not automatically copy existing local PDFs to the new service.

## n8n Backend API dependencies

These six MAIN HTTP nodes still target the local Backend via host.docker.internal:3001:

- API - Fetch Products: GET /api/products
- API - Fetch Products Detail: GET /api/products
- API - Fetch Products Compare: GET /api/products
- API - Fetch Products Recommendation: GET /api/products/search with existing category/maxPrice/page/limit query construction
- API - Fetch Products Quote: GET /api/products
- API - Verify Quote Catalog: POST /api/chatbot/catalog

After Render is healthy and catalog/TLS checks pass, replace only the base origin in all six nodes with the real Render HTTPS origin, preserving methods, parameters, body and existing auth. Validate and test before an explicitly authorized publish.
Until then, public Cloudflare chat still depends on the local Backend catalog and the running Windows host/Docker/tunnel.

## Release gates

- Verify origin/Minh contains the existing Webhook/Quotation commit and the FAQ source package before choosing the deployment SHA.
- Decide whether the uncommitted dropdown/payment UI work belongs in the release; it is not part of the Webhook commit.
- Confirm the public tunnel tests and full Backend roundtrip.
- Replace temporary Quick Tunnel with a durable production hostname/connector. Do not alter QUIC/firewall while HTTP/2 is functioning.
- Configure Render secrets, verified database TLS, email/OTP, bank details, persistent private storage and legacy image strategy.
- Review CORS origins and complete a Linux build/runtime check.
- Only after deploy approval and a working Render URL, cut over the six n8n catalog nodes and test the full journey.

## Official references

- https://render.com/docs/node-version
- https://render.com/docs/web-services
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/disks
- https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
