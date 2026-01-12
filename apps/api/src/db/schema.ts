import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

// --- Auth Tables (Better-Auth Standard) ---

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => users.id),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => users.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

// --- Business Tables ---

export const workspaces = pgTable("workspace", {
  id: text("id").primaryKey(), // Better-Auth 插件通常生成文本 ID
  name: text("name").notNull(),
  slug: text("slug").unique(), // 用于 URL 访问，如 /org/my-company
  logo: text("logo"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const members = pgTable("member", {
  id: text("id").primaryKey(),
  workspaceId: text("workspaceId").notNull().references(() => workspaces.id),
  userId: text("userId").notNull().references(() => users.id),
  role: text("role").notNull(), // 'admin', 'member'
  createdAt: timestamp("createdAt").notNull(),
});

// Organization plugin might need invitation table, but let's start with basic core tables first.
// The organization plugin will likely handle invitations internally or we will add it later.