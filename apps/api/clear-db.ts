import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function clearData() {
  console.log("Clearing all data from tables...");
  try {
    // 按顺序删除以避免外键冲突
    await db.execute(sql`TRUNCATE TABLE "member" RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "invitation" RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "organization" RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "session" RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "account" RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "verification" RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "user" RESTART IDENTITY CASCADE`);
    console.log("All data cleared successfully.");
  } catch (err) {
    console.error("Failed to clear data:", err);
  } finally {
    process.exit(0);
  }
}

clearData();
