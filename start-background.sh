#!/bin/bash

echo "🚀 启动 Loomi-Lab 智能体管理平台（完全重新构建）"
echo "=================================================="

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ 错误：请先安装 Node.js"
    exit 1
fi

echo "📦 Node.js 版本: $(node --version)"

# 完全清理所有缓存和依赖
echo "🧹 完全清理缓存和依赖..."
echo "   - 清理 Next.js 构建缓存"
rm -rf .next
rm -rf .turbo
echo "   - 清理 Node.js 缓存"
rm -rf node_modules/.cache
npm cache clean --force 2>/dev/null || true
echo "   - 重新安装依赖包"
rm -rf node_modules
rm -f package-lock.json

echo "📥 重新安装依赖..."
npm install

# 端口与日志配置
PORT=${PORT:-3000}
LOG_FILE="app.log"
PID_FILE="loomi.pid"
PORT_FILE="loomi.port"

# 检查端口占用（兼容 lsof/ss/netstat）
port_in_use() {
    local p="$1"
    if command -v lsof >/dev/null 2>&1; then
        lsof -Pi :"$p" -sTCP:LISTEN -t >/dev/null
        return $?
    elif command -v ss >/dev/null 2>&1; then
        ss -ltn | awk '{print $4}' | grep -q ":$p$"
        return $?
    elif command -v netstat >/dev/null 2>&1; then
        netstat -ltn 2>/dev/null | awk '{print $4}' | grep -q ":$p$"
        return $?
    else
        return 1
    fi
}

while port_in_use "$PORT" ; do
    echo "⚠️  端口 $PORT 已被占用，尝试端口 $((PORT+1))"
    PORT=$((PORT+1))
done

PUBLIC_IP=$(curl -s --max-time 2 ifconfig.me || true)
PRIVATE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo "🌐 启动开发服务器（后台运行，完全重新构建）..."
if [ -n "$PUBLIC_IP" ]; then
    echo "📍 公网访问: http://$PUBLIC_IP:$PORT"
else
    echo "📍 公网访问: http://<你的云服务器公网IP>:$PORT"
fi
if [ -n "$PRIVATE_IP" ]; then
    echo "📍 内网访问: http://$PRIVATE_IP:$PORT"
fi
echo "📍 本机: http://localhost:$PORT"
echo "📊 仪表板: http://<IP或域名>:$PORT/dashboard"
echo "🔐 登录页面: http://<IP或域名>:$PORT/login"
echo ""
echo "💡 提示："
echo "   - 日志文件: $LOG_FILE (使用 'tail -f $LOG_FILE' 查看)"
echo "   - 进程 PID 文件: $PID_FILE (使用 'kill \$(cat $PID_FILE)' 停止)"
echo "   - 完全重新构建完成，所有缓存已清理"
echo "   - 修改代码后会自动热重载"
echo ""

# 启动 Next.js 开发服务器（绑定 0.0.0.0，并后台运行，完全重新构建）
export NODE_ENV=development
nohup npx next dev --turbo -H 0.0.0.0 -p "$PORT" >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
echo "$PORT" > "$PORT_FILE"
echo "✅ 已后台启动，PID: $(cat "$PID_FILE")"

# 等待端口就绪（最多 30s）
echo "⏳ 等待服务在端口 $PORT 上监听..."
for i in {1..60}; do
    if command -v ss >/dev/null 2>&1; then
        if ss -ltn | awk '{print $4}' | grep -q ":$PORT$"; then
            echo "✅ 服务已在 0.0.0.0:$PORT 监听"
            break
        fi
    elif command -v lsof >/dev/null 2>&1; then
        if lsof -nPi :"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "✅ 服务已在 0.0.0.0:$PORT 监听"
            break
        fi
    fi
    sleep 0.5
    if [ "$i" -eq 60 ]; then
        echo "⚠️ 等待超时：请查看日志 $LOG_FILE"
    fi
done

echo ""
echo "🎉 完全重新构建启动完成！"
