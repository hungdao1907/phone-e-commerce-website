import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { loadCheckoutProfile, useCheckoutStore } from '../../store/useCheckoutStore';

export function useRecipientProfile() {
  const token = useAuthStore(state => state.token);
  const accountId = useAuthStore(state => state.user?.id);
  const state = useCheckoutStore();
  useEffect(() => { void loadCheckoutProfile(); }, [token, accountId]);
  return state;
}
