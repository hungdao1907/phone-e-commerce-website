import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

interface DashboardSummary {
  netRevenue: {
    current: number;
    last: number;
    growth: number;
  };
  successfulOrders: {
    current: number;
    last: number;
    growth: number;
  };
  pendingOrders: number;
  totalStock: number;
  lowStockVariants: number;
  aov: number;
}

export function useDashboardSummary() {
  const token = useAuthStore((state) => state.token);

  return useQuery<DashboardSummary, Error>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/dashboard/summary`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard summary');
      }

      return res.json();
    },
    // Refresh data every 2 minutes
    staleTime: 120000,
  });
}

export interface PendingOrder {
  id: string;
  orderCode: string;
  customer: {
    fullName: string;
  };
  items: {
    productName: string;
    variantInfo: string;
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface PendingOrdersResponse {
  count: number;
  orders: PendingOrder[];
}

export function usePendingOrders() {
  const token = useAuthStore((state) => state.token);

  return useQuery<PendingOrdersResponse, Error>({
    queryKey: ['dashboardPendingOrders'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/dashboard/pending-orders`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch pending orders');
      }

      return res.json();
    },
    // Refresh data every 1 minute
    staleTime: 60000,
  });
}
