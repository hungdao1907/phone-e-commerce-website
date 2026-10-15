export type QuotationPrincipal = {
  id?: unknown;
  role?: unknown;
};

export type QuotationAccessRecord = {
  customerId: string;
  assignedStaffId: string | null;
};

export type QuotationStateRecord = QuotationAccessRecord & {
  status: string;
  customerConfirmedAt: Date | null;
  expiresAt: Date;
};

export type QuotationItemSnapshot = {
  variantId: string | null;
  quantity: number;
  unitPrice: number;
};

export type CurrentQuotationVariant = {
  id: string;
  price: number;
  stock: number;
  product?: { status?: string } | null;
};

export type QuotationFreshnessFailure = 'empty' | 'variant_unavailable' | 'price_changed' | 'out_of_stock';

export function isQuotationAdmin(principal: QuotationPrincipal): boolean {
  return principal.role === 'admin' || principal.role === 'superadmin';
}

export function canReadQuotation(principal: QuotationPrincipal, quotation: QuotationAccessRecord): boolean {
  if (isQuotationAdmin(principal)) return true;
  if (principal.role === 'customer') return typeof principal.id === 'string' && principal.id === quotation.customerId;
  if (principal.role === 'staff') return typeof principal.id === 'string' && principal.id === quotation.assignedStaffId;
  return false;
}

export function canCustomerConfirmQuotation(
  principal: QuotationPrincipal,
  quotation: QuotationStateRecord,
  now = new Date(),
): boolean {
  return principal.role === 'customer'
    && typeof principal.id === 'string'
    && principal.id === quotation.customerId
    && quotation.status === 'PENDING_CUSTOMER_CONFIRMATION'
    && quotation.expiresAt instanceof Date
    && quotation.expiresAt.getTime() > now.getTime();
}

export function canStaffApproveQuotation(
  principal: QuotationPrincipal,
  quotation: QuotationStateRecord,
  now = new Date(),
): boolean {
  const permittedActor = isQuotationAdmin(principal)
    || (principal.role === 'staff'
      && typeof principal.id === 'string'
      && principal.id === quotation.assignedStaffId);

  return permittedActor
    && quotation.status === 'CUSTOMER_CONFIRMED'
    && quotation.customerConfirmedAt instanceof Date
    && quotation.expiresAt instanceof Date
    && quotation.expiresAt.getTime() > now.getTime();
}

export function validateQuotationFreshness(
  items: QuotationItemSnapshot[],
  variants: CurrentQuotationVariant[],
): QuotationFreshnessFailure | null {
  if (!Array.isArray(items) || items.length === 0) return 'empty';

  const currentById = new Map(variants.map(variant => [variant.id, variant]));
  const requestedQuantity = new Map<string, number>();
  for (const item of items) {
    if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity <= 0) return 'variant_unavailable';
    requestedQuantity.set(item.variantId, (requestedQuantity.get(item.variantId) || 0) + item.quantity);
  }

  for (const item of items) {
    const variant = item.variantId ? currentById.get(item.variantId) : undefined;
    if (!variant || variant.product?.status !== 'active') return 'variant_unavailable';
    if (!Number.isInteger(item.unitPrice) || variant.price !== item.unitPrice) return 'price_changed';
  }

  for (const [variantId, quantity] of requestedQuantity) {
    const variant = currentById.get(variantId);
    if (!variant || variant.stock < quantity) return 'out_of_stock';
  }

  return null;
}
