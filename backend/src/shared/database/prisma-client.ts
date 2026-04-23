/**
 * Prisma client singleton.
 * Prisma 7 requires an adapter for database connection.
 * Reuses the same client instance across hot-reloads in development.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { URL } from 'node:url';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') || 'public';
  const sslMode = url.searchParams.get('sslmode');
  const sslAccept = url.searchParams.get('sslaccept');
  const isSupabase = url.hostname.endsWith('supabase.com');
  const shouldDisableTlsVerification =
    sslMode === 'no-verify' || sslAccept === 'accept_invalid_certs' || isSupabase;
  const maxConnections = Number.parseInt(process.env.PG_POOL_MAX || (isSupabase ? '1' : '10'), 10);

  const pool = new pg.Pool({
    connectionString,
    max: Number.isFinite(maxConnections) && maxConnections > 0 ? maxConnections : 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
    ssl: shouldDisableTlsVerification ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool as any, { schema });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
