import { drizzle as nodeDrizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dotenv from "dotenv";
import * as schema from "./schema";
dotenv.config();
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
export const db = nodeDrizzle(pool, { schema });
