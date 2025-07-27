#!/bin/bash

echo "🚀 启动客户管理系统..."

# 检查 Node.js 版本
node_version=$(node -v)
echo "Node.js 版本: $node_version"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd client && npm install && cd ..
fi

echo "🗄️  初始化数据库..."
# 后端服务器会自动创建数据库和表

echo "🌐 启动后端服务器 (端口: 5000)..."
npm start &
backend_pid=$!

echo "⏳ 等待后端服务器启动..."
sleep 3

echo "🎨 启动前端开发服务器 (端口: 3000)..."
cd client && npm start &
frontend_pid=$!

echo "✅ 系统启动完成!"
echo ""
echo "📊 访问地址:"
echo "  - 前端应用: http://localhost:3000"
echo "  - 后端API:  http://localhost:5000/api"
echo ""
echo "⚡ 功能模块:"
echo "  - 📦 产品管理 (文件系统)"
echo "  - 🤝 渠道管理 (合作伙伴)"
echo "  - 👥 客户管理 (CRM系统)"
echo "  - 📄 许可管理 (授权控制)"
echo ""
echo "💡 提示: 按 Ctrl+C 停止所有服务"

# 等待用户中断
wait