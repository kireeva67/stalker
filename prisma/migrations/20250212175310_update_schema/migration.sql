/*
  Warnings:

  - Added the required column `url` to the `Polls` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Polls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poll_id" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "options" JSONB NOT NULL,
    "url" TEXT NOT NULL,
    CONSTRAINT "Polls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Polls" ("chat_id", "id", "options", "poll_id", "user_id") SELECT "chat_id", "id", "options", "poll_id", "user_id" FROM "Polls";
DROP TABLE "Polls";
ALTER TABLE "new_Polls" RENAME TO "Polls";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
