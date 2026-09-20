-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Song" ("artist", "audioUrl", "createdAt", "id", "title") SELECT "artist", "audioUrl", "createdAt", "id", "title" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
