import type { Application, Router } from 'express';

export type QuotationApiRouters = {
  customer: Router;
  staff: Router;
  admin: Router;
};

/** Exact opt-in only: absent, misspelled, or any value other than "true" stays disabled. */
export function isQuotationApiEnabled(value = process.env.QUOTATION_API_ENABLED): boolean {
  return value === 'true';
}

export function mountQuotationRouters(app: Pick<Application, 'use'>, routers: QuotationApiRouters): void {
  app.use('/api/quotations', routers.customer);
  app.use('/api/staff/quotations', routers.staff);
  app.use('/api/admin/quotations', routers.admin);
}
