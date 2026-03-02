# --- 阶段 1: 构建 ---
FROM node:20-alpine AS builder
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件 (利用缓存加速)
COPY package.json pnpm-lock.yaml ./
# 复制所有子项目的 package.json (pnpm -r 需要它们)
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/ 2>/dev/null || true

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制全部源代码
COPY . .

# 执行全量构建 (对应你 package.json 里的 pnpm -r build)
RUN pnpm run build

# --- 阶段 2: 运行 (极小体积) ---
FROM node:20-alpine
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制根依赖文件
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制编译好的后端代码
# 假设你的 api 构建产物在 apps/api/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3001

# 启动命令 (假设你的 api package.json 里有 "start": "node dist/index.js")
# 如果不确定，通常 hono 构建后是 node dist/index.js 或 node dist/server.js
CMD ["node", "dist/index.js"]