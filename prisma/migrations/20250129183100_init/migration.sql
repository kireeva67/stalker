-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegram_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "is_bot" BOOLEAN NOT NULL,
    "last_name" TEXT,
    "first_name" TEXT
);

-- CreateTable
CREATE TABLE "Links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "available_params" JSONB NOT NULL,
    "selected_params" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "Links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Links_user_id_key" ON "Links"("user_id");
