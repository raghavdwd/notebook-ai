import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

export const userData = pgTable("user_data", {
  userId: serial("user_id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  sessionId: serial("session_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userData.userId, { onDelete: "cascade" }),
  title: text("title").notNull().default("New chat"),
  contextSummary: text("context_summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chats = pgTable("chats", {
  chatId: serial("chat_id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => chatSessions.sessionId, { onDelete: "cascade" }),
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
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const chatSessionFiles = pgTable(
  "chat_session_files",
  {
    sessionId: integer("session_id")
      .notNull()
      .references(() => chatSessions.sessionId, { onDelete: "cascade" }),
    fileId: integer("file_id")
      .notNull()
      .references(() => files.fileId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionId, table.fileId] }),
  }),
);
