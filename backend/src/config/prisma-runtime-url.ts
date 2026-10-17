export type PrismaRuntimeEnvironment = {
  PRISMA_RUNTIME_URL?: string;
  DIRECT_URL?: string;
  DATABASE_URL?: string;
};

/** Prefer an explicit runtime URL, then Supabase transaction pooler (port 6543) for high concurrency, falling back to direct URL. */
export function resolvePrismaRuntimeUrl(environment: PrismaRuntimeEnvironment): string | undefined {
  return environment.PRISMA_RUNTIME_URL?.trim()
    || environment.DATABASE_URL?.trim()
    || environment.DIRECT_URL?.trim();
}

/** Make the selected URL visible to legacy route modules that construct their own PrismaClient. */
export function applyPrismaRuntimeUrl(environment: PrismaRuntimeEnvironment): string | undefined {
  const runtimeUrl = resolvePrismaRuntimeUrl(environment);
  if (runtimeUrl) environment.DATABASE_URL = runtimeUrl;
  return runtimeUrl;
}
