'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  Package,
  ShoppingCart,
  Users,
  Search,
  StickyNote,
  Megaphone,
  Image as ImageIcon,
  Settings,
  LayoutDashboard,
  Layers,
  Warehouse,
  FileText,
  MessageSquareWarning,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LottieIcon } from '@/components/ui/LottieIcon';

// ─── Types ──────────────────────────────────────────────────────

interface SearchButtonProps {
  onNavigate?: (viewId: string) => void;
}

interface BreadcrumbNode {
  label: string;
  icon: React.ReactNode;
  viewId?: string;           // if set, clicking navigates here
  children?: BreadcrumbNode[];
  apiEndpoint?: string;       // fetch real data from this endpoint
  mapFn?: (item: any) => { label: string; description: string; viewId: string };
}

// ─── Navigation tree definition ─────────────────────────────────

const NAV_TREE: BreadcrumbNode[] = [
  {
    label: 'Tổng quan',
    icon: <LayoutDashboard size={16} />,
    viewId: 'dashboard',
  },
  {
    label: 'Lịch',
    icon: <Calendar size={16} />,
    children: [
      {
        label: 'Lịch kế hoạch',
        icon: <StickyNote size={16} />,
        viewId: 'planned',
        apiEndpoint: '/api/plans',
        mapFn: (p: any) => ({
          label: p.title || 'Sự kiện',
          description: `${p.date || ''} ${p.time || ''} ${p.location ? '• ' + p.location : ''}`.trim(),
          viewId: 'planned',
        }),
      },
    ],
  },
  {
    label: 'Sản phẩm',
    icon: <Package size={16} />,
    children: [
      {
        label: 'Danh sách',
        icon: <Package size={16} />,
        viewId: 'product-list',
        apiEndpoint: '/api/products',
        mapFn: (p: any) => ({
          label: p.name || 'Sản phẩm',
          description: `${p.brand || ''} ${p.variants?.[0]?.price ? '• ' + Number(p.variants[0].price).toLocaleString('vi-VN') + '₫' : ''}`.trim(),
          viewId: 'product-list',
        }),
      },
      {
        label: 'Kho hàng',
        icon: <Warehouse size={16} />,
        viewId: 'inventory',
      },
      {
        label: 'Danh mục & phân loại',
        icon: <Layers size={16} />,
        viewId: 'categories',
      },
    ],
  },
  {
    label: 'Đơn hàng',
    icon: <ShoppingCart size={16} />,
    children: [
      {
        label: 'Danh sách đơn hàng',
        icon: <ShoppingCart size={16} />,
        viewId: 'orders-list',
        apiEndpoint: '/api/orders',
        mapFn: (o: any) => ({
          label: `Đơn #${(o._id || o.id || '').slice(-6).toUpperCase()}`,
          description: `${o.customerName || o.shippingAddress?.fullName || 'Khách hàng'} • ${o.status || 'Đang xử lý'}`,
          viewId: 'orders-list',
        }),
      },
      {
        label: 'Đánh giá & Khiếu nại',
        icon: <MessageSquareWarning size={16} />,
        viewId: 'orders-disputes',
      },
      {
        label: 'Hóa đơn & Chứng từ',
        icon: <FileText size={16} />,
        viewId: 'orders-invoices',
      },
    ],
  },
  {
    label: 'CRM',
    icon: <Users size={16} />,
    children: [
      {
        label: 'Khách hàng tiềm năng',
        icon: <UserPlus size={16} />,
        viewId: 'crm-leads',
        apiEndpoint: '/api/leads',
        mapFn: (l: any) => ({
          label: l.name || l.fullName || 'Lead',
          description: `${l.email || ''} ${l.phone ? '• ' + l.phone : ''}`.trim(),
          viewId: 'crm-leads',
        }),
      },
      {
        label: 'Khách hàng',
        icon: <Users size={16} />,
        viewId: 'crm-customers',
        apiEndpoint: '/api/customers',
        mapFn: (c: any) => ({
          label: c.name || c.fullName || 'Khách hàng',
          description: `${c.email || ''} ${c.phone ? '• ' + c.phone : ''}`.trim(),
          viewId: 'crm-customers',
        }),
      },
    ],
  },
  {
    label: 'Marketing',
    icon: <Megaphone size={16} />,
    children: [
      {
        label: 'Chiến dịch marketing',
        icon: <Megaphone size={16} />,
        viewId: 'marketing',
        apiEndpoint: '/api/campaigns',
        mapFn: (c: any) => ({
          label: c.name || c.title || 'Chiến dịch',
          description: `${c.status || ''} ${c.startDate ? '• Bắt đầu: ' + c.startDate : ''}`.trim(),
          viewId: 'marketing',
        }),
      },
      {
        label: 'Quản lý Banner',
        icon: <ImageIcon size={16} />,
        viewId: 'banners',
        apiEndpoint: '/api/banners',
        mapFn: (b: any) => ({
          label: b.title || b.name || 'Banner',
          description: `${b.position || b.location || ''} ${b.isActive ? '• Đang hiển thị' : '• Ẩn'}`.trim(),
          viewId: 'banners',
        }),
      },
    ],
  },
  {
    label: 'Nhân sự',
    icon: <Users size={16} />,
    children: [
      {
        label: 'Quản trị viên',
        icon: <Users size={16} />,
        viewId: 'user-staff',
        apiEndpoint: '/api/users',
        mapFn: (u: any) => ({
          label: u.name || u.username || 'User',
          description: `${u.role || ''} ${u.email ? '• ' + u.email : ''}`.trim(),
          viewId: 'user-staff',
        }),
      },
    ],
  },
  {
    label: 'Cài đặt',
    icon: <Settings size={16} />,
    viewId: 'settings',
  },
];

