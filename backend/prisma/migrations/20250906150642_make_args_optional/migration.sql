-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrustedProcess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comm" TEXT NOT NULL,
    "args" TEXT,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TrustedProcess" ("added_at", "args", "comm", "id") SELECT "added_at", "args", "comm", "id" FROM "TrustedProcess";
DROP TABLE "TrustedProcess";
ALTER TABLE "new_TrustedProcess" RENAME TO "TrustedProcess";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
