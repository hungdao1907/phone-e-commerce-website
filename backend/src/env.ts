import dotenv from 'dotenv';
import { applyPrismaRuntimeUrl } from './config/prisma-runtime-url';

dotenv.config({ path: process.env.DOTENV_PATH || '.env', override: true });

// Express is a persistent backend: prefer the Supabase session/direct endpoint (5432)
// for every PrismaClient, including legacy routes that create their own clients.
applyPrismaRuntimeUrl(process.env);
