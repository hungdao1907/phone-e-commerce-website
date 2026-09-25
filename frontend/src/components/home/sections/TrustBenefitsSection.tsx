import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Repeat,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const EASING = [0.22, 1, 0.36, 1] as const;

interface BenefitItem {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  tone: 'warm' | 'silver' | 'lavender' | 'sage';
  badge: string;
  details: string[];
  highlight: string;
}

const BENEFITS_ROW_1: BenefitItem[] = [
  {
    id: 'delivery',
    icon: Truck,
    title: 'Giao nhanh,\nđúng lúc.',
    subtitle: 'Vận chuyển hỏa tốc & chuẩn studio',
    description:
      'Theo dõi hành trình đơn hàng rõ ràng từ lúc xác nhận đến khi sản phẩm được trao tận tay.',
    tone: 'warm',
    badge: 'Miễn phí toàn quốc',
    details: [
      'Giao hỏa tốc 2H trong nội thành Hà Nội & TP.HCM',
      'Đóng gói 3 lớp chống va đập, niêm phong an toàn',
      'Đồng kiểm tra ngoại quan máy cùng shipper trước khi nhận',
      'Bảo hiểm hàng hóa 100% toàn bộ giá trị đơn hàng',
    ],
    highlight: 'Cam kết giao đúng hẹn hoặc hoàn 100% phí cước',
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'Đổi trả\nthật dễ dàng.',
    subtitle: 'Chính sách minh bạch & nhẹ nhàng',
    description:
      'Khi sản phẩm chưa thực sự phù hợp, quy trình đổi trả rõ ràng và linh hoạt giúp mọi quyết định trở nên nhẹ nhàng hơn.',
    tone: 'silver',
    badge: '30 ngày đổi mới',
    details: [
      '1 đổi 1 trong 30 ngày đầu nếu phát sinh lỗi nhà sản xuất',
      'Shipper hỗ trợ thu hồi sản phẩm tận nhà hoàn toàn miễn phí',
      'Thẩm định kỹ thuật và phản hồi nhanh chóng trong 24H',
      'Hoàn tiền tức thì hoặc đổi sang sản phẩm tương đương',
    ],
    highlight: 'Thủ tục trực tuyến chỉ với 1 bước xác nhận đơn',
  },
];

const BENEFITS_ROW_2: BenefitItem[] = [
  {
    id: 'warranty',
    icon: ShieldCheck,
    title: 'Chính hãng.\nAn tâm dài lâu.',
    subtitle: 'Bảo hành chính hãng 12–24 tháng',
    description:
      'Nguồn gốc sản phẩm minh bạch cùng chính sách bảo hành rõ ràng, để sự an tâm tiếp tục ngay cả sau khi mua.',
    tone: 'lavender',
    badge: '100% Chính hãng',
    details: [
      'Nguyên seal, xuất hóa đơn VAT đầy đủ theo số IMEI / Serial',
      'Kích hoạt bảo hành điện tử chính hãng trực tiếp từ Apple/Samsung',
      'Tiếp nhận bảo hành tại các trung tâm ủy quyền toàn quốc (AASP)',
      'Hỗ trợ kỹ thuật phần mềm và vệ sinh thiết bị trọn đời',
    ],
    highlight: 'Tặng kèm 6 tháng bảo hành mở rộng độc quyền',
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Thanh toán\ntheo cách của bạn.',
    subtitle: 'Linh hoạt & Bảo mật chuẩn quốc tế',
    description:
      'Lựa chọn phương thức phù hợp và hoàn tất thanh toán một cách đơn giản, an toàn và chủ động.',
    tone: 'sage',
    badge: 'Trả góp 0% lãi suất',
    details: [
      'Hỗ trợ thẻ quốc tế, chuyển khoản QR và ví MoMo / ZaloPay',
      'Trả góp 0% lãi suất lên tới 12 tháng qua thẻ tín dụng hoặc PayLater',
      'Mã hóa bảo mật giao dịch đa tầng chuẩn quốc tế PCI-DSS cấp 1',
      'Thanh toán COD linh hoạt nhận hàng kiểm tra mới thanh toán',
    ],
    highlight: 'Giảm thêm đến 500.000đ khi thanh toán qua VNPay-QR',
  },
];

interface BenefitCardProps {
  benefit: BenefitItem;
  index: number;
}

