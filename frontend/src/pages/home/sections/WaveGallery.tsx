import {
  ImagesScrollingAnimation,
  type TechnologyStory,
} from '../components/images-scrolling-animation';
import { TextEffect } from '../components/text-effect';

const STORIES: TechnologyStory[] = [
  {
    id: 'connect',
    title: 'Khoảng cách chỉ còn một chạm.',
    description:
      'Một cuộc gọi ngắn cũng có thể làm ngày trở nên gần gũi hơn. Công nghệ giúp những lời hỏi han, những nụ cười và cảm xúc được chạm tới nhau rõ ràng hơn, dù ở bất cứ đâu.',
    src: '/images/wave-gallery/story-01-connection-upscaled.png',
    alt: 'Người dùng gọi video qua điện thoại thông minh',
  },
  {
    id: 'work',
    title: 'Không gian làm việc đi cùng bạn.',
    description:
      'Từ bàn làm việc cố định đến những chuyển động của cuộc sống, công nghệ giữ cho ý tưởng, tài liệu và nhịp làm việc luôn liền mạch, để bạn tập trung vào điều quan trọng nhất.',
    src: '/images/wave-gallery/story-02-work-upscaled.png',
    alt: 'Làm việc trên laptop cùng cà phê',
  },
  {
    id: 'create',
    title: 'Ý tưởng xuất hiện, sáng tạo bắt đầu.',
    description:
      'Cảm hứng thường đến rất nhanh và bất ngờ. Công nghệ giúp bạn ghi lại, phát triển và biến những ý tưởng thoáng qua thành điều hữu hình, rõ ràng và giàu cảm xúc hơn.',
    src: '/images/wave-gallery/story-03-create-upscaled.png',
    alt: 'Vẽ và sáng tạo nhân vật trên máy tính bảng',
  },
  {
    id: 'companion',
    title: 'Đồng hành theo nhịp sống riêng.',
    description:
      'Không cần quá phô trương, công nghệ tốt là công nghệ hiện diện đúng lúc — âm thầm hỗ trợ sức khỏe, thói quen và những lựa chọn nhỏ mỗi ngày để cuộc sống nhẹ nhàng hơn.',
    src: '/images/wave-gallery/story-04-lifestyle-upscaled.png',
    alt: 'Chạy bộ và theo dõi sức khỏe trên đồng hồ thông minh',
  },
  {
    id: 'future',
    title: 'Điều tiếp theo luôn ở phía trước.',
    description:
      'Tương lai không còn là điều xa xôi. Nó bắt đầu từ những thay đổi rất nhỏ trong cách chúng ta kết nối, làm việc, sáng tạo và tận hưởng cuộc sống mỗi ngày.',
    src: '/images/wave-gallery/story-05-future-upscaled.png',
    alt: 'Sử dụng điện thoại giữa không gian thành phố về đêm',
  },
];

export function WaveGallery() {
  return (
    <section className="wave-gallery" aria-labelledby="wave-gallery-title">
      <div className="wave-gallery__grid">
        <div className="wave-gallery__editorial">
          <p className="wave-gallery__eyebrow">CÔNG NGHỆ & CUỘC SỐNG</p>
          <h2 id="wave-gallery-title">
            Công nghệ trong<br />
            từng khoảnh khắc.
          </h2>
          <TextEffect
            per="word"
            preset="blur"
            delay={0.15}
            className="wave-gallery__description"
          >
            Từ một cuộc gọi, một ý tưởng đến những nhịp sống thường ngày — công nghệ hiện diện nhẹ nhàng để mọi kết nối trở nên gần hơn, công việc linh hoạt hơn và từng khoảnh khắc nhỏ trong cuộc sống trở nên đáng nhớ hơn.
          </TextEffect>
          <p className="wave-gallery__hint" aria-hidden="true">
            ↓ CUỘN ĐỂ KHÁM PHÁ
          </p>
        </div>
        <ImagesScrollingAnimation stories={STORIES} />
      </div>
    </section>
  );
}
