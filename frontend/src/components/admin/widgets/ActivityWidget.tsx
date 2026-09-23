import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, UserPlus, Package, CreditCard, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
  {
    id: 1,
    type: 'order',
    title: 'Đơn hàng mới',
    description: 'iPhone 15 Pro Max - Nguyễn Văn A',
    time: '3 phút trước',
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 2,
    type: 'user',
    title: 'Khách hàng mới',
    description: 'Trần Thị B vừa đăng ký tài khoản',
    time: '12 phút trước',
    icon: UserPlus,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    id: 3,
    type: 'delivery',
    title: 'Giao hàng thành công',
    description: 'Đơn #ORD-9985 đã hoàn tất',
    time: '25 phút trước',
    icon: Package,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    id: 4,
    type: 'payment',
    title: 'Thanh toán',
    description: 'Nhận 15.500.000đ từ đơn #ORD-9984',
    time: '1 giờ trước',
    icon: CreditCard,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    id: 5,
    type: 'review',
    title: 'Đánh giá mới',
    description: 'MacBook Air M3 được đánh giá 5 sao',
    time: '2 giờ trước',
    icon: Star,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
];

export function ActivityWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <h3 className="text-white font-semibold text-sm">Activities</h3>
        <button className="text-white/30 hover:text-white/60 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", activity.bg)}>
              <activity.icon className={cn("w-4 h-4", activity.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{activity.title}</p>
              <p className="text-[11px] text-white/40 truncate mt-0.5">{activity.description}</p>
              <p className="text-[10px] text-white/25 mt-1">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
