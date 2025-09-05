#!/bin/bash

# 清理文档中的敏感配置信息脚本
# 将所有敏感的数据库配置信息替换为占位符

echo "🧹 开始清理文档中的敏感配置信息..."

# 定义要替换的敏感信息
declare -A REPLACEMENTS=(
    ["47.237.167.117"]="[REDACTED-HOST]"
    ["15432"]="[REDACTED-PORT]"
    ["16379"]="[REDACTED-PORT]"  
    ["loomi_pay"]="[REDACTED-DB]"
    ["loomi_user"]="[REDACTED-USER]"
    ["loomi_pass_2024"]="[REDACTED-PASSWORD]"
)

# 要处理的文件列表
FILES=(
    "app/payments/docs/external-access-guide.md"
    "app/payments/docs/external-access-guide.md"
)

# 备份原文件
echo "📦 创建备份文件..."
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ 备份: $file"
    fi
done

# 执行替换
echo "🔄 执行敏感信息替换..."
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "处理文件: $file"
        
        # 对每个敏感信息进行替换
        for sensitive in "${!REPLACEMENTS[@]}"; do
            replacement="${REPLACEMENTS[$sensitive]}"
            
            # 使用sed进行替换（macOS兼容）
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/${sensitive}/${replacement}/g" "$file"
            else
                sed -i "s/${sensitive}/${replacement}/g" "$file"
            fi
            
            echo "  替换: $sensitive -> $replacement"
        done
        
        echo "✅ 完成处理: $file"
    else
        echo "⚠️  文件不存在: $file"
    fi
done

# 添加安全提醒到文件开头
echo "📝 添加安全配置提醒..."
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        # 创建临时文件，添加安全提醒
        {
            echo "<!-- ⚠️ 安全提醒: 此文档中的敏感配置已被清理 -->"
            echo "<!-- 实际配置请联系管理员或查看 SECURITY_CONFIG_GUIDE.md -->"
            echo ""
            cat "$file"
        } > "$file.tmp" && mv "$file.tmp" "$file"
        
        echo "✅ 添加安全提醒: $file"
    fi
done

echo ""
echo "🎉 敏感配置清理完成！"
echo "📋 处理摘要:"
echo "  - 已备份原文件 (*.backup.*)"
echo "  - 已替换敏感配置信息"
echo "  - 已添加安全配置提醒"
echo ""
echo "📚 后续步骤:"
echo "  1. 查看 SECURITY_CONFIG_GUIDE.md 了解安全配置"
echo "  2. 使用 scripts/encrypt-config.js 生成加密配置"
echo "  3. 更新生产环境的环境变量"
echo ""
echo "🔐 记住: 永远不要在代码或文档中包含真实的生产配置！"