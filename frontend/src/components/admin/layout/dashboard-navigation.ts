export const QUOTATION_VIEW_IDS = ['quotations', 'quotations-list', 'quotations-pending', 'quotations-processed'] as const;

export function isQuotationView(view: string): boolean {
  return QUOTATION_VIEW_IDS.some(id => id === view);
}

export function dashboardViewPath(view: string): string {
  return view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`;
}

/** Sidebar visibility mirrors the existing screens; API authorization remains authoritative. */
export function canSeeDockItem(role: string | undefined, itemId: string): boolean {
  if (itemId === 'quotations') return role === 'admin' || role === 'superadmin' || role === 'staff';
  return !(role === 'staff' && (itemId === 'user' || itemId === 'calendar'));
}
