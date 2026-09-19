/**
 * Express 5 may expose route parameters as a string array for wildcard routes.
 * Resource identifiers in this API are always singular, so take the first value.
 */
export function getRouteParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  return Array.isArray(value) ? value[0] ?? '' : '';
}