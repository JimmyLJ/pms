import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { auth } from "./lib/auth"
import projectsRouter from "./routes/projects"
import tasksRouter from "./routes/tasks"

const app = new Hono()

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/projects", projectsRouter)
app.route("/api/tasks", tasksRouter)

app.get('/', (c) => {
  return c.json({
    message: 'Hello from Hono API'
  })
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
