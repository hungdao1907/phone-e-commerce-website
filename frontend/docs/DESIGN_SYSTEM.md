# Hệ thống thiết kế

## Định hướng dự án

Dự án này là frontend thương mại điện tử công nghệ tiêu dùng cao cấp.

Hướng thị giác cần tạo cảm giác:

- cao cấp
- hiện đại
- thoáng
- editorial
- tập trung vào sản phẩm
- sạch sẽ
- giàu motion nhưng có kiểm soát

Website không được trông như dashboard SaaS chung chung hoặc template do AI tạo ra.

---

## Nguyên tắc thiết kế

### 1. Ưu tiên sản phẩm

Sản phẩm, hình ảnh và typography phải dẫn dắt visual hierarchy.

Tránh thêm các chi tiết trang trí cạnh tranh với sản phẩm.

### 2. Layout thoáng

Sử dụng khoảng cách rộng rãi giữa các section chính.

Không làm giao diện dày đặc một cách không cần thiết.

### 3. Hierarchy rõ ràng

Tạo khác biệt rõ rệt giữa:

- eyebrow text
- tiêu đề section
- nội dung body
- metadata
- nhãn CTA

### 4. Accent color có kiểm soát

Xanh lá là accent color chính.

Dùng màu này cho:

- CTA chính
- trạng thái active
- điểm nhấn nhỏ
- control được chọn
- phản hồi tương tác tinh tế

Không dùng green glow ở mọi nơi.

### 5. Những khoảnh khắc immersive

Chỉ một số section được chọn mới nên mang cảm giác immersive mạnh.

Ví dụ:

- Hero
- phần giới thiệu sản phẩm 3D
- WaveGallery

Commerce UI như ProductCard, filter và cart nên yên tĩnh hơn.

---

## Hệ thống màu

### Background

Background chính:

`#F5F5F7`

Surface trắng:

`#FFFFFF`

Surface immersive tối:

Dùng tông navy hoặc forest rất tối khi cần.

Tránh dùng nhiều màu tối không liên quan.

### Văn bản

Văn bản chính:

`#1D1D1F`

Văn bản phụ:

`#6E6E73`

Văn bản muted vẫn phải dễ đọc.

### Accent

Accent chính:

Màu xanh lá hiện đang được dự án sử dụng.

Dùng nhất quán màu xanh lá hiện có của dự án, trừ khi design system được thay đổi có chủ đích sau này.

Không đưa vào nhiều accent color cạnh tranh với nhau.

---

## Cân bằng màu sắc

Mục tiêu xấp xỉ:

- 80% surface trung tính / sáng
- 15% section immersive tối
- 5% accent color

Đây là hướng dẫn, không phải công thức cứng.

---

## Typography

Font body chính:

Inter

Display typography có thể dùng Anton hiện có khi phù hợp.

### Hierarchy

Tiêu đề display lớn:

- đậm
- tương phản cao
- kiểm soát line-height rộng rãi

Tiêu đề section:

- nổi bật nhưng nhỏ hơn Hero text

Body:

- dễ đọc
- độ dài dòng tiết chế

Metadata / eyebrow:

- nhỏ hơn
- viết hoa khi phù hợp
- letter spacing lớn hơn

Tránh dùng quá nhiều cỡ chữ trong một section.

---

## Layout

Ưu tiên container căn giữa.

Chiều rộng nội dung tối đa phổ biến:

`1280px` đến `1440px`

Dùng horizontal padding responsive.

Mẫu gợi ý:

- mobile: 16px
- tablet: 24px
- desktop: 32px hoặc lớn hơn khi phù hợp

Không làm mọi section full-width nếu điều đó làm giảm khả năng đọc nội dung.

---

## Cấu trúc section

Một content section điển hình nên theo thứ tự:

Eyebrow
→ Heading
→ Supporting text
→ Content
→ CTA tuỳ chọn

Không ép cấu trúc này lên section không cần đủ các thành phần.

---

## Spacing

Dùng nhịp spacing nhất quán.

Ưu tiên một nhóm giá trị spacing nhỏ thay vì giá trị tuỳ ý ở khắp nơi.

