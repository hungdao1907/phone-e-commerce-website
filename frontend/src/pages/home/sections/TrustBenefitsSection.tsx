import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Truck, RotateCcw, ShieldCheck, CreditCard, type LucideIcon } from 'lucide-react';
import { TrustBenefitVisual, type BenefitVisualType } from '../components/TrustBenefitVisual';

const EASING = [0.22, 1, 0.36, 1] as const;

interface BenefitItem {
  id: string;
  icon: LucideIcon;
  visual: BenefitVisualType;
  title: string;
  description: string;
  tone: 'warm' | 'silver' | 'lavender' | 'sage';
}

const BENEFITS_ROW_1: BenefitItem[] = [
  {
    id: 'delivery',
    icon: Truck,
    visual: 'delivery',
    title: 'Giao nhanh,\nđúng lúc.',
    description:
      'Theo dõi hành trình đơn hàng rõ ràng từ lúc xác nhận đến khi sản phẩm được trao tận tay.',
    tone: 'warm',
  },
  {
    id: 'returns',
    icon: RotateCcw,
    visual: 'returns',
    title: 'Đổi trả\nthật dễ dàng.',
    description:
      'Khi sản phẩm chưa thực sự phù hợp, quy trình đổi trả rõ ràng và linh hoạt giúp mọi quyết định trở nên nhẹ nhàng hơn.',
    tone: 'silver',
  },
];

const BENEFITS_ROW_2: BenefitItem[] = [
  {
    id: 'warranty',
    icon: ShieldCheck,
    visual: 'authenticity',
    title: 'Chính hãng.\nAn tâm dài lâu.',
    description:
      'Nguồn gốc sản phẩm minh bạch cùng chính sách bảo hành rõ ràng, để sự an tâm tiếp tục ngay cả sau khi mua.',
    tone: 'lavender',
  },
  {
    id: 'payment',
    icon: CreditCard,
    visual: 'payment',
    title: 'Thanh toán\ntheo cách của bạn.',
    description:
      'Lựa chọn phương thức phù hợp và hoàn tất thanh toán một cách đơn giản, an toàn và chủ động.',
    tone: 'sage',
  },
];

interface BenefitCardProps {
  benefit: BenefitItem;
  index: number;
}

function BenefitCard({ benefit, index }: BenefitCardProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const Icon = benefit.icon;

  const cardVariants: Variants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: EASING,
      },
    },
    hover: {
      y: shouldReduceMotion ? 0 : -3,
      transition: { duration: 0.35, ease: EASING },
    },
  };

  return (
    <motion.article
      className={`trust-benefit-card trust-benefit-card--${benefit.tone}`}
      variants={cardVariants}
      initial="initial"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className="trust-benefit-card__ambient" aria-hidden="true" />
      
      {/* Decorative SVG Micro-Scene in upper/center-right */}
      <TrustBenefitVisual type={benefit.visual} />

      <div className="trust-benefit-card__header">
        <div className="trust-benefit-card__icon-box">
          <Icon className="trust-benefit-card__icon" strokeWidth={1.8} aria-hidden="true" />
        </div>
      </div>

      <div className="trust-benefit-card__spacer" aria-hidden="true" />

      <div className="trust-benefit-card__content">
        <h3 className="trust-benefit-card__title">{benefit.title}</h3>
        <p className="trust-benefit-card__description">{benefit.description}</p>
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
