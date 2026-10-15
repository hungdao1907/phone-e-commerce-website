import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  Package,
  Users,
  FileText,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Key,
  User,
  Bell,
  AlertCircle,
} from 'lucide-react';

interface StaffViewsProps {
  onNavigate?: (view: string) => void;
}

// ----------------------------------------------------------------------
// 1. STAFF OVERVIEW VIEW (Tổng quan giới hạn)
// ----------------------------------------------------------------------
export function StaffOverviewView({ onNavigate }: StaffViewsProps) {
  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [stats, setStats] = useState({
    assignedOrdersCount: 0,
    assignedLeadsCount: 0,
    assignedPlansCount: 0,
    unreadNotifsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStaffStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

        const [ordersRes, leadsRes, plansRes, notifsRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/orders/assigned`, { headers }),
          fetch(`${apiUrl}/api/leads`, { headers }),
          fetch(`${apiUrl}/api/plans/assigned`, { headers }),
          fetch(`${apiUrl}/api/notifications/my`, { headers }),
        ]);

        let ordersCount = 0;
        let leadsCount = 0;
        let plansCount = 0;
        let notifsCount = 0;

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
          const orders = await ordersRes.value.json();
          ordersCount = Array.isArray(orders) ? orders.length : 0;
        }

        if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
          const leads = await leadsRes.value.json();
          leadsCount = Array.isArray(leads) ? leads.length : 0;
        }

        if (plansRes.status === 'fulfilled' && plansRes.value.ok) {
          const plans = await plansRes.value.json();
          plansCount = Array.isArray(plans) ? plans.length : 0;
        }

        if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
          const notifs = await notifsRes.value.json();
          notifsCount = notifs?.unreadCount || (Array.isArray(notifs?.data) ? notifs.data.length : 0);
        }

        if (isMounted) {
          setStats({
            assignedOrdersCount: ordersCount,
            assignedLeadsCount: leadsCount,
            assignedPlansCount: plansCount,
            unreadNotifsCount: notifsCount,
          });
        }
      } catch (err) {
        console.error('Error loading staff summary stats:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStaffStats();
    return () => { isMounted = false; };
  }, [token]);

  return (
    <div className="flex flex-col gap-6 text-slate-900">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cổng thông tin Nhân viên kinh doanh
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            Xin chào, {currentUser?.username || 'Bạn'}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Đây là khu vực làm việc của bạn. Bạn có thể theo dõi các đơn hàng, khách hàng tiềm năng và báo giá chatbot được phân công trực tiếp tại đây.
          </p>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders Card */}
        <div
          onClick={() => onNavigate?.('orders')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn được phân công</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {isLoading ? '—' : stats.assignedOrdersCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span>Xem danh sách đơn</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Leads Card */}
        <div
          onClick={() => onNavigate?.('crm-leads')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead phân công</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {isLoading ? '—' : stats.assignedLeadsCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span>Chăm sóc khách hàng</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Quotations Card */}
        <div
          onClick={() => onNavigate?.('quotations')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Báo giá Chatbot</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            Xem báo giá
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span>Duyệt báo giá tư vấn</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Calendar Card */}
        <div
          onClick={() => onNavigate?.('planned')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch làm việc</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">
            {isLoading ? '—' : stats.assignedPlansCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span>Xem lịch kế hoạch</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Actions & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Chính sách quyền hạn</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Chỉ truy cập và quản lý các đơn hàng, lead được gán cho tài khoản của bạn.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Xem thông tin danh mục sản phẩm ở chế độ chỉ đọc.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Duyệt và tư vấn các báo giá Chatbot theo quy trình phê duyệt.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Các quyền quản trị hệ thống, marketing, tạo tài khoản và cài đặt được ẩn khỏi nhân sự.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Thông tin tài khoản</h2>
            <p className="text-sm text-slate-500 mb-4">
              Bạn có thể cập nhật mật khẩu đăng nhập ban đầu trong mục Hồ sơ cá nhân.
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('profile')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200"
          >
            <User className="w-4 h-4" />
            <span>Mở hồ sơ cá nhân & Đổi mật khẩu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. STAFF QUOTATIONS VIEW (Báo giá Chatbot được phân công)
// ----------------------------------------------------------------------
export function StaffQuotationsView({ initialTab }: { initialTab?: string } = {}) {
  const token = useAuthStore((state) => state.token);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processed'>(() => {
    if (initialTab === 'quotations-pending') return 'pending';
    if (initialTab === 'quotations-processed') return 'processed';
    return 'all';
  });

  useEffect(() => {
    if (initialTab === 'quotations-pending') setActiveTab('pending');
    else if (initialTab === 'quotations-processed') setActiveTab('processed');
    else if (initialTab === 'quotations-list' || initialTab === 'quotations') setActiveTab('all');
  }, [initialTab]);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/staff/quotations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQuotations(data.quotations || []);
        } else {
          setQuotations([]);
        }
      } catch (err) {
        console.error('Error fetching staff quotations:', err);
        setQuotations([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotations();
  }, [token]);

  const filteredQuotations = quotations.filter((q) => {
    if (activeTab === 'pending') {
      return q.status === 'PENDING_CUSTOMER_CONFIRMATION' || q.status === 'CUSTOMER_CONFIRMED';
    }
    if (activeTab === 'processed') {
      return q.status === 'APPROVED' || q.status === 'NEEDS_REQUOTE' || q.status === 'REJECTED'
        || q.status === 'EXPIRED' || q.status === 'CONVERTED';
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo Giá Chatbot</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách báo giá được khách hàng tạo từ AI Chatbot và phân công cho nhân viên</p>
        </div>

        {/* Tab Filters */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all",
              activeTab === 'all'
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Danh sách báo giá
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all",
              activeTab === 'pending'
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Báo giá chờ duyệt
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all",
              activeTab === 'processed'
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Báo giá đã xử lý
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[300px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 py-16">
            Đang tải danh sách báo giá...
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 px-4 text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">
              {activeTab === 'pending'
                ? 'Chưa có báo giá nào chờ duyệt'
                : activeTab === 'processed'
                ? 'Chưa có báo giá nào đã xử lý'
                : 'Chưa có báo giá nào được phân công'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Các báo giá từ Chatbot sau khi khách xác nhận sẽ hiển thị ở đây. (Hệ thống Quotation API đang ở trạng thái sẵn sàng kết nối).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Mã Báo Giá</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Số Lượng Sản Phẩm</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4">Hạn Hiệu Lực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{q.quoteNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{q.customer?.fullName || 'Khách hàng'}</div>
                      <div className="text-xs text-slate-500">{q.shippingPhone}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{q.items?.length || 0} sản phẩm</td>
                    <td className="p-4 font-semibold text-emerald-700">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(q.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {q.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(q.expiresAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. STAFF NOTIFICATIONS VIEW (Thông báo của tôi)
// ----------------------------------------------------------------------
export function StaffNotificationsView() {
  const token = useAuthStore((state) => state.token);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [token]);

  return (
    <div className="flex flex-col gap-6 text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thông Báo Của Tôi</h1>
          <p className="text-slate-500 text-sm mt-1">Thông báo liên quan đến các đơn hàng và công việc được phân công</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center text-slate-400 py-16">
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-16">
            <Bell className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Không có thông báo mới</p>
            <p className="text-xs text-slate-400 mt-1">Khi có cập nhật về đơn hàng phụ trách, thông báo sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. STAFF PROFILE VIEW (Hồ sơ cá nhân & Đổi mật khẩu)
// ----------------------------------------------------------------------
export function StaffProfileView() {
  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!newPassword || newPassword.length < 6) {
      setMsg({ text: 'Mật khẩu phải có ít nhất 6 ký tự', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'Mật khẩu xác nhận không khớp', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/users/${currentUser?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Cập nhật mật khẩu thất bại');
      }

      setMsg({ text: 'Đổi mật khẩu thành công!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-900 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hồ Sơ Cá Nhân</h1>
        <p className="text-slate-500 text-sm mt-1">Thông tin tài khoản và thiết lập bảo mật</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Thông Tin Nhân Viên</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium block">Tên đăng nhập</span>
            <span className="text-base font-bold text-slate-900">{currentUser?.username || '—'}</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium block">Vai trò</span>
            <span className="text-base font-bold text-emerald-700">Nhân viên kinh doanh (Staff)</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 sm:col-span-2">
            <span className="text-xs text-slate-500 font-medium block">Mã định danh (User ID)</span>
            <span className="font-mono text-xs text-slate-600 break-all">{currentUser?.id || '—'}</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">Đổi Mật Khẩu</h2>
        <p className="text-xs text-slate-500 mb-4">
          Nếu đây là lần đầu đăng nhập bằng mật khẩu do Quản trị viên cấp, vui lòng đổi mật khẩu an toàn.
        </p>

        {msg.text && (
          <div className={`p-3 rounded-xl mb-4 text-sm font-medium border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự..."
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
