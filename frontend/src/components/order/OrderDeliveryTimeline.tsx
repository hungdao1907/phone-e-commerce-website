import React from 'react';
import { ShoppingBag, CheckCircle, Package, Truck, Home, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'completed' | 'cancelled' | 'returned';

interface OrderDeliveryTimelineProps {
  currentStatus: OrderStatus;
  history?: { status: OrderStatus; timestamp: string }[];
}

const TIMELINE_STEPS: { id: OrderStatus; label: string; icon: any }[] = [
  { id: 'pending', label: 'Đã đặt hàng', icon: ShoppingBag },
  { id: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { id: 'processing', label: 'Đang chuẩn bị hàng', icon: Package },
  { id: 'shipping', label: 'Đang giao', icon: Truck },
  { id: 'delivered', label: 'Đã giao', icon: Home },
  { id: 'completed', label: 'Đã hoàn thành', icon: CheckCircle2 }
];

export function OrderDeliveryTimeline({ currentStatus, history = [] }: OrderDeliveryTimelineProps) {
  let currentIndex = TIMELINE_STEPS.findIndex(s => s.id === currentStatus);
  if (currentIndex === -1) currentIndex = 0; // fallback

  const getTimestampForStatus = (statusId: OrderStatus) => {
    const entry = history.find(h => h.status === statusId);
    return entry ? new Date(entry.timestamp).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }) : null;
  };

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-neutral-100" />
      <div 
        className="absolute left-[15px] top-6 w-0.5 bg-emerald-500 transition-all duration-500 ease-out" 
        style={{ height: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
      />

      <div className="space-y-6 relative">
        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const timestamp = getTimestampForStatus(step.id);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex gap-4 relative items-start">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white transition-all duration-300",
                isCompleted ? "border-emerald-500 text-emerald-500" : "border-neutral-200 text-neutral-300",
                isCurrent && "border-emerald-500 bg-emerald-50 text-emerald-600 scale-110"
              )}>
                <Icon className={cn("w-4 h-4", isCurrent && "w-4.5 h-4.5")} />
              </div>
              <div className="pt-1.5 flex-1 min-w-0">
                <h4 className={cn(
                  "text-sm",
                  isCompleted || isCurrent ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                )}>
                  {step.label}
                </h4>
                {timestamp ? (
                  <p className="text-xs text-neutral-500 mt-1">{timestamp}</p>
                ) : (
                  <p className="text-xs text-neutral-400 mt-1">Chưa hoàn thành</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
