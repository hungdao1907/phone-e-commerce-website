import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { quotationApiEnabled, requestQuotationJson, QuotationApiError } from './quotation-api';
import { subscribeToPersistedQuotationUpdates } from './quotation-events';
import type { QuotationRecord } from './QuotationDetails';

export function useCustomerQuotations(active = true) {
  const { token, user } = useAuthStore();
  const client = useQueryClient();
  const enabled = active && quotationApiEnabled() && !!token && user?.role === 'customer';
  const customerId = user?.role === 'customer' ? user.id : null;
  const query = useQuery<QuotationRecord[], QuotationApiError>({
    queryKey: ['customer-quotations', customerId],
    enabled, retry: false, gcTime: 0, staleTime: 0,
    refetchOnWindowFocus: true, refetchOnMount: 'always',
    // Bounded refresh while a quotation surface is open; never polls a hidden tab.
    refetchInterval: state => enabled && !([401, 403].includes((state.state.error as QuotationApiError)?.status ?? 0)) ? 30000 : false,
    refetchIntervalInBackground: false,
    queryFn: async ({ signal }) => {
      const data = await requestQuotationJson<{ quotations: QuotationRecord[] }>('/api/quotations', token!, { signal, cache: 'no-store' }, 'list');
      if (!Array.isArray(data.quotations)) throw new QuotationApiError('Backend không trả danh sách báo giá hợp lệ.');
      if (data.quotations.some(quote => quote.customer?.id && quote.customer.id !== customerId)) {
        throw new QuotationApiError('Không thể hiển thị báo giá không thuộc tài khoản hiện tại.', 403);
      }
      return data.quotations;
    },
  });
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: ['customer-quotations', customerId] }); };
    return subscribeToPersistedQuotationUpdates(refresh);
  }, [enabled, customerId, token, client]);
  useEffect(() => {
    if (enabled) void client.invalidateQueries({ queryKey: ['customer-quotations', customerId] });
  }, [token, enabled, customerId, client]);
  return { ...query, quotations: enabled && !query.isError ? query.data ?? [] : [], enabled };
}
