import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Cpu, Camera, Shield, Zap, Layers, Eye, Smartphone } from 'lucide-react';
import type { BrandConfig, BrandModel } from '@/types/smartphone';

interface BrandExperienceSectionProps {
  config: BrandConfig;
  products?: BrandModel[];
}

export function BrandExperienceSection({ config }: BrandExperienceSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  // Define brand-specific technology innovations
  const getBrandInnovations = () => {
    const brandId = typeof config.id === 'string' ? config.id.toLowerCase() : '';

    if (brandId.includes('samsung')) {
      return {
        tag: 'GALAXY INNOVATIONS',
        title: 'Quyền Năng Đột Phá Từ Galaxy AI',
        subtitle: 'Khai mở kỷ nguyên di động thông minh vượt giới hạn với hệ thống phần cứng mạnh mẽ nhất.',
        features: [
          {
            icon: Sparkles,
            title: 'Galaxy AI 2.0',
            highlight: 'Thông Minh Vượt Trội',
            description: 'Khoanh tròn để tìm kiếm, phiên dịch cuộc gọi trực tiếp và hỗ trợ chỉnh sửa ảnh nghệ thuật tạo sinh.',
            gradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
            accent: '#3b82f6',
          },
          {
            icon: Camera,
            title: '200MP Quad-Tele Camera',
            highlight: 'Zoom Điện Ảnh Chuẩn Studio',
            description: 'Cảm biến 200MP đỉnh cao kết hợp công nghệ AI Nightography bắt trọn mọi khoảnh khắc sắc nét trong đêm.',
            gradient: 'from-purple-600/20 via-pink-600/10 to-transparent',
            accent: '#8b5cf6',
          },
          {
            icon: Cpu,
            title: 'Snapdragon 8 Elite for Galaxy',
            highlight: 'Hiệu Năng Xử Lý Đỉnh Cao',
            description: 'Vi xử lý tối ưu độc quyền với NPU AI tăng tốc 45% và buồng tản nhiệt Vapor Chamber lớn hơn gấp đôi.',
            gradient: 'from-cyan-600/20 via-blue-600/10 to-transparent',
            accent: '#06b6d4',
          },
          {
            icon: Shield,
            title: 'Khung Titan & Kính Armor 2',
            highlight: 'Độ Bền Chuẩn Quân Đội',
            description: 'Chống trầy xước vượt trội, giảm phản xạ ánh sáng 75% cùng khả năng kháng nước bụi IP68 toàn diện.',
            gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
            accent: '#10b981',
          },
        ],
      };
    }

    if (brandId.includes('xiaomi')) {
      return {
        tag: 'LEICA OPTICS & HYPEROS',
        title: 'Tinh Hoa Quang Học Leica & Xiaomi HyperOS',
        subtitle: 'Nâng tầm nhiếp ảnh di động chuyên nghiệp với ống kính Leica Summilux và hiệu năng đỉnh cao.',
        features: [
          {
            icon: Camera,
            title: 'Ống Kính Leica Summilux',
            highlight: 'Chất Ảnh Huyền Thoại',
            description: 'Cảm biến 1-inch siêu lớn với khẩu độ tùy biến, mang lại độ sâu trường ảnh quang học chân thực nhất.',
            gradient: 'from-orange-600/20 via-amber-600/10 to-transparent',
            accent: '#f97316',
          },
          {
            icon: Zap,
            title: 'Sạc Siêu Nhanh 120W HyperCharge',
            highlight: 'Đầy 100% Trong 19 Phút',
            description: 'Công nghệ sạc siêu tốc an toàn với chip quản lý năng lượng Surge P2 độc quyền từ Xiaomi.',
            gradient: 'from-red-600/20 via-orange-600/10 to-transparent',
            accent: '#ef4444',
          },
          {
            icon: Layers,
            title: 'Xiaomi HyperOS 2.0',
            highlight: 'Hệ Sinh Thái Thông Minh',
            description: 'Kết nối liền mạch giữa điện thoại, máy tính bảng, đồng hồ và thiết bị nhà thông minh Smart Home.',
            gradient: 'from-amber-600/20 via-yellow-600/10 to-transparent',
            accent: '#f59e0b',
          },
          {
            icon: Eye,
            title: 'Màn Hình 2K LTPO 3000 nits',
            highlight: 'Độ Sáng Kỷ Lục',
            description: 'Tần số quét thích ứng 1-120Hz bảo vệ mắt tối đa với chứng nhận TUV Rheinland chống mỏi mắt.',
            gradient: 'from-rose-600/20 via-pink-600/10 to-transparent',
            accent: '#f43f5e',
          },
        ],
      };
    }

    if (brandId.includes('oppo')) {
      return {
        tag: 'HASSELBLAD & COLOROS',
        title: 'Hệ Thống Camera Hasselblad Đỉnh Cao',
        subtitle: 'Bậc thầy chân dung di động với chuẩn màu sắc Hasselblad Natural Color Calibration.',
        features: [
          {
            icon: Camera,
            title: 'Hasselblad Camera Master',
            highlight: 'Màu Sắc Huyền Thoại',
            description: 'Cảm biến kép tiềm vọng Periscope Telephoto giúp chụp chân dung sắc nét ở mọi tiêu cự.',
            gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
            accent: '#10b981',
          },
          {
            icon: Zap,
            title: 'SuperVOOC Siêu Nhanh 100W',
            highlight: 'Bảo Vệ Tuổi Thọ Pin 4 Năm',
            description: 'Động cơ bảo vệ pin Battery Health Engine duy trì dung lượng pin bền bỉ sau hơn 1.600 chu kỳ sạc.',
            gradient: 'from-teal-600/20 via-cyan-600/10 to-transparent',
            accent: '#14b8a6',
          },
          {
            icon: Sparkles,
            title: 'ColorOS AI Tiên Tiến',
            highlight: 'Trải Nghiệm Mượt Mà 48 Tháng',
            description: 'Tích hợp AI Eraser xóa vật thể thông minh, tóm tắt văn bản và công nghệ Trinity Engine tối ưu RAM.',
            gradient: 'from-cyan-600/20 via-blue-600/10 to-transparent',
            accent: '#06b6d4',
          },
          {
            icon: Smartphone,
            title: 'Thiết Kế Không Viền Cosmos Ring',
            highlight: 'Sang Trọng & Đẳng Cấp',
            description: 'Cụm camera vũ trụ đối xứng hoàn mỹ cùng kính mờ cao cấp chống bám vân tay tuyệt đối.',
            gradient: 'from-green-600/20 via-emerald-600/10 to-transparent',
            accent: '#22c55e',
          },
        ],
      };
    }

    // Default to Apple / iPhone
    return {
      tag: 'APPLE INTELLIGENCE & TITANIUM',
      title: 'Đột Phá Công Nghệ Từ Apple Intelligence',
      subtitle: 'Hệ thống trí tuệ nhân tạo cá nhân hóa kết hợp cùng chip Apple Silicon tối tân thế hệ mới.',
      features: [
        {
          icon: Sparkles,
          title: 'Apple Intelligence',
          highlight: 'Trí Tuệ Cá Nhân Đỉnh Cao',
          description: 'Hỗ trợ viết văn bản, tạo hình ảnh Genmoji, và trợ lý Siri thế hệ mới hiểu sâu ngữ cảnh cá nhân của bạn.',
          gradient: 'from-indigo-600/20 via-purple-600/10 to-transparent',
          accent: '#6366f1',
        },
        {
          icon: Cpu,
          title: 'Chip A19 Pro (3nm Thế Hệ Mới)',
          highlight: 'Hiệu Năng Vượt Trội Toàn Ngành',
          description: 'GPU 6 lõi đẳng cấp máy chơi game với phần cứng dò tia Ray Tracing và hiệu suất tiết kiệm pin kỷ lục.',
          gradient: 'from-purple-600/20 via-pink-600/10 to-transparent',
          accent: '#a855f7',
        },
        {
          icon: Camera,
          title: 'Camera 48MP Pro Fusion System',
          highlight: 'Nhiếp Ảnh Chuẩn Điện Ảnh 4K120fps',
          description: 'Nút Điều Khiển Camera chuyên dụng, hỗ trợ quay video Dolby Vision và âm thanh không gian Spatial Audio.',
          gradient: 'from-blue-600/20 via-cyan-600/10 to-transparent',
          accent: '#38bdf8',
        },
        {
          icon: Shield,
          title: 'Khung Titanium & Ceramic Shield',
          highlight: 'Bền Nhất Từng Có Trên Smartphone',
          description: 'Vật liệu hợp kim Titanium Cấp 5 siêu nhẹ, siêu cứng cùng mặt trước Ceramic Shield bền hơn mọi mặt kính điện thoại.',
          gradient: 'from-neutral-600/20 via-neutral-700/10 to-transparent',
          accent: '#9ca3af',
        },
      ],
    };
  };

  const data = getBrandInnovations();

  return (
    <section
      id={`${config.id}-experience`}
      aria-label={`${config.brand} Technology Experience`}
      className="relative w-full py-24 sm:py-32 bg-black text-white px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none opacity-20"
        style={{ backgroundColor: config.accent }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none opacity-15"
        style={{ backgroundColor: config.accentSoft || '#3b82f6' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20 space-y-4 max-w-3xl">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm font-bold tracking-wider uppercase text-white/90"
          >
            <Sparkles className="w-4 h-4" style={{ color: config.accent }} />
            <span>{data.tag}</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {data.title}
          </h2>

          <p className="text-white/70 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            {data.subtitle}
          </p>
        </div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {data.features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-white/10 hover:border-white/25 backdrop-blur-xl flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
              >
                {/* Accent Background Gradient on Card */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${item.gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative z-10 space-y-4">
                  {/* Icon Box */}
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: item.accent }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>

                  {/* Highlights */}
                  <div>
                    <span
                      className="text-xs font-bold uppercase tracking-wider block mb-1"
                      style={{ color: item.accent }}
                    >
                      {item.highlight}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-white/65 text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom subtle accent line */}
                <div
                  className="relative z-10 w-8 h-[2px] rounded-full mt-6 transition-all duration-300 group-hover:w-16"
                  style={{ backgroundColor: item.accent }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BrandExperienceSection;
