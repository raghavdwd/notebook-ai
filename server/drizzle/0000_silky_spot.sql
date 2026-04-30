CREATE TABLE "chats" (
	"chat_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_msg" text NOT NULL,
	"ai_response" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"file_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_path" text NOT NULL,
	"vector_id" text,
	"chat_id" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_data" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_data_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_data_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_user_data_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;