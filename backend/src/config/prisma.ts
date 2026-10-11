import { PrismaClient } from '@prisma/client';
import { resolvePrismaRuntimeUrl } from './prisma-runtime-url';

const runtimeUrl = resolvePrismaRuntimeUrl(process.env);
const prisma = runtimeUrl
  ? new PrismaClient({ datasources: { db: { url: runtimeUrl } } })
  : new PrismaClient();

export default prisma;
