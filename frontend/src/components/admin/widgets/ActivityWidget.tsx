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
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 2,
    type: 'user',
    title: 'Khách hàng mới',
    description: 'Trần Thị B vừa đăng ký tài khoản',
    time: '12 phút trước',
    icon: UserPlus,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 3,
    type: 'delivery',
    title: 'Giao hàng thành công',
    description: 'Đơn #ORD-9985 đã hoàn tất',
    time: '25 phút trước',
    icon: Package,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    id: 4,
    type: 'payment',
    title: 'Thanh toán',
    description: 'Nhận 15.500.000đ từ đơn #ORD-9984',
    time: '1 giờ trước',
    icon: CreditCard,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 5,
    type: 'review',
    title: 'Đánh giá mới',
    description: 'MacBook Air M3 được đánh giá 5 sao',
    time: '2 giờ trước',
    icon: Star,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
];

export function ActivityWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 border-b border-slate-100">
        <h3 className="text-slate-900 font-semibold text-sm">Activities</h3>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", activity.bg)}>
              <activity.icon className={cn("w-4 h-4", activity.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{activity.title}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{activity.description}</p>
              <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
