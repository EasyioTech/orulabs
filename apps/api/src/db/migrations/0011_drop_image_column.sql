-- Merge `image` into `avatar_url` (OAuth remnant), then drop the duplicate column.
-- avatar_url is the canonical field used everywhere in the codebase.
UPDATE "users" SET "avatar_url" = "image" WHERE "avatar_url" IS NULL AND "image" IS NOT NULL;
ALTER TABLE "users" DROP COLUMN "image";
