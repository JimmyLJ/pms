import { db } from "./src/db";
import { sql } from "drizzle-orm";
async function truncate() {
    console.log("Truncating all tables...");
    // Truncate all tables, CASCADE will handle foreign key dependencies
    await db.execute(sql `
    TRUNCATE TABLE
      "task",
      "project",
      "member",
      "organization",
      "session",
      "account",
      "verification",
      "user"
    CASCADE
  `);
    console.log("All data cleared. Table structures preserved.");
    process.exit(0);
}
truncate().catch((err) => {
    console.error("Error truncating tables:", err);
    process.exit(1);
});
