# Hệ thống motion

## Triết lý motion

Motion là một phần quan trọng của dự án.

Animation cần khiến giao diện tạo cảm giác:

- cao cấp
- phản hồi tốt
- có chiều không gian
- có chủ đích
- hoàn thiện

Motion phải hỗ trợ visual hierarchy và tương tác.

Không animate phần tử chỉ vì có thể animate.

---

## Cường độ motion

Có ba cấp độ motion.

### Level 1 — Chức năng

Dùng cho:

- button
- link
- hover state
- focus state
- dropdown

Chuyển động phải tinh tế.

### Level 2 — Trình bày

Dùng cho:

- section reveal
- tương tác ProductCard
- chuyển tiếp hình ảnh
- nội dung xuất hiện theo stagger

Chuyển động có thể dễ nhận thấy hơn nhưng vẫn phải có kiểm soát.

### Level 3 — Immersive

Chỉ dành cho:

- Hero 3D
- iPhone 3D viewer
- WaveGallery
- các section kể chuyện lớn trong tương lai

Không dùng motion Level 3 cho commerce UI thông thường.

---

## Các mẫu motion cốt lõi

Dự án nên tái sử dụng một nhóm nhỏ motion pattern.

### 1. Section reveal

Dùng cho nội dung chính khi đi vào viewport.

Trạng thái bắt đầu điển hình:

- opacity: 0
- translateY: 24px đến 40px

Trạng thái cuối:

- opacity: 1
- translateY: 0

Thời lượng điển hình:

300ms đến 600ms

Tránh animation xuất hiện quá dài.

---

### 2. Stagger reveal

Dùng khi nhiều phần tử liên quan xuất hiện cùng nhau.

Ví dụ:

- ProductCard
- category card
- feature item

Độ trễ điển hình giữa các phần tử:

60ms đến 120ms

Stagger phải truyền đạt trình tự, không làm người dùng chậm lại.

---

### 3. Card focus

Chủ yếu dùng trong các section curated hoặc featured.

Hành vi có thể có:

Card active:

- scale khoảng 1.02 đến 1.05
- translateY nhẹ lên trên
- chiều sâu/shadow mạnh hơn

Các card xung quanh:

- giảm scale nhẹ
- giảm opacity nhẹ
- blur nhỏ tuỳ chọn trong bối cảnh featured đặc biệt

Không dùng group blur mạnh trong catalog sản phẩm lớn.

---

### 4. Chiều sâu hình ảnh

Hình ảnh sản phẩm có thể chuyển động độc lập với card.

Hành vi hover điển hình:

- scale: 1.03 đến 1.07
- translateY: -2px đến -8px

Chuyển động phải nhỏ.

Không làm biến dạng hình ảnh.

---

### 5. CTA motion

Tương tác CTA phải tinh tế.

Ví dụ:

Mũi tên:

`translateX(0) → translateX(4px)`

Button:

scale nhỏ hoặc transition background

Tránh làm CTA bounce.

---

### 6. Menu motion

Motion của mega-menu và navigation cần nhanh, chính xác.

Dùng:

- opacity
- translateY
- backdrop transition tinh tế

Tránh chuyển động quá lớn.

Tương tác menu không bao giờ được chậm hơn ý định điều hướng của người dùng.

---

## Motion 3D

Motion 3D được dành cho các trải nghiệm cụ thể.

Các trải nghiệm quan trọng hiện tại:

- Hero Spline scene
- iPhone GLB viewer
- phối cảnh WaveGallery

Không thêm 3D tilt cho mọi component.

Khi dùng card tilt 3D:

- giữ rotation tối đa khoảng 4° đến 8°
- reset mượt mà
- tắt hoặc đơn giản hoá trên thiết bị cảm ứng

---

## Thời gian hover

Hover transition điển hình:

200ms đến 400ms

Tương tác card phức tạp hơn:

300ms đến 500ms

Tránh tương tác hover chậm vượt khoảng 600ms, trừ khi có chủ đích cinematic.

