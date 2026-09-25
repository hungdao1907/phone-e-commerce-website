import { resolveMediaUrl } from '@/utils/media';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`;

export interface StorefrontBanner {
  id: string;
  title: string;
  image: string | null;
  publicUrl: string | null;
  link: string | null;
  position: string;
  sortOrder: number;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

function isStorefrontBanner(value: unknown): value is StorefrontBanner {
  if (!value || typeof value !== 'object') return false;
  const banner = value as Record<string, unknown>;
  const hasImage = typeof banner.image === 'string' && banner.image.trim().length > 0;
  const hasPublicUrl = typeof banner.publicUrl === 'string' && banner.publicUrl.trim().length > 0;

  return typeof banner.id === 'string'
    && typeof banner.title === 'string'
    && (typeof banner.image === 'string' || banner.image === null || banner.image === undefined)
    && (typeof banner.publicUrl === 'string' || banner.publicUrl === null || banner.publicUrl === undefined)
    && (hasImage || hasPublicUrl)
    && (typeof banner.link === 'string' || banner.link === null || banner.link === undefined)
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

export function resolveBannerImage(
  bannerOrSrc: StorefrontBanner | string | null | undefined
): string {
  if (!bannerOrSrc) return '';

  if (typeof bannerOrSrc === 'string') {
    return resolveMediaUrl(bannerOrSrc);
  }

  const source =
    bannerOrSrc.publicUrl?.trim() ||
    bannerOrSrc.image?.trim() ||
    '';

  return resolveMediaUrl(source);
}

export { resolveMediaUrl };