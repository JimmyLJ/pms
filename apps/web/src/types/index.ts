export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "completed" | string;
export type TaskType = "TASK" | "BUG" | "FEATURE" | "IMPROVEMENT" | "OTHER" | string;
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
  position: number;
  projectId: string;
  organizationId: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
}

export type ProjectStatus = "planning" | "active" | "completed" | "on_hold" | "cancelled" | string;
export type ProjectPriority = "low" | "medium" | "high";

export interface ProjectMember {
  id: string;
  name: string;
  image?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  progress?: number;
  startDate?: string | null;
  endDate?: string | null;
  leadId?: string | null;
  organizationId: string;
  members?: ProjectMember[];
  memberCount?: number;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export type OrgRole = "owner" | "admin" | "member";

export interface OrgMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrgRole;
  user: User;
  createdAt: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  leadId?: string;
  progress?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status: string;
  type?: string;
  priority?: string;
  projectId: string;
  workspaceId: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface AddMemberResponse {
  id: string;
  userId: string;
  role: string;
  user: User;
}
