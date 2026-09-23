import React from 'react';
import { ShoppingBag, CheckCircle, Package, Truck, Home } from 'lucide-react';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned';

interface OrderDeliveryTimelineProps {
  currentStatus: OrderStatus;
  history?: { status: OrderStatus; timestamp: string }[];
}

const TIMELINE_STEPS: { id: OrderStatus; label: string; icon: React.ElementType }[] = [
  { id: 'pending', label: 'Đã đặt hàng', icon: ShoppingBag },
  { id: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { id: 'processing', label: 'Đang chuẩn bị hàng', icon: Package },
  { id: 'shipping', label: 'Đang giao', icon: Truck },
  { id: 'delivered', label: 'Đã giao', icon: Home }
];

export function OrderDeliveryTimeline({ currentStatus, history = [] }: OrderDeliveryTimelineProps) {
  // Determine current index. If cancelled/returned, we might handle it differently.
  // For standard flow:
  let currentIndex = TIMELINE_STEPS.findIndex(s => s.id === currentStatus);
  if (currentIndex === -1) currentIndex = 0; // fallback

  const getTimestampForStatus = (statusId: OrderStatus) => {
    const entry = history.find(h => h.status === statusId);
    return entry ? new Date(entry.timestamp).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }) : null;
  };

  return (
    <div className="py-6">
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-neutral-100" />
        <div 
          className="absolute left-6 top-10 w-0.5 bg-emerald-500 transition-all duration-500 ease-out" 
          style={{ height: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
        />

        <div className="space-y-8 relative">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const timestamp = getTimestampForStatus(step.id);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex gap-6 relative">
                <div className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shrink-0 z-10 bg-white transition-colors duration-300 ${
                  isCompleted ? 'border-emerald-500 text-emerald-500' : 'border-neutral-200 text-neutral-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="pt-2">
                  <h4 className={`text-sm font-bold ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {step.label}
                  </h4>
                  {timestamp ? (
                    <p className="text-xs font-semibold text-neutral-500 mt-1">{timestamp}</p>
                  ) : (
                    <p className="text-xs text-neutral-400 mt-1">Chưa hoàn thành</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
