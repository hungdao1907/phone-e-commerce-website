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
      const res = await fetch('http://localhost:3001/api/invoices', { headers: { 'Authorization': `Bearer ${token}` } });
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
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hóa đơn & Chứng từ</h1>
          <p className="text-sm text-white/50 mt-1">Quản lý hóa đơn được tự động sinh ra từ các đơn hàng đã hoàn thành.</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Tìm theo mã HĐ, mã đơn, tên khách..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30" />
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider shrink-0">
          <div className="col-span-2 pl-2">Mã Hóa Đơn</div>
          <div className="col-span-2">Mã Đơn Hàng</div>
          <div className="col-span-3">Khách Hàng</div>
          <div className="col-span-2">Ngày Phát Hành</div>
          <div className="col-span-2 text-right">Tổng Tiền</div>
          <div className="col-span-1 text-center">In</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/40">
              <FileText className="w-10 h-10 text-white/15 mb-3" />
              <p>Không có hóa đơn nào</p>
            </div>
          ) : (
            filteredInvoices.map((inv, index) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(inv)}
              >
                <div className="col-span-2 font-mono text-sm font-medium text-emerald-400 pl-2">{inv.invoiceCode}</div>
                <div className="col-span-2 font-mono text-sm text-white/60">{inv.order.orderCode}</div>
                <div className="col-span-3 font-medium text-white truncate">{inv.order.customer.fullName}</div>
                <div className="col-span-2 text-sm text-white/80">{formatDate(inv.issuedAt)}</div>
                <div className="col-span-2 text-right font-bold text-white">{formatCurrency(inv.total)}</div>
                <div className="col-span-1 flex justify-center">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); window.print(); }}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-gray-100 border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <FileText className="w-5 h-5 text-gray-500" /> Bản xem trước Hóa đơn
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <Printer className="w-4 h-4" /> In hóa đơn
                  </button>
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Đóng</button>
                </div>
              </div>

              {/* Mẫu Hóa Đơn A4 mô phỏng */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-8 custom-scrollbar">
                <div className="bg-white p-10 max-w-2xl mx-auto shadow-sm border border-gray-200 min-h-[800px] text-gray-800" id="print-area">
                  
                  {/* Tiêu đề */}
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter text-black mb-1">INVOICE</h1>
                      <p className="text-sm text-gray-500">Mã HĐ: <strong className="text-black font-mono">{selectedInvoice.invoiceCode}</strong></p>
                      <p className="text-sm text-gray-500">Ngày lập: {formatDate(selectedInvoice.issuedAt)}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-bold text-black mb-1">HM STORE</h2>
                      <p className="text-sm text-gray-600">123 Apple Street, Cupertino, CA</p>
                      <p className="text-sm text-gray-600">hello@hmstore.com | 1900 1234</p>
                    </div>
                  </div>

                  {/* Thông tin khách hàng & Đơn hàng */}
                  <div className="flex justify-between mb-10 pb-6 border-b border-gray-200">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin khách hàng</h3>
                      <p className="font-bold text-black text-lg mb-1">{selectedInvoice.order.customer.fullName}</p>
                      <p className="text-sm text-gray-600 mb-1">{selectedInvoice.order.shippingPhone}</p>
                      <p className="text-sm text-gray-600 max-w-[250px]">{selectedInvoice.order.shippingAddress}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Chi tiết thanh toán</h3>
                      <p className="text-sm text-gray-600 mb-1">Mã đơn hàng: <strong className="text-black font-mono">{selectedInvoice.order.orderCode}</strong></p>
                      <p className="text-sm text-gray-600 mb-1">PTTT: {selectedInvoice.order.paymentMethod.toUpperCase()}</p>
                      <p className="text-sm text-emerald-600 font-medium">Đã thanh toán</p>
                    </div>
                  </div>

                  {/* Bảng sản phẩm */}
                  <table className="w-full mb-10 text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider w-1/2">Sản phẩm</th>
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-center">SL</th>
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-right">Đơn giá</th>
                        <th className="py-3 px-2 font-bold text-xs uppercase tracking-wider text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.order.items.map((item: any, i: number) => (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="py-4 px-2">
                            <p className="font-semibold text-black">{item.productName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.variantInfo}</p>
                          </td>
                          <td className="py-4 px-2 text-center text-sm">{item.quantity}</td>
                          <td className="py-4 px-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-4 px-2 text-right text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Tổng kết */}
                  <div className="flex justify-end">
                    <div className="w-72">
                      <div className="flex justify-between py-2 text-sm text-gray-600">
                        <span>Tạm tính:</span>
                        <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-gray-600">
                        <span>Phí vận chuyển:</span>
                        <span>{formatCurrency(selectedInvoice.shippingFee)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
                        <span>Thuế VAT:</span>
                        <span>{formatCurrency(selectedInvoice.tax)}</span>
                      </div>
                      <div className="flex justify-between py-4 text-xl font-bold text-black">
                        <span>Tổng cộng:</span>
                        <span>{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-20 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
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
