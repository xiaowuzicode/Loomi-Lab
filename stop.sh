#!/bin/bash

echo "🛑 停止 Loomi-Lab 应用"
echo "====================="

# 检查是否使用 PM2
if command -v pm2 &> /dev/null; then
    echo "检查 PM2 进程..."
    if pm2 list | grep -q loomi-lab; then
        pm2 stop loomi-lab
        pm2 delete loomi-lab
        echo "✅ PM2 进程已停止"
    else
        echo "ℹ️  未找到 PM2 进程"
    fi
fi

# 停止 npm run dev 进程
echo "停止 npm run dev 进程..."
pkill -f "npm run dev" && echo "✅ npm 进程已停止" || echo "ℹ️  未找到 npm 进程"

# 停止可能的 node 进程
echo "停止相关 Node.js 进程..."
pkill -f "next-server" && echo "✅ Next.js 进程已停止" || echo "ℹ️  未找到 Next.js 进程"

# 检查端口占用
if lsof -i :3000 &>/dev/null; then
    echo "⚠️  端口 3000 仍被占用，尝试强制停止..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ 端口已释放" || echo "❌ 无法释放端口"
else
    echo "✅ 端口 3000 已释放"
fi

echo ""
echo "🎉 停止完成！"
