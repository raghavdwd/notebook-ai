import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const userData = pgTable("user_data", {
  userId: serial("user_id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  chatId: serial("chat_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userData.userId, { onDelete: "cascade" }),
  userMsg: text("user_msg").notNull(),
  aiResponse: text("ai_response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  fileId: serial("file_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userData.userId, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  vectorId: text("vector_id"),
  chatId: text("chat_id"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});
