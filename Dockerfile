# 使用预构建方式：本地 build 好 dist/，Docker 只负责打包运行环境
# 运行前请先执行: pnpm --filter @pms/api build
FROM node:20-alpine
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖描述文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# 只安装 API 的生产依赖
RUN pnpm install --filter @pms/api --prod --frozen-lockfile

# 复制本地已构建好的 dist 文件
COPY apps/api/dist ./apps/api/dist

# 创建数据目录（用于挂载 SQLite Volume）
RUN mkdir -p /app/data

WORKDIR /app/apps/api

EXPOSE 3100

# 启动命令
CMD ["node", "dist/index.js"]