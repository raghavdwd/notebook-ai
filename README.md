# Notebook AI

AI-powered notebook with PDF export and chat history.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS 4, React Router, React Markdown
- **Backend**: Node.js, Express, Bun
- **Database**: SQLite (Drizzle ORM), ChromaDB (vector storage)
- **Auth**: JWT, Bcrypt

## Project Structure

```
/client     - Vite + React frontend
/server     - Express backend
```

## Setup

```bash
# Install dependencies
cd server && npm install
cd client && npm install

# Server env vars (server/.env)
DATABASE_URL=./data.db
JWT_SECRET=your-secret
CLIENT_APP_URL=http://localhost:5173

# Client env vars (client/.env)
SERVER_APP_URL=http://localhost:3000
```

## Run

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

## Deploy

- **Client**: Vercel (auto-deploy from git)
- **Server**: Render Railway (set env vars)