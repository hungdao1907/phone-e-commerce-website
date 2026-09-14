import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Truck, CheckCircle2, Clock, 
  Package, Calendar as CalendarIcon, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationMap } from '@/components/ui/ExpandMap';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '@/store/authStore';

// Custom icons using HTML
const createCustomIcon = (isActive: boolean, isDelivered: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-xl transition-colors duration-300 ${
        isDelivered ? 'bg-white/10 border-white/20 text-white/50' :
        isActive ? 'bg-emerald-500 border-white text-black' :
        'bg-blue-500 border-white/50 text-white'
      }">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isActive ? '' : 'rotate-45'}"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        ${!isDelivered && !isActive ? '<span class="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-blue-400 animate-ping opacity-75"></span>' : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// --- Types ---
type DeliveryStatus = 'preparing' | 'en_route' | 'delivered';

type DeliveryOrder = {
  id: string;
  orderCode: string;
  customer: string;
  address: string;
  phone: string;
  status: DeliveryStatus;
  driver: string;
  driverAvatar: string;
  time: string;
  coord: [number, number];
  estimatedDelivery?: string;
  items: any[];
};

// Default coord for HCM
const DEFAULT_COORD: [number, number] = [10.7769, 106.7009];

function MapUpdater({ activeOrder, orders }: { activeOrder: string | null; orders: DeliveryOrder[] }) {
  const map = useMap();
  useEffect(() => {
    if (activeOrder) {
      const order = orders.find(d => d.id === activeOrder);
      if (order) {
        map.flyTo(order.coord, 15, { duration: 1.5 });
      }
    } else {
      map.flyTo(DEFAULT_COORD, 11, { duration: 1.5 });
    }
  }, [activeOrder, map, orders]);
  return null;
}

// Geocode address using Nominatim (free)
const geocodeAddress = async (address: string): Promise<[number, number]> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Vietnam')}&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) { console.error('Geocode error:', e); }
  // Return random offset around HCM if geocode fails
  return [10.7769 + (Math.random() - 0.5) * 0.05, 106.7009 + (Math.random() - 0.5) * 0.05];
};

export function Delivery() {
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'shipping' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuthStore();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3001/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const allOrders = await res.json();

      // Only get shipping + delivered orders for the delivery view
      const relevantOrders = allOrders.filter((o: any) =>
        o.status === 'shipping' || o.status === 'delivered' || o.status === 'pending'
      );

      // Geocode all addresses in parallel
      const mapped: DeliveryOrder[] = await Promise.all(
        relevantOrders.map(async (o: any) => {
          const coord = await geocodeAddress(o.shippingAddress || '');
          const statusMap: Record<string, DeliveryStatus> = {
            'pending': 'preparing',
            'shipping': 'en_route',
            'delivered': 'delivered',
            'completed': 'delivered',
          };

          // Generate stable dummy shipper info based on order ID last char
          const dummyShippers = [
            { name: 'Nguyễn Văn Tuấn (GHN)', avatar: 'Tuan' },
            { name: 'Giao Hàng Nhanh', avatar: 'GHN' },
            { name: 'Lê Hùng (GrabExpress)', avatar: 'Hung' },
            { name: 'Đội xe nội bộ', avatar: 'Apple' },
            { name: 'Mai Phương (Ahamove)', avatar: 'Phuong' }
          ];
          const shipperIndex = o.id ? parseInt(o.id.slice(-1), 16) % dummyShippers.length : 0;
          const shipper = dummyShippers[shipperIndex];

          return {
            id: o.id,
            orderCode: o.orderCode || o.id.slice(0, 8),
            customer: o.customer?.fullName || 'Khách hàng',
            address: o.shippingAddress || 'Chưa có địa chỉ',
            phone: o.shippingPhone || '',
            status: statusMap[o.status] || 'preparing',
            driver: shipper.name,
            driverAvatar: `https://ui-avatars.com/api/?name=${shipper.avatar}&background=random`,
            time: new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            coord,
            estimatedDelivery: o.estimatedDelivery,
            items: o.items || [],
          };
        })
      );
      setOrders(mapped);
    } catch (error) {
      console.error('Fetch delivery error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCompleteDelivery = async (orderId: string) => {
    if (!confirm('Xác nhận đã giao đơn hàng này thành công?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'delivered' })
      });
      if (res.ok) {
        setActiveOrder(null);
        setExpandedId(null);
        fetchOrders();
      }
    } catch (error) { alert('Lỗi cập nhật trạng thái'); }
  };

  // Filter & Search
  const filteredOrders = orders.filter(o => {
    const matchFilter = filter === 'all' || 
      (filter === 'shipping' && o.status === 'en_route') || 
      (filter === 'delivered' && o.status === 'delivered');
    const matchSearch = !searchQuery || 
      o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const enRouteCount = orders.filter(d => d.status === 'en_route').length;
  const deliveredCount = orders.filter(d => d.status === 'delivered').length;
  const preparingCount = orders.filter(d => d.status === 'preparing').length;

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch Giao Hàng</h1>
          <p className="text-sm text-white/50 mt-1">Điều phối và theo dõi hành trình đơn hàng trên bản đồ thời gian thực.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-sm font-medium">
            <button className="text-white/40 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-emerald-400" /> Hôm nay ({new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })})</span>
            <button className="text-white/40 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* SPLIT PANE CONTAINER */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* LEFT PANE: INTERACTIVE REAL MAP (65%) */}
        <div className="w-[65%] flex flex-col bg-black/60 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl map-container-custom z-0">
          
          {isLoading ? (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
            </div>
          ) : null}

          <MapContainer 
            center={DEFAULT_COORD} 
            zoom={11} 
            scrollWheelZoom={true} 
            className="w-full h-full absolute inset-0 z-0 bg-transparent"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            
            <MapUpdater activeOrder={activeOrder} orders={filteredOrders} />

            {filteredOrders.map(order => {
              const isActive = activeOrder === order.id;
              const isDelivered = order.status === 'delivered';
              
              return (
                <Marker 
                  key={order.id} 
                  position={order.coord}
                  icon={createCustomIcon(isActive, isDelivered)}
                  eventHandlers={{
                    click: () => setActiveOrder(isActive ? null : order.id)
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="flex flex-col gap-1 p-1">
                      <p className="font-bold text-sm text-black">{order.orderCode}</p>
                      <p className="text-xs text-black/70">{order.customer}</p>
                      <p className="text-xs text-black/50">{order.address}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wider font-bold text-emerald-600">
                        <Truck className="w-3 h-3" /> {order.driver}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Stats Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] flex gap-2">
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80">{enRouteCount} đang giao</span>
            </div>
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-white/80">{deliveredCount} hoàn thành</span>
            </div>
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-xs font-medium text-white/80">{preparingCount} chuẩn bị</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: DELIVERY QUEUE (35%) */}
        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden shrink-0 transform-gpu will-change-transform">
          
          {/* Queue Header */}
          <div className="p-5 border-b border-white/10 bg-black/20 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setFilter('all')} className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors", filter === 'all' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5')}>
                Tất cả ({orders.length})
              </button>
              <button onClick={() => setFilter('shipping')} className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors", filter === 'shipping' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5')}>
                Đang giao ({enRouteCount})
              </button>
              <button onClick={() => setFilter('delivered')} className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors", filter === 'delivered' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5')}>
                Hoàn thành ({deliveredCount})
              </button>
            </div>
          </div>
          
          {/* Order List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/40">
                <Package className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-sm">Không có đơn hàng nào</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredOrders.map((order, idx) => {
                  const isActive = activeOrder === order.id;
                  const isEnRoute = order.status === 'en_route';
                  const isDelivered = order.status === 'delivered';

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setActiveOrder(isActive ? null : order.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group shrink-0",
                        expandedId && expandedId !== order.id ? "opacity-30 scale-[0.98]" : "",
                        isActive ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : 
                        isDelivered ? "bg-white/5 border-white/5 opacity-60 hover:opacity-100" :
                        "bg-black/20 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {/* Active Indicator Line */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            {order.orderCode}
                            {isEnRoute && <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>}
                          </h4>
                          <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {order.time}
                          </p>
                        </div>
                        
                        <div className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          isDelivered ? "bg-white/5 text-white/50 border-white/10" :
                          isEnRoute ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        )}>
                          {isDelivered ? 'Hoàn thành' : isEnRoute ? 'Đang giao' : 'Đóng gói'}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mb-4">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isDelivered ? "bg-white/10 text-white/40" : "bg-white/10 text-emerald-400"
                        )}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-white/90 font-medium">{order.customer}</span>
                          <span className="text-xs text-white/50 mt-0.5 line-clamp-1">{order.address}</span>
                        </div>
                      </div>

                      {/* Driver Info & Actions */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={order.driverAvatar} alt={order.driver} className="w-6 h-6 rounded-full grayscale opacity-80" />
                          <span className="text-xs text-white/60 font-medium truncate max-w-[100px]">{order.driver}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isEnRoute && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteDelivery(order.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 hover:text-white transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Đã giao
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === order.id ? null : order.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-white transition-colors"
                          >
                            Địa chỉ
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Map */}
                      <AnimatePresence>
                        {expandedId === order.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 mt-2"
                          >
                            <LocationMap 
                              location={order.customer} 
                              address={order.address} 
                              coord={order.coord}
                              autoExpand={true} 
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