Các section chính cần có khoảng cách dọc rộng rãi.

Product card và commerce UI nên dùng spacing chặt hơn Hero section.

---

## Border radius

Dùng bo góc một cách thận trọng.

Product card:

- radius trung bình đến lớn

Button:

- radius nhất quán

Không áp dụng bo góc lớn cho mọi container.

Tránh tạo visual hierarchy kiểu "card trong card trong card".

---

## Shadow

Dùng shadow để thể hiện chiều sâu.

Ưu tiên:

- mềm
- rộng
- opacity thấp

Tránh:

- shadow đen nặng
- shadow neon
- hiệu ứng nổi quá mức

Component immersive có thể có chiều sâu mạnh hơn khi hợp lý.

---

## Product card

ProductCard cần tạo cảm giác:

- sạch sẽ
- cao cấp
- ưu tiên hình ảnh
- dễ scan

Thứ tự ưu tiên:

1. hình ảnh sản phẩm
2. tên sản phẩm
3. giá sản phẩm
4. thương hiệu / metadata
5. hành động hỗ trợ

Tránh nhồi quá nhiều nội dung vào card.

ProductCard phải có thể tái sử dụng cho:

- FeaturedProductsSection
- ProductsPage
- gợi ý sản phẩm

Hiệu ứng tương tác đặc biệt chỉ được áp dụng trong bối cảnh trình bày cụ thể.

---

## Hình ảnh sản phẩm

Dùng:

- `object-contain`
- vùng hình ảnh nhất quán
- khoảng trắng rộng rãi

Không crop phần cứng quan trọng của sản phẩm trừ khi có chủ đích thiết kế.

Giữ tỷ lệ hình ảnh ổn định giữa các card.

---

## Button

### Primary

Dùng cho hành động chính.

Ví dụ:

- Mua ngay
- Khám phá sản phẩm
- Thêm vào giỏ hàng

Hành động chính có thể dùng accent xanh lá.

### Secondary

Nên yên tĩnh hơn.

Ví dụ:

- Xem chi tiết
- Tìm hiểu thêm

Tránh đặt nhiều CTA nổi bật về thị giác trong cùng một khu vực nhỏ.

---

## Navigation

Giữ nguyên kiến trúc mega-menu hiện có.

Navigation cần tạo cảm giác:

- tối giản
- chính xác
- cao cấp

Tên gọi phải nhất quán.

Ưu tiên:

- Laptop
- Tablet
- iPhone
- Smartphone
- Watch
- Hỗ trợ

Tránh cách viết hoa không nhất quán như:

- LapTop
- TabLet
- SmartPhone

---

## Nhịp thị giác của homepage

Cấu trúc ưu tiên:

Hero
→ Chuyển tiếp thương hiệu / marquee
→ Nội dung thương mại nổi bật
→ Section thị giác immersive
→ Footer

Trang nên luân phiên giữa:

bình tĩnh
→ nhấn mạnh
→ bình tĩnh
→ immersive

Tránh làm mọi section đều quá mạnh về thị giác.

---

## Accessibility

Luôn cân nhắc:

- độ tương phản dễ đọc
- phần tử tương tác có ngữ nghĩa
- keyboard focus hiển thị rõ
- alt text hữu ích cho hình ảnh
- touch target trên mobile
- reduced motion khi liên quan

---

## Anti-pattern

Tránh:

- card SaaS chung chung
- glassmorphism quá mức
- gradient quá mức
- neon glow ngẫu nhiên
- UI dạng pill quá nhiều
- dashboard không cần thiết
- quá nhiều card
- quá nhiều badge
- layout quá dày đặc
- spacing không nhất quán
- animation trang trí không có mục đích
- đưa ngôn ngữ thị giác mới vào các section riêng lẻ

---

## Các phần tử hiện có cần giữ nguyên

Trừ khi đang redesign rõ ràng chúng:

- trải nghiệm Spline Hero
- iPhone 3D viewer
- tương tác phối cảnh WaveGallery
- kiến trúc mega-menu hiện tại
- typography editorial lớn
- phần mở đầu homepage thoáng

Hãy cải thiện xung quanh các phần tử này thay vì tự động thay thế chúng.
