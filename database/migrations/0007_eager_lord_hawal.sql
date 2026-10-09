CREATE TYPE "public"."verification_document_status" AS ENUM('pending_upload', 'uploaded', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verification_document_type" AS ENUM('government_id', 'cac_certificate', 'other');--> statement-breakpoint
CREATE TABLE "verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"type" "verification_document_type" NOT NULL,
	"status" "verification_document_status" DEFAULT 'pending_upload' NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_documents_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
ALTER TABLE "business_verifications" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "bank_code" text;--> statement-breakpoint
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verification_id_business_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."business_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_documents_verification_id_idx" ON "verification_documents" USING btree ("verification_id");