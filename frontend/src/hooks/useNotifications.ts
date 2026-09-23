import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import type { Notification, NotificationPage } from '@/data/notifications';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getHeaders(token: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ─── Top 3 notifications cho Dashboard Widget ──────────────────────────────
export function useTopNotifications() {
  const token = useAuthStore((s) => s.token);

  return useQuery<{ data: Notification[]; unreadCount: number }, Error>({
    queryKey: ['notifications', 'top3'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/notifications?limit=3&page=1`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    staleTime: 60_000, // 1 phút
    enabled: !!token,
  });
}

// ─── Paginated list cho Notification Center ────────────────────────────────
export function useNotificationCenter(
  type: string = 'ALL',
  page: number = 1,
  limit: number = 20,
  enabled: boolean = false,
) {
  const token = useAuthStore((s) => s.token);
  const typeParam = type === 'ALL' ? '' : `&type=${type}`;

  return useQuery<NotificationPage, Error>({
    queryKey: ['notifications', 'center', type, page],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/notifications?limit=${limit}&page=${page}${typeParam}`,
        { headers: getHeaders(token) },
      );
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    staleTime: 30_000, // 30 giây
    enabled: !!token && enabled,
  });
}

// ─── Mark single notification as read ─────────────────────────────────────
export function useMarkNotificationRead() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    },
    onSuccess: () => {
      // Invalidate both caches
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Mark ALL as read ──────────────────────────────────────────────────────
export function useMarkAllNotificationsRead() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
