# 多阶段构建 Dockerfile
# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# 复制前端依赖文件
COPY client/package*.json ./
RUN npm ci --only=production

# 复制前端源码并构建
COPY client/ ./
RUN npm run build

# 阶段2: 构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app

# 复制后端依赖文件
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制后端源码
COPY src/ ./src/

# 构建后端
RUN npm run build

# 阶段3: 生产环境镜像
FROM node:18-alpine AS production

# 安装 dumb-init 用于信号处理
RUN apk add --no-cache dumb-init

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# 复制依赖文件并安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制文件
COPY --from=backend-builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=frontend-builder --chown=nestjs:nodejs /app/client/dist ./public

# 切换到应用用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
