-- Migration: Add context_summary column to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN context_summary TEXT;