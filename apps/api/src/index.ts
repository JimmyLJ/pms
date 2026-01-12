import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { auth } from "./lib/auth"

const app = new Hono()

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
