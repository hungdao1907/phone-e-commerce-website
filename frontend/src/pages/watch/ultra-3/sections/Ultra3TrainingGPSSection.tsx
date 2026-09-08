import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Mountain,
  Activity,
  Heart,
  Zap,
  MapPin,
  Radio,
  Cpu,
  Gauge,
} from 'lucide-react';
import { ULTRA3_TRAINING_DATA } from '../data/ultra3Data';

type MetricMode = 'elevation' | 'pace' | 'heartRate' | 'power';

interface MetricDetail {
  id: MetricMode;
  tag: string;
  label: string;
  value: string;
  unit: string;
  sub: string;
  secondary: string;
  color: string;
  accentClass: string;
  borderClass: string;
  bgActive: string;
  image: string;
  locationBadge: string;
  statusBadge: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hud: {
    title: string;
    primary: string;
    subLeft: string;
    subRight: string;
  };
  pillars: {
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }[];
}

const METRIC_DATA: Record<MetricMode, MetricDetail> = {
  elevation: {
    id: 'elevation',
    tag: 'CHẾ ĐỘ ĐỘ CAO',
    label: 'Elevation',
    value: '3,842',
    unit: 'm',
    sub: 'Độ cao hiện tại',
    secondary: '+2,480 m tích lũy',
    color: '#ff6700',
    accentClass: 'text-[#ff6700]',
    borderClass: 'border-[#ff6700]',
    bgActive: 'bg-orange-500/10',
    image: '/images/watch/ultra3-metric-elevation.jpg',
    locationBadge: 'ĐỈNH MONT BLANC • 3,842 M',
    statusBadge: 'GPS L1+L5 • KHÍ ÁP KẾ TỰ HIỆU CHUẨN',
    icon: Mountain,
    hud: {
      title: 'ĐỘ CAO ĐỈNH NÚI',
      primary: '3,842 M',
      subLeft: '+2,480 M TÍCH LŨY',
      subRight: 'ĐỘ DỐC 18%',
    },
    pillars: [
      {
        title: 'Ăng-ten GPS Kép L1 + L5',
        desc: 'Định vị chuẩn xác từng mét ngay dưới tán rừng rậm rạp hoặc vách đá che khuất bầu trời.',
        icon: Radio,
      },
      {
        title: 'Khí Áp Kế Altimeter Độc Lập',
        desc: 'Liên tục theo dõi áp suất khí quyển để cập nhật biến thiên độ cao thời gian thực.',
        icon: Gauge,
      },
      {
        title: 'Bản Đồ Địa Hình Ngoại Tuyến',
        desc: 'Hiển thị đường đồng mức chi tiết và cảnh báo độ dốc ngay cả khi không có mạng di động.',
        icon: Mountain,
      },
    ],
  },
  pace: {
    id: 'pace',
    tag: 'CHẾ ĐỘ TỐC ĐỘ',
    label: 'Pace',
    value: "4'38\"",
    unit: '/km',
    sub: 'Tốc độ trung bình',
    secondary: "Nhanh nhất 3'52\"/km",
    color: '#10b981',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-500',
    bgActive: 'bg-emerald-500/10',
    image: '/images/watch/ultra3-metric-pace.jpg',
    locationBadge: 'ĐOẠN RIDGE SPRINT • KM 18.4',
    statusBadge: 'ĐIỀU TỐC PACER • GRADE-ADJUSTED PACE',
    icon: Activity,
    hud: {
      title: 'TỐC ĐỘ THEO DÕI',
      primary: "4'38\" /KM",
      subLeft: "NHANH NHẤT 3'52\"",
      subRight: '178 BƯỚC/PHÚT',
    },
    pillars: [
      {
        title: 'Grade-Adjusted Pace (GAP)',
        desc: 'Tự động tính toán tốc độ tương đương trên đường bằng khi leo dốc 20% để giữ nhịp tối ưu.',
        icon: Gauge,
      },
      {
        title: 'Cảm Biến Dao Động Dọc',
        desc: 'Phân tích độ nảy cơ thể và thời gian chạm đất giúp tiết kiệm tối đa sức bền cơ bắp.',
        icon: Activity,
      },
      {
        title: 'Bộ Điều Tốc Pacer Ảo',
        desc: 'Phản hồi xúc giác tức thì khi chạy nhanh hơn hoặc chậm hơn mục tiêu đề ra.',
        icon: Cpu,
      },
    ],
  },
  heartRate: {
    id: 'heartRate',
    tag: 'VÙNG NHỊP TIM',
    label: 'Heart Rate',
    value: '172',
    unit: 'bpm',
    sub: 'Vùng nhịp tim 4',
    secondary: 'Peak 181 bpm',
    color: '#f43f5e',
    accentClass: 'text-rose-400',
    borderClass: 'border-rose-500',
    bgActive: 'bg-rose-500/10',
    image: '/images/watch/ultra3-metric-heartrate.jpg',
    locationBadge: 'VÙNG CARDIO ĐỈNH • 172 BPM',
    statusBadge: 'CẢM BIẾN QUANG HỌC GEN 3 • ĐO LIÊN TỤC',
    icon: Heart,
    hud: {
      title: 'VÙNG 4: YẾM KHÍ',
      primary: '172 BPM',
      subLeft: 'PEAK 181 BPM',
      subRight: 'VÙNG TỐI ƯU 48%',
    },
    pillars: [
      {
        title: 'Cảm Biến Tim Quang Học Gen 3',
        desc: 'Đèn LED xanh lá và hồng ngoại kép đo mạch chính xác bất kể mồ hôi hay lạnh giá âm độ.',
        icon: Heart,
      },
      {
        title: '5 Vùng Nhịp Tim Cá Nhân Hóa',
        desc: 'Tự động tính ngưỡng hiếu khí và yếm khí dựa trên chỉ số VO2 Max và lịch sử tập luyện.',
        icon: Activity,
      },
      {
        title: 'Đo Phục Hồi Tim (HR Recovery)',
        desc: 'Đánh giá tốc độ hạ nhịp tim sau các đoạn dốc đứng để xác định thời điểm tăng tốc lại.',
        icon: Gauge,
      },
    ],
  },
  power: {
    id: 'power',
    tag: 'CÔNG SUẤT CHẠY',
    label: 'Power',
    value: '320',
    unit: 'W',
    sub: 'Công suất chạy bộ',
    secondary: 'Peak 410 W',
    color: '#f59e0b',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-500',
    bgActive: 'bg-amber-500/10',
    image: '/images/watch/ultra3-metric-power.jpg',
    locationBadge: 'VÁCH NÚI ĐÁ DỐC • DỐC 25%',
    statusBadge: 'RUNNING POWER • ĐO WATTS TỨC THỜI',
    icon: Zap,
    hud: {
      title: 'CÔNG SUẤT ĐẨY',
      primary: '320 W',
      subLeft: 'CỰC ĐẠI 410 W',
      subRight: 'HIỆU SUẤT 94%',
    },
    pillars: [
      {
        title: 'Công Suất Thời Gian Thực',
        desc: 'Đo lường cơ học tức thì theo Watts mà không bị độ trễ sinh học như nhịp tim.',
        icon: Zap,
      },
      {
        title: 'Tích Hợp Khí Động Học',
        desc: 'Tính toán sức cản gió, độ dốc bề mặt và gia tốc sải chân để cân bằng sức bền cự ly 42km.',
        icon: Cpu,
      },
      {
        title: 'Cảnh Báo Ngưỡng Tới Hạn (FTP)',
        desc: 'Nhắc nhở duy trì công suất dưới ngưỡng kiệt sức khi vượt qua các cung đèo dài.',
        icon: Gauge,
      },
    ],
  },
};

