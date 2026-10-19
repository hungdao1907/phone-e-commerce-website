import { create } from 'zustand';
import { useCheckoutStore } from './useCheckoutStore';

type Contact = { recipientName: string; shippingPhone: string; shippingAddress: string };
const empty: Contact = { recipientName: '', shippingPhone: '', shippingAddress: '' };
export const useQuotationContactStore = create<{
  contact: Contact;
  touched: Partial<Record<keyof Contact, boolean>>;
  update: (input: Partial<Contact>) => void;
}>(set => ({
  contact: { ...empty }, touched: {},
  update: input => set(state => ({ contact: { ...state.contact, ...input },
    touched: { ...state.touched, ...Object.fromEntries(Object.keys(input).map(key => [key, true])) } })),
}));

useCheckoutStore.subscribe((state, previous) => {
  if (state.sessionRevision !== previous.sessionRevision) {
    useQuotationContactStore.setState({ contact: { ...empty }, touched: {} });
  }
  if (state.profileStatus === 'ready' && previous.profileStatus !== 'ready') {
    const defaults = state.profileRecipient;
    useQuotationContactStore.setState(current => ({ contact: { ...current.contact,
      ...Object.fromEntries(Object.entries(defaults).filter(([key]) => !current.touched[key as keyof Contact])) } }));
  }
});
