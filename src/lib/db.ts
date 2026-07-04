import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  const isTurso = databaseUrl.startsWith('libsql://')

  if (isTurso) {
    // Use libSQL driver adapter for Turso (production on Vercel)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')

    const url = process.env.NODE_ENV === 'production'
      ? databaseUrl
      : (process.env.DIRECT_URL ?? databaseUrl)

    const libsql = createClient({ url })
    const adapter = new PrismaLibSQL(libsql)

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'production' ? [] : ['query'],
    })
  }

  // Fallback: local SQLite for development
  return new PrismaClient({
    log: ['query'],
  })
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db