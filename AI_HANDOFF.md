# E-commerce Website — AI Handoff

Ngày đóng gói: 14/09/2026

## Mục đích

Gói này chuyển giao mã nguồn hiện tại của website thương mại điện tử để một AI hoặc lập trình viên khác có thể tiếp tục phát triển mà không cần truy cập máy gốc.

## Cấu trúc dự án

- `frontend/` — ứng dụng React, TypeScript và Vite.
  - `src/` chứa pages, components, styles, routes, state và các logic giao diện.
  - `public/` chứa các asset giao diện đang được tham chiếu.
  - `npm run dev` chạy Vite tại cổng 3000.
  - `npm run lint` chạy kiểm tra TypeScript.
  - `npm run build` tạo bản production.
- `backend/` — API Node.js/Express, TypeScript và Prisma.
  - `src/routes/` chứa các REST API theo miền nghiệp vụ.
  - `src/` cũng chứa middleware, services, utilities và cấu hình máy chủ.
  - `prisma/schema.prisma` là mô hình dữ liệu chính.
  - `scripts/` chứa script hỗ trợ/seed dữ liệu.
  - `npm run start` chạy máy chủ phát triển bằng `tsx watch`.
- `metadata.json` và các tệp cấu hình package/TypeScript được giữ nguyên để tái tạo môi trường.

## Khởi chạy trên máy mới

1. Giải nén gói.
2. Trong `frontend`, cài dependencies bằng `npm install`, sau đó dùng `npm run dev`.
3. Trong `backend`, cài dependencies bằng `npm install`.
4. Tạo `backend/.env` từ thông tin môi trường an toàn của chủ dự án (database, JWT, mail, dịch vụ Google nếu dùng). Tệp này cố ý không nằm trong gói.
5. Với Prisma, chạy `npx prisma generate`; chỉ migrate/seed khi đã xác nhận đúng database đích.
6. Khởi chạy backend bằng `npm run start`.

## Lưu ý tích hợp

- Frontend và backend là hai ứng dụng riêng; không đưa URL/database/secret vào mã nguồn khi chưa có biến môi trường tương ứng.
- Hệ thống sử dụng Prisma cho dữ liệu, JWT cho xác thực, và có các route nghiệp vụ như sản phẩm, danh mục, đơn hàng, khuyến mãi, hóa đơn, tranh chấp và khách hàng.
- Các thay đổi có thể chưa được commit. Trước khi chỉnh sửa, kiểm tra `git status` và giữ lại thay đổi đang có nếu không thuộc phạm vi công việc mới.

## Kiểm tra gần nhất

Trong backend, TypeScript và Prisma schema đã được kiểm tra không lỗi bằng `npx tsc --noEmit` và `npx prisma validate`.

## Nội dung cố ý loại trừ

Để không lộ khóa bí mật và không làm gói nặng không cần thiết, archive không chứa:

- `.env` và dữ liệu cấu hình bí mật tương đương
- file credentials/service-account
- `node_modules/`, `dist/`, `.git/`
- dữ liệu runtime như `uploads/` và database file cục bộ

Danh sách tệp cụ thể nằm trong `AI_SOURCE_MANIFEST.txt`.