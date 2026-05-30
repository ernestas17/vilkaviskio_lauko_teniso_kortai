import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma.js";

// Creates (or updates) the admin account from .env. The plaintext password is
// hashed here, at seeding time.
//   ADMIN_EMAIL     — required
//   ADMIN_PASSWORD  — required (plaintext)
async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const plain = process.env.ADMIN_PASSWORD;
  if (!email) throw new Error("Set ADMIN_EMAIL in server/.env");
  if (!plain) throw new Error("Set ADMIN_PASSWORD in server/.env");

  const password = bcrypt.hashSync(plain, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password },
    create: { email, password },
  });
  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
