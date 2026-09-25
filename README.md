# Phone E-Commerce Website — Cửa Hàng Công Nghệ Cao Cấp

Dự án frontend thương mại điện tử công nghệ tiêu dùng cao cấp, tập trung vào trải nghiệm người dùng tinh tế, đồ họa điện ảnh và scrollytelling tương tác cho các dòng sản phẩm

---

## 🚀 Khởi chạy Dự án

```powershell
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Truy cập cục bộ tại: `http://localhost:3000`

### Các lệnh kiểm tra chất lượng mã nguồn:
```powershell
# Kiểm tra TypeScript
npx tsc --noEmit

# Kiểm tra Linter
npm run lint

# Tạo bản build production
npm run build
```

---

## 🧭 Cấu trúc Dự án & Bản đồ Route

```
phone-e-commerce-website/
├── AI_CLI_HANDOFF.md       # Tài liệu bàn giao chi tiết cho AI CLI & Developer
├── AI_CLI_HANDOFF.json     # Manifest máy đọc được ghi nhận toàn bộ trạng thái source
├── README.md               # Hướng dẫn tổng quan dự án
└── frontend/
    ├── index.html          # HTML entry, cấu hình fonts SF Pro, Inter, Anton
    ├── vite.config.ts      # Cấu hình Vite & alias @/*
    ├── package.json        # Dependencies (React 19, Tailwind 4, Framer Motion, Lenis, Three.js)
    ├── public/
    │   ├── images/         # Kho ảnh sản phẩm (có thư mục chuyên biệt /images/watch/)
    │   ├── videos/         # Video giới thiệu và hero cinematic (16:9 crop chuẩn)
    │   └── models/         # Mô hình 3D GLB cho iPhone 17 Pro Max
    └── src/
        ├── App.tsx         # Thiết lập Router, ReactLenis (smooth scroll), Suspense
        ├── main.tsx        # React root entry
        ├── components/
        │   ├── layout/     # GlobalNav (mega menu) và Footer
        │   └── ui/         # Các nút bấm tương tác và micro-components
        └── pages/
            ├── home/       # Trang chủ giới thiệu sản phẩm nổi bật
            ├── iphone/     # Trang chi tiết iPhone 17 Pro với 3D WebGL viewer
            ├── login/      # Giao diện đăng nhập / đăng ký độc lập
            └── watch/      # Hệ sinh thái Apple Watch
                ├── WatchPage.tsx   # Trang tổng quan kết nối 10 section liên tục
                ├── sections/       # 10 Section từ Hero full view đến Health & CTA
                ├── components/     # Các component dùng chung (MetricCard, RingVisual...)
                ├── data/           # watchModels.ts (dữ liệu SE 3, Series 11, Ultra 3)
                ├── se-3/           # Trang chuyên sâu Apple Watch SE 3
                ├── series-11/      # Trang chuyên sâu Apple Watch Series 11
                └── ultra-3/        # Trang chuyên sâu Apple Watch Ultra 3
```

---

## 🛠️ Công nghệ Sử dụng

- **Giao diện & Logic**: React 19, TypeScript, Vite
- **Kiểu dáng (Styling)**: Tailwind CSS v4, Vanilla CSS tùy chỉnh
- **Hiệu ứng & Cuộn**: Framer Motion 12, Lenis Smooth Scroll, GSAP
- **Đồ họa 3D**: Three.js, React Three Fiber, Drei


