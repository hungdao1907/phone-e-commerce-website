// Notification data model & mock service
// Replace mock data with real API calls when backend is ready

export interface Notification {
  id: string;
  type: 'order_new' | 'order_confirmed' | 'payment' | 'inventory' | 'customer' | 'warranty' | 'campaign' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
}

// Type → icon mapping helper
export const NOTIFICATION_TYPE_CONFIG: Record<Notification['type'], { color: string; bg: string; iconName: string }> = {
  order_new: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', iconName: 'ShoppingBag' },
  order_confirmed: { color: 'text-blue-400', bg: 'bg-blue-500/10', iconName: 'CheckCircle2' },
  payment: { color: 'text-green-400', bg: 'bg-green-500/10', iconName: 'CreditCard' },
  inventory: { color: 'text-orange-400', bg: 'bg-orange-500/10', iconName: 'AlertCircle' },
  customer: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', iconName: 'UserPlus' },
  warranty: { color: 'text-red-400', bg: 'bg-red-500/10', iconName: 'MessageSquare' },
  campaign: { color: 'text-purple-400', bg: 'bg-purple-500/10', iconName: 'Megaphone' },
  system: { color: 'text-gray-400', bg: 'bg-gray-500/10', iconName: 'Bell' },
};

// Mock notifications — sorted newest first
// Replace this function with a real API call later:
//   export async function fetchNotifications(): Promise<Notification[]> {
//     const res = await fetch('/api/notifications');
//     return res.json();
//   }
export function getNotifications(): Notification[] {
  return [
    {
      id: 'n1',
      type: 'order_new',
      title: 'Đơn hàng mới #ORD-9989',
      message: 'Nguyễn Văn A vừa đặt mua iPhone 15 Pro Max.',
      createdAt: '2 phút trước',
      isRead: false,
    },
    {
      id: 'n2',
      type: 'inventory',
      title: 'Cảnh báo Tồn kho',
      message: 'MacBook Pro 14 M3 chỉ còn 2 máy trong kho.',
      createdAt: '15 phút trước',
      isRead: false,
    },
    {
      id: 'n3',
      type: 'warranty',
      title: 'Khiếu nại #TK-1025',
      message: 'Giao nhầm bản 256GB thay vì 512GB.',
      createdAt: '1 giờ trước',
      isRead: true,
    },
    {
      id: 'n4',
      type: 'payment',
      title: 'Thanh toán thành công',
      message: 'Nhận 15.500.000đ từ đơn #ORD-9984.',
      createdAt: '2 giờ trước',
      isRead: true,
    },
    {
      id: 'n5',
      type: 'customer',
      title: 'Khách hàng mới',
      message: 'Trần Thị B vừa đăng ký tài khoản.',
      createdAt: '3 giờ trước',
      isRead: true,
    },
  ];
}
