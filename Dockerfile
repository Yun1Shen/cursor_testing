# 使用官方Node.js镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./

# 安装后端依赖
RUN npm ci --only=production

# 复制前端package.json
COPY client/package*.json ./client/

# 安装前端依赖并构建
RUN cd client && npm ci && npm run build

# 复制应用代码
COPY . .

# 创建uploads目录
RUN mkdir -p uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["npm", "start"]