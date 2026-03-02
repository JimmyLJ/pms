import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- 认证表 (Better-Auth 标准) ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  activeOrganizationId: text("activeOrganizationId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// --- 组织插件表 ---

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  metadata: text("metadata"),
});

export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'admin' (管理员), 'member' (成员), 'owner' (所有者)
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  inviterId: text("inviterId").notNull().references(() => user.id),
});

// --- 业务表 ---

export const projects = sqliteTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"),
  priority: text("priority").default("medium"),
  startDate: integer("startDate", { mode: "timestamp" }),
  endDate: integer("endDate", { mode: "timestamp" }),
  leadId: text("leadId").references(() => user.id),
  progress: integer("progress").default(0),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const projectMembers = sqliteTable("project_member", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const tasks = sqliteTable("task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // 'TODO' (待办), 'IN_PROGRESS' (进行中), 'DONE' (已完成) 等
  type: text("type"), // 'TASK' (任务), 'BUG' (缺陷), 'FEATURE' (特性), 'IMPROVEMENT' (改进), 'OTHER' (其他)
  priority: text("priority").default("medium"), // 'LOW' (低), 'MEDIUM' (中), 'HIGH' (高)
  position: integer("position").notNull().default(0),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  assigneeId: text("assigneeId").references(() => user.id),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});
