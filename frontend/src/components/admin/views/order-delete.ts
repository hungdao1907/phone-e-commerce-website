export function canPermanentlyDeleteOrder(role: string | undefined): boolean { return role === 'superadmin'; }

export async function requestPermanentOrderDeletion(input: {
  baseUrl: string; token: string | null; role: string | undefined; id: string; orderCode: string; confirmationCode: string;
}, fetcher: typeof fetch = fetch) {
  if (!canPermanentlyDeleteOrder(input.role) || !input.token) throw new Error('Chỉ Superadmin có quyền xóa đơn hàng.');
  if (!input.confirmationCode || input.confirmationCode !== input.orderCode) throw new Error('Vui lòng nhập đúng mã đơn hàng.');
  const response = await fetcher(`${input.baseUrl}/api/orders/${encodeURIComponent(input.id)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${input.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmationCode: input.confirmationCode }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || (response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Không thể xóa đơn hàng. Vui lòng thử lại.'));
  if (data?.deleted !== true || data.id !== input.id) throw new Error('Máy chủ chưa xác nhận xóa đơn hàng. Vui lòng tải lại danh sách.');
  return data;
}
