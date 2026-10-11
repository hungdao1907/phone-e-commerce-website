export const ORDER_MANAGER_ROLES = ['superadmin', 'admin', 'manager', 'user'] as const;

export type OrderPrincipal = {
  id?: unknown;
  role?: unknown;
};

export function isOrderManagerRole(role: unknown): boolean {
  return typeof role === 'string' && ORDER_MANAGER_ROLES.includes(role as (typeof ORDER_MANAGER_ROLES)[number]);
}

export function isCustomerPrincipal(principal: unknown): principal is { id: string; role: 'customer' } {
  if (!principal || typeof principal !== 'object') return false;

  const candidate = principal as OrderPrincipal;
  return candidate.role === 'customer' && typeof candidate.id === 'string' && candidate.id.length > 0;
}

export function customerOwnsOrder(principal: unknown, customerId: string | null | undefined): boolean {
  return isCustomerPrincipal(principal) && typeof customerId === 'string' && principal.id === customerId;
}

export function canCustomerCompleteOrder(
  principal: unknown,
  customerId: string | null | undefined,
  currentStatus: unknown,
  requestedStatus: unknown,
  paymentStatusProvided: boolean,
): boolean {
  return customerOwnsOrder(principal, customerId)
    && currentStatus === 'delivered'
    && requestedStatus === 'completed'
    && !paymentStatusProvided;
}
