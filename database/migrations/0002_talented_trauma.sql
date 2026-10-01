CREATE TABLE "interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_interests" (
	"profile_id" uuid NOT NULL,
	"interest_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_interests_profile_id_interest_id_pk" PRIMARY KEY("profile_id","interest_id")
);
--> statement-breakpoint
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "interests_name_unique" ON "interests" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "profile_interests_interest_id_idx" ON "profile_interests" USING btree ("interest_id");