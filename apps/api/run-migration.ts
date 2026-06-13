import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sqlClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function main() {
  try {
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log('Migration done');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

main();
