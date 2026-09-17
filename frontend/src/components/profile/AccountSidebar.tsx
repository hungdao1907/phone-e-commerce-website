import React from 'react';
import { User, Package, Heart, MapPin, Ticket, Star, Lock, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export type TabId = 'overview' | 'info' | 'orders' | 'wishlist' | 'address' | 'voucher' | 'points' | 'security';

interface AccountSidebarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

const MENU_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'Thông tin tài khoản', icon: User },
  { id: 'orders', label: 'Đơn hàng của tôi', icon: Package },
  { id: 'wishlist', label: 'Sản phẩm yêu thích', icon: Heart },
  { id: 'address', label: 'Địa chỉ nhận hàng', icon: MapPin },
  { id: 'voucher', label: 'Voucher', icon: Ticket },
  { id: 'points', label: 'Điểm thưởng', icon: Star },
];

const SECURITY_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'security', label: 'Đổi mật khẩu', icon: Lock },
];

export function AccountSidebar({ activeTab, onChangeTab }: AccountSidebarProps) {
  const { user, logout } = useAuthStore();
  const userName = user?.username ? user.username.split('@')[0] : 'Người dùng';
  
  return (
    <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
      {/* User Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mb-4 overflow-hidden border border-neutral-200">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 truncate w-full">{userName}</h2>
        <p className="text-sm text-neutral-500 truncate w-full">{user?.username}</p>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex flex-col bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-3">
        <div className="px-3 py-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Tài khoản
        </div>
        {MENU_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-neutral-900 text-white shadow-sm' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}

        <div className="px-3 py-2 mt-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Bảo mật
        </div>
        {SECURITY_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-neutral-900 text-white shadow-sm' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}

        <div className="my-2 border-t border-neutral-100" />
        
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
      
      {/* Mobile Horizontal Menu (Scrollable) */}
      <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4">
        {[...MENU_ITEMS, ...SECURITY_ITEMS].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border ${
                isActive 
                  ? 'bg-neutral-900 border-neutral-900 text-white' 
                  : 'bg-white border-neutral-200 text-neutral-600'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium border bg-white border-red-200 text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
