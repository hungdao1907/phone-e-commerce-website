// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import lottie from 'lottie-web';
import { ChevronRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LottieIcon } from '@/components/ui/LottieIcon';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const DOCK_ITEMS = [
  { id: 'dashboard', icon: "/lottie/dashboard.json", label: 'Tổng quan', isLottie: true, path: '/dashboard' },
  {
    id: 'calendar',
    icon: "/lottie/calendar.json",
    label: 'Lịch',
    isLottie: true,
    path: '/calendar',
    subItems: [
      { id: 'planned', label: 'Lịch kế hoạch' }
    ]
  },
  {
    id: 'product',
    icon: "/lottie/product.json",
    label: 'Sản phẩm',
    isLottie: true,
    path: '/product',
    subItems: [
      { id: 'product-list', label: 'Danh sách sản phẩm' },
      { id: 'inventory', label: 'Kho hàng' },
      { id: 'categories', label: 'Danh mục & phân loại' }
    ]
  },
  {
    id: 'orders',
    icon: "/lottie/orders.json",
    label: 'Đơn hàng',
    isLottie: true,
    path: '/orders',
    subItems: [
      { id: 'orders-list', label: 'Danh sách đơn hàng' },
      { id: 'orders-reviews', label: 'Đánh giá sản phẩm' },
      { id: 'orders-complaints', label: 'Khiếu nại / Hỗ trợ' },
      { id: 'orders-invoices', label: 'Hóa đơn & Chứng từ' }
    ]
  },
  {
    id: 'crm',
    icon: "/lottie/user.json",
    label: 'CRM',
    isLottie: true,
    path: '/crm',
    subItems: [
      { id: 'crm-leads', label: 'Khách hàng tiềm năng' },
      { id: 'crm-customers', label: 'Khách hàng' }
    ]
  },
  {
    id: 'user',
    icon: "/lottie/user.json",
    label: 'Nhân sự',
    isLottie: true,
    path: '/user',
    subItems: [
      { id: 'user-staff', label: 'Quản trị viên' }
    ]
  },
  {
    id: 'marketing-module',
    icon: "/lottie/performance.json",
    label: 'Marketing',
    isLottie: true,
    path: '/marketing-module',
    subItems: [
      { id: 'marketing', label: 'Chiến dịch Marketing' },
      { id: 'banners', label: 'Quản lý Banner' },
      { id: 'home-featured-products', label: 'Sản phẩm nổi bật' }
    ]
  },
  {
    id: 'quotations',
    icon: "/lottie/performance.json",
    label: 'Báo giá Chatbot',
    isLottie: true,
    path: '/quotations',
    subItems: [
      { id: 'quotations-list', label: 'Danh sách báo giá' },
      { id: 'quotations-pending', label: 'Báo giá chờ duyệt' },
      { id: 'quotations-processed', label: 'Báo giá đã xử lý' }
    ]
  }
];

