import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { hashPassword } from "../auth/password";

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://oruclass:oruclass_dev_secret@localhost:5433/oruclass";
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  const email = "dev.trainer@oruclass.test";
  const password = "password123";
  const hashed = await hashPassword(password);

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing) {
    await db.update(schema.users)
      .set({ hashedPassword: hashed, emailVerified: true })
      .where(eq(schema.users.email, email));
    console.log("Updated dev trainer user with verified email and password.");
  } else {
    console.log("Dev trainer user not found. Did you run the seed script?");
  }

  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  await client.end();
}

main().catch(console.error);
