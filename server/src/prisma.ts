import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Prisma 7 connects at runtime through a driver adapter rather than a `url`
// in schema.prisma. The MariaDB adapter talks to the MySQL server in DATABASE_URL.
//
// `allowPublicKeyRetrieval` is required for MySQL's caching_sha2_password auth
// over a non-TLS connection — without it the handshake fails ("RSA public key
// is not available client side") and connections time out.
const url = process.env.DATABASE_URL ?? "";
const databaseUrl = url.includes("allowPublicKeyRetrieval")
  ? url
  : url + (url.includes("?") ? "&" : "?") + "allowPublicKeyRetrieval=true";

const adapter = new PrismaMariaDb(databaseUrl);

// Single shared Prisma client instance for the whole app.
export const prisma = new PrismaClient({ adapter });
