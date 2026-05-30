import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 configuration. The connection URL lives here (and is consumed by the
// driver adapter at runtime, see src/prisma.ts) instead of in schema.prisma.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Used by the CLI for migrate / studio / introspection commands.
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
