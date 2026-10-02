import React, { useState } from 'react';
import { Settings, Gift, Tag, PackageSearch, LayoutDashboard, PanelBottom } from 'lucide-react';
import { CartRewardsSetting } from '../settings/CartRewardsSetting';
import { PromoCodesSetting } from '../settings/PromoCodesSetting';
import { FooterManagement } from './FooterManagement';

type SettingsTab = 'general' | 'cart-rewards' | 'promo-codes' | 'footer';

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('cart-rewards');

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: Settings },
    { id: 'cart-rewards', label: 'Mốc thưởng Giỏ hàng', icon: Gift },
    { id: 'promo-codes', label: 'Mã giảm giá', icon: Tag },
    { id: 'footer', label: 'Quản lý Footer', icon: PanelBottom }
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Settings Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-600" /> Cài Đặt Hệ Thống
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border-slate-200'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-white">
        {activeTab === 'cart-rewards' && <CartRewardsSetting />}
        {activeTab === 'promo-codes' && <PromoCodesSetting />}
        {activeTab === 'footer' && <FooterManagement />}
        {activeTab === 'general' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Settings className="w-12 h-12 mb-4 opacity-20 text-slate-400" />
            <p>Các cài đặt hệ thống chung sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
