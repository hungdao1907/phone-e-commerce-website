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

  useEffect(() => {
    if (!token || !user) {
      alert('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/');
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
        let savedCity = '';
        let savedCityCode: number | undefined;
        let savedDistrict = '';
        let savedDistrictCode: number | undefined;
        let savedWard = '';
        let savedWardCode: number | undefined;
        let savedDetail = '';
        try {
          const parsed = JSON.parse(data.address);
          savedCity = parsed.city || '';
          savedCityCode = parsed.cityCode;
          savedDistrict = parsed.district || '';
          savedDistrictCode = parsed.districtCode;
          savedWard = parsed.ward || '';
          savedWardCode = parsed.wardCode;
          savedDetail = parsed.detailAddress || '';
        } catch (e) {
          savedDetail = data.address;
        }

        // Automatically fill if empty
        if (!deliveryInfo.address && !deliveryInfo.city) {
          setDeliveryInfo({ 
            address: savedDetail,
            city: savedCity,
            cityCode: savedCityCode,
            district: savedDistrict,
            districtCode: savedDistrictCode,
            ward: savedWard,
            wardCode: savedWardCode
          });
          if (savedCityCode) fetchDistricts(savedCityCode);
          if (savedDistrictCode) fetchWards(savedDistrictCode);
        }
      }
      if (data.phone && !deliveryInfo.phone) {
        setDeliveryInfo({ phone: data.phone });
      }
      if (data.fullName && !deliveryInfo.fullName) {
        setDeliveryInfo({ fullName: data.fullName });
      }
    })
    .catch(console.error);
  }, [token, items, navigate]);

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
      navigate('/checkout/payment');
    }
  };

  if (items.length === 0) return null;

  const stores = [
    { id: 'store_1', name: 'Apple Store Quận 1', address: '123 Lê Lợi, Q.1, TP.HCM' },
    { id: 'store_2', name: 'Apple Store Quận 7', address: 'Crescent Mall, Q.7, TP.HCM' },
  ];

  return (
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
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(profileAddress);
                        setDeliveryInfo({ 
                          city: parsed.city || '',
                          cityCode: parsed.cityCode,
                          district: parsed.district || '',
                          districtCode: parsed.districtCode,
                          ward: parsed.ward || '',
                          wardCode: parsed.wardCode,
                          address: parsed.detailAddress || ''
                        });
                        if (parsed.cityCode) fetchDistricts(parsed.cityCode);
                        if (parsed.districtCode) fetchWards(parsed.districtCode);
                      } catch (e) {
                        setDeliveryInfo({ address: profileAddress });
                      }
                    }}
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
                  Tiếp tục thanh toán <ArrowRight className="w-4 h-4" />
                </div> as any
              }
              onNext={handleNextStep}
              shippingFeeOverride={deliveryInfo.deliveryMethod === 'store_pickup' ? 0 : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
