import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

// --- Auth Tables (Better-Auth Standard) ---

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

// --- Organization Plugin Tables ---

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
  role: text("role").notNull(), // 'admin', 'member', 'owner'
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

// --- Business Tables ---

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
  status: text("status").notNull(), // 'TODO', 'IN_PROGRESS', 'DONE', etc.
  type: text("type"), // 'TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'OTHER'
  priority: text("priority").default("medium"), // 'LOW', 'MEDIUM', 'HIGH'
  position: integer("position").notNull().default(0),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
  assigneeId: text("assigneeId").references(() => user.id),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});
