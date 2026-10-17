import { PrismaClient } from "@prisma/client";
import { resolvePrismaRuntimeUrl } from "./prisma-runtime-url";

function withConnectionLimit(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  if (rawUrl.includes("connection_limit=")) return rawUrl;
  const separator = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${separator}connection_limit=3&pool_timeout=20`;
}

const runtimeUrl = withConnectionLimit(resolvePrismaRuntimeUrl(process.env));
const prisma = runtimeUrl
  ? new PrismaClient({ datasources: { db: { url: runtimeUrl } } })
  : new PrismaClient();

export default prisma;
