import { queryOptions } from '@tanstack/react-query';

export function navSearchQuery<T>(apiUrl: string, isOpen: boolean) {
  return queryOptions<T[]>({
    queryKey: ['nav-search-catalog', apiUrl],
    enabled: isOpen,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(`${apiUrl}/api/products`, { signal });
      if (!response.ok) throw new Error('Không thể tải sản phẩm tìm kiếm.');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      return data;
    },
  });
}
