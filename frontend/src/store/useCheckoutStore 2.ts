import { create } from 'zustand';

interface DeliveryInfo {
  fullName: string;
  phone: string;
  city: string;
  cityCode?: number;
  district: string;
  districtCode?: number;
  ward: string;
  wardCode?: number;
  address: string;
  note: string;
  deliveryMethod: 'shipping' | 'store_pickup';
  storeId?: string;
  requiresVAT: boolean;
  vatInfo: {
    companyName: string;
    taxCode: string;
    companyAddress: string;
    companyEmail: string;
  };
}

interface CheckoutState {
  deliveryInfo: DeliveryInfo;
  paymentMethod: string;
  setDeliveryInfo: (info: Partial<DeliveryInfo>) => void;
  setVATInfo: (info: Partial<DeliveryInfo['vatInfo']>) => void;
  setPaymentMethod: (method: string) => void;
  resetCheckout: () => void;
}

const defaultDeliveryInfo: DeliveryInfo = {
  fullName: '',
  phone: '',
  city: '',
  district: '',
  ward: '',
  address: '',
  note: '',
  deliveryMethod: 'shipping',
  requiresVAT: false,
  vatInfo: {
    companyName: '',
    taxCode: '',
    companyAddress: '',
    companyEmail: '',
  }
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  deliveryInfo: { ...defaultDeliveryInfo },
  paymentMethod: 'COD',
  setDeliveryInfo: (info) => set((state) => ({ 
    deliveryInfo: { ...state.deliveryInfo, ...info } 
  })),
  setVATInfo: (info) => set((state) => ({
    deliveryInfo: { 
      ...state.deliveryInfo, 
      vatInfo: { ...state.deliveryInfo.vatInfo, ...info } 
    }
  })),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  resetCheckout: () => set({ deliveryInfo: { ...defaultDeliveryInfo }, paymentMethod: 'COD' })
}));
