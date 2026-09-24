import React from 'react';
import { X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function ActiveFilterChips() {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleRemove = (key: string, value: string) => {
    if (key === 'category' || key === 'minPrice' || key === 'maxPrice' || key === 'sort' || key === 'page' || key === 'limit') {
      searchParams.delete(key);
    } else {
      const currentValues = searchParams.get(key)?.split(',') || [];
      const newValues = currentValues.filter(v => v !== value);
      if (newValues.length > 0) {
        searchParams.set(key, newValues.join(','));
      } else {
        searchParams.delete(key);
      }
    }
    
    // Reset page to 1
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const getLabel = (key: string, value: string) => {
    switch (key) {
      case 'category': return `Danh mục: ${value}`;
      case 'brand': return `Thương hiệu: ${value}`;
      case 'ram': return `RAM: ${value}`;
      case 'storage': return `Lưu trữ: ${value}`;
      case 'cpu': return `CPU: ${value}`;
      case 'gpu': return `GPU: ${value}`;
      case 'screenSize': return `Màn hình: ${value}`;
      case 'colors': return `Màu: ${value}`;
      case 'minPrice': return `Giá từ: ${Number(value).toLocaleString('vi-VN')}đ`;
      case 'maxPrice': return `Giá đến: ${Number(value).toLocaleString('vi-VN')}đ`;
      default: return value;
    }
  };

  const chips: { key: string, value: string, label: string }[] = [];

  Array.from(searchParams.entries()).forEach(([key, value]) => {
    if (['page', 'limit', 'sort'].includes(key)) return;
    
    if (['category', 'minPrice', 'maxPrice'].includes(key)) {
      chips.push({ key, value, label: getLabel(key, value) });
    } else {
      value.split(',').forEach(v => {
        if (v) {
          chips.push({ key, value: v, label: getLabel(key, v) });
        }
      });
    }
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm font-semibold text-neutral-500 mr-1">Đang lọc:</span>
      {chips.map((chip, idx) => (
        <span 
          key={`${chip.key}-${idx}`} 
          className="inline-flex items-center bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 px-3 py-1.5 rounded-full shadow-sm"
        >
          {chip.label}
          <button 
            onClick={() => handleRemove(chip.key, chip.value)}
            className="ml-2 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button 
        onClick={() => {
          const params = new URLSearchParams();
          const cat = searchParams.get('category');
          if (cat) params.set('category', cat);
          setSearchParams(params);
        }}
        className="text-xs font-semibold text-blue-500 hover:text-blue-700 ml-2"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
