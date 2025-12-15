#!/bin/bash

# Alibaba PuHuiTi 字体下载脚本
# macOS / Linux

echo "🚀 开始下载 Alibaba PuHuiTi 字体..."

# 创建字体目录
FONT_DIR="$HOME/Library/Fonts/Alibaba-PuHuiTi"
if [ ! -d "$FONT_DIR" ]; then
    mkdir -p "$FONT_DIR"
fi

# 字体文件列表
declare -A FONTS=(
    ["Alibaba-PuHuiTi-3-35-Thin"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-35-Thin.ttf"
    ["Alibaba-PuHuiTi-3-45-Light"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-45-Light.ttf"
    ["Alibaba-PuHuiTi-3-55-Regular"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-55-Regular.ttf"
    ["Alibaba-PuHuiTi-3-65-Medium"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-65-Medium.ttf"
    ["Alibaba-PuHuiTi-3-75-SemiBold"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-75-SemiBold.ttf"
    ["Alibaba-PuHuiTi-3-85-Bold"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-85-Bold.ttf"
    ["Alibaba-PuHuiTi-3-95-ExtraBold"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-95-ExtraBold.ttf"
    ["Alibaba-PuHuiTi-3-105-Heavy"]="https://github.com/alibaba/PuHuiTi/releases/download/V3.0.0/Alibaba-PuHuiTi-3-105-Heavy.ttf"
)

# 下载字体文件
for font_name in "${!FONTS[@]}"; do
    font_url="${FONTS[$font_name]}"
    font_path="$FONT_DIR/$font_name.ttf"

    if [ ! -f "$font_path" ]; then
        echo "⬇️  下载 $font_name..."
        curl -L -o "$font_path" "$font_url"
        if [ $? -eq 0 ]; then
            echo "✅ $font_name 下载完成"
        else
            echo "❌ $font_name 下载失败"
        fi
    else
        echo "⏭️  $font_name 已存在，跳过"
    fi
done

echo ""
echo "✨ 字体安装完成！"
echo "📂 字体位置：$FONT_DIR"
echo ""
echo "📝 使用方法："
echo "   在CSS中使用："
echo "   font-family: 'Alibaba PuHuiTi 3.0 45 Light', sans-serif;"
echo ""
echo "💡 提示：可能需要重启应用程序才能看到新字体"
