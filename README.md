# Notebook AI

AI-powered notebook for chatting with your PDFs, keeping session history, and exporting conversations to PDF.

## Features

- Upload PDFs and index them into vector storage for semantic search.
- Create chat sessions, attach/detach documents, and query only the selected files.
- AI responses with citations, auto-generated chat titles, and conversation summaries.
- Export chat transcripts to PDF from the dashboard.
- JWT authentication with refresh tokens and email verification (Mailgun).
- Health check endpoint for monitoring.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS 4, React Router, React Markdown
- **Backend**: Node.js, Express 5
- **Database**: Postgres (Drizzle ORM), ChromaDB Cloud (vector storage)
- **AI**: Gemini (OpenAI-compatible API)
- **Auth**: JWT, bcrypt, Mailgun for verification emails

## Project Structure

```
/client     - Vite + React frontend
/server     - Express backend
```

## Requirements

- Node.js 20+
- Postgres database
- ChromaDB Cloud API key (vector store)
- Gemini API key (embeddings + chat)
- Mailgun credentials (for email verification)

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
| --- | --- |
| `PORT` | Server port (default: `3000`) |
| `DATABASE_URL` | Postgres connection string |
| `MY_JWT_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `GEMINI_API_KEY` | Gemini API key |
| `CHROMADB_API_KEY` | ChromaDB Cloud API key |
| `CLIENT_APP_URL` | Frontend URL for CORS (default: `http://localhost:5173`) |
| `SERVER_APP_URL` | Backend base URL used in verification links (default: `http://localhost:3000`) |
| `MAILGUN_API_KEY` | Mailgun API key |
| `MAILGUN_DOMAIN` | Mailgun domain |
| `MAILGUN_FROM` | From address for Mailgun (default: `noreply@notebook-ai.com`) |

### Client (`client/.env`)

| Variable | Description |
| --- | --- |
| `VITE_SERVER_APP_URL` | Backend base URL (e.g., `http://localhost:3000`) |

## Setup

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
```

Ensure your Postgres database is running and apply the schema using the migrations in `server/drizzle`.

## Run (Development)

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

## Build

```bash
cd client && npm run build
```

## API Overview

Base URL: `http://localhost:3000/api/v1`

- **Auth**: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/verify-email`, `POST /auth/resend-verification`
- **Chat Sessions**: `POST /chat/sessions`, `GET /chat/sessions`, `DELETE /chat/sessions/:sessionId`
- **Session Files**: `GET /chat/sessions/:sessionId/files`, `POST /chat/sessions/:sessionId/files`, `DELETE /chat/sessions/:sessionId/files/:fileId`
- **Chat Messages**: `GET /chat/sessions/:sessionId/messages`, `POST /chat/sessions/:sessionId/messages`
- **Uploads**: `POST /upload`, `GET /upload`, `DELETE /upload/:fileId`
- **Users**: `GET /users/me`, `GET /users/chatHistory`
- **Health**: `GET /health`

## Deployment

- **Client**: Static build output from `client/dist` (Vercel, Netlify, etc.).
- **Server**: Use the `server/Dockerfile` or any Node 20 runtime. Set the required env vars.
