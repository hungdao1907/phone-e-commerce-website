import React from 'react';
import { DollarSign, ShoppingCart, Package, Wallet, LayoutDashboard, Boxes, Users, Settings } from 'lucide-react';
import './vision-dashboard.css';

/** Thay các mảng mặc định bằng dữ liệu thật từ API/store của bạn qua props. */
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

interface Props {
  adminName?: string;
  stats?: { revenue: number; orders: number; pending: number; products: number; lowStock: number; aov: number; revenueDelta: number };
  categories?: { name: string; value: number; color: string }[];
  topProducts?: { name: string; sold: number; revenue: number }[];
  pendingOrders?: { id: string; customer: string; product: string; total: number; ago: string }[];
  schedule?: { title: string; when: string; place: string }[];
  notice?: { title: string; body: string };
}

export default function VisionDashboard({
  adminName = 'superadmin',
  stats = { revenue: 0, orders: 0, pending: 22, products: 1294, lowStock: 129, aov: 0, revenueDelta: -100 },
  categories = [
    { name: 'Điện thoại', value: 214172000, color: '#0075FF' },
    { name: 'Laptop', value: 118890000, color: '#2CD9FF' },
    { name: 'Máy tính bảng', value: 104980000, color: '#4318FF' },
  ],
  topProducts = [
    { name: 'MacBook Pro M5 Max 16 inch 2026', sold: 1, revenue: 118890000 },
    { name: 'iPad Pro chip M5 13 inch 5G 2TB', sold: 2, revenue: 104980000 },
    { name: 'iPhone 16', sold: 3, revenue: 79170000 },
    { name: 'iPhone 17 PRO MAX', sold: 2, revenue: 75000000 },
  ],
  pendingOrders = [
    { id: 'DH20260930002', customer: 'test', product: 'iphone test - Đen · 64GB × 2', total: 2000, ago: '5 ngày trước' },
    { id: 'DH20260929012', customer: 'Đào Anh Hùng', product: 'iphone test - Đen · 64GB × 2', total: 2000, ago: '6 ngày trước' },
  ],
  schedule = [
    { title: 'Sắp xếp quầy trưng bày', when: 'Thứ 5, 13/08 · 17:00', place: 'Chi nhánh cơ sở quận 1' },
    { title: 'Họp team marketing', when: 'Thứ 6, 14/08 · 07:00', place: 'Zoom Meeting' },
  ],
  notice = { title: 'Thanh toán tự động thành công', body: 'Đơn DH20261003001 đã nhận thanh toán chuyển khoản 54.000đ.' },
}: Props) {
  const total = categories.reduce((s, c) => s + c.value, 0) || 1;
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  const maxRev = Math.max(...topProducts.map(p => p.revenue), 1);

  const statCards = [
    { label: 'Doanh thu thuần', value: fmt(stats.revenue), icon: <DollarSign size={20} />, delta: stats.revenueDelta },
    { label: 'Đơn hàng', value: String(stats.orders), icon: <ShoppingCart size={20} />, badge: `${stats.pending} chờ duyệt` },
    { label: 'Sản phẩm', value: stats.products.toLocaleString('en-US'), icon: <Package size={20} />, badge: `${stats.lowStock} sắp hết` },
    { label: 'AOV', value: fmt(stats.aov), icon: <Wallet size={20} /> },
  ];

  return (
    <div className="vd">
      <nav className="vd-side" aria-label="Điều hướng">
        {[LayoutDashboard, Boxes, ShoppingCart, Users, Settings].map((Icon, i) => (
          <button key={i} className={i === 0 ? 'on' : ''} aria-label={`Menu ${i + 1}`}><Icon size={20} /></button>
        ))}
      </nav>

      <main className="vd-main">
        <p className="vd-label" style={{ marginBottom: 12 }}>Chào mừng trở lại, <b style={{ color: '#fff' }}>{adminName}</b></p>

        <section className="vd-grid-stats">
          {statCards.map(s => (
            <div key={s.label} className="vd-card">
              <div className="vd-row">
                <div>
                  <div className="vd-label">{s.label}</div>
                  <div className="vd-value">{s.value}
                    {s.delta !== undefined && <small className={s.delta < 0 ? 'vd-down' : 'vd-up'} style={{ fontSize: 13, marginLeft: 8 }}>{s.delta > 0 ? '+' : ''}{s.delta}%</small>}
                  </div>
                </div>
                <div className="vd-icon">{s.icon}</div>
              </div>
              {s.badge && <span className="vd-badge" style={{ display: 'inline-block', marginTop: 12 }}>{s.badge}</span>}
            </div>
          ))}
        </section>

        <section className="vd-grid-main">
          <div className="vd-card">
            <h3 style={{ margin: 0 }}>Doanh thu theo danh mục</h3>
            <p className="vd-label">Tổng {fmt(total)}</p>
            <div className="vd-row" style={{ flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 16 }}>
              <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Biểu đồ doanh thu theo danh mục">
                <g transform="rotate(-90 90 90)">
                  {categories.map(c => {
                    const len = (c.value / total) * C;
                    const el = <circle key={c.name} cx="90" cy="90" r={R} fill="none" stroke={c.color} strokeWidth="16"
                      strokeDasharray={`${Math.max(len - 4, 0)} ${C}`} strokeDashoffset={-offset} strokeLinecap="round" />;
                    offset += len; return el;
                  })}
                </g>
                <text x="90" y="92" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">{Math.round(total / 1e6)}tr</text>
                <text x="90" y="110" textAnchor="middle" fill="#A0AEC0" fontSize="11">Tổng doanh thu</text>
              </svg>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, minWidth: 220 }}>
                {categories.map(c => (
                  <li key={c.name} className="vd-row" style={{ padding: '8px 0' }}>
                    <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 99, background: c.color, marginRight: 8 }} />{c.name}</span>
                    <b>{fmt(c.value)}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="vd-card">
            <h3 style={{ margin: '0 0 12px' }}>Top sản phẩm</h3>
            {topProducts.map(p => (
              <div key={p.name} style={{ marginBottom: 16 }}>
                <div className="vd-row"><span>{p.name}</span><span className="vd-label">{p.sold} đã bán</span></div>
                <div className="vd-bar"><i style={{ width: `${(p.revenue / maxRev) * 100}%` }} /></div>
                <div className="vd-label" style={{ marginTop: 4 }}>{fmt(p.revenue)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="vd-grid-bottom">
          <div className="vd-card">
            <div className="vd-row"><h3 style={{ margin: 0 }}>Đơn hàng chờ xác nhận</h3><span className="vd-badge">{stats.pending}</span></div>
            <div style={{ marginTop: 12 }}>
              {pendingOrders.map(o => (
                <div key={o.id} className="vd-table-row">
                  <div className="vd-row" style={{ justifyContent: 'flex-start' }}>
                    <div className="vd-avatar">{o.customer.slice(0, 2).toUpperCase()}</div>
                    <div><div>{o.customer}</div><div className="vd-label">{o.id}</div></div>
                  </div>
                  <span className="vd-label">{o.product}</span>
                  <div style={{ textAlign: 'right' }}><b>{fmt(o.total)}</b><div className="vd-label">{o.ago}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div className="vd-card">
              <div className="vd-notice"><b>{notice.title}</b><div className="vd-label" style={{ marginTop: 4 }}>{notice.body}</div></div>
            </div>
            <div className="vd-card">
              <h3 style={{ margin: '0 0 12px' }}>Lịch kế hoạch</h3>
              {schedule.map(s => (
                <div key={s.title} className="vd-inner" style={{ marginBottom: 10 }}>
                  <b>{s.title}</b>
                  <div className="vd-label">{s.when} · {s.place}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
