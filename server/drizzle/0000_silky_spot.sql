CREATE TABLE "user_data" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_data_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"chat_id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
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
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_session_files" (
	"session_id" integer NOT NULL,
	"file_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chat_session_files_session_id_file_id_pk" PRIMARY KEY("session_id","file_id")
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_user_data_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_session_id_chat_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_data_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_user_data_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session_files" ADD CONSTRAINT "chat_session_files_session_id_chat_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session_files" ADD CONSTRAINT "chat_session_files_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("file_id") ON DELETE cascade ON UPDATE no action;
