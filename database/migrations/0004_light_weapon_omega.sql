CREATE TYPE "public"."payout_provider" AS ENUM('stripe', 'local');--> statement-breakpoint
CREATE TABLE "payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" "payout_provider" NOT NULL,
	"provider_account_id" text NOT NULL,
	"display_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payout_accounts_profile_id_provider_unique" ON "payout_accounts" USING btree ("profile_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_accounts_provider_account_unique" ON "payout_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "payout_accounts_profile_id_idx" ON "payout_accounts" USING btree ("profile_id");