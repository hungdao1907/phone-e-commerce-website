// Notification data model — dùng với API thật /api/notifications

export interface Notification {
  id: string;
  type: 'ORDER' | 'REVIEW' | 'DISPUTE' | 'INVENTORY' | 'CUSTOMER' | 'PAYMENT';
  title: string;
  message: string;
  createdAt: string; // ISO date string từ backend
  isRead: boolean;
  referenceType?: string | null; // 'Order', 'Review', 'Dispute', 'Product', 'Customer'
  referenceId?: string | null;   // ID entity liên quan
}

export interface NotificationPage {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

// Type → icon + color config (chỉ dùng icon names có trong NotificationsWidget)
export const NOTIFICATION_TYPE_CONFIG: Record<
  Notification['type'],
  { color: string; bg: string; iconName: string; label: string }
> = {
  ORDER:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', iconName: 'ShoppingBag',  label: 'Đơn hàng'   },
  PAYMENT:   { color: 'text-green-400',   bg: 'bg-green-500/10',   iconName: 'CreditCard',   label: 'Thanh toán'  },
  INVENTORY: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  iconName: 'AlertCircle',  label: 'Kho hàng'    },
  REVIEW:    { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  iconName: 'MessageSquare', label: 'Đánh giá'   },
  DISPUTE:   { color: 'text-red-400',     bg: 'bg-red-500/10',     iconName: 'MessageSquare', label: 'Khiếu nại'  },
  CUSTOMER:  { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    iconName: 'UserPlus',     label: 'Khách hàng'  },
};

// Filter types dùng trong Notification Center
export type NotificationFilterType = Notification['type'] | 'ALL';

export const NOTIFICATION_FILTERS: { type: NotificationFilterType; label: string }[] = [
  { type: 'ALL',       label: 'Tất cả'    },
  { type: 'ORDER',     label: 'Đơn hàng'  },
  { type: 'REVIEW',    label: 'Đánh giá'  },
  { type: 'DISPUTE',   label: 'Khiếu nại' },
  { type: 'INVENTORY', label: 'Kho hàng'  },
];
