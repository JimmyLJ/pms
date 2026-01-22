import { Hono } from "hono";
import projectsRouter from "../routes/projects";
import tasksRouter from "../routes/tasks";
import analyticsRouter from "../routes/analytics";
/**
 * 创建测试用的 Hono app 实例
 */
export function createTestApp() {
    const app = new Hono();
    app.route("/api/projects", projectsRouter);
    app.route("/api/tasks", tasksRouter);
    app.route("/api/analytics", analyticsRouter);
    return app;
}
