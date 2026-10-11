export type PromoUsageTransaction = {
  promoCode: {
    findUnique(args: any): Promise<any | null>;
    updateMany(args: any): Promise<{ count: number }>;
  };
};

/** Atomically reserves one usage without allowing a concurrent finite-limit overrun. */
export async function reservePromoUsage(
  transaction: PromoUsageTransaction,
  promoCodeId: string,
  now = new Date(),
): Promise<boolean> {
  if (!promoCodeId || !Number.isFinite(now.getTime())) return false;
  const promo = await transaction.promoCode.findUnique({ where: { id: promoCodeId } });
  if (!promo || !promo.isActive || !(promo.startDate instanceof Date) || !(promo.endDate instanceof Date)
    || promo.startDate > now || promo.endDate < now
    || !Number.isSafeInteger(promo.usageLimit) || promo.usageLimit < 0
    || !Number.isSafeInteger(promo.usedCount) || promo.usedCount < 0
    || (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit)) {
    return false;
  }

  const where: Record<string, unknown> = {
    id: promoCodeId,
    isActive: true,
    usageLimit: promo.usageLimit,
    startDate: { lte: now },
    endDate: { gte: now },
  };
  if (promo.usageLimit > 0) where.usedCount = { lt: promo.usageLimit };

  const updated = await transaction.promoCode.updateMany({
    where,
    data: { usedCount: { increment: 1 } },
  });
  return updated.count === 1;
}