export function VerticalDock({ activeView, onNavigate }: { activeView: string; onNavigate: (view: string) => void }) {
  const currentUser = useAuthStore((state) => state.user);
  const isStaff = currentUser?.role === 'staff';
  const dockItems = isStaff
    ? DOCK_ITEMS.filter((item) => item.id !== 'user' && item.id !== 'calendar')
    : DOCK_ITEMS;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);


  return (
    <div
      className="fixed left-4 top-4 bottom-4 z-50 flex flex-col"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Dock Container */}
      <motion.div
        initial={{ x: -150, opacity: 0, skewX: -15, rotateZ: -5, width: 64 }}
        animate={{
          x: 0,
          opacity: 1,
          skewX: 0,
          rotateZ: 0,
          width: isExpanded ? 240 : 64
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 24,
          mass: 1
        }}
        style={{ transformOrigin: "top left" }}
        className="h-full flex flex-col p-3 bg-black/20 backdrop-blur-sm border border-white/5 rounded-3xl shadow-2xl overflow-hidden transform-gpu will-change-transform"
      >

        {/* Brand Logo Box */}
        <div className="flex items-center w-full mb-8 overflow-hidden shrink-0">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <img src="/images/logo.png" alt="Brand Logo" className="w-7 h-7 object-contain" />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap ml-4 text-white font-extrabold text-xl tracking-tighter"
          >
            HM STORE
          </motion.div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {dockItems.map((item) => {
            const hasSubItems = !!item.subItems;
            const isSubMenuOpen = openMenuId === item.id;
            const isActive = activeView === item.id || (hasSubItems && item.subItems!.some(s => activeView === s.id));
            const isItemHovered = hoveredId === item.id;

            const handleParentClick = () => {
              if (hasSubItems) {
                setOpenMenuId(isSubMenuOpen ? null : item.id);
              } else {
                onNavigate(item.id);
              }
            };

            return (
              <div key={item.id} className="w-full flex flex-col">
                <button
                  onClick={handleParentClick}
                  className="relative group outline-none flex items-center w-full rounded-2xl"
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Gradient background — same effect as sub-items */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{
                      opacity: isActive ? 1 : isItemHovered ? 0.5 : 0
                    }}
                    style={{
                      background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.12) 100%)"
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />

                  {/* Icon Container */}
                  <motion.div
                    animate={{ scale: isItemHovered ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-10 h-10 shrink-0 flex items-center justify-center"
                  >
                    {item.isLottie ? (
                      <div className="w-7 h-7 flex items-center justify-center">
                        <LottieIcon path={item.icon as string} playing={isItemHovered} />
                      </div>
                    ) : (
                      <item.icon className="w-6 h-6 text-white/80" />
                    )}
                  </motion.div>

                  {/* Text Label */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "whitespace-nowrap ml-4 font-medium transition-colors duration-200 flex-1 flex items-center justify-between",
                      isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                    )}
                  >
                    <span>{item.label}</span>
                    {hasSubItems && (
                      <ChevronRight className={cn("w-4 h-4 transition-transform mr-4", isSubMenuOpen ? "rotate-90" : "")} />
                    )}
                  </motion.div>
                </button>

                {/* Sub Menu Accordion */}
                <AnimatePresence>
                  {hasSubItems && isSubMenuOpen && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden w-full"
                    >
                      {/*
                        Layout logic:
                        - Icon container = w-10 = 40px → tâm icon tại x=20px
                        - Line/Dot đặt tại left=20px (tâm icon)
                        - Text bắt đầu sau icon+ml-4 = 40+16 = 56px (dùng pl-14)
                      */}
                      <div className="relative mt-1 pb-2 flex flex-col">
                        {(() => {
                          const ROW_H = 36; // h-9 = 36px
                          const activeIndex = item.subItems!.findIndex(s => activeView === s.id);

                          // Dot dừng ở tâm item (ROW_H/2 từ đầu item đó)
                          const dotY = activeIndex >= 0
                            ? activeIndex * ROW_H + ROW_H / 2 - 4
                            : (item.subItems!.length - 1) * ROW_H + ROW_H / 2;
                          const lineH = dotY + 4;

                          return (
                            <>
                              {/* Trailing Line - x=20px = tâm icon cha */}
                              <motion.div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: "20px",
                                  width: "2px",
                                  borderRadius: "999px",
                                  background: "linear-gradient(to bottom, rgba(158,255,0,0.7), rgba(158,255,0,0.15))"
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: lineH }}
                                transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
                              />

                              {/* Dot - tâm dot = left + width/2 = 17 + 4 = 21px = tâm line */}
                              <motion.div
                                style={{
                                  position: "absolute",
                                  left: "17px",
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#9eff00",
                                  boxShadow: "0 0 8px 2px rgba(158,255,0,0.8)",
                                  zIndex: 20
                                }}
                                initial={{ y: 0, opacity: 0 }}
                                animate={{ y: dotY, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
                              />
                            </>
                          );
                        })()}

                        {/* Sub-items: text bắt đầu tại pl-14 = 56px = thẳng hàng với text cha */}
                        {item.subItems!.map((sub) => {
                          const isSubActive = activeView === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => onNavigate(sub.id)}
                              className="relative flex items-center h-9 pr-4 group overflow-hidden rounded-2xl text-left w-full"
                              style={{ paddingLeft: "56px" }}
                            >
                               {/* Gradient fade-in background: trong suốt bên trái, sáng dần bên phải */}
                               <motion.div
                                 className="absolute inset-0 rounded-2xl"
                                 style={{
                                   background: isSubActive
                                     ? "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.12) 100%)"
                                     : "transparent"
                                 }}
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: isSubActive ? 1 : 0 }}
                                 transition={{ duration: 0.4, ease: "easeOut" }}
                               />

                               <span className={cn(
                                 "relative z-10 text-sm font-medium whitespace-nowrap transition-colors",
                                 isSubActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                               )}>
                                 {sub.label}
                               </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer Icons: Settings, Notif, Avatar */}
        <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-3 w-full relative">



          {/* Settings */}
          {(() => {
            const isSettingsActive = activeView === 'settings' || activeView === 'cart-rewards' || activeView === 'promo-codes' || activeView === 'footer';
            return (
              <div className="w-full flex flex-col">
                <button
                  onClick={() => onNavigate('settings')}
                  onMouseEnter={() => setIsSettingsHovered(true)}
                  onMouseLeave={() => setIsSettingsHovered(false)}
                  className={cn(
                    "relative group outline-none flex items-center w-full rounded-2xl transition-all duration-150",
                    isSettingsActive
                      ? "bg-gradient-to-r from-transparent via-slate-100 to-slate-200/90"
                      : isSettingsHovered
                      ? "bg-gradient-to-r from-transparent via-slate-50 to-slate-100/90"
                      : "hover:bg-gradient-to-r hover:from-transparent hover:via-slate-50 hover:to-slate-100/90"
                  )}
                >
                  <motion.div
                    animate={{ scale: isSettingsHovered ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-10 h-10 shrink-0 flex items-center justify-center"
                  >
                    <div className="w-7 h-7 [filter:brightness(0)]">
                      <LottieIcon path="/lottie/setting.json" playing={isSettingsHovered} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "whitespace-nowrap ml-4 transition-all duration-200 flex-1 flex items-center justify-between",
                      isSettingsActive ? "text-black font-bold" : "text-slate-800 font-medium"
                    )}
                    style={isSettingsActive ? { textShadow: "0 0 1px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.45), 0 0 18px rgba(0,0,0,0.2)" } : undefined}
                  >
                    <span>Cài đặt</span>
                  </motion.div>
                </button>
              </div>
            );
          })()}

          {/* User Avatar */}
          <div className="w-full flex flex-col">
            <div className="relative group flex items-center justify-between w-full rounded-2xl pr-2">
              <button
                onClick={() => onNavigate('profile')}
                className="relative outline-none flex items-center flex-1 rounded-2xl cursor-pointer"
                title="Hồ sơ cá nhân"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none group-hover:bg-white/5 transition-colors"
                />
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 group-hover:border-slate-300 transition-colors shadow-sm">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random&color=fff`}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isExpanded ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap ml-4 transition-colors duration-200 flex-1 flex flex-col items-start justify-center overflow-hidden text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser?.username || 'Admin'}
                  </span>
                  <span className="text-xs text-slate-500 leading-tight">
                    {currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role === 'admin' ? 'Quản trị viên' : isStaff ? 'Nhân viên vận hành' : currentUser?.role || 'User'}
                  </span>
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      useAuthStore.getState().logout();
                    }}
                    title="Đăng xuất"
                    className="w-8 h-8 ml-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors shadow-inner flex-shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
