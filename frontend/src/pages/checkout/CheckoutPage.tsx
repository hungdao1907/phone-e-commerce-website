import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { useCheckoutStore } from '../../store/useCheckoutStore';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { CheckoutSidebar } from '../../components/checkout/CheckoutSidebar';
import { useVNAddress } from '../../hooks/useVNAddress';
import { MapPin, Truck, Store, FileText, ArrowRight } from 'lucide-react';

export function CheckoutPage() {
  const { user, token } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const { deliveryInfo, setDeliveryInfo, setVATInfo } = useCheckoutStore();
  const { provinces, districts, wards, fetchDistricts, fetchWards } = useVNAddress();

  const [profileAddress, setProfileAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [redirectProgress, setRedirectProgress] = useState(0);

  const applySavedAddress = async (addrString: string) => {
    setErrors({});
    try {
      const parsed = JSON.parse(addrString);
      let cCode = parsed.cityCode;
      let dCode = parsed.districtCode;
      let wCode = parsed.wardCode;
      
      const normalize = (s: string) => s.toLowerCase().replace(/(thành phố|tỉnh|quận|huyện|phường|xã|tp\.|tp)/g, '').trim();

      if (!cCode && parsed.city && provinces.length > 0) {
         const search = normalize(parsed.city);
         const match = provinces.find(p => normalize(p.name).includes(search) || search.includes(normalize(p.name)));
         if (match) cCode = match.code;
      }

      if (cCode && !dCode && parsed.district) {
         const res = await fetch(`https://provinces.open-api.vn/api/p/${cCode}?depth=2`);
         const data = await res.json();
         const search = normalize(parsed.district);
         const match = (data.districts || []).find((d: any) => normalize(d.name).includes(search) || search.includes(normalize(d.name)));
         if (match) dCode = match.code;
      }

      if (dCode && !wCode && parsed.ward) {
         const res = await fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`);
         const data = await res.json();
         const search = normalize(parsed.ward);
         const match = (data.wards || []).find((w: any) => normalize(w.name).includes(search) || search.includes(normalize(w.name)));
         if (match) wCode = match.code;
      }

      setDeliveryInfo({
        city: parsed.city || '',
        cityCode: cCode,
        district: parsed.district || '',
        districtCode: dCode,
        ward: parsed.ward || '',
        wardCode: wCode,
        address: parsed.detailAddress || ''
      });
      
      if (cCode) fetchDistricts(cCode);
      if (dCode) fetchWards(dCode);
    } catch (e) {
      setDeliveryInfo({ address: addrString });
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
      return;
    }
    
    if (!token || !user) {
      // Allow guest users to fill checkout form
      return;
    }
    
    // Fetch user profile for default address
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/customers/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.address) {
        setProfileAddress(data.address);
        // Automatically fill if empty
        if (!deliveryInfo.address && !deliveryInfo.city && provinces.length > 0) {
          applySavedAddress(data.address);
        } else if (!deliveryInfo.address && !deliveryInfo.city) {
          // Fallback if provinces are not loaded yet
          setTimeout(() => applySavedAddress(data.address), 1000);
        }
      }
      if (data.phone && !deliveryInfo.phone) {
        setDeliveryInfo({ phone: data.phone });
      }
      if (data.fullName && !deliveryInfo.fullName) {
        setDeliveryInfo({ fullName: data.fullName });
      }
      if (data.email && !deliveryInfo.email) {
        setDeliveryInfo({ email: data.email });
      }
    })
    .catch(console.error);
  }, [token, items, navigate, provinces.length]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!deliveryInfo.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    
    // VN Phone validation: 10 digits starting with 03, 05, 07, 08, 09
    const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    if (!deliveryInfo.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(deliveryInfo.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03,05,07,08,09)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!deliveryInfo.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(deliveryInfo.email)) {
      newErrors.email = 'Địa chỉ email không hợp lệ';
    }

    if (deliveryInfo.deliveryMethod === 'shipping') {
      if (!deliveryInfo.city.trim()) newErrors.city = 'Vui lòng nhập Tỉnh/Thành phố';
      if (!deliveryInfo.district.trim()) newErrors.district = 'Vui lòng nhập Quận/Huyện';
      if (!deliveryInfo.ward.trim()) newErrors.ward = 'Vui lòng nhập Phường/Xã';
      if (!deliveryInfo.address.trim()) newErrors.address = 'Vui lòng nhập Địa chỉ chi tiết';
    } else {
      if (!deliveryInfo.storeId) newErrors.storeId = 'Vui lòng chọn cửa hàng';
    }

    if (deliveryInfo.requiresVAT) {
      if (!deliveryInfo.vatInfo.companyName.trim()) newErrors.companyName = 'Vui lòng nhập tên công ty';
      if (!deliveryInfo.vatInfo.taxCode.trim()) newErrors.taxCode = 'Vui lòng nhập mã số thuế';
      if (!deliveryInfo.vatInfo.companyAddress.trim()) newErrors.companyAddress = 'Vui lòng nhập địa chỉ công ty';
      if (!deliveryInfo.vatInfo.companyEmail.trim()) newErrors.companyEmail = 'Vui lòng nhập email nhận hóa đơn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validate()) {
      if (!user || !token) {
        setShowLoginModal(true);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setRedirectProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            navigate('/login?returnUrl=/checkout');
          }
        }, 75); // 75ms * 20 = 1500ms (1.5s)
      } else {
        navigate('/checkout/payment');
      }
    }
  };

  if (items.length === 0) return null;

  const stores = [
    { id: 'store_1', name: 'Apple Store Quận 1', address: '123 Lê Lợi, Q.1, TP.HCM' },
    { id: 'store_2', name: 'Apple Store Quận 7', address: 'Crescent Mall, Q.7, TP.HCM' },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f8f9fc] py-8 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-[1000px] mx-auto">
        <CheckoutProgress currentStep="delivery" />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* THÔNG TIN NGƯỜI NHẬN */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-neutral-900" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-neutral-900">Thông tin người nhận</h2>
                  <p className="text-sm text-neutral-500">Vui lòng cung cấp thông tin người nhận hàng.</p>
                </div>
                {profileAddress && (
                  <button 
                    onClick={() => applySavedAddress(profileAddress)}
                    className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Dùng địa chỉ đã lưu
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5">Họ và tên người nhận *</label>
                  <input 
                    type="text" 
                    value={deliveryInfo.fullName}
                    onChange={(e) => {
                      setDeliveryInfo({ fullName: e.target.value });
                      if(errors.fullName) setErrors({...errors, fullName: ''});
                    }}
                    placeholder="VD: Nguyễn Văn A"
                    className={`w-full h-11 px-4 bg-white border ${errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                  />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.fullName}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5">Số điện thoại *</label>
                  <input 
                    type="tel" 
                    value={deliveryInfo.phone}
                    onChange={(e) => {
                      setDeliveryInfo({ phone: e.target.value });
                      if(errors.phone) setErrors({...errors, phone: ''});
                    }}
                    placeholder="Ví dụ: 0912345678"
                    className={`w-full h-11 px-4 bg-white border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5">Email *</label>
                  <input 
                    type="email" 
                    value={deliveryInfo.email}
                    onChange={(e) => {
                      setDeliveryInfo({ email: e.target.value });
                      if(errors.email) setErrors({...errors, email: ''});
                    }}
                    placeholder="Nhập địa chỉ email"
                    className={`w-full h-11 px-4 bg-white border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email}</p>}
                </div>

                <div className="md:col-span-2 mt-2">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-start">
                    <div className="text-red-500 mt-0.5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-red-800 leading-relaxed mb-2 font-medium">
                        Bằng việc bấm "Đặt hàng", bạn đồng ý cho phép hệ thống gửi email xác thực và thông tin đơn hàng đến email đã cung cấp để xác minh và tiếp tục mua hàng.
                      </p>
                      <button 
                        type="button"
                        onClick={() => navigate('/login?returnUrl=/checkout')} 
                        className="text-sm font-bold text-[#99e300] hover:text-[#88c900] bg-black/90 hover:bg-black px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Đăng nhập hoặc đăng ký ngay
                      </button>
                    </div>
                  </div>
                </div>

                {/* PHƯƠNG THỨC NHẬN HÀNG */}
                <div className="md:col-span-2 mt-4">
                  <label className="block text-sm font-bold text-neutral-700 mb-3">Phương thức nhận hàng *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      deliveryInfo.deliveryMethod === 'shipping' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'
                    }`}>
                      <input 
                        type="radio" 
                        checked={deliveryInfo.deliveryMethod === 'shipping'}
                        onChange={() => {
                          setDeliveryInfo({ deliveryMethod: 'shipping' });
                          setErrors({});
                        }}
                        className="mt-0.5 w-4 h-4 text-black focus:ring-black cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-neutral-700" />
                          <h4 className="text-sm font-bold text-neutral-900">Giao tận nơi</h4>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Giao hàng đến địa chỉ của bạn</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      deliveryInfo.deliveryMethod === 'store_pickup' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'
                    }`}>
                      <input 
                        type="radio" 
                        checked={deliveryInfo.deliveryMethod === 'store_pickup'}
                        onChange={() => {
                          setDeliveryInfo({ deliveryMethod: 'store_pickup' });
                          setErrors({});
                        }}
                        className="mt-0.5 w-4 h-4 text-black focus:ring-black cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-neutral-700" />
                          <h4 className="text-sm font-bold text-neutral-900">Nhận tại cửa hàng</h4>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Đến cửa hàng để nhận máy</p>
                      </div>
                    </label>
                  </div>
                </div>

                {deliveryInfo.deliveryMethod === 'shipping' ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-1.5">Tỉnh/Thành phố *</label>
                      <select 
                        value={deliveryInfo.cityCode || ''}
                        onChange={(e) => {
                          const code = Number(e.target.value);
                          const name = e.target.options[e.target.selectedIndex].text;
                          setDeliveryInfo({ 
                            cityCode: code, city: name, 
                            districtCode: undefined, district: '', 
                            wardCode: undefined, ward: '' 
                          });
                          if(errors.city) setErrors({...errors, city: ''});
                          fetchDistricts(code);
                        }}
                        className={`w-full h-11 px-4 bg-white border ${errors.city ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow cursor-pointer`}
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                      {errors.city && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-1.5">Quận/Huyện *</label>
                      <select 
                        value={deliveryInfo.districtCode || ''}
                        onChange={(e) => {
                          const code = Number(e.target.value);
                          const name = e.target.options[e.target.selectedIndex].text;
                          setDeliveryInfo({ 
                            districtCode: code, district: name, 
                            wardCode: undefined, ward: '' 
                          });
                          if(errors.district) setErrors({...errors, district: ''});
                          fetchWards(code);
                        }}
                        disabled={!deliveryInfo.cityCode}
                        className={`w-full h-11 px-4 bg-white border ${errors.district ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:bg-neutral-100`}
                      >
                        <option value="">Chọn Quận/Huyện</option>
                        {districts.map(d => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                        ))}
                      </select>
                      {errors.district && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.district}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-neutral-700 mb-1.5">Phường/Xã *</label>
                      <select 
                        value={deliveryInfo.wardCode || ''}
                        onChange={(e) => {
                          const code = Number(e.target.value);
                          const name = e.target.options[e.target.selectedIndex].text;
                          setDeliveryInfo({ wardCode: code, ward: name });
                          if(errors.ward) setErrors({...errors, ward: ''});
                        }}
                        disabled={!deliveryInfo.districtCode}
                        className={`w-full h-11 px-4 bg-white border ${errors.ward ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:bg-neutral-100`}
                      >
                        <option value="">Chọn Phường/Xã</option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        ))}
                      </select>
                      {errors.ward && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.ward}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-neutral-700 mb-1.5">Địa chỉ chi tiết *</label>
                      <textarea 
                        value={deliveryInfo.address}
                        onChange={(e) => {
                          setDeliveryInfo({ address: e.target.value });
                          if(errors.address) setErrors({...errors, address: ''});
                        }}
                        rows={2}
                        placeholder="Số nhà, tên đường..."
                        className={`w-full p-4 bg-white border ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                      />
                      {errors.address && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.address}</p>}
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Chọn cửa hàng *</label>
                    <div className="space-y-3">
                      {stores.map(store => (
                        <label key={store.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                          deliveryInfo.storeId === store.id ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'
                        }`}>
                          <input 
                            type="radio" 
                            name="store"
                            checked={deliveryInfo.storeId === store.id}
                            onChange={() => {
                              setDeliveryInfo({ storeId: store.id });
                              if(errors.storeId) setErrors({...errors, storeId: ''});
                            }}
                            className="w-4 h-4 text-black focus:ring-black cursor-pointer"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-neutral-900">{store.name}</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">{store.address}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.storeId && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.storeId}</p>}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-neutral-700 mb-1.5">Ghi chú giao hàng (Không bắt buộc)</label>
                  <textarea 
                    value={deliveryInfo.note}
                    onChange={(e) => setDeliveryInfo({ note: e.target.value })}
                    rows={2}
                    placeholder="VD: Giao trong giờ hành chính..."
                    className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" 
                  />
                </div>
              </div>
            </div>

            {/* HÓA ĐƠN VAT */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300 delay-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={deliveryInfo.requiresVAT}
                  onChange={(e) => setDeliveryInfo({ requiresVAT: e.target.checked })}
                  className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                />
                <span className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Xuất hóa đơn VAT
                </span>
              </label>

              {deliveryInfo.requiresVAT && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Tên công ty *</label>
                    <input 
                      type="text" 
                      value={deliveryInfo.vatInfo.companyName}
                      onChange={(e) => {
                        setVATInfo({ companyName: e.target.value });
                        if(errors.companyName) setErrors({...errors, companyName: ''});
                      }}
                      className={`w-full h-11 px-4 bg-white border ${errors.companyName ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                    />
                    {errors.companyName && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.companyName}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Mã số thuế *</label>
                    <input 
                      type="text" 
                      value={deliveryInfo.vatInfo.taxCode}
                      onChange={(e) => {
                        setVATInfo({ taxCode: e.target.value });
                        if(errors.taxCode) setErrors({...errors, taxCode: ''});
                      }}
                      className={`w-full h-11 px-4 bg-white border ${errors.taxCode ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                    />
                    {errors.taxCode && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.taxCode}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Địa chỉ công ty *</label>
                    <input 
                      type="text" 
                      value={deliveryInfo.vatInfo.companyAddress}
                      onChange={(e) => {
                        setVATInfo({ companyAddress: e.target.value });
                        if(errors.companyAddress) setErrors({...errors, companyAddress: ''});
                      }}
                      className={`w-full h-11 px-4 bg-white border ${errors.companyAddress ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                    />
                    {errors.companyAddress && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.companyAddress}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-1.5">Email nhận hóa đơn *</label>
                    <input 
                      type="email" 
                      value={deliveryInfo.vatInfo.companyEmail}
                      onChange={(e) => {
                        setVATInfo({ companyEmail: e.target.value });
                        if(errors.companyEmail) setErrors({...errors, companyEmail: ''});
                      }}
                      className={`w-full h-11 px-4 bg-white border ${errors.companyEmail ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:ring-black'} rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow`} 
                    />
                    {errors.companyEmail && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.companyEmail}</p>}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSidebar 
              buttonText={
                <div className="flex items-center gap-2">
                  Đặt hàng <ArrowRight className="w-4 h-4" />
                </div> as any
              }
              onNext={handleNextStep}
              shippingFeeOverride={deliveryInfo.deliveryMethod === 'store_pickup' ? 0 : undefined}
            />
          </div>
          </div>
        </div>
      </div>

      {/* GUEST REDIRECT MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[440px] p-8 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Đang chuyển hướng...</h3>
              <p className="text-neutral-500 mb-6 font-medium">Bạn cần đăng nhập để tiếp tục đặt hàng.</p>
              
              <div className="w-full text-left space-y-2">
                <div className="flex justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <span>Chuyển hướng</span>
                  <span>{Math.round(redirectProgress)}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#99e300] h-full rounded-full transition-all duration-75 ease-linear"
                    style={{ width: `${redirectProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
