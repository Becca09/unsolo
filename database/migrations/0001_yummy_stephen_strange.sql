CREATE TYPE "public"."social_platform" AS ENUM('instagram', 'x');--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"handle" text,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_accounts_handle_or_url" CHECK ("social_accounts"."handle" is not null or "social_accounts"."url" is not null)
);
--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "social_accounts_profile_id_platform_unique" ON "social_accounts" USING btree ("profile_id","platform");--> statement-breakpoint
CREATE INDEX "social_accounts_profile_id_idx" ON "social_accounts" USING btree ("profile_id");