---

## Easing

Ưu tiên easing mượt mà.

Ví dụ về mặt khái niệm:

- ease-out cho hiệu ứng đi vào
- ease-in-out cho chuyển trạng thái
- chỉ dùng spring khi tương tác được hưởng lợi từ phản hồi vật lý

Tránh hiệu ứng spring/bounce quá mức.

---

## Scroll animation

Animation dựa trên scroll có thể dùng cho:

- section reveal
- kể chuyện
- chuỗi hình ảnh
- trải nghiệm featured được chọn

Không để việc đọc thông thường phụ thuộc vào scroll animation.

Nội dung vẫn phải dễ hiểu khi không có animation.

---

## Continuous animation

Vòng lặp liên tục nên hiếm khi được dùng.

Ví dụ được phép:

- brand marquee
- bầu không khí thị giác tinh tế đang có
- 3D auto-rotation khi đã phù hợp

Tránh thêm continuous motion vào:

- ProductCard
- button
- giá
- filter
- cart item
- text block

Continuous motion làm tăng sự xao nhãng và chi phí render.

---

## ProductCard motion

ProductCard mặc định:

- hover lift tinh tế
- chiều sâu hình ảnh
- shadow transition

ProductCard featured có thể dùng tương tác mạnh hơn như:

- giảm nhấn mạnh theo nhóm
- stagger entrance
- focused card scale
- blur nhỏ cho các card xung quanh

ProductCard trong catalog đầy đủ nên yên tĩnh hơn.

---

## Mobile / Touch

Không phụ thuộc vào hover.

Trên thiết bị cảm ứng:

- bỏ pointer tilt
- bỏ thông tin chỉ xuất hiện khi hover
- dùng phản hồi nhấn đơn giản khi hữu ích
- giữ card hiển thị đầy đủ

Motion không bao giờ được cản trở truy cập nội dung.

---

## Reduced motion

Tôn trọng:

`prefers-reduced-motion`

Khi reduced motion được bật:

- bỏ translate lớn lúc xuất hiện
- tắt 3D tilt trang trí
- dừng continuous animation không cần thiết khi phù hợp
- giữ khả năng sử dụng
- giữ content hierarchy

Không ẩn nội dung vì motion bị tắt.

---

## Hiệu năng

Ưu tiên các thuộc tính thân thiện với GPU:

- transform
- opacity

Tránh animate liên tục:

- width
- height
- top
- left
- blur lớn

Tránh cập nhật React state ở mọi lần pointer move khi có thể dùng giải pháp CSS hoặc MotionValue.

Tránh layout thrashing.

---

## Tính nhất quán của motion

Trước khi thêm animation mới, hãy hỏi:

1. Một motion pattern hiện có đã giải quyết được việc này chưa?
2. Tương tác này có cần chuyển động không?
3. Cấp độ motion có phù hợp với component không?
4. Nó có cạnh tranh với trải nghiệm Hero, WaveGallery hoặc 3D không?
5. Nó có hoạt động trên mobile không?
6. Nó có tôn trọng reduced motion không?

Ưu tiên tái sử dụng thay vì tạo ra style animation mới.

---

## Nhịp motion của homepage

Cường độ được khuyến nghị:

Hero:
Level 3

BrandMarquee:
Level 2, continuous motion nhẹ

FeaturedProducts:
Level 2

WaveGallery:
Level 3

Footer:
Level 1 hoặc phần lớn tĩnh

Điều này tạo ra nhịp:

immersive
→ chuyển tiếp bình tĩnh
→ thương mại có tương tác
→ immersive
→ kết thúc bình tĩnh

---

## Anti-pattern

Tránh:

- bounce ở mọi nơi
- rotation lớn
- parallax ngẫu nhiên
- blur quá mức
- scale quá mức
- delay dài
- navigation chậm
- animation card vô hạn
- animation cho mọi text element
- nhiều style motion không liên quan trong một section
- motion gây layout shift
