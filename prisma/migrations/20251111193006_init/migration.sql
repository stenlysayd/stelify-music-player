/*
  Warnings:

  - You are about to drop the column `favorite` on the `Song` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Song" ("artist", "audioUrl", "coverUrl", "createdAt", "id", "title") SELECT "artist", "audioUrl", "coverUrl", "createdAt", "id", "title" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
