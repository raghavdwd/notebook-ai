import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/notebook_ai';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

console.log('Postgres database initialized.');
