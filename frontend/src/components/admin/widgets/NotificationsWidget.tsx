import React from 'react';
import { motion, type Transition } from 'framer-motion';
import { ShoppingBag, AlertCircle, MessageSquare, CreditCard, UserPlus, Bell, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NOTIFICATION_TYPE_CONFIG, type Notification } from '@/data/notifications';
import { useTopNotifications } from '@/hooks/useNotifications';

// Icon map
const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag, AlertCircle, MessageSquare, CreditCard, UserPlus, Bell,
  CheckCircle2: Bell, Megaphone: Bell, // fallbacks
};

// Animation config — KHÔNG THAY ĐỔI
const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

const textSwitchTransition: Transition = {
  duration: 0.22,
  ease: 'easeInOut',
};

const getCardVariants = (i: number) => ({
  collapsed: {
    marginTop: i === 0 ? 0 : -48,
    scaleX: 1 - i * 0.04,
    opacity: i > 3 ? 0 : 1,
  },
  expanded: {
    marginTop: i === 0 ? 0 : 6,
    scaleX: 1,
    opacity: 1,
  },
});

const footerNotifVariants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
  expanded: { opacity: 0, y: -16, pointerEvents: 'none' as const },
};

const footerViewAllVariants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: 'none' as const },
  expanded: { opacity: 1, y: 0, pointerEvents: 'auto' as const },
};

// Skeleton card khi đang loading
function SkeletonCard({ i }: { i: number }) {
  return (
    <motion.div
      className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 relative animate-pulse shadow-xs"
      variants={getCardVariants(i)}
      transition={springTransition}
      style={{ zIndex: 3 - i }}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-200 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-2 bg-slate-100 rounded w-full" />
        </div>
      </div>
    </motion.div>
  );
}

interface NotificationsWidgetProps {
  onViewAll?: () => void;
}

export function NotificationsWidget({ onViewAll }: NotificationsWidgetProps) {
  const { data, isLoading } = useTopNotifications();

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Format timestamp ngắn gọn
  const formatTime = (isoStr: string) => {
    const date = new Date(isoStr);
    const now  = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1)  return 'Hôm qua';
    return `${diffD} ngày trước`;
  };

  return (
    <motion.div
      className="w-full flex items-start justify-start pt-2"
      initial="collapsed"
      whileHover="expanded"
    >
      {/* Inner stacked container */}
      <motion.div
        className="w-full rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex flex-col gap-3"
      >
        {/* Card stack */}
        <div>
          {isLoading ? (
            // Loading skeletons — giữ đúng 3 card
            [0, 1, 2].map((i) => <SkeletonCard key={i} i={i} />)
          ) : notifications.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-4 text-center">
              <Bell className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-[11px] text-slate-500">Không có thông báo</p>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const config = NOTIFICATION_TYPE_CONFIG[notif.type] ?? NOTIFICATION_TYPE_CONFIG['ORDER'];
              const IconComponent = ICON_MAP[config.iconName] || Bell;

              return (
                <motion.div
                  key={notif.id}
                  className={cn(
                    "bg-white border border-slate-200 rounded-xl px-4 py-3 relative",
                    "hover:bg-slate-50 transition-colors duration-200",
                    "shadow-sm"
                  )}
                  variants={getCardVariants(i)}
                  transition={springTransition}
                  style={{ zIndex: notifications.length - i }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                      <IconComponent className={cn("w-3.5 h-3.5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-xs font-semibold truncate",
                          !notif.isRead ? "text-slate-900 font-bold" : "text-slate-600"
                        )}>
                          {notif.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">{formatTime(notif.createdAt)}</span>
                          {!notif.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer — switches between "Notifications" and "View all" */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] flex items-center justify-center font-bold border border-slate-200">
            {unreadCount > 0 ? unreadCount : (notifications.length || '0')}
          </div>
          <span className="grid">
            <motion.span
              className="text-xs font-medium text-slate-500 row-start-1 col-start-1"
              variants={footerNotifVariants}
              transition={textSwitchTransition}
            >
              Notifications
            </motion.span>
            <motion.span
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer select-none row-start-1 col-start-1"
              variants={footerViewAllVariants}
              transition={textSwitchTransition}
              onClick={onViewAll}
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </motion.span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