function BenefitCard({ benefit, index }: BenefitCardProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const [isFlipped, setIsFlipped] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = benefit.icon;

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    // 80ms grace window to prevent edge hover jitter along the border perimeter
    hoverTimerRef.current = setTimeout(() => {
      setIsFlipped(false);
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const cardEntranceVariants: Variants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: EASING,
      },
    },
  };

  const backContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: shouldReduceMotion ? 0 : 0.28,
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const textItemVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: 'blur(5px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: EASING,
      },
    },
  };

  return (
    <motion.article
      className={`trust-benefit-card ${isFlipped ? 'is-flipped' : ''}`}
      variants={cardEntranceVariants}
      initial="initial"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setIsFlipped((prev) => !prev);
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          setIsFlipped((prev) => !prev);
        }
      }}
      aria-label={`${benefit.title.replace('\n', ' ')}. Nhấn để lật xem chi tiết.`}
    >
      <div className="trust-benefit-card__inner">
        {/* FRONT FACE (Clean editorial light card with static solid icon) */}
        <div className={`trust-benefit-card__face trust-benefit-card__face--front trust-benefit-card--${benefit.tone}`}>
          <div className="trust-benefit-card__ambient" aria-hidden="true" />

          {/* Clean Solid Static Icon Watermark */}
          <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-[0.05] select-none text-current" aria-hidden="true">
            <Icon className="w-36 h-36" strokeWidth={1.2} />
          </div>

          <div className="trust-benefit-card__header flex items-center justify-between">
            <div className="trust-benefit-card__icon-box">
              <Icon className="trust-benefit-card__icon" strokeWidth={2} aria-hidden="true" />
            </div>
            <span className="trust-benefit-card__badge">
              {benefit.badge}
            </span>
          </div>

          <div className="trust-benefit-card__spacer" aria-hidden="true" />

          <div className="trust-benefit-card__content">
            <h3 className="trust-benefit-card__title">{benefit.title}</h3>
            <p className="trust-benefit-card__description">{benefit.description}</p>
            <div className="trust-benefit-card__footer-hint" aria-hidden="true">
              <span>Lật thẻ xem chi tiết</span>
              <Repeat className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* BACK FACE (Deep luxury dark tinted card with staggered text reveal) */}
        <div className={`trust-benefit-card__face trust-benefit-card__face--back trust-benefit-card--${benefit.tone}-back`}>
          <div className="trust-benefit-card__ambient" aria-hidden="true" />

          <motion.div
            className="w-full h-full flex flex-col justify-between"
            variants={backContainerVariants}
            initial="hidden"
            animate={isFlipped ? 'visible' : 'hidden'}
          >
            {/* Header with Title and Subtitle */}
            <motion.div variants={textItemVariants} className="flex items-center justify-between pb-2.5 border-b border-white/12">
              <div className="flex items-center gap-2.5">
                <div className="trust-benefit-card__icon-box-back">
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white tracking-tight leading-tight">
                    {benefit.title.replace('\n', ' ')}
                  </h4>
                  <p className="text-[11px] text-white/60 font-medium">
                    {benefit.subtitle}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                {benefit.badge}
              </span>
            </motion.div>

            {/* Detailed Points (Appear gradually with stagger & unblur) */}
            <ul className="flex-1 my-2.5 flex flex-col justify-center gap-2">
              {benefit.details.map((point, idx) => (
                <motion.li
                  key={idx}
                  variants={textItemVariants}
                  className="flex items-start gap-2 text-[12.5px] leading-snug text-white/90 font-normal"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" strokeWidth={2.2} />
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>

            {/* Bottom Highlight & Flip-back Hint */}
            <motion.div variants={textItemVariants} className="pt-2 border-t border-white/12 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{benefit.highlight}</span>
              </div>
              <span className="text-[10px] text-white/50 flex items-center gap-1 shrink-0 ml-2">
                Lật lại ↺
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

export function TrustBenefitsSection() {
  const shouldReduceMotion = useReducedMotion() === true;

  return (
    <section className="trust-benefits" aria-labelledby="trust-benefits-title">
      <div className="trust-benefits__container">
        {/* Editorial Section Header */}
        <motion.header
          className="trust-benefits__header"
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASING }}
        >
          <div className="trust-benefits__header-left">
            <p className="trust-benefits__eyebrow">TRẢI NGHIỆM MUA SẮM</p>
            <h2 id="trust-benefits-title" className="trust-benefits__title">
              An tâm từ lúc chọn<br />
              đến khi nhận.
            </h2>
          </div>
          <div className="trust-benefits__header-right">
            <p className="trust-benefits__description">
              Không chỉ là sản phẩm tốt. Một trải nghiệm mua sắm trọn vẹn còn đến từ sự rõ ràng,
              thuận tiện và cảm giác an tâm trong từng bước — từ lúc lựa chọn cho đến khi sản
              phẩm được trao tận tay.
            </p>
          </div>
        </motion.header>

        {/* Asymmetric 4-card Grid */}
        <div className="trust-benefits__grid">
          <div className="trust-benefits__row trust-benefits__row--1">
            {BENEFITS_ROW_1.map((benefit, index) => (
              <BenefitCard key={benefit.id} benefit={benefit} index={index} />
            ))}
          </div>
          <div className="trust-benefits__row trust-benefits__row--2">
            {BENEFITS_ROW_2.map((benefit, index) => (
              <BenefitCard key={benefit.id} benefit={benefit} index={index + 2} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
