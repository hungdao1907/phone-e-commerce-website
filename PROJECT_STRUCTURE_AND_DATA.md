# TÀI LIỆU CẤU TRÚC SOURCE CODE VÀ MÔ HÌNH DỮ LIỆU DỰ ÁN
## PHONE & TECH E-COMMERCE WEBSITE (FULLSTACK ARCHITECTURE)

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

- **Tên dự án:** Phone & Tech E-Commerce Website.
- **Mục tiêu:** Nền tảng thương mại điện tử chuyên cung cấp thiết bị công nghệ cao cấp (Điện thoại thông minh, Laptop, Máy tính bảng, Đồng hồ thông minh và Phụ kiện). Giao diện lấy cảm hứng từ phong cách thiết kế tối giản, sang trọng và hiện đại của Apple Store và các thương hiệu công nghệ hàng đầu thế giới.
- **Mô hình kiến trúc:** **Client - Server (Decoupled RESTful API)**
  - **Frontend:** Single Page Application (SPA) xây dựng bằng React 18, Vite, TypeScript, TailwindCSS, Framer Motion, GSAP, React Three Fiber (3D Canvas) và Lenis Smooth Scroll.
  - **Backend:** REST API server xây dựng bằng Node.js, Express, TypeScript, Prisma ORM.
  - **Database:** PostgreSQL (lưu trữ trên Cloud Supabase / Neon / Local PostgreSQL).
  - **Media & CDN:** Hỗ trợ song song Local Uploads (`/uploads/...`) và CDN ngoài (Cloudinary Public URL).

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT DIRECTORY TREE)

