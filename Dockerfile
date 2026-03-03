# --- 阶段 1: 构建 ---
FROM node:20-alpine AS builder
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件 (利用层缓存加速)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制全部源代码
COPY . .

# 执行全量构建
RUN pnpm run build

# --- 阶段 2: 运行 (精简体积) ---
FROM node:20-alpine
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制根依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# 只安装后端生产依赖
RUN pnpm install --filter @pms/api --prod --frozen-lockfile

# 从构建阶段复制编译好的后端代码
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# 创建数据目录（用于挂载 SQLite Volume）
RUN mkdir -p /app/data

WORKDIR /app/apps/api

EXPOSE 3100

# 启动命令
# 注意: 生产环境请通过 Docker Volume 挂载数据库文件
# 示例: docker run -v /your/host/data:/app/data -e DATABASE_URL=file:/app/data/pms.db ...
CMD ["node", "dist/index.js"]