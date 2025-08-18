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

# 端口与日志配置
PORT=${PORT:-3000}
LOG_FILE="app.log"
PID_FILE="loomi.pid"

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

echo "🌐 启动开发服务器 (后台运行)..."
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
echo "   - 修改代码后会自动热重载"
echo "   - 默认使用深色主题"
echo ""

# 启动 Next.js 开发服务器（绑定 0.0.0.0，并后台运行）
nohup npm run dev -- -H 0.0.0.0 -p "$PORT" >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
echo "✅ 已后台启动，PID: $(cat "$PID_FILE")"
