import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, AlertCircle, MessageSquare, Package, CheckCircle2, ChevronRight, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: 'order',
    title: 'Đơn hàng mới #ORD-9989',
    message: 'Khách hàng Nguyễn Văn A vừa đặt mua iPhone 15 Pro Max.',
    time: '2 phút trước',
    icon: ShoppingBag,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    id: 2,
    type: 'inventory',
    title: 'Cảnh báo Tồn kho',
    message: 'Sản phẩm MacBook Pro 14 M3 chỉ còn 2 máy trong kho.',
    time: '15 phút trước',
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    id: 3,
    type: 'dispute',
    title: 'Khiếu nại Khẩn cấp',
    message: 'Ticket #TK-1025: Giao nhầm bản 256GB thay vì 512GB.',
    time: '1 giờ trước',
    icon: MessageSquare,
    color: 'text-red-600',
    bg: 'bg-red-50'
  },
  {
    id: 4,
    type: 'delivery',
    title: 'Giao hàng Thành công',
    message: 'Đơn hàng #ORD-9985 đã được giao thành công.',
    time: '2 giờ trước',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  }
];

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-14 right-0 w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[999] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Thông báo mới</h3>
            </div>
            <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full">4 Mới</span>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col p-2">
            {mockNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-200/60", notif.bg)}>
                  <notif.icon className={cn("w-5 h-5", notif.color)} />
                </div>
                <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pr-4">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <button 
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center transition-colors shadow-xs"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
