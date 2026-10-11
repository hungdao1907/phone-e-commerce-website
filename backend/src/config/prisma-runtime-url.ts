export type PrismaRuntimeEnvironment = {
  PRISMA_RUNTIME_URL?: string;
  DIRECT_URL?: string;
  DATABASE_URL?: string;
};

/** Prefer an explicit runtime URL, then Supabase's session/direct URL for the persistent Express server. */
export function resolvePrismaRuntimeUrl(environment: PrismaRuntimeEnvironment): string | undefined {
  return environment.PRISMA_RUNTIME_URL?.trim()
    || environment.DIRECT_URL?.trim()
    || environment.DATABASE_URL?.trim();
}

/** Make the selected URL visible to legacy route modules that construct their own PrismaClient. */
export function applyPrismaRuntimeUrl(environment: PrismaRuntimeEnvironment): string | undefined {
  const runtimeUrl = resolvePrismaRuntimeUrl(environment);
  if (runtimeUrl) environment.DATABASE_URL = runtimeUrl;
  return runtimeUrl;
}
