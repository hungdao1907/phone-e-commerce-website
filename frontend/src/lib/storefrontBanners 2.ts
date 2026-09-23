import { resolveMediaUrl } from '@/utils/media';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`;

export interface StorefrontBanner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  position: string;
  sortOrder: number;
}

function isStorefrontBanner(value: unknown): value is StorefrontBanner {
  if (!value || typeof value !== 'object') return false;
  const banner = value as Record<string, unknown>;
  return typeof banner.id === 'string'
    && typeof banner.title === 'string'
    && typeof banner.image === 'string'
    && (typeof banner.link === 'string' || banner.link === null)
    && typeof banner.position === 'string'
    && typeof banner.sortOrder === 'number';
}

export async function fetchActiveBanners(position: string, signal?: AbortSignal): Promise<StorefrontBanner[]> {
  const query = new URLSearchParams({ position });
  const response = await fetch(`${API_BASE_URL}/api/banners/active?${query}`, { signal });
  if (!response.ok) throw new Error('Không thể tải banner.');

  const payload: unknown = await response.json();
  return Array.isArray(payload) ? payload.filter(isStorefrontBanner) : [];
}

export { resolveMediaUrl, resolveMediaUrl as resolveBannerImage };