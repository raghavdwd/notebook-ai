import { config } from "dotenv";

config({ path: "./.env", quiet: true });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_EMBEDDINGS_MODEL = "gemini-embedding-001";
export const CHROMADB_API_KEY = process.env.CHROMADB_API_KEY;
export const CHROMADB_TENANT = process.env.CHROMADB_TENANT;
export const CHROMADB_DATABASE = process.env.CHROMADB_DATABASE;
export const CHROMADB_COLLECTION = process.env.CHROMADB_COLLECTION;
export const JWT_SECRET = process.env.MY_JWT_SECRET;
export const CLIENT_APP_URL = process.env.CLIENT_APP_URL;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
export const MAILGUN_FROM = process.env.MAILGUN_FROM;
export const SERVER_APP_URL = process.env.SERVER_APP_URL;
//console.log(JWT_SECRET);
