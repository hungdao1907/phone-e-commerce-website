// services/bannerCampaign.api.ts
// API hooks for Banner Campaign Products (React Query + fetch)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface MarketingTag {
  id: string;
  name: string;
  color?: string | null;
}

export interface BannerCampaignProductItem {
  id: string;
  productId: string;
  productName: string;
  brand?: string | null;
  image?: string | null;
  variantId?: string | null;
  categorySlug: string;
  bannerImage: string;
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  salePrice: number;
  sortOrder: number;
  tags: MarketingTag[];
}

export interface ActiveBannerCampaign {
  campaign: { id: string; name: string; startDate: string; endDate: string } | null;
  products: BannerCampaignProductItem[];
}

/** Lấy active campaign + products cho một category (public) */
export async function fetchActiveBannerCampaign(categorySlug: string): Promise<ActiveBannerCampaign> {
  const res = await fetch(`${API_URL}/api/campaigns/active/${categorySlug}`);
  if (!res.ok) throw new Error('Lỗi khi tải dữ liệu banner');
  return res.json();
}

/** Lấy danh sách marketing tags (public) */
export async function fetchMarketingTags(): Promise<MarketingTag[]> {
  const res = await fetch(`${API_URL}/api/campaigns/tags`);
  if (!res.ok) throw new Error('Lỗi khi tải tags');
  return res.json();
}

/** Lấy banner products của một campaign theo category (admin) */
export async function fetchBannerProductsByCampaign(campaignId: string, categorySlug: string, token: string) {
  const res = await fetch(
    `${API_URL}/api/campaigns/${campaignId}/banner-products?categorySlug=${categorySlug}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Lỗi khi tải dữ liệu');
  return res.json();
}

/** Thêm sản phẩm vào banner campaign */
export async function addBannerCampaignProduct(
  campaignId: string,
  data: {
    productId: string;
    variantId?: string | null;
    categorySlug: string;
    bannerImage: string;
    discountPercent: number;
    tagIds?: string[];
  },
  token: string
) {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/banner-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lỗi khi thêm sản phẩm');
  return json;
}

/** Cập nhật banner campaign product */
export async function updateBannerCampaignProduct(
  campaignId: string,
  bpId: string,
  data: { discountPercent?: number; tagIds?: string[]; sortOrder?: number; variantId?: string | null; bannerImage?: string },
  token: string
) {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/banner-products/${bpId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lỗi khi cập nhật');
  return json;
}

/** Xóa banner campaign product */
export async function deleteBannerCampaignProduct(campaignId: string, bpId: string, token: string) {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/banner-products/${bpId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lỗi khi xóa');
  return json;
}

/** Format VND price */
export function formatVND(price: number): string {
  return price.toLocaleString('vi-VN') + '₫';
}

/** Resolve image URL with API prefix for /uploads paths */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_URL}${url}`;
  return url;
}

/** Upload banner image */
export async function uploadBannerImage(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lỗi khi tải ảnh lên');
  return json.url; // Returns the uploaded image URL
}
