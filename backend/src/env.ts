import dotenv from 'dotenv';
import { applyPrismaRuntimeUrl } from './config/prisma-runtime-url';

dotenv.config({ path: process.env.DOTENV_PATH || '.env', override: true });

// Express is a persistent backend: prefer the Supabase transaction pooler (6543) for concurrency
// for every PrismaClient, including legacy routes that create their own clients.
applyPrismaRuntimeUrl(process.env);
