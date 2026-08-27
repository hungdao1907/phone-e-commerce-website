import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { useState, useMemo, useRef, useCallback } from 'react';
import {
  FinalCTAVisual,
  type UsageType,
  type PriorityType,
} from '../components/FinalCTAVisual';

const EASING = [0.22, 1, 0.36, 1] as const;

interface FinderOption<T> {
  id: T;
  label: string;
}

const USAGE_OPTIONS: FinderOption<UsageType>[] = [
  { id: 'everyday', label: 'Mỗi ngày' },
  { id: 'work', label: 'Công việc' },
  { id: 'creative', label: 'Sáng tạo' },
  { id: 'gaming', label: 'Gaming' },
];

const PRIORITY_OPTIONS: FinderOption<PriorityType>[] = [
  { id: 'camera', label: 'Camera' },
  { id: 'performance', label: 'Hiệu năng' },
  { id: 'battery', label: 'Pin lâu' },
  { id: 'display', label: 'Màn hình' },
];

const RECOMMENDATION_MAP: Record<string, { highlight: string; description: string }> = {
  'creative-camera': {
    highlight: 'iPhone 16 Pro & iPad Pro M4',
    description: 'Hệ thống camera chuyên nghiệp 48MP Fusion cùng màn hình Ultra Retina XDR cho quy trình sáng tạo hình ảnh đỉnh cao.',
  },
  'work-performance': {
    highlight: 'MacBook Pro M3 & iPhone 16 Pro',
    description: 'Sức mạnh chip Apple Silicon vượt trội, xử lý đa nhiệm mượt mà và thời lượng pin bền bỉ suốt ngày dài làm việc.',
  },
  'gaming-performance': {
    highlight: 'iPhone 16 Pro Max & iPad Air M2',
    description: 'Chip xử lý đồ họa Ray Tracing phần cứng cùng tần số quét 120Hz ProMotion cho trải nghiệm gaming đỉnh cao.',
  },
  'everyday-battery': {
    highlight: 'iPhone 16 Plus & Apple Watch Series 10',
    description: 'Thời lượng pin ấn tượng nhất dòng iPhone, thiết kế mỏng nhẹ bền bỉ và kết nối liền mạch cả ngày.',
  },
  'everyday-display': {
    highlight: 'iPhone 16 & iPad Air M2',
    description: 'Màn hình Super Retina XDR sắc nét, màu sắc chuẩn xác và thiết kế nhôm chuẩn hàng không sang trọng.',
  },
  'work-battery': {
    highlight: 'MacBook Air M3 & iPhone 16 Plus',
    description: 'Bộ đôi siêu bền bỉ với thời lượng pin lên đến 18 giờ liên tục, sẵn sàng đồng hành trong mọi chuyến công tác.',
  },
  'creative-display': {
    highlight: 'iPad Pro M4 & Apple Pencil Pro',
    description: 'Công nghệ màn hình OLED hai lớp Tandem đột phá cùng dải màu P3 rộng cho độ chính xác hình ảnh tuyệt đối.',
  },
  'gaming-display': {
    highlight: 'iPhone 16 Pro Max & AirPods Pro 2',
    description: 'Màn hình 6.9 inch viền siêu mỏng tần số 120Hz kết hợp âm thanh không gian Spatial Audio độ trễ cực thấp.',
  },
  default: {
    highlight: 'Hệ sinh thái Apple thế hệ mới',
    description: 'Khám phá các thiết bị phù hợp với cách bạn làm việc, kết nối và tận hưởng từng khoảnh khắc công nghệ mỗi ngày.',
  },
};

