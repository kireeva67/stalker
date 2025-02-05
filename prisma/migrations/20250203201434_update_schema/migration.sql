-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "available_params" JSONB NOT NULL,
    "selected_params" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "Links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Links" ("available_params", "id", "is_active", "selected_params", "url", "user_id") SELECT "available_params", "id", "is_active", "selected_params", "url", "user_id" FROM "Links";
DROP TABLE "Links";
ALTER TABLE "new_Links" RENAME TO "Links";
CREATE UNIQUE INDEX "Links_user_id_key" ON "Links"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
