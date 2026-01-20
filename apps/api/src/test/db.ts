import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";

dotenv.config();

// 使用测试数据库 URL，如果没有设置则使用默认数据库
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: testDatabaseUrl,
});

export const testDb = drizzle(pool, { schema });

/**
 * 重置数据库 - 清空所有表数据
 * 按照外键依赖顺序删除
 */
export async function resetDatabase() {
  // 按依赖顺序删除（子表先删除）
  await testDb.delete(schema.tasks);
  await testDb.delete(schema.projectMembers);
  await testDb.delete(schema.projects);
  await testDb.delete(schema.invitation);
  await testDb.delete(schema.member);
  await testDb.delete(schema.organization);
  await testDb.delete(schema.session);
  await testDb.delete(schema.account);
  await testDb.delete(schema.verification);
  await testDb.delete(schema.user);
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase() {
  await pool.end();
}
