# 客户管理系统

一个功能完整的客户关系管理系统，包含产品管理、渠道管理、客户管理和许可管理等核心功能。

## 功能特性

### 🎯 核心功能
- **产品资料管理**: 文件系统管理，支持产品组件及版本管理
- **渠道管理**: 渠道信息管理，包含渠道类型、对接客户、使用产品等
- **客户关系管理**: 客户信息、行业分类、联系人、交付人员、部署计划等
- **许可管理**: 许可授权、到期提醒、特征码管理、有效点数统计

### 🔧 技术特性
- **现代化UI**: 基于Ant Design的美观界面
- **响应式设计**: 支持桌面和移动设备
- **实时数据**: 自动刷新和实时统计
- **文件管理**: 支持多种格式文件上传下载
- **数据关联**: 完整的数据关系管理

## 技术栈

### 后端
- **Node.js** + **Express**: 服务器框架
- **SQLite**: 轻量级数据库
- **Multer**: 文件上传处理
- **安全中间件**: Helmet, CORS, 限流等

### 前端
- **React 18** + **TypeScript**: 现代化前端框架
- **Ant Design**: 企业级UI组件库
- **Axios**: HTTP客户端
- **Lucide React**: 现代图标库
- **Day.js**: 轻量级日期处理

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client && npm install
```

### 启动开发服务器

```bash
# 启动后端服务器 (端口: 5000)
npm run dev

# 启动前端开发服务器 (端口: 3000)
cd client && npm start
```

### 访问应用

- 前端应用: http://localhost:3000
- 后端API: http://localhost:5000/api

## API 接口

### 产品管理
- `GET /api/products` - 获取产品列表
- `POST /api/products` - 创建产品
- `PUT /api/products/:id` - 更新产品
- `DELETE /api/products/:id` - 删除产品
- `GET /api/products/:id/download` - 下载产品文件

### 渠道管理
- `GET /api/channels` - 获取渠道列表
- `POST /api/channels` - 创建渠道
- `PUT /api/channels/:id` - 更新渠道
- `DELETE /api/channels/:id` - 删除渠道

### 客户管理
- `GET /api/customers` - 获取客户列表
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户

### 许可管理
- `GET /api/licenses` - 获取许可列表
- `POST /api/licenses` - 创建许可
- `PUT /api/licenses/:id` - 更新许可
- `DELETE /api/licenses/:id` - 删除许可
- `GET /api/licenses/expiring/soon` - 获取即将到期许可
- `GET /api/licenses/expired/all` - 获取已过期许可

## 数据库结构

### 主要数据表
- `products` - 产品信息表
- `channels` - 渠道信息表
- `customers` - 客户信息表
- `licenses` - 许可信息表

### 关联表
- `channel_customers` - 渠道客户关联
- `channel_products` - 渠道产品关联
- `customer_products` - 客户产品关联

## 部署说明

### 生产环境部署

1. **构建前端应用**
```bash
npm run build
```

2. **设置环境变量**
```bash
export NODE_ENV=production
export PORT=5000
```

3. **启动生产服务器**
```bash
npm start
```

### Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 开发指南

### 目录结构
```
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API服务
│   │   └── App.tsx         # 主应用
├── config/                 # 配置文件
├── routes/                 # API路由
├── uploads/                # 文件上传目录
├── server.js              # 服务器入口
└── package.json
```

### 添加新功能

1. **后端API**
   - 在 `routes/` 目录添加新的路由文件
   - 在 `config/database.js` 中添加数据表定义
   - 在 `server.js` 中注册新路由

2. **前端页面**
   - 在 `client/src/pages/` 添加新页面组件
   - 在 `client/src/services/api.ts` 添加API接口
   - 在 `App.tsx` 中添加路由配置

## 许可协议

MIT License

## 支持

如有问题或建议，请提交 Issue 或 Pull Request。