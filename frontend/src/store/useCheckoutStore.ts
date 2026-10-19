import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { deliveryContactFromProfile, savedDeliveryAddress, validProfileEmail } from '../components/profile/delivery-contact';

interface DeliveryInfo {
  fullName: string;
  phone: string;
  email: string;
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
  accountId: string | null;
  sessionRevision: number;
  profileStatus: 'idle' | 'loading' | 'ready' | 'error';
  profileEmail: string;
  profileAddress: string;
  profileError: string;
  profileRecipient: { recipientName: string; shippingPhone: string; shippingAddress: string };
  touched: Partial<Record<keyof DeliveryInfo, boolean>>;
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
  email: '',
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
  accountId: useAuthStore.getState().token ? useAuthStore.getState().user?.id ?? null : null,
  sessionRevision: 0,
  profileStatus: 'idle', profileEmail: '', profileAddress: '', profileError: '', touched: {},
  profileRecipient: { recipientName: '', shippingPhone: '', shippingAddress: '' },
  deliveryInfo: { ...defaultDeliveryInfo },
  paymentMethod: 'COD',
  setDeliveryInfo: (info) => set((state) => ({
    // Email is deliberately never accepted through editable checkout state.
    deliveryInfo: { ...state.deliveryInfo, ...info, email: '' },
    touched: { ...state.touched, ...Object.fromEntries(Object.keys(info).map(key => [key, true])) },
  })),
  setVATInfo: (info) => set((state) => ({
    deliveryInfo: {
      ...state.deliveryInfo,
      vatInfo: { ...state.deliveryInfo.vatInfo, ...info }
    }
  })),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  resetCheckout: () => set({ deliveryInfo: { ...defaultDeliveryInfo, vatInfo: { ...defaultDeliveryInfo.vatInfo } }, paymentMethod: 'COD', touched: {} })
}));

// This subscription remains active across SPA routes, including logout away from checkout.
useAuthStore.subscribe((auth, previous) => {
  const accountId = auth.token ? auth.user?.id ?? null : null;
  const previousId = previous.token ? previous.user?.id ?? null : null;
  if (accountId !== previousId) {
    // Keep opaque customer-scoped retry keys: a request may already have committed.
    useCheckoutStore.getState().resetCheckout();
    useCheckoutStore.setState(state => ({ accountId, sessionRevision: state.sessionRevision + 1 }));
  }
  if (accountId !== previousId || auth.token !== previous.token) {
    useCheckoutStore.setState({ profileStatus: 'idle', profileEmail: '', profileAddress: '', profileError: '', profileRecipient: { recipientName: '', shippingPhone: '', shippingAddress: '' } });
  }
});

export function checkoutProfileError(): string {
  const auth = useAuthStore.getState();
  const state = useCheckoutStore.getState();
  if (!auth.token || !auth.user || auth.user.id !== state.accountId) return 'Vui lòng đăng nhập bằng tài khoản khách hàng.';
  if (state.profileStatus !== 'ready' || !validProfileEmail(state.profileEmail)) {
    return state.profileError || 'Đang xác minh hồ sơ và email đăng ký. Vui lòng chờ.';
  }
  return '';
}

export async function loadCheckoutProfile(
  fetcher: typeof fetch = fetch,
  baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001',
): Promise<void> {
  const { token, user } = useAuthStore.getState();
  const { sessionRevision } = useCheckoutStore.getState();
  if (!token || !user) return;
  if (useCheckoutStore.getState().profileStatus === 'loading') return;
  const current = () => useAuthStore.getState().token === token
    && useAuthStore.getState().user?.id === user.id && useCheckoutStore.getState().sessionRevision === sessionRevision;
  useCheckoutStore.setState({ profileStatus: 'loading', profileEmail: '', profileError: '' });
  try {
    const response = await fetcher(`${baseUrl}/api/customers/profile`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) throw new Error('Không thể tải hồ sơ khách hàng. Vui lòng tải lại trang.');
    const profile = await response.json();
    if (!current()) return;
    if (!profile || profile.id !== user.id || !validProfileEmail(profile.email)) {
      throw new Error('Email đăng ký không hợp lệ hoặc hồ sơ không khớp. Không thể gửi yêu cầu.');
    }
    const address = typeof profile.address === 'string' ? profile.address : '';
    const defaults = { ...deliveryContactFromProfile(profile), ...savedDeliveryAddress(address) };
    useCheckoutStore.setState(state => ({
      profileStatus: 'ready', profileEmail: profile.email, profileAddress: address, profileError: '',
      profileRecipient: { recipientName: defaults.fullName, shippingPhone: defaults.phone,
        shippingAddress: [defaults.address, defaults.ward, defaults.district, defaults.city].filter(Boolean).join(', ') },
      deliveryInfo: { ...state.deliveryInfo, ...Object.fromEntries(Object.entries(defaults).filter(([key]) => !state.touched[key as keyof DeliveryInfo])), email: '' },
    }));
  } catch (error) {
    if (current()) useCheckoutStore.setState({ profileStatus: 'error', profileEmail: '', profileAddress: '',
      profileError: error instanceof Error ? error.message : 'Không thể tải hồ sơ khách hàng. Vui lòng tải lại trang.' });
  }
}
