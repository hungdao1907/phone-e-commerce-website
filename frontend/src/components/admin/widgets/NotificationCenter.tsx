import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, ShoppingBag, AlertCircle, MessageSquare,
  CreditCard, UserPlus, CheckCheck, Loader2, PackageSearch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_FILTERS,
  type Notification,
  type NotificationFilterType,
} from '@/data/notifications';
import {
  useNotificationCenter,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';

// ─── Icon map ──────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, AlertCircle, MessageSquare, CreditCard, UserPlus, Bell,
  CheckCircle2: Bell, Megaphone: Bell,
};

// ─── Time helpers ──────────────────────────────────────────────────────────
function formatTime(isoStr: string): string {
  const date = new Date(isoStr);
  const now  = new Date();
  const diffMs  = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)  return 'Hôm qua';
  if (diffD < 7)    return `${diffD} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDateGroup(isoStr: string): 'Hôm nay' | 'Hôm qua' | 'Trước đó' {
  const date = new Date(isoStr);
  const now  = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime())     return 'Hôm nay';
  if (d.getTime() === yesterday.getTime()) return 'Hôm qua';
  return 'Trước đó';
}

// ─── Navigation helper ─────────────────────────────────────────────────────
function useNotificationNav(onClose: () => void) {
  const navigate = useNavigate();
  return useCallback((notif: Notification) => {
    if (!notif.referenceType || !notif.referenceId) { onClose(); return; }
    switch (notif.referenceType) {
      case 'Order':   navigate(`/dashboard/orders`);            break;
      case 'Review':  navigate(`/dashboard/orders`);            break;
      case 'Dispute': navigate(`/dashboard/orders-disputes`);   break;
      case 'Product': navigate(`/dashboard/inventory`);         break;
      case 'Customer': navigate(`/dashboard/crm-customers`);   break;
      default:        navigate(`/dashboard`);
    }
    onClose();
  }, [navigate, onClose]);
}

// ─── Group notifications by date ───────────────────────────────────────────
function groupByDate(items: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  for (const n of items) {
    const g = getDateGroup(n.createdAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  }
  return groups;
}

// ─── Single notification item ──────────────────────────────────────────────
interface NotifItemProps {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: (notif: Notification) => void;
}
function NotifItem({ notif, onMarkRead, onNavigate }: NotifItemProps) {
  const config = NOTIFICATION_TYPE_CONFIG[notif.type] ?? NOTIFICATION_TYPE_CONFIG['ORDER'];
  const IconComponent = ICON_MAP[config.iconName] || Bell;

  return (
    <button
      onClick={() => {
        if (!notif.isRead) onMarkRead(notif.id);
        onNavigate(notif);
      }}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 rounded-2xl transition-colors text-left group',
        notif.isRead
          ? 'hover:bg-white/5'
          : 'bg-white/[0.06] hover:bg-white/10'
      )}
    >
      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-white/10', config.bg)}>
        <IconComponent className={cn('w-4 h-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={cn(
            'text-sm leading-snug',
            notif.isRead ? 'font-medium text-white/60' : 'font-semibold text-white/90'
          )}>
            {notif.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <span className="text-[10px] text-white/30 whitespace-nowrap">{formatTime(notif.createdAt)}</span>
            {!notif.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            )}
          </div>
        </div>
        <p className="text-[12px] text-white/45 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
      </div>
    </button>
  );
}

// ─── Main NotificationCenter component ────────────────────────────────────
interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('ALL');
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Notification[]>([]);

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [activeFilter]);

  // Reset when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setAccumulated([]);
      setActiveFilter('ALL');
    }
  }, [isOpen]);

  const { data, isLoading, isFetching } = useNotificationCenter(
    activeFilter, page, 20, isOpen
  );

  // Accumulate pages
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAccumulated(data.data);
      } else {
        setAccumulated(prev => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  const { mutate: markRead }    = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const handleNavigate = useNotificationNav(onClose);

  const groups = groupByDate(accumulated);
  const GROUP_ORDER = ['Hôm nay', 'Hôm qua', 'Trước đó'] as const;
  const hasMore = data?.pagination.hasMore ?? false;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="nc-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}
      {isOpen && (
        <motion.aside
          key="nc-drawer"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className={cn(
            'fixed right-0 top-0 bottom-0 z-[201] w-[400px] max-w-[90vw]',
            'flex flex-col',
            'bg-[#0D1F16]/95 backdrop-blur-md',
            'border-l border-white/10',
            'shadow-[-20px_0_60px_rgba(0,0,0,0.4)]',
          )}
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">Thông báo</h2>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-white/40">{unreadCount} chưa đọc</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    title="Đánh dấu tất cả đã đọc"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/50 hover:text-white/80 text-[11px] font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Đọc tất cả
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-white/50 hover:text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Filter Tabs ── */}
            <div className="flex gap-1.5 px-4 py-3 border-b border-white/[0.06] shrink-0 overflow-x-auto scrollbar-none">
              {NOTIFICATION_FILTERS.map((f) => (
                <button
                  key={f.type}
                  onClick={() => setActiveFilter(f.type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                    activeFilter === f.type
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.08] hover:text-white/60',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Loading state (first load) */}
              {isLoading && accumulated.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <p className="text-sm">Đang tải thông báo...</p>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && accumulated.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <PackageSearch className="w-7 h-7 text-white/25" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/50 text-sm font-medium">
                      {activeFilter === 'ALL'
                        ? 'Không có thông báo'
                        : `Không có thông báo thuộc danh mục này`}
                    </p>
                    <p className="text-white/25 text-xs mt-1">
                      {activeFilter !== 'ALL' && 'Thử chọn danh mục khác'}
                    </p>
                  </div>
                </div>
              )}

              {/* Grouped notification list */}
              {accumulated.length > 0 && (
                <div className="px-3 py-2 space-y-1">
                  {GROUP_ORDER.map((group) => {
                    const items = groups[group];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={group}>
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-4 py-2 mt-2">
                          {group}
                        </p>
                        {items.map((notif) => (
                          <NotifItem
                            key={notif.id}
                            notif={notif}
                            onMarkRead={markRead}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load more */}
              {hasMore && (
                <div className="px-4 py-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className={cn(
                      'w-full py-2.5 rounded-xl border border-white/10 text-xs font-semibold transition-all',
                      isFetching
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                    )}
                  >
                    {isFetching ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      'Xem thêm'
                    )}
                  </button>
                </div>
              )}

              {/* Fetching more indicator */}
              {isFetching && accumulated.length > 0 && page > 1 && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                </div>
              )}
            </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
