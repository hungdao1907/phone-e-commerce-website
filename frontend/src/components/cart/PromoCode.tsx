import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

interface PromoCodeProps {
  onApply: (code: string) => Promise<void>;
  onRemove: () => void;
  appliedCode: string | null;
  discountAmount: number;
}

export function PromoCode({ onApply, onRemove, appliedCode, discountAmount }: PromoCodeProps) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    try {
      await onApply(inputCode.trim());
      setError('');
      setInputCode('');
    } catch (err: any) {
      setError(err.message || 'Mã giảm giá không hợp lệ.');
    }
  };

  return (
    <div className="py-4 border-b border-neutral-200/60 px-5">
      <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
        <Tag className="w-4 h-4" /> Bạn có mã giảm giá?
      </h4>
      
      {appliedCode ? (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">{appliedCode}</p>
              <p className="text-xs text-emerald-600 font-medium">Giảm {discountAmount.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
          <button 
            onClick={onRemove}
            className="p-2 hover:bg-emerald-100 rounded-full text-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Nhập mã giảm giá..."
              className="flex-1 h-10 px-4 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black uppercase"
            />
            <button
              onClick={handleApply}
              disabled={!inputCode.trim()}
              className="h-10 px-5 bg-black text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
            >
              Áp dụng
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}
