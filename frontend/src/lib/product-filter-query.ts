/** Use exactly the effective request parameters as the cache identity. */
export function productFilterQuery(
  search: URLSearchParams,
  overrides: Record<string, string> = {},
  ignored: string[] = ['page', 'limit', 'sort'],
) {
  const params = new URLSearchParams(search);
  ignored.forEach(key => params.delete(key));
  Object.entries(overrides).forEach(([key, value]) => params.set(key, value));
  params.sort();
  return params.toString();
}
