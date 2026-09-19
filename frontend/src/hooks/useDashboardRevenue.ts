import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

export interface CategoryRevenue {
  label: string;
  value: number;
  color: string;
}

export function useDashboardRevenue() {
  const token = useAuthStore((state) => state.token);

  return useQuery<CategoryRevenue[], Error>({
    queryKey: ['dashboardRevenue'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/dashboard/revenue-by-category', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard revenue');
      }

      return res.json();
    },
    // Refresh data every 2 minutes
    staleTime: 120000,
  });
}
