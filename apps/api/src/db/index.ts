import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client, { schema });
