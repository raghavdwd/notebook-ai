ALTER TABLE "files" ADD COLUMN "source_type" varchar(20) DEFAULT 'pdf' NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "transcript_text" text;