// Lottie shortcut icons (the 4 floating buttons)
const SHORTCUT_ICONS: { label: string; lottiePath: string; treeIndex: number }[] = [
  { label: 'Tổng quan', lottiePath: '/lottie/dashboard.json', treeIndex: 0 },
  { label: 'Lịch', lottiePath: '/lottie/calendar.json', treeIndex: 1 },
  { label: 'Sản phẩm', lottiePath: '/lottie/product.json', treeIndex: 2 },
  { label: 'Đơn hàng', lottiePath: '/lottie/orders.json', treeIndex: 3 },
];

// ─── Component ──────────────────────────────────────────────────

export const SearchButton = ({ onNavigate }: SearchButtonProps) => {
  const [hovered, setHovered] = useState(false);
  const [hoveredShortcut, setHoveredShortcut] = useState<number | null>(null);

  // Breadcrumb path: array of nodes we drilled into
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbNode[]>([]);
  // Free-text filter typed after the breadcrumb prefix
  const [filterText, setFilterText] = useState('');
  // Data fetched from API for the deepest breadcrumb level
  const [apiData, setApiData] = useState<any[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the current "prefix" shown in the input
  const breadcrumbPrefix = breadcrumb.map(n => n.label).join(' / ');
  const displayValue = breadcrumbPrefix ? breadcrumbPrefix + ' / ' + filterText : filterText;

  // Which children are visible at the current breadcrumb level
  const currentNode = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;

  // Fetch API data when we land on a node that has an apiEndpoint
  useEffect(() => {
    if (!currentNode?.apiEndpoint) {
      setApiData([]);
      return;
    }
    setIsLoadingApi(true);
    fetch(`http://localhost:3001${currentNode.apiEndpoint}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setApiData(data);
        else setApiData([]);
      })
      .catch(() => setApiData([]))
      .finally(() => setIsLoadingApi(false));
  }, [currentNode?.apiEndpoint]);

  // Build dropdown items
  const dropdownItems = React.useMemo(() => {
    const items: { icon: React.ReactNode; label: string; description: string; action: () => void }[] = [];
    const q = filterText.toLowerCase();

    if (!currentNode) {
      // Level 0: show top-level tree items
      NAV_TREE.forEach(node => {
        if (q && !node.label.toLowerCase().includes(q)) return;
        items.push({
          icon: node.icon,
          label: node.label,
          description: node.children ? `${node.children.length} mục con` : 'Mở trang',
          action: () => {
            if (node.viewId && !node.children) {
              // Leaf node, navigate directly
              onNavigate?.(node.viewId);
              resetSearch();
            } else {
              // Drill down
              setBreadcrumb(prev => [...prev, node]);
              setFilterText('');
            }
          },
        });
      });
    } else if (currentNode.children && !currentNode.apiEndpoint) {
      // Show children (sub-categories)
      currentNode.children.forEach(child => {
        if (q && !child.label.toLowerCase().includes(q)) return;
        items.push({
          icon: child.icon,
          label: child.label,
          description: child.apiEndpoint ? 'Xem dữ liệu' : 'Mở trang',
          action: () => {
            if (child.viewId && !child.children && !child.apiEndpoint) {
              onNavigate?.(child.viewId);
              resetSearch();
            } else {
              setBreadcrumb(prev => [...prev, child]);
              setFilterText('');
            }
          },
        });
      });
    } else if (currentNode.apiEndpoint && currentNode.mapFn) {
      // Show API data
      const mapped = apiData.map(currentNode.mapFn);
      mapped.forEach(item => {
        if (q && !item.label.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return;
        items.push({
          icon: currentNode.icon,
          label: item.label,
          description: item.description,
          action: () => {
            onNavigate?.(item.viewId);
            resetSearch();
          },
        });
      });
    } else if (currentNode.children) {
      // Node has both children AND apiEndpoint (shouldn't happen but handle it)
      currentNode.children.forEach(child => {
        if (q && !child.label.toLowerCase().includes(q)) return;
        items.push({
          icon: child.icon,
          label: child.label,
          description: child.apiEndpoint ? 'Xem dữ liệu' : 'Mở trang',
          action: () => {
            setBreadcrumb(prev => [...prev, child]);
            setFilterText('');
          },
        });
      });
    }

    return items;
  }, [currentNode, filterText, apiData, onNavigate]);

  const isDropdownVisible = breadcrumb.length > 0 || filterText.length > 0;

  const resetSearch = useCallback(() => {
    setBreadcrumb([]);
    setFilterText('');
    setApiData([]);
    setHovered(false);
  }, []);

  const goBack = useCallback(() => {
    setBreadcrumb(prev => prev.slice(0, -1));
    setFilterText('');
    setApiData([]);
  }, []);

  // Handle input change: prevent user from erasing the breadcrumb prefix
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const prefixWithSlash = breadcrumbPrefix ? breadcrumbPrefix + ' / ' : '';
    if (raw.length < prefixWithSlash.length) {
      // User pressed backspace into the prefix — go back one level
      goBack();
      return;
    }
    setFilterText(raw.slice(prefixWithSlash.length));
  }, [breadcrumbPrefix, goBack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetSearch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetSearch]);

  // Handle shortcut button click
  const handleShortcutClick = useCallback((treeIndex: number) => {
    const node = NAV_TREE[treeIndex];
    if (!node) return;
    if (node.viewId && !node.children) {
      onNavigate?.(node.viewId);
      resetSearch();
    } else {
      setBreadcrumb([node]);
      setFilterText('');
      setHovered(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [onNavigate, resetSearch]);

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center"
      onMouseLeave={() => {
        if (!isDropdownVisible) {
          setHovered(false);
          setHoveredShortcut(null);
        }
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full flex items-center justify-end gap-2 z-20 group',
          '[&_svg]:size-4 [&_svg]:stroke-[1.4]',
          'max-w-3xl'
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            layoutId="search-input-container"
            transition={{ layout: { duration: 0.5, type: 'spring', bounce: 0.2 } }}
            style={{ transformOrigin: 'left center', borderRadius: 9999 }}
            className="w-full flex flex-col items-center justify-start z-10 relative overflow-hidden bg-[#222222] border border-white/10"
          >
            {/* Input row */}
            <div className="flex items-center w-full gap-2 px-4 h-10">
              {breadcrumb.length > 0 ? (
                <button onClick={goBack} className="shrink-0 text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <motion.div layoutId="search-icon"><Search size={16} /></motion.div>
              )}
              <div className="flex-1 relative text-sm flex items-center">
                {!displayValue && (
                  <div className="absolute inset-0 flex items-center pointer-events-none z-10 text-gray-500">
                    <span className="block truncate w-full">
                      {hoveredShortcut !== null ? SHORTCUT_ICONS[hoveredShortcut].label : 'Tìm kiếm sản phẩm, đơn hàng...'}
                    </span>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={displayValue}
                  onChange={handleInputChange}
                  onFocus={() => setHovered(true)}
                  className="w-full bg-transparent outline-none ring-0 border-none m-0 p-0 text-sm text-white truncate pr-4"
                />
              </div>
            </div>
          </motion.div>

          {/* ─── Dropdown ─── */}
          <AnimatePresence>
            {isDropdownVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 w-full pt-2 z-50"
              >
                <div className="w-full bg-[#222222] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[420px] overflow-y-auto custom-scrollbar">
                  {/* Breadcrumb trail */}
                  {breadcrumb.length > 0 && (
                    <div className="px-4 pt-3 pb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                      {breadcrumb.map((node, i) => (
                        <React.Fragment key={i}>
                          <button
                            onClick={() => {
                              setBreadcrumb(prev => prev.slice(0, i + 1));
                              setFilterText('');
                            }}
                            className="hover:text-white/60 transition-colors cursor-pointer"
                          >
                            {node.label}
                          </button>
                          {i < breadcrumb.length - 1 && <ChevronRight size={10} className="text-white/20" />}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Loading state */}
                  {isLoadingApi && (
                    <div className="px-4 py-6 text-center text-white/40 text-sm">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full mr-2"
                      />
                      Đang tải dữ liệu...
                    </div>
                  )}

                  {/* Results */}
                  {!isLoadingApi && dropdownItems.length === 0 && (
                    <div className="px-4 py-6 text-center text-white/40 text-sm">
                      {filterText ? `Không tìm thấy "${filterText}"` : 'Không có dữ liệu'}
                    </div>
                  )}

                  {!isLoadingApi && (
                    <div className="px-1.5 py-1.5">
                      {dropdownItems.map((item, i) => (
                        <motion.div
                          key={`item-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02, duration: 0.12 }}
                        >
                          <button
                            type="button"
                            onClick={item.action}
                            className="flex items-center text-white justify-start hover:bg-white/10 gap-3 py-2.5 px-3 rounded-xl transition-colors duration-200 w-full text-left group/card"
                          >
                            <div className="w-7 h-7 flex items-center justify-center shrink-0 text-white/50 group-hover/card:text-white/80 transition-colors">
                              {item.icon}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <p className="font-medium text-sm m-0 leading-tight truncate">{item.label}</p>
                              <p className="text-xs opacity-40 m-0 leading-tight truncate">{item.description}</p>
                            </div>
                            <ChevronRight className="size-4 opacity-0 group-hover/card:opacity-60 shrink-0 transition-opacity" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Shortcut floating buttons ─── */}
          {hovered && !isDropdownVisible &&
            SHORTCUT_ICONS.map((shortcut, index) => (
              <motion.div
                key={`shortcut-${index}`}
                onMouseEnter={() => setHoveredShortcut(index)}
                onMouseLeave={() => setHoveredShortcut(null)}
                layout
                initial={{ scale: 0.7, x: -1 * (44 * (index + 1)) }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0.7, x: -1 * (44 * (index + 1)) }}
                transition={{
                  duration: 0.8,
                  type: 'spring',
                  bounce: 0.2,
                  delay: index * 0.05,
                }}
                className="rounded-full cursor-pointer bg-white/5 border border-white/10 text-white shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => handleShortcutClick(index)}
                  className="rounded-full cursor-pointer hover:shadow-lg opacity-30 hover:opacity-100 transition-[opacity,shadow] duration-200"
                >
                  <div className="size-9 aspect-square flex items-center justify-center bg-transparent">
                    <LottieIcon
                      path={shortcut.lottiePath}
                      className="w-5 h-5"
                      autoplay={false}
                      playing={hoveredShortcut === index}
                    />
                  </div>
                </button>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Click-away overlay */}
      {isDropdownVisible && (
        <div className="fixed inset-0 z-[-1]" onClick={resetSearch} />
      )}
    </div>
  );
};
