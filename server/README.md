# server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run server.js
```

## Deploy to Vercel

Use `server` as the Vercel project root directory.

Required Vercel environment variables:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `CHROMADB_API_KEY`
- `MY_JWT_SECRET`

The Express app is exported from `server.js`, which Vercel detects as the backend entry. Local development still works with:

```bash
npm run dev
```

Health check:

```bash
GET /api/health
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
