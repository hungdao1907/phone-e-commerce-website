import React, { useState } from 'react';
import { Settings, Gift, Tag, PackageSearch, LayoutDashboard } from 'lucide-react';
import { CartRewardsSetting } from '../settings/CartRewardsSetting';
import { PromoCodesSetting } from '../settings/PromoCodesSetting';

type SettingsTab = 'general' | 'cart-rewards' | 'promo-codes';

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('cart-rewards');

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: Settings },
    { id: 'cart-rewards', label: 'Mốc thưởng Giỏ hàng', icon: Gift },
    { id: 'promo-codes', label: 'Mã giảm giá', icon: Tag }
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-black/20 rounded-3xl overflow-hidden border border-white/5">
      {/* Settings Sidebar */}
      <div className="w-64 bg-black/40 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Settings
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        {activeTab === 'cart-rewards' && <CartRewardsSetting />}
        {activeTab === 'promo-codes' && <PromoCodesSetting />}
        {activeTab === 'general' && (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <Settings className="w-12 h-12 mb-4 opacity-20" />
            <p>Các cài đặt hệ thống chung sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