const METRIC_KEYS: MetricMode[] = ['elevation', 'pace', 'heartRate', 'power'];

interface Ultra3TrainingGPSSectionProps {
  onOpenSpecs?: () => void;
}

export function Ultra3TrainingGPSSection({ onOpenSpecs }: Ultra3TrainingGPSSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeMetric, setActiveMetric] = useState<MetricMode>('elevation');

  const current = METRIC_DATA[activeMetric];

  return (
    <section
      id={ULTRA3_TRAINING_DATA.sectionId}
      className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#08080a] text-white overflow-hidden scroll-mt-16 select-none"
    >
      {/* Background Ambience: Crisp Alpine Texture with Soft Vignettes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img
          src="/images/watch/ultra3-training-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-55 filter contrast-115 brightness-105"
          loading="lazy"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#08080a]/45 to-[#08080a]/90" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08080a] via-[#08080a]/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#08080a] via-[#08080a]/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <motion.span
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-[#ff6700] uppercase mb-3 block"
        >
          {ULTRA3_TRAINING_DATA.eyebrow}
        </motion.span>

        {/* Headline */}
        <motion.h2
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="ultra-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 whitespace-pre-line text-white"
        >
          {ULTRA3_TRAINING_DATA.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.14 }}
          className="ultra-body text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed"
        >
          {ULTRA3_TRAINING_DATA.subtitle}
        </motion.p>

        {/* =========================================================================
            1. CINEMATIC DISCIPLINE SHOWCASE
            Replaces the static map with the high-impact photo corresponding to the active metric.
            Smooth crossfade with real-time watchOS telemetry card overlay.
            ========================================================================= */}
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden bg-[#0d0d12] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.85)] mb-8 flex flex-col relative group">
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-black flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMetric}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={current.image}
                  alt={current.label}
                  className="w-full h-full object-cover object-center select-none filter contrast-105"
                  loading="lazy"
                />

                {/* Cinematic Vignette & Atmospheric Lighting */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/45 pointer-events-none" />
                <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/50 pointer-events-none" />

                {/* Top-Left: Technology / GPS Status Pill */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-mono text-white/90 shadow-xl">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: current.color }}
                  />
                  <span className="font-bold tracking-wide">{current.statusBadge}</span>
                </div>

                {/* Top-Right: Active Mode Pill */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-7 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 text-xs font-mono text-white shadow-xl">
                  <current.icon className="w-3.5 h-3.5" style={{ color: current.color }} />
                  <span className="font-bold tracking-wide uppercase text-white/90">
                    {current.tag}
                  </span>
                </div>

                {/* Bottom-Left: Live watchOS Workout Telemetry Card */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 w-60 sm:w-80 bg-black/85 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.9)]">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono tracking-wider mb-1.5">
                    <span className="text-white/60 font-semibold">{current.hud.title}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10"
                      style={{ color: current.color }}
                    >
                      LIVE TELEMETRY
                    </span>
                  </div>

                  <div className="ultra-heading text-2xl sm:text-4xl font-black text-white leading-none my-1 tracking-tight">
                    <span style={{ color: current.color }}>{current.hud.primary}</span>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-[10px] sm:text-xs font-mono text-white/90">
                    <span>{current.hud.subLeft}</span>
                    <span className="text-white/40">•</span>
                    <span>{current.hud.subRight}</span>
                  </div>
                </div>

                {/* Bottom-Right: Context Location Badge */}
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono text-white shadow-xl">
                  <MapPin className="w-3.5 h-3.5" style={{ color: current.color }} />
                  <span className="font-bold">{current.locationBadge}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* =========================================================================
            2. THE 4 METRIC CONTROL CARDS
            Direct controller deck: Clean, aesthetic, logic-first.
            ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-5xl mb-8">
          {METRIC_KEYS.map((key) => {
            const item = METRIC_DATA[key];
            const isActive = activeMetric === key;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMetric(item.id)}
                className={`group relative p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer overflow-hidden border ${
                  isActive
                    ? `${item.bgActive} ${item.borderClass} ring-1 ring-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.4)]`
                    : 'bg-white/[0.02] border-white/10 opacity-70 hover:opacity-100 hover:border-white/25 hover:bg-white/[0.04]'
                }`}
              >
                {/* Top Row: Metric Tag & Mode Icon */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-bold ${
                      isActive ? item.accentClass : 'text-white/60 group-hover:text-white/90'
                    }`}
                  >
                    {item.label}
                  </span>

                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive ? 'bg-white/15' : 'bg-white/5'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? item.accentClass : 'text-white/60 group-hover:text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Primary Metric Value */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className={`ultra-heading text-2xl sm:text-3xl font-black tracking-tight ${
                      isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                    }`}
                  >
                    {item.value}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-white/70">
                    {item.unit}
                  </span>
                </div>

                {/* Subtitle */}
                <div className="text-xs text-white/80 font-normal mb-1">
                  {item.sub}
                </div>

                {/* Exactly 1 Secondary Metric */}
                <div
                  className={`text-[11px] sm:text-xs font-mono font-medium truncate ${
                    isActive ? item.accentClass : 'text-white/50'
                  }`}
                >
                  {item.secondary}
                </div>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            3. HARDWARE & ALGORITHMIC INTELLIGENCE PANEL
            Reveals the science behind the selected metric on Apple Watch Ultra 3.
            Clean 3-pillar layout.
            ========================================================================= */}
        <div className="w-full max-w-5xl rounded-2xl bg-[#0c0c14]/90 border border-white/10 p-6 sm:p-8 text-left mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#ff6700] mb-1">
                CÔNG NGHỆ ĐO LƯỜNG CHUYÊN SÂU
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Cách Apple Watch Ultra 3 đo lường {current.label}
              </h3>
            </div>
            <div className="text-xs font-mono text-white">
              ĐỒNG BỘ THỜI GIAN THỰC QUA CHIP S9 SIP
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {current.pillars.map((pillar, idx) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                      <PillarIcon className="w-4 h-4" style={{ color: current.color }} />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">
                      {pillar.title}
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
