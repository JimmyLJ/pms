import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import { auth } from "./lib/auth"
import projectsRouter from "./routes/projects"
import tasksRouter from "./routes/tasks"
import analyticsRouter from "./routes/analytics"
import searchRouter from "./routes/search"
import uploadsRouter from "./routes/uploads"
import organizationsRouter from "./routes/organizations"

import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
)

// Serve static files from uploads directory
app.use('/uploads/*', serveStatic({
  root: './uploads',
  rewriteRequestPath: (path) => path.replace(/^\/uploads/, ''),
}))

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/projects", projectsRouter)
app.route("/api/tasks", tasksRouter)
app.route("/api/analytics", analyticsRouter)
app.route("/api/search", searchRouter)
app.route("/api/uploads", uploadsRouter)
app.route("/api/organizations", organizationsRouter)

app.get('/', (c) => {
  return c.json({
    message: 'Hello from Hono API'
  })
})

const port = 3000
console.log(`Server is running on http://127.0.0.1:${port}`)

serve({
  fetch: app.fetch,
  port,
  hostname: '127.0.0.1'
})
