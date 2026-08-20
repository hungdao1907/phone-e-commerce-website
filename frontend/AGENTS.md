# Dự án: Frontend thương mại điện tử điện thoại

## Mục tiêu dự án

Xây dựng frontend thương mại điện tử cao cấp, hiện đại cho điện thoại, laptop và phụ kiện.

Ưu tiên hiện tại chỉ là UI/UX frontend.

Backend, cơ sở dữ liệu, xác thực, tồn kho, logic quản trị và tích hợp thanh toán sẽ được triển khai sau.

## Tech stack hiện tại

- React 19
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS 4
- Zustand
- TanStack React Query
- Three.js
- React Three Fiber
- Drei
- Spline
- Lucide React

## Kiến trúc hiện tại

Các khu vực quan trọng đang có:

- `src/pages`
- `src/components/layout`
- `src/components/sections`
- `src/data`
- `src/store`

Các route hiện có:

- `/`
- `/iphone`

Trải nghiệm iPhone 3D hiện có là quan trọng và phải được giữ nguyên, trừ khi có yêu cầu rõ ràng.

## Ưu tiên frontend

Ưu tiên theo thứ tự:

1. chất lượng hình ảnh
2. layout
3. hành vi responsive
4. tương tác
5. animation
6. accessibility
7. component sạch, có thể tái sử dụng

Chưa ưu tiên kiến trúc backend ở giai đoạn này.

## Hướng thiết kế

UI cần tạo cảm giác:

- cao cấp
- sạch sẽ
- hiện đại
- thoáng
- tập trung vào sản phẩm
- sáng tạo về thị giác
- giàu motion nhưng không hỗn loạn

Tránh phong cách SaaS chung chung do AI tạo ra.

Tránh:

- gradient quá mức
- glassmorphism quá mức
- neon glow ngẫu nhiên
- card bo góc quá nhiều
- phong cách giống dashboard không cần thiết
- animation quá mức
- các ngôn ngữ thị giác không nhất quán

Sử dụng visual hierarchy rõ ràng.

## Hướng motion

Animation là một phần quan trọng của dự án.

Ưu tiên:

- section reveal mượt mà
- phần tử xuất hiện theo stagger
- tương tác card tinh tế
- chiều sâu cho hình ảnh
- kể chuyện dựa trên scroll khi phù hợp
- transition cao cấp
- animation dựa trên `transform` và `opacity`

Tránh:

- bounce quá mức
- xoay tròn
- scale mạnh
- animation lặp vô hạn liên tục không có mục đích
- motion gây xao nhãng

Tôn trọng tuỳ chọn reduced motion khi phù hợp.

## Quy tắc React

- Dùng functional component.
- Dùng TypeScript.
- Tránh `any`.
- Giữ component tập trung vào một trách nhiệm.
- Tái sử dụng component thay vì lặp lại markup.
- Tránh `useEffect` không cần thiết.
- Tránh global state không cần thiết.
- Không tạo abstraction nếu không có lợi ích rõ ràng.

## Quy tắc styling

- Dùng Tailwind CSS làm phương thức styling chính.
- Tuân theo convention hiện có của dự án.
- Luôn cân nhắc responsive trên mobile.
- Không thêm thư viện styling mới nếu chưa được phê duyệt rõ ràng.
- Tránh thay đổi global CSS lớn cho một task component cục bộ.

## Quy tắc dữ liệu

Ở giai đoạn hiện tại:

- dùng mock data cho frontend
- không thiết kế schema backend/cơ sở dữ liệu nếu chưa được yêu cầu
- không tạo API giả
- không thêm dependency backend

Product UI cần dễ kết nối với backend về sau.

## Bảo vệ feature hiện có

Trừ khi có yêu cầu rõ ràng, không sửa:

- `IphonePage.tsx`
- 3D viewer hiện có
- các file GLB model
- hành vi Hero
- hành vi WaveGallery
- hành vi GlobalNav
- các homepage section không liên quan

Không refactor file không liên quan trong một task UI nhỏ.

## Quy tắc dependency

Trước khi cài một package:

1. kiểm tra xem dependency hiện có đã giải quyết được vấn đề chưa
2. ưu tiên stack hiện tại
3. không cài package cho utility đơn giản
4. chỉ hỏi khi dependency mới ảnh hưởng đáng kể đến kiến trúc

## Quy trình làm việc

Trước khi chỉnh sửa:

1. kiểm tra các file hiện có liên quan
2. hiểu luồng component/dữ liệu hiện tại
3. giữ phạm vi task hẹp

Với task nhỏ, được xác định rõ, hãy triển khai trực tiếp.

Với task làm thay đổi kiến trúc, hãy lập kế hoạch ngắn trước khi triển khai.

Sau khi chỉnh sửa:

1. chạy `npm run lint`
2. chạy `npm run build` khi phù hợp
3. sửa các lỗi do thay đổi gây ra
4. review diff để phát hiện thay đổi không liên quan

## Git

Branch phát triển hiện tại:

`Minh`

Không:

- chuyển branch
- tự động commit
- chạy `git add .`
- reset history
- thay đổi cấu hình Git

trừ khi được yêu cầu rõ ràng.

## Phản hồi cuối

Sau một coding task, hãy tóm tắt:

- file được tạo
- file được chỉnh sửa
- nội dung đã thay đổi
- validation đã thực hiện
- các vấn đề liên quan còn lại

Giữ báo cáo ngắn gọn.

## Tài liệu thiết kế của dự án

Với công việc UI, layout, styling hoặc visual design, hãy đọc:

`docs/DESIGN_SYSTEM.md`

Với công việc animation, interaction hoặc motion, hãy đọc:

`docs/MOTION_SYSTEM.md`

Không tạo một ngôn ngữ thiết kế hoặc motion mới nếu chưa kiểm tra các tài liệu này.

Khi task yêu cầu hoặc phù hợp với việc đánh giá thiết kế frontend, hãy dùng `$design-taste-frontend` theo hướng dẫn có sẵn.

Chỉ đọc các tài liệu này khi chúng liên quan đến task được yêu cầu.

Chỉ đọc các tài liệu này khi chúng liên quan.
