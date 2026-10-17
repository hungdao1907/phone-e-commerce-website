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
      className="border border-[#3ee08c]/25 rounded-[18px] px-4 py-3 relative animate-pulse"
      variants={getCardVariants(i)}
      transition={springTransition}
      style={{
        background: '#0d1a14',
        boxShadow: 'inset 0 -10px 18px -8px rgba(62, 224, 140, 0.3), 0 8px 30px -12px rgba(62, 224, 140, 0.35)',
        zIndex: 3 - i
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#3ee08c]/15 border border-[#3ee08c]/30 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 bg-[#eefaf3]/20 rounded w-3/4" />
          <div className="h-2 bg-[#eefaf3]/10 rounded w-full" />
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
      className="w-full flex items-start justify-start"
      initial="collapsed"
      whileHover="expanded"
    >
      {/* Inner stacked container */}
      <motion.div
        className="w-full backdrop-blur-xl p-5 flex flex-col gap-3"
        style={{
          background: 'rgba(4, 22, 15, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '28px',
          boxShadow: '0 10px 40px -14px rgba(62, 224, 140, 0.25)'
        }}
      >
        {/* Card stack */}
        <div>
          {isLoading ? (
            // Loading skeletons — giữ đúng 3 card
            [0, 1, 2].map((i) => <SkeletonCard key={i} i={i} />)
          ) : notifications.length === 0 ? (
            <div className="bg-[#0d1a14] border border-[#3ee08c]/30 rounded-[18px] px-4 py-4 text-center">
              <Bell className="w-5 h-5 text-[#3ee08c]/60 mx-auto mb-1" />
              <p className="text-[11px] text-[#eefaf3]/60">Không có thông báo</p>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const config = NOTIFICATION_TYPE_CONFIG[notif.type] ?? NOTIFICATION_TYPE_CONFIG['ORDER'];
              const IconComponent = ICON_MAP[config.iconName] || Bell;

              return (
                <motion.div
                  key={notif.id}
                  className={cn(
                    "rounded-[18px] px-4 py-3 relative border",
                    "transition-all duration-200 cursor-pointer"
                  )}
                  style={{
                    background: '#0d1a14',
                    borderColor: 'rgba(62, 224, 140, 0.45)',
                    boxShadow: 'inset 0 -10px 18px -8px rgba(62, 224, 140, 0.4), 0 8px 30px -12px rgba(62, 224, 140, 0.5)',
                    zIndex: notifications.length - i
                  }}
                  variants={getCardVariants(i)}
                  transition={springTransition}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon in emerald glass square */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#3ee08c]/15 border border-[#3ee08c]/40 text-[#3ee08c]">
                      <IconComponent className="w-4 h-4 text-[#3ee08c]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-xs font-semibold truncate",
                          !notif.isRead ? "text-[#eefaf3]" : "text-[#eefaf3]/70"
                        )}>
                          {notif.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-[#eefaf3]/55 font-medium">{formatTime(notif.createdAt)}</span>
                          {!notif.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3ee08c] shadow-[0_0_6px_#3ee08c]" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#eefaf3]/75 font-normal line-clamp-1 mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer — switches between "Notifications" and "View all" */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-full border border-[#3ee08c]/50 text-[#3ee08c] text-xs flex items-center justify-center font-bold">
            {unreadCount > 0 ? unreadCount : (notifications.length || '0')}
          </div>
          <span className="grid">
            <motion.span
              className="text-xs font-medium text-[#eefaf3]/55 row-start-1 col-start-1"
              variants={footerNotifVariants}
              transition={textSwitchTransition}
            >
              Notifications
            </motion.span>
            <motion.span
              className="text-xs font-medium text-[#3ee08c] flex items-center gap-1 cursor-pointer select-none row-start-1 col-start-1 hover:text-[#7af0b2]"
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
