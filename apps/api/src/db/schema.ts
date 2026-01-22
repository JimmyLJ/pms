import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

// --- 认证表 (Better-Auth 标准) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  activeOrganizationId: text("activeOrganizationId"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// --- 组织插件表 ---

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("createdAt").notNull(),
  metadata: text("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'admin' (管理员), 'member' (成员), 'owner' (所有者)
  createdAt: timestamp("createdAt").notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  inviterId: text("inviterId").notNull().references(() => user.id),
});

// --- 业务表 ---

export const projects = pgTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"),
  priority: text("priority").default("medium"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  leadId: text("leadId").references(() => user.id),
  progress: integer("progress").default(0),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const projectMembers = pgTable("project_member", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp("createdAt").notNull(),
});

export const tasks = pgTable("task", {
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
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});
