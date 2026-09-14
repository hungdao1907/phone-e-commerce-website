

## 📁 Cấu trúc thư mục (Folder Structure)
Để anh em trong team dễ hình dung, dưới đây là luồng đi của dự án:
```text
frontend/
├── public/               # Chứa các tài nguyên tĩnh không cần build
│   ├── images/           # Hình ảnh (Hero, Camera, Video...)
│   ├── models/           # Các file 3D (.glb) của iPhone 17
│   └── draco-gltf/       # ⚠️ QUAN TRỌNG: Bộ giải mã 3D Google Draco (TUYỆT ĐỐI KHÔNG XÓA)
├── src/
│   ├── components/       # Các thành phần tái sử dụng
│   │   ├── layout/       # Navbar, Footer toàn cục
│   │   ├── sections/     # Các phân đoạn hiển thị (Hero, Camera, Carousel...)
│   │   └── ui/           # (Nếu có) Các component siêu nhỏ (Nút, Input...)
│   ├── pages/            # Các trang chính
│   │   ├── HomePage.tsx  # Trang chủ
│   │   ├── IphonePage.tsx# Trang hiển thị chi tiết iPhone 17 + 3D
│   │   └── LoginPage.tsx # Trang đăng nhập Glassmorphism
│   ├── hooks/            # Các custom React Hooks
│   ├── lib/              # Các hàm tiện ích (utils.ts kết hợp clsx, tailwind-merge)
│   ├── App.tsx           # Nơi định nghĩa Routing
│   └── index.css         # Nơi chứa config Tailwind & CSS Variables gốc
└── vite.config.ts        # Cấu hình Vite & Alias (@/)
```