export function FinalCTASection() {
  const shouldReduceMotion = useReducedMotion() === true;
  const panelRef = useRef<HTMLDivElement>(null);

  const [selectedUsage, setSelectedUsage] = useState<UsageType | null>('everyday');
  const [selectedPriority, setSelectedPriority] = useState<PriorityType | null>('performance');
  const [showResult, setShowResult] = useState(false);
  const [sweepTrigger, setSweepTrigger] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const activeResult = useMemo(() => {
    const key = `${selectedUsage || ''}-${selectedPriority || ''}`;
    return RECOMMENDATION_MAP[key] || RECOMMENDATION_MAP.default;
  }, [selectedUsage, selectedPriority]);

  const selectedUsageLabel = useMemo(() => {
    return USAGE_OPTIONS.find((opt) => opt.id === selectedUsage)?.label || '';
  }, [selectedUsage]);

  const selectedPriorityLabel = useMemo(() => {
    return PRIORITY_OPTIONS.find((opt) => opt.id === selectedPriority)?.label || '';
  }, [selectedPriority]);

  // Subtle pointer parallax handler (desktop only)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setMouseOffset({ x, y });
  }, [shouldReduceMotion]);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  const handleSelectUsage = (id: UsageType) => {
    setSelectedUsage(id);
    if (showResult) setShowResult(false);
  };

  const handleSelectPriority = (id: PriorityType) => {
    setSelectedPriority(id);
    if (showResult) setShowResult(false);
  };

  const handleFindClick = () => {
    setSweepTrigger((prev) => prev + 1);
    setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
  };

  const isReady = selectedUsage !== null && selectedPriority !== null;

  // Choreographed Entry Animation Variants
  const panelVariants: Variants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.985, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.8, ease: EASING },
    },
  };

  const eyebrowVariants: Variants = {
    initial: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.15, ease: EASING } },
  };

  const headlineVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, delay: 0.25, ease: EASING } },
  };

  const descVariants: Variants = {
    initial: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.35, ease: EASING } },
  };

  const controlsVariants: Variants = {
    initial: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.45, ease: EASING } },
  };

  return (
    <section className="final-cta-section" aria-labelledby="final-cta-heading">
      <div className="final-cta-section__outer-container">
        {/* Dark Graphite Cinematic Closing Panel */}
        <motion.div
          ref={panelRef}
          className="final-cta-panel"
          variants={panelVariants}
          initial="initial"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle Ambient Vignette & Noise Texture */}
          <div className="final-cta-panel__ambient-grid" aria-hidden="true" />
          <div className="final-cta-panel__glow-spot" aria-hidden="true" />

          <div className="final-cta-panel__grid">
            {/* Left Column: Editorial Content & Guided Finder */}
            <div className="final-cta-panel__content">
              {/* Eyebrow */}
              <motion.div className="final-cta-panel__eyebrow-box" variants={eyebrowVariants}>
                <span className="final-cta-panel__eyebrow-line" aria-hidden="true" />
                <p className="final-cta-panel__eyebrow">TÌM LỰA CHỌN DÀNH CHO BẠN</p>
              </motion.div>

              {/* Headline */}
              <motion.h2 id="final-cta-heading" className="final-cta-panel__title" variants={headlineVariants}>
                Không cần biết mọi thông số.<br />
                Chỉ cần biết bạn cần gì.
              </motion.h2>

              {/* Description */}
              <motion.p className="final-cta-panel__description" variants={descVariants}>
                Công việc, sáng tạo, giải trí hay đơn giản là một thiết bị đáng tin cậy mỗi ngày
                — hãy bắt đầu từ điều quan trọng với bạn. Chúng tôi sẽ giúp thu hẹp những lựa chọn
                phù hợp nhất.
              </motion.p>

              {/* Guided Choice Controls or Active Recommendation Result */}
              {!showResult ? (
                <motion.div className="final-cta-finder" variants={controlsVariants}>
                  {/* Group 1: Usage */}
                  <div className="final-cta-finder__group">
                    <label className="final-cta-finder__label">
                      BẠN ĐANG TÌM THIẾT BỊ CHO
                    </label>
                    <div className="final-cta-finder__chips" role="group" aria-label="Nhu cầu sử dụng">
                      {USAGE_OPTIONS.map((option) => {
                        const isSelected = selectedUsage === option.id;
                        return (
                          <motion.button
                            key={option.id}
                            type="button"
                            className={`final-cta-chip ${isSelected ? 'final-cta-chip--selected' : ''}`}
                            onClick={() => handleSelectUsage(option.id)}
                            aria-pressed={isSelected}
                            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                            transition={{ duration: 0.16 }}
                          >
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.18 }}
                                className="final-cta-chip__icon-wrapper"
                              >
                                <Check className="final-cta-chip__check-icon" strokeWidth={2.5} aria-hidden="true" />
                              </motion.span>
                            )}
                            <span>{option.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Group 2: Priority */}
                  <div className="final-cta-finder__group">
                    <label className="final-cta-finder__label">
                      ĐIỀU BẠN QUAN TÂM NHẤT
                    </label>
                    <div className="final-cta-finder__chips" role="group" aria-label="Ưu tiên quan tâm">
                      {PRIORITY_OPTIONS.map((option) => {
                        const isSelected = selectedPriority === option.id;
                        return (
                          <motion.button
                            key={option.id}
                            type="button"
                            className={`final-cta-chip ${isSelected ? 'final-cta-chip--selected' : ''}`}
                            onClick={() => handleSelectPriority(option.id)}
                            aria-pressed={isSelected}
                            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                            transition={{ duration: 0.16 }}
                          >
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.18 }}
                                className="final-cta-chip__icon-wrapper"
                              >
                                <Check className="final-cta-chip__check-icon" strokeWidth={2.5} aria-hidden="true" />
                              </motion.span>
                            )}
                            <span>{option.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <div className="final-cta-panel__actions">
                    <motion.button
                      type="button"
                      className={`final-cta-btn ${isReady ? 'final-cta-btn--ready' : ''}`}
                      onClick={handleFindClick}
                      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span>Tìm lựa chọn phù hợp</span>
                      <ArrowRight className="final-cta-btn__icon" strokeWidth={2} aria-hidden="true" />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                /* Recommendation Result Feedback Card */
                <motion.div
                  className="final-cta-result"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASING }}
                >
                  <div className="final-cta-result__header">
                    <div className="final-cta-result__badge">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>Lựa chọn của bạn đã sẵn sàng</span>
                    </div>
                    <span className="final-cta-result__tags">
                      {selectedUsageLabel} · {selectedPriorityLabel}
                    </span>
                  </div>

                  <h3 className="final-cta-result__highlight">{activeResult.highlight}</h3>
                  <p className="final-cta-result__description">{activeResult.description}</p>

                  <div className="final-cta-result__footer">
                    <button
                      type="button"
                      className="final-cta-result__reset-btn"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Thay đổi nhu cầu</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column: Abstract Luminous Reactive Visual */}
            <div className="final-cta-panel__visual-col">
              <FinalCTAVisual
                usage={selectedUsage}
                priority={selectedPriority}
                sweepTrigger={sweepTrigger}
                mouseOffset={mouseOffset}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
