export function upsertPersistedQuotation<T extends { id: string }>(
  current: T[],
  saved: T,
): T[] {
  return [saved, ...current.filter(quotation => quotation.id !== saved.id)];
}