```text
phone-e-commerce-website/
├── backend/                             # BACKEND APPLICATION (Node.js + Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma                # Định nghĩa toàn bộ Database Models và Relations
│   ├── src/
│   │   ├── config/                      # Cấu hình hệ thống (Database, Prisma, Email, etc.)
│   │   ├── controllers/                 # Tầng Controller xử lý nghiệp vụ
│   │   │   ├── auth.controller.ts       # Xác thực Admin / Customer (JWT, Login, Register, OTP)
│   │   │   ├── product.controller.ts    # CRUD Sản phẩm, lọc, tìm kiếm nâng cao, sync mock
│   │   │   ├── category.controller.ts   # Quản lý danh mục cây đa cấp (Parent - Child)
│   │   │   ├── banner.controller.ts     # Quản lý Banner (Hỗ trợ Local Image & Cloudinary Public URL)
│   │   │   ├── order.controller.ts      # Quản lý đơn hàng, quy trình thanh toán, hóa đơn
│   │   │   ├── review.controller.ts     # Quản lý đánh giá sản phẩm và phản hồi của admin
│   │   │   ├── dispute.controller.ts    # Quản lý khiếu nại / đổi trả hàng
│   │   │   ├── lead.controller.ts       # CRM quản lý khách hàng tiềm năng & tương tác
│   │   │   ├── promoCode.controller.ts  # Mã giảm giá (Vouchers / Coupon codes)
│   │   │   ├── campaign.controller.ts   # Chiến dịch Marketing giảm giá tự động
│   │   │   ├── chatbot.controller.ts    # AI Chatbot & kịch bản tư vấn tự động
│   │   │   ├── dashboard.controller.ts  # Thống kê doanh thu, đơn hàng, biểu đồ tăng trưởng
│   │   │   └── upload.controller.ts     # Upload file ảnh tĩnh qua Multer
│   │   ├── middleware/                  # Tầng Middleware
│   │   │   ├── auth.middleware.ts       # Xác thực JWT Token & Phân quyền Role (RBAC)
│   │   │   ├── upload.middleware.ts     # Multer middleware xử lý lưu trữ file ảnh
│   │   │   └── error.middleware.ts      # Bắt lỗi toàn cục & chuẩn hóa Response
│   │   ├── routes/                      # Định tuyến RESTful API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── banner.routes.ts
│   │   │   ├── order.routes.ts
│   │   │   ├── review.routes.ts
│   │   │   ├── dispute.routes.ts
│   │   │   ├── lead.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── ...
│   │   ├── services/                    # Tầng Service xử lý logic phụ trợ
│   │   ├── utils/                       # Tiện ích (Mã hóa mật khẩu, tạo mã đơn, validate)
│   │   └── index.ts                     # Điểm khởi động Server Express
│   ├── uploads/                         # Thư mục lưu trữ media tĩnh local (/uploads/...)
│   ├── .env                             # Biến môi trường Backend (DATABASE_URL, JWT_SECRET, PORT)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                            # FRONTEND APPLICATION (React 18 + Vite + TypeScript)
│   ├── public/                          # Tài nguyên công khai (3D Models .glb, videos, images)
│   │   ├── models/                      # 3D GLTF/GLB models (iPhone 17 Pro Max 3D)
│   │   ├── videos/                      # Video showcase sản phẩm cinematic
│   │   └── images/                      # Ảnh banner, logo, icon
│   ├── src/
│   │   ├── assets/                      # Fonts, static assets
│   │   ├── components/                  # Tầng Components tái sử dụng
│   │   │   ├── admin/                   # Giao diện Quản trị Dashboard
│   │   │   │   ├── layout/              # Sidebar, Header, Notification Center, DashboardLayout
│   │   │   │   └── views/               # Banners, Products, Orders, Categories, Reviews, CRM, Analytics...
│   │   │   ├── auth/                    # Modal đăng nhập, OTP form, ProtectedRoute
│   │   │   ├── cart/                    # CartDrawer, FloatingCartButton, Giỏ hàng bay
│   │   │   ├── chatbot/                 # ChatWidget (Tư vấn viên AI & Hỗ trợ kỹ thuật)
│   │   │   ├── checkout/                # Form thông tin giao hàng, tóm tắt đơn hàng
│   │   │   ├── home/                    # Các section trang chủ (Hero Slider, Bento Grid, Ecosystem...)
│   │   │   ├── iphone/                  # Các section 3D iPhone (IphoneHero, HighlightsCarousel, 3D Canvas)
│   │   │   ├── layout/                  # GlobalNav (Mega Menu đa cấp), Footer đa tầng
│   │   │   ├── product/                 # Chi tiết sản phẩm (Gallery, Color/Storage Configurator, Specs)
│   │   │   ├── product-cards/           # Card sản phẩm (SmartphoneProductCard, StandardProductCard)
│   │   │   ├── smartphone/              # Các section trang thương hiệu điện thoại (Hero, Featured, AllProducts, Why)
│   │   │   ├── store/                   # SidebarFilter, ActiveFilterChips, FilteredProductCard
│   │   │   ├── ui/                      # Base UI (Button, Modal, RangeSlider, Carousel, Dropdown)
│   │   │   └── watch/                   # Các section trang Apple Watch / Smartwatch
│   │   ├── css/                         # CSS Module & Global stylesheets
│   │   │   ├── smartphone.css
│   │   │   ├── iphone.css
│   │   │   ├── home.css
│   │   │   └── watch.css
│   │   ├── data/                        # Dữ liệu tĩnh dự phòng (Mock & Brand Configuration)
│   │   │   ├── smartphoneData.ts        # Cấu hình màu sắc, accent, series của iPhone, Samsung, Xiaomi, OPPO
│   │   │   └── ...
│   │   ├── hooks/                       # Custom React Hooks (useLenis, useDebounce, useMediaQuery)
│   │   ├── lib/                         # Helper kết nối Storefront & Backend
│   │   │   ├── storefrontBanners.ts     # Tải banner storefront, xử lý fallback Cloudinary/Local
│   │   │   └── authFetch.ts             # Wrapper fetch kèm JWT Header tự động
│   │   ├── pages/                       # Tầng Trang (Pages / Routes)
│   │   │   ├── home/HomePage.tsx
│   │   │   ├── smartphone/              # SmartphonePage (iphone, samsung, xiaomi, oppo)
│   │   │   ├── iphone/IphonePage.tsx    # Trang 3D Interactive iPhone 17 Pro Max
│   │   │   ├── watch/                   # WatchPage, WatchBrandPage, Series11, SE3, Ultra3
│   │   │   ├── tablet/TabletPage.tsx    # iPad, Samsung Tab, Xiaomi Pad
│   │   │   ├── laptop/LaptopPage.tsx    # MacBook, ASUS, Lenovo
│   │   │   ├── product/ProductPurchasePage.tsx # Trang đặt mua sản phẩm & cấu hình biến thể
│   │   │   ├── store/ProductsFilterPage.tsx    # Trang tìm kiếm & lọc sản phẩm toàn hệ thống
│   │   │   ├── checkout/                # CheckoutPage, PaymentPage, OrderSuccessPage
│   │   │   ├── profile/CustomerProfile.tsx     # Quản lý đơn hàng cá nhân, đánh giá, khiếu nại
│   │   │   └── auth/LoginPage.tsx       # Trang đăng nhập Admin & Quản lý
│   │   ├── store/                       # State Management (Zustand)
│   │   │   ├── useCartStore.ts          # Quản lý giỏ hàng, số lượng, lưu trữ LocalStorage
│   │   │   ├── useAppStore.ts           # Trạng thái UI (CartDrawer, MobileMenu, Theme)
│   │   │   └── authStore.ts             # Trạng thái đăng nhập Customer & Admin JWT
│   │   ├── types/                       # TypeScript Interface & Type Definitions
│   │   ├── utils/                       # Hàm format giá tiền VND, xử lý ảnh (media.ts)
│   │   ├── App.tsx                      # Định tuyến chính (React Router Dom)
│   │   ├── main.tsx                     # Entry point Vite
│   │   └── index.css                    # TailwindCSS & Design Tokens
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## 3. MÔ HÌNH DỮ LIỆU CƠ SỞ DỮ LIỆU (PRISMA DATABASE SCHEMA)

Hệ thống quản lý dữ liệu toàn diện với quan hệ chặt chẽ giữa các bảng:

### 3.1. Sơ đồ Quan hệ Thực thể (Entity Relationship Overview)

```mermaid
erDiagram
    CATEGORY ||--o{ CATEGORY : "Parent-Child (Tree)"
    CATEGORY ||--o{ PRODUCT : "contains"
    CATEGORY ||--o{ CATEGORY_ATTRIBUTE : "defines"
    PRODUCT ||--|{ PRODUCT_VARIANT : "has variants"
    PRODUCT ||--o{ REVIEW : "receives"
    PRODUCT ||--o{ DISPUTE : "involves"
    
    CUSTOMER ||--o{ ORDER : "places"
    CUSTOMER ||--o{ REVIEW : "writes"
    CUSTOMER ||--o{ DISPUTE : "opens"
    
    ORDER ||--|{ ORDER_ITEM : "contains"
    ORDER ||--o| INVOICE : "generates"
    ORDER ||--o{ PAYMENT : "records"
    ORDER ||--o{ REVIEW : "rates"
    ORDER ||--o{ DISPUTE : "claims"
    
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : "ordered in"
    
    BANNER ||--o{ BANNER : "showcases on positions"
    CAMPAIGN ||--o{ PRODUCT : "applies discounts"
    LEAD ||--o{ LEAD_INTERACTION : "tracks"
```

---

### 3.2. Chi tiết các bảng cơ sở dữ liệu (Database Models)

#### 1. Bảng `Product` & `ProductVariant` (Sản phẩm & Biến thể)
- **`Product`**:
  - `id` (UUID, Primary Key)
  - `name` (String) - Tên sản phẩm.
  - `status` (String) - Trạng thái (`active`, `draft`, `archived`).
  - `image` (String, Nullable) - Ảnh đại diện chính (hỗ trợ local `/uploads/...` hoặc URL).
  - `images` (String[]) - Danh sách ảnh gallery.
  - `categoryId` (UUID, Foreign Key) - Liên kết `Category`.
  - `brand` (String, Nullable) - Tên thương hiệu (`Apple`, `Samsung`, `Xiaomi`, `OPPO`, `ASUS`, `Lenovo`).
  - `description` (String, Nullable) - Mô tả chi tiết sản phẩm.
  - `specifications` (Json, Nullable) - Lưu thông số kỹ thuật (hỗ trợ cả định dạng phẳng `[{key, value}]` và định dạng nhóm `[{title, items: [{label, value}]}]`).
- **`ProductVariant`**:
  - `id` (UUID, Primary Key)
  - `sku` (String, Unique) - Mã phân loại hàng hóa duy nhất.
  - `price` (Int) - Giá niêm yết (VNĐ).
  - `salePrice` (Int, Nullable) - Giá khuyến mãi (nếu có).
  - `stock` (Int) - Số lượng tồn kho.
  - `attributes` (Json) - Lưu các thuộc tính biến thể (VD: `{"Màu sắc": "Titan Sa Mạc", "Dung lượng": "256GB"}`).
  - `colorCode` (String, Nullable) - Mã màu HEX phục vụ swatch color (`#24262A`, `#D4734A`).
  - `image` (String, Nullable) - Ảnh tương ứng với màu sắc cụ thể của biến thể.

#### 2. Bảng `Category` & `CategoryAttribute` (Danh mục & Thuộc tính)
- **`Category`**: Hỗ trợ phân cấp cây danh mục (Self-referencing Tree):
  - `id` (UUID, Primary Key)
  - `name` (String) - Tên danh mục (Điện thoại, iPhone, Samsung, MacBook...).
  - `slug` (String, Unique) - Đường dẫn thân thiện (`dien-thoai`, `iphone`, `macbook`...).
  - `parentId` (UUID, Nullable) - Tham chiếu đến `Category.id` cha.
  - `isActive` (Boolean) - Kích hoạt / Tắt.
  - `sortOrder` (Int) - Thứ tự hiển thị menu.
- **`CategoryAttribute`**: Định nghĩa các bộ lọc cấu hình theo từng danh mục (Màu sắc, RAM, Ổ cứng, Chip...).

#### 3. Bảng `Banner` (Quản lý Banner Quảng cáo & Hero Slider)
- `id` (UUID, Primary Key)
- `title` (String) - Tiêu đề banner.
- `image` (String, Nullable) - Đường dẫn ảnh upload local (`/uploads/banners/...`).
- `publicUrl` (String, Nullable) - Đường dẫn Public URL từ Cloudinary / CDN (`https://res.cloudinary.com/...`).
- `link` (String, Nullable) - Đường dẫn điều hướng khi click (`/phone/iphone`, `/exploreIphone17promax`...).
- `position` (String) - Vị trí hiển thị (`home_hero`, `iphone_hero`, `samsung_hero`, `watch_hero`, `laptop_hero`, `tablet_hero`...).
- `sortOrder` (Int) - Thứ tự hiển thị slide.
- `isActive` (Boolean) - Trạng thái kích hoạt.
- `startDate` / `endDate` (DateTime, Nullable) - Lịch chạy banner tự động.

#### 4. Bảng `Order`, `OrderItem`, `Invoice`, `Payment` (Đơn hàng & Thanh toán)
- **`Order`**:
  - `orderCode` (String, Unique) - Mã đơn hàng (VD: `ORD-882910`).
  - `customerId` (UUID) - Khách hàng đặt mua.
  - `status` (String) - `pending`, `confirmed`, `shipping`, `delivered`, `completed`, `cancelled`.
  - `paymentMethod` (String) - `COD`, `BANK_TRANSFER`.
  - `paymentStatus` (String) - `PENDING`, `PAID`, `REFUNDED`.
  - `shippingAddress`, `shippingPhone` (String).
  - `totalAmount`, `discountAmount`, `shippingFee` (Int).
- **`OrderItem`**:
  - `orderId`, `variantId`
  - `productName`, `variantInfo` (Lưu snapshot thông tin tại thời điểm mua).
  - `quantity`, `unitPrice` (Int).
- **`Invoice`**: Xuất hóa đơn điện tử VAT đính kèm đơn hàng.
- **`Payment`**: Ghi nhận lịch sử giao dịch chuyển khoản VietQR, mã tham chiếu ngân hàng.

#### 5. Bảng `Customer`, `User` (Khách hàng & Quản trị viên)
- **`User`**: Dành cho Quản trị viên / Nhân viên (`role`: `superadmin`, `admin`, `manager`, `user`).
- **`Customer`**: Dành cho khách mua hàng (Email, SĐT, Mật khẩu băm, OTP xác thực, Địa chỉ).

#### 6. Bảng `Review`, `Dispute` (Đánh giá & Khiếu nại đổi trả)
- **`Review`**: Đánh giá số sao (1-5★), bình luận, ảnh thực tế, câu trả lời từ Admin.
- **`Dispute`**: Yêu cầu đổi trả / hoàn tiền / bảo hành từ khách hàng với hình ảnh bằng chứng.

#### 7. Bảng `Lead`, `LeadInteraction` (CRM & Chăm sóc khách hàng)
- Quản lý thông tin khách hàng tiềm năng từ Website, Chatbot AI, Hotline.
- Đánh giá điểm tiềm năng (`leadScore`), trạng thái tư vấn và phân công nhân viên phụ trách.

#### 8. Bảng `Campaign`, `PromoCode` (Marketing & Khuyến mãi)
- **`Campaign`**: Flash sale, Black Friday, tự động áp dụng % hoặc số tiền giảm cho nhóm sản phẩm.
- **`PromoCode`**: Mã voucher nhập tay ở bước thanh toán (giới hạn lượt dùng, đơn hàng tối thiểu).

---

## 4. DANH SÁCH RESTFUL API (BACKEND API ENDPOINTS)

| Nhóm chức năng | Endpoint | Phương thức | Mô tả chi tiết |
| :--- | :--- | :---: | :--- |
| **Authentication** | `/api/auth/login` | `POST` | Đăng nhập Admin / Manager (Nhận JWT Token) |
| | `/api/auth/customer/login` | `POST` | Đăng nhập Khách hàng |
| | `/api/auth/customer/register`| `POST` | Đăng ký tài khoản khách hàng mới |
| | `/api/auth/customer/otp` | `POST` | Gửi & xác thực mã OTP qua Email/SĐT |
| **Sản phẩm (Products)** | `/api/products` | `GET` | Lấy danh sách toàn bộ sản phẩm |
| | `/api/products/:id` | `GET` | Lấy chi tiết sản phẩm kèm variants và specs |
| | `/api/products/search` | `GET` | Tìm kiếm & phân trang theo category, brand, giá, RAM, chip |
| | `/api/products/filters` | `GET` | Lấy danh mục bộ lọc khả dụng (Brands, RAM, Storage, CPU, Colors) |
| | `/api/products` | `POST` | Tạo sản phẩm mới (Admin) |
| | `/api/products/:id` | `PUT/DELETE`| Cập nhật / Xóa sản phẩm (Admin) |
| | `/api/products/sync-mock` | `POST` | Tự động đồng bộ sản phẩm mock vào CSDL khi thêm vào giỏ |
| **Danh mục (Categories)**| `/api/categories` | `GET` | Lấy cây danh mục đa cấp (Root + Children) |
| | `/api/categories` | `POST` | Tạo mới danh mục (Admin) |
| | `/api/categories/:id` | `PUT/DELETE`| Chỉnh sửa / Xóa danh mục |
| **Banner quảng cáo** | `/api/banners` | `GET` | Lấy danh sách tất cả banner (Admin) |
| | `/api/banners/active` | `GET` | Lấy banner đang hoạt động theo vị trí (`position`) cho Storefront |
| | `/api/banners` | `POST` | Tạo banner mới (Hỗ trợ upload ảnh local hoặc paste Cloudinary Public URL) |
| | `/api/banners/:id` | `PUT` | Cập nhật banner (Thay đổi link, vị trí, ảnh local / Public URL) |
| | `/api/banners/:id` | `DELETE` | Xóa banner |
| **Đơn hàng (Orders)** | `/api/orders` | `POST` | Tạo đơn hàng mới từ Storefront |
| | `/api/orders` | `GET` | Danh sách đơn hàng (Phân quyền Admin / Customer) |
| | `/api/orders/:id` | `GET` | Chi tiết đơn hàng, lịch sử trạng thái, mã QR chuyển khoản |
| | `/api/orders/:id/status` | `PATCH` | Cập nhật trạng thái đơn (pending -> confirmed -> shipping...) |
| **Đánh giá & Khiếu nại**| `/api/reviews` | `GET/POST` | Gửi và duyệt đánh giá sản phẩm |
| | `/api/disputes` | `GET/POST` | Gửi yêu cầu đổi trả / xử lý khiếu nại |
| **Upload File** | `/api/upload` | `POST` | Upload file ảnh tĩnh lên máy chủ qua Multer (`/uploads/...`) |
| **Dashboard Analytics** | `/api/dashboard/stats` | `GET` | Thống kê doanh thu ngày/tuần/tháng, top sản phẩm, tỉ lệ chuyển đổi |
| **CRM Leads & Chatbot** | `/api/chatbot/message` | `POST` | Nhận phản hồi tư vấn tự động từ AI Chatbot |
| | `/api/leads` | `GET/POST` | Quản lý thông tin khách hàng cần tư vấn |

---

## 5. KIẾN TRÚC FRONTEND & LUỒNG XỬ LÝ (FRONTEND ARCHITECTURE)

### 5.1. Luồng định tuyến giao diện (Routing Architecture - `App.tsx`)

1. **Storefront Routes (Bọc trong `MainLayout` gồm GlobalNav, CartDrawer, ChatWidget, Footer):**
   - `/`: Trang chủ (`HomePage`) - Banner 3D Hero, Flash Sale, Showcase sản phẩm theo hệ sinh thái.
   - `/phone/iphone` (và alias `/iphone`, `/phone`): Trang danh mục iPhone (`SmartphonePage brand="iphone"`).
   - `/phone/exploreIphone17promax`: Trang trải nghiệm 3D tương tác iPhone 17 Pro Max (`IphonePage`).
   - `/phone/samsung`, `/phone/xiaomi`, `/phone/oppo`: Trang sản phẩm các thương hiệu điện thoại.
   - `/watch/exploreWatch`, `/watch/apple-watch`, `/watch/exploreSeries-11`: Trang hệ sinh thái Smartwatch.
   - `/tablet/ipad`, `/tablet/samsung`, `/tablet/xiaomi`: Trang máy tính bảng.
   - `/laptop/macbook`, `/laptop/asus`, `/laptop/lenovo-6xfo`: Trang máy tính xách tay.
   - `/products`: Trang tìm kiếm, lọc thông số toàn diện (`ProductsFilterPage`).
   - `/product/:slug`: Trang đặt mua sản phẩm (`ProductPurchasePage`).
   - `/checkout`, `/checkout/payment`, `/order-success`: Quy trình thanh toán giỏ hàng.
   - `/profile`, `/profile/orders/:orderId`: Quản lý tài khoản và lịch sử đơn hàng khách hàng.

2. **Admin Dashboard Routes (Bọc trong `ProtectedRoute` với quyền `admin`, `manager`, `superadmin`):**
   - `/dashboard`: Bảng điều khiển tổng quan và thống kê doanh thu.
   - `/dashboard/products`: Quản lý sản phẩm, tồn kho và biến thể.
   - `/dashboard/categories`: Quản lý cây danh mục và thuộc tính lọc.
   - `/dashboard/banners`: Quản lý Banner quảng cáo (Hỗ trợ kép Local Upload + Cloudinary Public URL).
   - `/dashboard/orders`: Quản lý đơn hàng, in hóa đơn và cập nhật vận chuyển.
   - `/dashboard/reviews`, `/dashboard/disputes`: Chăm sóc khách hàng và phản hồi đánh giá.
   - `/dashboard/marketing`, `/dashboard/promocodes`: Chiến dịch khuyến mãi và mã giảm giá.
   - `/dashboard/leads`: CRM khách hàng tiềm năng.

---

### 5.2. Các cơ chế xử lý dữ liệu đặc biệt (Special Data Handling Mechanisms)

#### 1. Cơ chế Banner Kép (Cloudinary Public URL & Local Uploads)
Hệ thống banner áp dụng nguyên tắc fallback linh hoạt:
- **Admin:** Có thể chọn tải ảnh từ máy tính (lưu vào `/uploads/banners/...`) **HOẶC** dán trực tiếp đường link Public URL từ CDN (Cloudinary / S3).
- **Backend:** Lưu cả 2 trường `image` và `publicUrl` độc lập trong cơ sở dữ liệu.
- **Storefront:** Sử dụng helper `resolveBannerImage(banner)` tại `storefrontBanners.ts`:
  $$\text{Render URL} = \text{publicUrl} \parallel \text{resolveMediaUrl(image)} \parallel \text{fallbackPlaceholder}$$

#### 2. Cơ chế trích xuất thông số kỹ thuật an toàn (Universal Specs Parser)
Cơ sở dữ liệu hỗ trợ cả 2 định dạng thông số:
- **Định dạng phẳng:** `[{ key: "RAM", value: "8GB" }]` hoặc `[{ name: "Màn hình", value: "6.3 inch" }]`
- **Định dạng nhóm (Grouped):** `[{ title: "Hiệu năng", items: [{ label: "CPU", value: "Apple A19" }] }, { type: "specImage", url: "..." }]`

Component [FilteredProductCard.tsx](file:///c:/Users/minh1/Downloads/phone-e-commerce-website/frontend/src/components/store/FilteredProductCard.tsx) và các trang danh mục được trang bị hàm `getSpec(keyword)` an toàn 100%, tự động duyệt qua tất cả cấu trúc dữ liệu mà không bao giờ phát sinh lỗi `undefined.toLowerCase()` gây trắng trang.

#### 3. Trải nghiệm 3D Interactive (Three.js / React Three Fiber)
- Trang [IphonePage.tsx](file:///c:/Users/minh1/Downloads/phone-e-commerce-website/frontend/src/pages/iphone/IphonePage.tsx) tải mô hình 3D định dạng `.glb` nén Draco.
- Tự động chuẩn hóa tỷ lệ mô hình (`normalizeModel`), khử ánh sáng chói màn hình (`envMapIntensity`), hỗ trợ xoay 360 độ theo thao tác chuột và cảm ứng với lực quán tính mượt mà (Inertia damping).
- Tích hợp GSAP ScrollTrigger để tạo hiệu ứng zoom video và trượt linh kiện theo tiến trình cuộn trang.

---

## 6. HƯỚNG DẪN CẤU HÌNH & KHỞI CHẠY (GETTING STARTED)

### 6.1. Cấu hình biến môi trường (`.env`)

**Backend (`backend/.env`):**
```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db"
DIRECT_URL="postgresql://user:password@localhost:5432/ecommerce_db"
JWT_SECRET="your_jwt_super_secret_key"
FRONTEND_URL="http://localhost:3000"
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL="http://localhost:3001"
```

### 6.2. Lệnh cài đặt và khởi chạy

1. **Khởi động Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm start
   # Server chạy tại: http://localhost:3001
   ```

2. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Ứng dụng chạy tại: http://localhost:3000
   ```

3. **Kiểm tra bản build Production:**
   ```bash
   cd frontend
   npm run build
   ```

---

*Tài liệu được tự động đồng bộ và phản ánh chính xác 100% cấu trúc source code hiện tại của dự án.*
