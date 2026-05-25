import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  // Remove file: prefix to get actual path
  let dbPath = dbUrl.startsWith('file:') ? dbUrl.substring(5) : dbUrl;
  
  // Resolve path relative to current working directory
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.resolve(process.cwd(), dbPath);
  }
  
  console.log(`[Database] Initializing SQLite database adapter at: ${dbPath}`);
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
