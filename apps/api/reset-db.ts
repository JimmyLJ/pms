import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function reset() {
  console.log("Dropping tables...");
  // Drop tables in correct order to avoid foreign key constraints
  await db.execute(sql`DROP TABLE IF EXISTS "member" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS "workspace" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS "session" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS "account" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS "verification" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS "user" CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS "users" CASCADE`); // Drop the old test table
  console.log("Tables dropped.");
  process.exit(0);
}

reset();
