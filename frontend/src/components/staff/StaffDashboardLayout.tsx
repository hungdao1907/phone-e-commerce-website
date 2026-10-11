import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, FileText, LayoutDashboard, LogOut, Package, UserRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navigation = [
  { to: '/staff', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/staff/quotations', label: 'Báo giá', icon: FileText },
  { to: '/staff/orders', label: 'Đơn hàng', icon: Package },
  { to: '/staff/notifications', label: 'Thông báo', icon: Bell },
  { to: '/staff/profile', label: 'Hồ sơ', icon: UserRound },
];

export function StaffDashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">WebPhone</p>
          <h1 className="mt-1 text-xl font-bold">Khu vực nhân viên</h1>
          <p className="mt-1 truncate text-sm text-slate-500">{user?.username ?? 'Staff'}</p>
        </div>

        <nav aria-label="Điều hướng nhân viên" className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Đăng xuất
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}

export function StaffHome() {
  const user = useAuthStore((state) => state.user);
  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold text-emerald-700">Nhân viên bán hàng</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">Xin chào{user?.username ? `, ${user.username}` : ''}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Đây là khu vực làm việc riêng của Staff. Các chức năng báo giá, đơn hàng và thông báo sẽ hiển thị dữ liệu
        sau khi API và quyền truy cập theo nhân viên được triển khai.
      </p>
    </section>
  );
}

function StaffEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-3 text-slate-600">{description}</p>
      <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Chưa có dữ liệu.</p>
    </section>
  );
}

export function StaffQuotations() {
  return <StaffEmptyState title="Báo giá" description="Chưa có Quotation model/API chính thức; trang này chưa đọc hoặc tạo báo giá." />;
}

export function StaffOrders() {
  return <StaffEmptyState title="Đơn hàng" description="Chưa có API đơn hàng được phân quyền theo nhân viên trong khu vực Staff." />;
}

export function StaffNotifications() {
  return <StaffEmptyState title="Thông báo" description="Thông báo hiện chưa có người nhận/định tuyến theo Staff nên chưa thể hiển thị an toàn." />;
}

export function StaffProfile() {
  const user = useAuthStore((state) => state.user);
  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold">Hồ sơ nhân viên</h2>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Tên đăng nhập</dt><dd className="mt-1 font-medium">{user?.username ?? '—'}</dd></div>
        <div><dt className="text-sm text-slate-500">Vai trò</dt><dd className="mt-1 font-medium">Staff</dd></div>
        <div className="sm:col-span-2"><dt className="text-sm text-slate-500">User ID</dt><dd className="mt-1 break-all font-mono text-sm">{user?.id ?? '—'}</dd></div>
      </dl>
    </section>
  );
}
