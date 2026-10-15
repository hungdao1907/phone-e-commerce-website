/**
 * Role vocabulary observed in the existing source. `staff` is the Sale role.
 * `manager` and `user` are legacy roles whose general permissions are unresolved;
 * this policy grants them no access by default. Existing Order API policy is left
 * intact and remains separately defined in routes/order-authorization.ts.
 */
export const KNOWN_ROLES = ['customer', 'staff', 'manager', 'admin', 'superadmin', 'user'] as const;

export type Principal = { id?: unknown; role?: unknown };

export const ADMIN_ROLES = ['admin', 'superadmin'] as const;

export function isAdminRole(role: unknown): role is (typeof ADMIN_ROLES)[number] {
  return role === 'admin' || role === 'superadmin';
}

/** Customers may read only invoices belonging to their own Customer record. */
export function invoiceScopeForPrincipal(principal: Principal): { order?: { customerId: string } } | null {
  if (isAdminRole(principal.role) || principal.role === 'staff') return {};
  if (principal.role === 'customer' && typeof principal.id === 'string' && principal.id.length > 0) {
    return { order: { customerId: principal.id } };
  }
  return null;
}

/** Legacy Lead.assignedTo may contain a name or ID; staff sees only exact user-ID assignments. */
export function leadScopeForPrincipal(principal: Principal): { assignedTo?: string } | null {
  if (isAdminRole(principal.role)) return {};
  if (principal.role === 'staff' && typeof principal.id === 'string' && principal.id.length > 0) {
    return { assignedTo: principal.id };
  }
  return null;
}
