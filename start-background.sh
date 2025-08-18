#!/bin/bash

echo "🚀 启动 Loomi-Lab 智能体管理平台（后台运行）"
echo "============================================="

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

echo "🌐 启动开发服务器（后台运行）..."
echo "📍 访问地址: http://localhost:$PORT"
echo "📊 仪表板: http://localhost:$PORT/dashboard"
echo "🔐 登录页面: http://localhost:$PORT/login"
echo ""
echo "💡 提示："
echo "   - 查看日志: tail -f app.log"
echo "   - 停止服务: pkill -f 'npm run dev' 或 pm2 stop loomi-lab"
echo "   - 重启服务: ./start-background.sh"
echo ""

# 检查是否安装了 PM2
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 启动..."
    
    # 停止可能存在的进程
    pm2 delete loomi-lab 2>/dev/null || true
    
    # 启动应用
    PORT=$PORT pm2 start npm --name "loomi-lab" -- run dev
    
    echo "✅ 应用已后台启动"
    echo "📊 查看状态: pm2 status"
    echo "📋 查看日志: pm2 logs loomi-lab"
    
else
    echo "使用 nohup 启动..."
    
    # 停止可能存在的进程
    pkill -f "npm run dev" 2>/dev/null || true
    sleep 2
    
    # 后台启动
    nohup npm run dev > app.log 2>&1 &
    
    echo "✅ 应用已后台启动"
    echo "📋 查看日志: tail -f app.log"
    echo "🔍 查看进程: ps aux | grep 'npm run dev'"
fi

echo ""
echo "🎉 启动完成！"
