import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { FileText, Download, Printer, Search, MapPin, Phone, User, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/invoices`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setInvoices(await res.json());
    } catch (error) { console.error(error); } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceCode.toLowerCase().includes(search.toLowerCase()) ||
    inv.order.orderCode.toLowerCase().includes(search.toLowerCase()) ||
    inv.order.customer.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6 text-slate-900 w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hóa đơn & Chứng từ</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý hóa đơn được tự động sinh ra từ các đơn hàng đã hoàn thành.</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ, mã đơn, tên khách..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm outline-none focus:border-slate-400 shadow-sm transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          <div className="col-span-2 pl-2">Mã Hóa Đơn</div>
          <div className="col-span-2">Mã Đơn Hàng</div>
          <div className="col-span-3">Khách Hàng</div>
          <div className="col-span-2">Ngày Phát Hành</div>
          <div className="col-span-2 text-right">Tổng Tiền</div>
          <div className="col-span-1 text-center">In</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <FileText className="w-10 h-10 text-slate-300 mb-3" />
              <p>Không có hóa đơn nào</p>
            </div>
          ) : (
            filteredInvoices.map((inv, index) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(inv)}
              >
                <div className="col-span-2 font-mono text-sm font-semibold text-emerald-600 pl-2">{inv.invoiceCode}</div>
                <div className="col-span-2 font-mono text-sm text-slate-500">{inv.order.orderCode}</div>
                <div className="col-span-3 font-medium text-slate-900 truncate">{inv.order.customer.fullName}</div>
                <div className="col-span-2 text-sm text-slate-600">{formatDate(inv.issuedAt)}</div>
                <div className="col-span-2 text-right font-bold text-slate-900">{formatCurrency(inv.total)}</div>
                <div className="col-span-1 flex justify-center">
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); window.print(); }}>
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* INVOICE MODAL (Preview) */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <FileText className="w-5 h-5 text-slate-500" /> Bản xem trước Hóa đơn
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                    <Printer className="w-4 h-4" /> In hóa đơn
                  </button>
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Đóng</button>
                </div>
              </div>

              {/* Mẫu Hóa Đơn A4 mô phỏng */}
              <div className="flex-1 overflow-y-auto bg-slate-100 p-8 custom-scrollbar">
                <div className="bg-white p-10 max-w-2xl mx-auto shadow-sm border border-slate-200 min-h-[800px] text-slate-800 rounded-xl" id="print-area">
                  
                  {/* Tiêu đề */}
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">INVOICE</h1>
                      <p className="text-sm text-slate-500">Mã HĐ: <strong className="text-slate-900 font-mono">{selectedInvoice.invoiceCode}</strong></p>
                      <p className="text-sm text-slate-500">Ngày lập: {formatDate(selectedInvoice.issuedAt)}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-bold text-slate-900 mb-1">HM STORE</h2>
                      <p className="text-sm text-slate-600">123 Apple Street, Cupertino, CA</p>
                      <p className="text-sm text-slate-600">hello@hmstore.com | 1900 1234</p>
                    </div>
                  </div>

                  {/* Thông tin khách hàng & Đơn hàng */}
                  <div className="flex justify-between mb-10 pb-6 border-b border-slate-200">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Thông tin khách hàng</h3>
                      <p className="font-bold text-slate-900 text-lg mb-1">{selectedInvoice.order.customer.fullName}</p>
                      <p className="text-sm text-slate-600 mb-1">{selectedInvoice.order.shippingPhone}</p>
                      <p className="text-sm text-slate-600 max-w-[250px]">{selectedInvoice.order.shippingAddress}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Chi tiết thanh toán</h3>
                      <p className="text-sm text-slate-600 mb-1">Mã đơn hàng: <strong className="text-slate-900 font-mono">{selectedInvoice.order.orderCode}</strong></p>
                      <p className="text-sm text-slate-600 mb-1">PTTT: {selectedInvoice.order.paymentMethod.toUpperCase()}</p>
                      <p className="text-sm text-emerald-600 font-medium">Đã thanh toán</p>
                    </div>
                  </div>

                  {/* Bảng sản phẩm */}
                  <table className="w-full mb-10 text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-1/2 text-slate-900">Sản phẩm</th>
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-center text-slate-900">SL</th>
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-right text-slate-900">Đơn giá</th>
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-right text-slate-900">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.order.items.map((item: any, i: number) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-4 px-2">
                            <p className="font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.variantInfo}</p>
                          </td>
                          <td className="py-4 px-2 text-center text-sm text-slate-700">{item.quantity}</td>
                          <td className="py-4 px-2 text-right text-sm text-slate-700">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-4 px-2 text-right text-sm font-semibold text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Tổng kết */}
                  <div className="flex justify-end">
                    <div className="w-72">
                      <div className="flex justify-between py-2 text-sm text-slate-600">
                        <span>Tạm tính:</span>
                        <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-slate-600">
                        <span>Phí vận chuyển:</span>
                        <span>{formatCurrency(selectedInvoice.shippingFee)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-200">
                        <span>Thuế VAT:</span>
                        <span>{formatCurrency(selectedInvoice.tax)}</span>
                      </div>
                      <div className="flex justify-between py-4 text-xl font-bold text-slate-900">
                        <span>Tổng cộng:</span>
                        <span>{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-20 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
                    <p>Cảm ơn quý khách đã mua sắm tại HM Store!</p>
                    <p className="mt-1 text-xs">Hóa đơn này được tạo tự động bởi hệ thống.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
