ALTER TABLE "user_data" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "user_data" ADD COLUMN "verification_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "user_data" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "context_summary" text;