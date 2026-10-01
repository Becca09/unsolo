ALTER TABLE "profiles" RENAME COLUMN "display_name" TO "full_name";--> statement-breakpoint
DROP INDEX "users_username_unique";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "username" text;--> statement-breakpoint
UPDATE "profiles" SET "username" = 'user_' || substr(replace("id"::text, '-', ''), 1, 10) WHERE "username" IS NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_unique" ON "profiles" USING btree (lower("username"));--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";