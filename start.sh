#!/bin/bash

echo "🚀 启动 Loomi-Lab 智能体管理平台"
echo "================================"

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ 错误：请先安装 Node.js"
    exit 1
fi

echo "📦 Node.js 版本: $(node --version)"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# 检查端口占用
PORT=3000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    echo "⚠️  端口 $PORT 已被占用，尝试端口 $((PORT+1))"
    PORT=$((PORT+1))
done

echo "🌐 启动开发服务器..."
echo "📍 访问地址: http://localhost:$PORT"
echo "📊 仪表板: http://localhost:$PORT/dashboard"
echo "🔐 登录页面: http://localhost:$PORT/login"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 修改代码后会自动热重载"
echo "   - 默认使用深色主题"
echo ""

# 启动 Next.js 开发服务器
npm run dev
