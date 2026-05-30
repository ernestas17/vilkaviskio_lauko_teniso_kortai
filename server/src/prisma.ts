import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 connects at runtime through a driver adapter rather than a `url`
// in schema.prisma. The path is resolved relative to process.cwd() (server/).
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

// Single shared Prisma client instance for the whole app.
export const prisma = new PrismaClient({ adapter });
