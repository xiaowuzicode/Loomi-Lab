# 启动脚本说明

本项目提供了两个启动脚本，用于不同的开发场景：

## 📚 脚本概览

### 🚀 start.sh - 快速启动
**适用场景**: 日常开发，代码调试

**特性**:
- ⚡ 快速启动（保留 node_modules）
- 🧹 只清理编译缓存（.next, .turbo）
- 📦 跳过包重装，启动更快
- 🔄 适合频繁重启开发服务器

**使用**:
```bash
./start.sh
```

### 🔄 start-background.sh - 完全重新构建
**适用场景**: 重大更新，依赖变更，彻底重置

**特性**:
- 🧹 完全清理所有缓存和依赖
- 📦 重新安装 node_modules
- 🔨 完全重新构建项目
- 💯 确保最干净的启动环境

**使用**:
```bash
./start-background.sh
```

## 🎯 使用建议

| 场景 | 推荐脚本 | 启动时间 |
|------|---------|---------|
| 日常开发调试 | `start.sh` | ~30秒 |
| 修改依赖包后 | `start-background.sh` | ~2分钟 |
| 重大版本更新 | `start-background.sh` | ~2分钟 |
| 环境问题排查 | `start-background.sh` | ~2分钟 |
| 生产部署前测试 | `start-background.sh` | ~2分钟 |

## 📋 管理命令

### 查看服务状态
```bash
# 查看进程
ps aux | grep "next dev"

# 查看日志
tail -f app.log
```

### 停止服务
```bash
# 使用 PID 文件停止
kill $(cat loomi.pid)

# 或者手动停止
pkill -f "next dev"
```

### 检查端口
```bash
# 查看端口占用
lsof -i :3002

# 或者
ss -tulpn | grep :3002
```

## 🔐 登录信息


**访问地址**: http://localhost:3002/login