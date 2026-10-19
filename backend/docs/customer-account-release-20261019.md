# Customer registration, email login and immutable account identity

## Contract

- Customer registration: `POST /api/auth/customer/register` with `{ fullName, email, phone, password }`.
- Customer login: `POST /api/auth/customer/login` with `{ email, password }`.
- Registration OTP resend: `POST /api/auth/customer/resend-otp` with `{ email }`.
- Internal Admin/Staff/Superadmin username login remains at `POST /api/auth/login`.
- Legacy clients may submit a customer email in `username` to `/api/auth/login`; customer usernames and telephone numbers no longer authenticate there.
- Profile `PUT /api/customers/profile` accepts exactly `{ address: string }`. Any additional property is rejected with 400 before a write.
- Delivery recipient name/phone live inside the existing address JSON as `recipientName` and `recipientPhone`; they do not update Customer registration fields. Checkout reads these independent values.
- Email is trimmed/lowercased for input and matched case-insensitively against legacy accounts. Existing stored email, username and password are not backfilled.
- New/reset passwords require 8+ characters, upper/lowercase letters and a digit, at most 72 UTF-8 bytes. Existing login passwords remain valid without applying new-password rules.
- OTP verification remains mandatory; stored registration challenges are hashed, expire in five minutes, enforce five attempts and a 60-second resend cooldown. Password-reset challenges use a separate signing purpose.
- No schema migration is required. Prisma connection preference and production data are unchanged.

## Validation on 2026-10-19

- Backend existing suite: 249/249; account HTTP regression suite: 40/40.
- Frontend existing suite: 76/76; account/delivery/SSR regression suite: 14/14.
- Tests use fixture accounts, mocked Prisma delegates and mocked mail delivery. They do not prove real PostgreSQL integration, real OTP delivery or a production Customer browser journey.
- Frontend TypeScript/lint and both production builds are required before commit.

## Release gate

The inspected Render service is linked to the group repository and branch Minh, root `backend/`, auto-deploy OFF, and is suspended by the user. Its latest recorded deployment uses the previous backend commit. The inspected Vercel production deployment is linked to `minh20062/webphone`, branch `main`.

1. Commit/push only the account change files to group Minh after validation.
2. The owner must resume the intended Render service and deploy the reviewed group commit. Do not change database configuration or run migrations.
3. Verify health and the new customer login/resend routes; use an approved test Customer for authenticated login, profile, verification and reset. Confirm email delivery is configured through the existing mail transport. Do not put keys in source or logs.
4. Coordinate the frontend rollout: the old registration UI lacks mandatory fullName/phone, and old profile forms submit locked identity fields. A backend-only release intentionally rejects these old writes, so minimize the window before releasing the matching frontend.
5. Only after backend compatibility is verified, sync the reviewed frontend changes to personal main with a non-force push. Preserve that repository's deployment configuration and other work.
6. Verify Vercel READY for the actual new commit, then test Customer and internal login in the browser.

Legacy Customers missing a name or phone see “Chưa có thông tin”. A separate identity-verified support process is needed to fill these fields; this release does not add public editing or mass backfill.

Rollback must coordinate frontend and backend versions. Never restore production data, reset customer passwords, or remove newly registered customers to roll back application code.
