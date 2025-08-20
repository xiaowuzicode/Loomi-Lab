#!/bin/bash

echo "🛑 停止 Loomi-Lab 应用"
echo "====================="

# 统一文件位置（与 start.sh 保持一致）
LOG_FILE="app.log"
PID_FILE="loomi.pid"
PORT_FILE="loomi.port"

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

# 优先根据 PID 文件精准停止
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ] && ps -p "$PID" &>/dev/null; then
        echo "尝试根据 PID 停止进程: $PID ..."
        # 尝试优雅停止
        kill "$PID" 2>/dev/null || true
        for i in {1..20}; do
            if ! ps -p "$PID" &>/dev/null; then
                break
            fi
            sleep 0.3
        done
        # 如未退出则强制
        if ps -p "$PID" &>/dev/null; then
            echo "进程未退出，强制终止..."
            kill -9 "$PID" 2>/dev/null || true
        else
            echo "✅ 进程已停止"
        fi
    else
        echo "ℹ️  PID 文件存在但进程不在或 PID 无效"
    fi

    # 解析该进程的端口（如果可用）
    PORT_FROM_CMD=$(ps -p "$PID" -o cmd= 2>/dev/null | sed -nE 's/.*-p[[:space:]]+([0-9]+).*/\1/p')
    rm -f "$PID_FILE"
else
    echo "ℹ️  未发现 PID 文件，回退为进程名匹配停止"
fi

# 回退：按进程名停止（避免残留）
echo "停止 npm run dev 进程..."
pkill -f "npm run dev" && echo "✅ npm 进程已停止" || echo "ℹ️  未找到 npm 进程"

echo "停止相关 Next.js 进程..."
pkill -f "next-server" && echo "✅ Next.js 进程已停止" || echo "ℹ️  未找到 Next.js 进程"

# 端口释放校验（优先使用解析到的端口，否则默认 3000）
check_port_release() {
    local p="$1"
    if command -v ss >/dev/null 2>&1; then
        if ss -ltnp | grep -q ":$p\b"; then
            echo "⚠️  端口 $p 仍在监听，尝试强制释放..."
            # 查找 next-server 相关 PID 强制结束
            pgrep -f "next-server" | xargs -r kill -9 2>/dev/null || true
            if ss -ltnp | grep -q ":$p\b"; then
                echo "❌ 端口 $p 仍被占用，请手动排查 (ss -ltnp)"
            else
                echo "✅ 端口 $p 已释放"
            fi
        else
            echo "✅ 端口 $p 已释放"
        fi
    elif command -v lsof >/dev/null 2>&1; then
        if lsof -i :"$p" &>/dev/null; then
            echo "⚠️  端口 $p 仍被占用，尝试强制释放..."
            lsof -ti:"$p" | xargs -r kill -9 2>/dev/null || true
            lsof -i :"$p" &>/dev/null && echo "❌ 端口 $p 仍被占用" || echo "✅ 端口 $p 已释放"
        else
            echo "✅ 端口 $p 已释放"
        fi
    else
        echo "ℹ️  无 ss/lsof 可用，跳过端口校验"
    fi
}

if [ -n "$PORT_FROM_CMD" ]; then
    check_port_release "$PORT_FROM_CMD"
else
    # 未能解析端口时，按默认 3000 给出校验
    if [ -f "$PORT_FILE" ]; then
        PORT_FALLBACK=$(cat "$PORT_FILE" 2>/dev/null)
        if [[ "$PORT_FALLBACK" =~ ^[0-9]+$ ]]; then
            check_port_release "$PORT_FALLBACK"
        else
            check_port_release 3000
        fi
        rm -f "$PORT_FILE"
    else
        check_port_release 3000
    fi
fi

echo ""
echo "🎉 停止完成！"
