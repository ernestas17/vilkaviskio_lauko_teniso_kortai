-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "customerSurname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Reservation" ("confirmed", "createdAt", "customerName", "customerSurname", "date", "email", "endHour", "id", "phone", "startHour", "token") SELECT "confirmed", "createdAt", "customerName", "customerSurname", "date", "email", "endHour", "id", "phone", "startHour", "token" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_token_key" ON "Reservation"("token");
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

