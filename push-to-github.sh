#!/bin/bash

# Lion Festival G3 Spelling - 推送到 GitHub 脚本

echo "🚀 开始推送到 GitHub..."
echo ""

# 检查是否已配置远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "❌ 未配置远程仓库，正在添加..."
    git remote add origin https://github.com/cswanghan/wordTest.git
fi

# 推送代码
echo "📤 推送代码到 main 分支..."
if git push -u origin main; then
    echo ""
    echo "✅ 推送成功！"
    echo "🌐 项目地址：https://github.com/cswanghan/wordTest"
    echo ""
    echo "📋 后续步骤："
    echo "   1. 访问项目页面确认代码已上传"
    echo "   2. 在 GitHub 设置中启用 Pages（可选）"
    echo "   3. 分享项目链接给团队成员"
else
    echo ""
    echo "❌ 推送失败，可能需要认证"
    echo ""
    echo "💡 解决方案："
    echo "   方案1: 使用 GitHub CLI"
    echo "      gh auth login"
    echo "      gh repo view"
    echo ""
    echo "   方案2: 使用 Personal Access Token"
    echo "      git remote set-url origin https://<USERNAME>:<TOKEN>@github.com/cswanghan/wordTest.git"
    echo "      git push -u origin main"
    echo ""
    echo "   方案3: 使用 GitHub Desktop 应用"
    echo "      下载: https://desktop.github.com/"
fi

echo ""
echo "📚 项目文档："
echo "   README.md - 详细使用说明"
echo "   assets/js/ - 源代码目录"
echo "   index.html - 主页面"
