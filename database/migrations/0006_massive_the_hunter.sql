CREATE TYPE "public"."business_verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."social_platform" ADD VALUE 'tiktok';--> statement-breakpoint
CREATE TABLE "business_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"nin" text NOT NULL,
	"bvn" text,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"state" text NOT NULL,
	"city" text NOT NULL,
	"lga" text NOT NULL,
	"street" text NOT NULL,
	"status" "business_verification_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_verifications_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
ALTER TABLE "payout_accounts" ALTER COLUMN "provider_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "account_name" text;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_verifications_profile_id_idx" ON "business_verifications" USING btree ("profile_id");