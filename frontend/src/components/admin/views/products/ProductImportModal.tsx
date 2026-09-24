import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

export function ProductImportModal({ isOpen, onClose, onSuccess, token }: ProductImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setError(null);
  };

  const handleClose = () => {
    if (step === 'importing') return;
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const downloadTemplate = () => {
    // Generate a template with new array structure using '|'
    const headers = [
      "Product Name", "Category", "Brand", "Description", "Base Price",
      "Storage", "Storage Price", "Storage Sale Price",
      "Color", "Color Code", "Color Image URL",
      "RAM", "SSD",
      "Product Image URL", "Gallery Image URLs", "Status",
      "Screen", "CPU", "GPU", "Camera", "Battery", "OS", "Resolution"
    ];
    
    // Example: iPhone 17 Pro Max
    // Storage: 256GB, 512GB
    // Color: Đen, Bạc
    const demoRow1 = [
      "iPhone 17 Pro Max", "Điện thoại", "Apple", "Siêu phẩm Apple", "34990000",
      "256GB|512GB", "34990000|37990000", "32990000|35990000",
      "Đen|Bạc", "#1c1c1e|#e5e5e5", "black.jpg|silver.jpg",
      "", "",
      "https://example.com/ip17pm.jpg", "", "active",
      "6.9 inch", "A19 Pro", "", "48MP", "4800mAh", "iOS 18", ""
    ];

    // Example: Laptop
    const demoRow2 = [
      "MacBook Pro 16", "Laptop", "Apple", "Laptop cao cấp", "50000000",
      "", "", "",
      "Space Gray|Silver", "#555555|#cccccc", "space.jpg|silver.jpg",
      "32GB|64GB", "1TB|2TB",
      "https://example.com/mac.jpg", "", "active",
      "16 inch", "M3 Max", "M3 Max GPU", "1080p", "100Wh", "macOS", "3456x2234"
    ];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + demoRow1.join(",") + "\n"
      + demoRow2.join(",");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Import_Template_Auto_Variant.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async () => {
    if (!file) return;
    try {
      setStep('importing');
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/import/preview`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setPreviewData(data);
        setStep('preview');
      } else {
        setError(data.message || 'Lỗi khi đọc file Excel.');
        setStep('upload');
      }
    } catch (err: any) {
      setError('Lỗi kết nối server: ' + err.message);
      setStep('upload');
    }
  };

  const handleVariantChange = (prodIndex: number, varIndex: number, field: string, value: string) => {
    const newData = { ...previewData };
    const numericValue = parseInt(value.replace(/\D/g, ''), 10);
    newData.groupedProducts[prodIndex].variants[varIndex][field] = isNaN(numericValue) && value !== '' ? 0 : numericValue;
    setPreviewData(newData);
  };

  const handleConfirm = async () => {
    if (!previewData || !previewData.groupedProducts) return;
    try {
      setStep('importing');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/import/confirm`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ groupedProducts: previewData.groupedProducts })
      });
      
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        setStep('result');
        onSuccess();
      } else {
        setError(data.message || 'Lỗi khi lưu dữ liệu.');
        setStep('preview');
      }
    } catch (err: any) {
      setError('Lỗi kết nối server: ' + err.message);
      setStep('preview');
    }
  };

  // Calculate totals for preview summary
  const totalGeneratedVariants = previewData?.groupedProducts?.reduce((acc: number, p: any) => acc + (p.variants?.length || 0), 0) || 0;
  const hasErrors = previewData?.errorRows > 0 || previewData?.groupedProducts?.some((p: any) => p.error);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <h2 className="text-xl font-bold text-white">Import Sản phẩm từ Excel</h2>
              <button
                onClick={handleClose}
                disabled={step === 'importing'}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {step === 'upload' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">File mẫu (Template Tự Động Sinh Variant)</h3>
                        <p className="text-xs text-white/50 mt-0.5">Sử dụng dấu | để khai báo nhiều thuộc tính trên 1 dòng</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Tải File Mẫu
                    </button>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors",
                      file ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/20 hover:border-white/40 hover:bg-white/5"
                    )}
                  >
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Upload className={cn("w-8 h-8", file ? "text-emerald-400" : "text-white/50")} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-medium text-white mb-1">
                        {file ? file.name : "Kéo thả file hoặc nhấn để chọn"}
                      </h3>
                      <p className="text-sm text-white/50">
                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Hỗ trợ .xlsx, .xls, .csv"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handlePreview}
                      disabled={!file}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Tiếp tục (Preview)
                    </button>
                  </div>
                </div>
              )}

              {step === 'preview' && previewData && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{previewData.totalRows}</div>
                      <div className="text-xs text-white/50 mt-1">Sản phẩm (Dòng)</div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">{totalGeneratedVariants}</div>
                      <div className="text-xs text-white/50 mt-1">Variants được sinh ra</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{previewData.validRows}</div>
                      <div className="text-xs text-white/50 mt-1">Dòng hợp lệ</div>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <div className="text-2xl font-bold text-red-400">{previewData.errorRows}</div>
                      <div className="text-xs text-white/50 mt-1">Dòng bị lỗi</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {previewData.groupedProducts.map((prod: any, prodIndex: number) => (
                      <div key={prod.key} className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
                        <div className="p-4 bg-white/5 flex items-center justify-between border-b border-white/10">
                          <div>
                            <h3 className="font-bold text-white text-lg">{prod.name}</h3>
                            <p className="text-xs text-white/50 mt-0.5">Category: {prod.categorySlug || 'N/A'} | Brand: {prod.brand}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-blue-400">{prod.variants?.length || 0} Variants</span>
                          </div>
                        </div>

                        {prod.error ? (
                          <div className="p-4 bg-red-500/10 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 inline-block mr-2" />
                            {prod.error}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-white/10 bg-white/5 text-white/50">
                                  <th className="p-3 font-medium whitespace-nowrap">SKU</th>
                                  <th className="p-3 font-medium">Thuộc tính</th>
                                  <th className="p-3 font-medium w-32">Giá (VND)</th>
                                  <th className="p-3 font-medium w-32">Giá KM (VND)</th>
                                  <th className="p-3 font-medium w-24">Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prod.variants.map((v: any, varIndex: number) => (
                                  <tr key={v.sku} className="border-b border-white/5 hover:bg-white/5 last:border-0">
                                    <td className="p-3 text-white/80 font-mono text-xs">{v.sku}</td>
                                    <td className="p-3 text-white">
                                      <div className="flex flex-wrap gap-1">
                                        {Object.entries(v.attributes).map(([k, val]) => (
                                          <span key={k} className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/70">
                                            {String(val)}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        value={v.price ? v.price.toLocaleString('vi-VN') : ''}
                                        onChange={(e) => handleVariantChange(prodIndex, varIndex, 'price', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-emerald-500"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        value={v.salePrice ? v.salePrice.toLocaleString('vi-VN') : ''}
                                        onChange={(e) => handleVariantChange(prodIndex, varIndex, 'salePrice', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-emerald-500"
                                        placeholder="Trống"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        value={v.stock}
                                        onChange={(e) => handleVariantChange(prodIndex, varIndex, 'stock', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-emerald-500"
                                        min="0"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setStep('upload')}
                      className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={hasErrors || previewData.validRows === 0}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Xác nhận Import ({previewData.validRows} SP / {totalGeneratedVariants} Variants)
                    </button>
                  </div>
                </div>
              )}

              {step === 'importing' && (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-2">Đang xử lý dữ liệu...</h3>
                    <p className="text-sm text-white/50">Hệ thống đang tải ảnh và lưu vào database.<br/>Vui lòng không đóng cửa sổ này.</p>
                  </div>
                </div>
              )}

              {step === 'result' && importResult && (
                <div className="flex flex-col items-center py-10 gap-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Import Thành Công</h3>
                    <p className="text-white/70">Quá trình nhập liệu đã hoàn tất.</p>
                  </div>

                  <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Sản phẩm tạo mới:</span>
                      <span className="text-white font-bold">{importResult.productsCreated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Phiên bản (Variants) tạo mới:</span>
                      <span className="text-white font-bold">{importResult.variantsCreated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Ảnh đã tải về:</span>
                      <span className="text-emerald-400 font-bold">{importResult.imagesDownloaded}</span>
                    </div>
                    {importResult.errors?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <span className="text-red-400 font-medium mb-2 block">Lỗi trong quá trình import ({importResult.errors.length}):</span>
                        <div className="max-h-32 overflow-y-auto text-xs text-red-400/80 bg-red-500/10 p-3 rounded">
                          {importResult.errors.map((e: string, i: number) => <div key={i} className="mb-1">{e}</div>)}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleClose}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
