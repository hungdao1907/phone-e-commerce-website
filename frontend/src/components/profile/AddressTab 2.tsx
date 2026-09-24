import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Edit2, Plus, Save, X } from 'lucide-react';
import { useVNAddress } from '@/hooks/useVNAddress';

interface AddressTabProps {
  initialFullName: string;
  initialPhone: string;
  initialAddress: string;
  onUpdate: (data: { fullName?: string, phone?: string, address?: string }) => Promise<void>;
}

export function AddressTab({ initialFullName, initialPhone, initialAddress, onUpdate }: AddressTabProps) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const { provinces, districts, wards, fetchDistricts, fetchWards } = useVNAddress();

  // Form states
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  
  const [cityCode, setCityCode] = useState<number | ''>('');
  const [cityName, setCityName] = useState('');
  
  const [districtCode, setDistrictCode] = useState<number | ''>('');
  const [districtName, setDistrictName] = useState('');
  
  const [wardCode, setWardCode] = useState<number | ''>('');
  const [wardName, setWardName] = useState('');
  
  const [detailAddress, setDetailAddress] = useState('');

  // Handle Initial Data
  useEffect(() => {
    setFullName(initialFullName);
    setPhone(initialPhone);
    
    if (initialAddress) {
      try {
        const parsed = JSON.parse(initialAddress);
        setDetailAddress(parsed.detailAddress || '');
        if (parsed.cityCode) {
          setCityCode(parsed.cityCode);
          setCityName(parsed.city || '');
          fetchDistricts(parsed.cityCode);
        }
        if (parsed.districtCode) {
          setDistrictCode(parsed.districtCode);
          setDistrictName(parsed.district || '');
          fetchWards(parsed.districtCode);
        }
        if (parsed.wardCode) {
          setWardCode(parsed.wardCode);
          setWardName(parsed.ward || '');
        }
      } catch (e) {
        setDetailAddress(initialAddress);
      }
    }
  }, [initialFullName, initialPhone, initialAddress]);

  // Handlers for dropdowns
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const name = e.target.options[e.target.selectedIndex].text;
    setCityCode(code);
    setCityName(name);
    setDistrictCode('');
    setDistrictName('');
    setWardCode('');
    setWardName('');
    fetchDistricts(code);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const name = e.target.options[e.target.selectedIndex].text;
    setDistrictCode(code);
    setDistrictName(name);
    setWardCode('');
    setWardName('');
    fetchWards(code);
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const name = e.target.options[e.target.selectedIndex].text;
    setWardCode(code);
    setWardName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    if (!fullName.trim() || !phone.trim() || !cityCode || !districtCode || !wardCode || !detailAddress.trim()) {
      setMessage({ text: 'Vui lòng điền đầy đủ các trường bắt buộc', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const addressJson = JSON.stringify({
        city: cityName,
        cityCode,
        district: districtName,
        districtCode,
        ward: wardName,
        wardCode,
        detailAddress: detailAddress.trim()
      });

      await onUpdate({ 
        fullName: fullName.trim(), 
        phone: phone.trim(), 
        address: addressJson 
      });
      
      setMessage({ text: 'Cập nhật địa chỉ thành công!', type: 'success' });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ text: error.message || 'Cập nhật thất bại', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage({ text: '', type: '' });
  };

  const displayName = initialFullName || user?.username.split('@')[0] || 'Người dùng';
  const displayPhone = initialPhone || 'Chưa cập nhật số điện thoại';
  
  let formattedAddress = '';
  if (initialAddress) {
    try {
      const parsed = JSON.parse(initialAddress);
      formattedAddress = [parsed.detailAddress, parsed.ward, parsed.district, parsed.city].filter(Boolean).join(', ');
    } catch (e) {
      formattedAddress = initialAddress;
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div className="mb-8 border-b border-neutral-100 pb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Địa chỉ nhận hàng</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý địa chỉ nhận hàng mặc định của bạn.
          </p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-sm font-semibold rounded-full transition-colors"
          >
            {formattedAddress ? (
              <>
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Thêm địa chỉ</span>
              </>
            )}
          </button>
        )}
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {!isEditing ? (
        formattedAddress ? (
          <div className="relative border border-neutral-200 rounded-xl p-5 hover:border-black transition-colors group">
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">
                Mặc định
              </span>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-neutral-900">{displayName}</h4>
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  <p className="text-sm text-neutral-600">{displayPhone}</p>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed max-w-lg">
                  {formattedAddress}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
            <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-900 mb-1">Bạn chưa có địa chỉ giao hàng</h4>
            <p className="text-sm text-neutral-500 mb-4 max-w-xs mx-auto">
              Thêm địa chỉ để chúng tôi có thể giao hàng đến tận nơi cho bạn một cách nhanh chóng.
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white text-sm font-bold rounded-full hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm địa chỉ mới
            </button>
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Họ và tên người nhận *</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full h-11 px-4 bg-white border border-neutral-200 focus:ring-black rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow" 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Số điện thoại *</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full h-11 px-4 bg-white border border-neutral-200 focus:ring-black rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Tỉnh/Thành phố *</label>
              <select 
                value={cityCode}
                onChange={handleCityChange}
                className="w-full h-11 px-4 bg-white border border-neutral-200 focus:ring-black rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow cursor-pointer"
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Quận/Huyện *</label>
              <select 
                value={districtCode}
                onChange={handleDistrictChange}
                disabled={!cityCode}
                className="w-full h-11 px-4 bg-white border border-neutral-200 focus:ring-black rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:bg-neutral-100"
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Phường/Xã *</label>
              <select 
                value={wardCode}
                onChange={handleWardChange}
                disabled={!districtCode}
                className="w-full h-11 px-4 bg-white border border-neutral-200 focus:ring-black rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:bg-neutral-100"
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Địa chỉ chi tiết *</label>
              <input 
                type="text" 
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="Ví dụ: Số 123, Đường Lê Lợi"
                className="w-full h-11 px-4 bg-white border border-neutral-200 focus:ring-black rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow" 
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-neutral-200 pt-5">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
