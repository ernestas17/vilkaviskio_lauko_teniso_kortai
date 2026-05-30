import "dotenv/config";
import { randomUUID } from "node:crypto";
import { type Prisma } from "@prisma/client";
import { prisma } from "../src/prisma.js";

async function main() {
  // Seeded reservations are already confirmed (booked).
  const reservations: Prisma.ReservationCreateInput[] = [
    {
      customerName: "Jonas",
      customerSurname: "Jonaitis",
      email: "jonas@example.com",
      phone: "+37060000000",
      date: new Date("2026-06-01"),
      startHour: 9,
      endHour: 11,
      confirmed: true,
      token: randomUUID(),
    },
    {
      customerName: "Petras",
      customerSurname: "Petraitis",
      email: "petras@example.com",
      phone: "+37061111111",
      date: new Date("2026-06-01"),
      startHour: 17,
      endHour: 18,
      confirmed: true,
      token: randomUUID(),
    },
  ];

  for (const reservation of reservations) {
    await prisma.reservation.create({ data: reservation });
  }

  console.log(`Seeded ${reservations.length} reservations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
