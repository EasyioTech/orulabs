import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

// Single connection for migrations, connection pool for queries
const queryClient = postgres(connectionString, { max: 20 });

export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
