-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Court";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "customerSurname" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Reservation" ("createdAt", "email", "id") SELECT "createdAt", "email", "id" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

