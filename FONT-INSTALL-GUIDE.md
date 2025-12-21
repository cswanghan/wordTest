# 🔤 Alibaba PuHuiTi 字体安装指南

## 📖 简介

Alibaba PuHuiTi（阿里巴巴普惠体）是阿里巴巴集团发布的官方字体，支持中英文，具有8种不同的字重，是一款优秀的开源字体，可免费商用。

## 📦 字体字重

| 字重 | 文件名 | 数值 | 说明 |
|------|--------|------|------|
| Thin | Alibaba-PuHuiTi-3-35-Thin.ttf | 100 | 极细 |
| Light | Alibaba-PuHuiTi-3-45-Light.ttf | 300 | 细体 |
| Regular | Alibaba-PuHuiTi-3-55-Regular.ttf | 400 | 常规 |
| Medium | Alibaba-PuHuiTi-3-65-Medium.ttf | 500 | 中黑 |
| SemiBold | Alibaba-PuHuiTi-3-75-SemiBold.ttf | 600 | 半黑 |
| Bold | Alibaba-PuHuiTi-3-85-Bold.ttf | 700 | 黑体 |
| ExtraBold | Alibaba-PuHuiTi-3-95-ExtraBold.ttf | 800 | 超黑 |
| Heavy | Alibaba-PuHuiTi-3-105-Heavy.ttf | 900 | 特黑 |

## 💾 下载字体

### 方法1：GitHub 官方仓库
访问：https://github.com/alibaba/PuHuiTi/releases

下载 `Alibaba-PuHuiTi-3-55-Regular.ttf`（推荐）

### 方法2：使用下载脚本
```bash
# 运行我们提供的下载脚本
./download-fonts.sh
```

### 方法3：在线下载
- 官网：https://www.fontspace.com/alibaba-puhuiti
- 字体天下：https://www.fonts.net.cn
- 字由：https://www.hellofont.cn

## 🔧 安装字体

### macOS

#### 方法1：字体册（推荐）
```bash
# 双击字体文件，系统会自动打开字体册
open ~/Downloads/Alibaba-PuHuiTi-3-55-Regular.ttf
```
然后点击"安装字体"。

#### 方法2：命令行
```bash
# 复制到系统字体目录（需要密码）
sudo cp ~/Downloads/Alibaba-PuHuiTi-3-55-Regular.ttf /Library/Fonts/

# 或复制到用户字体目录
mkdir -p ~/Library/Fonts/
cp ~/Downloads/Alibaba-PuHuiTi-3-55-Regular.ttf ~/Library/Fonts/
```

### Windows

1. 右键点击下载的字体文件
2. 选择"安装"或"为所有用户安装"
3. 等待安装完成

### Linux

```bash
# 创建字体目录
mkdir -p ~/.local/share/fonts/
mkdir -p ~/.config/fontconfig/

# 复制字体文件
cp ~/Downloads/Alibaba-PuHuiTi-3-55-Regular.ttf ~/.local/share/fonts/

# 刷新字体缓存
fc-cache -fv

# 验证字体
fc-list | grep PuHuiTi
```

## 🎨 在网页中使用

### 1. 本地字体文件

#### HTML
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Hello, Alibaba PuHuiTi!</h1>
</body>
</html>
```

#### CSS (styles.css)
```css
/* 定义字体 */
@font-face {
    font-family: 'Alibaba PuHuiTi 3.0';
    src: url('fonts/Alibaba-PuHuiTi-3-55-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Alibaba PuHuiTi 3.0';
    src: url('fonts/Alibaba-PuHuiTi-3-65-Medium.ttf') format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Alibaba PuHuiTi 3.0';
    src: url('fonts/Alibaba-PuHuiTi-3-75-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Alibaba PuHuiTi 3.0';
    src: url('fonts/Alibaba-PuHuiTi-3-85-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
}

/* 使用字体 */
body {
    font-family: 'Alibaba PuHuiTi 3.0', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

h1 {
    font-family: 'Alibaba PuHuiTi 3.0';
    font-weight: 600;
}
```

### 2. 系统字体（已安装）

```css
body {
    font-family: 'Alibaba PuHuiTi 3.0',
                 'PingFang SC',
                 'Hiragino Sans GB',
                 'Microsoft YaHei',
                 'WenQuanYi Micro Hei',
                 sans-serif;
}
```

## ✅ 验证安装

### 方法1：浏览器测试
打开我们提供的 `font-test.html` 文件，查看字体是否正常显示。

### 方法2：JavaScript 检测
```javascript
// 检测字体是否加载
if (document.fonts && document.fonts.check) {
    const isLoaded = document.fonts.check('24px "Alibaba PuHuiTi 3.0"');
    console.log(isLoaded ? '字体已加载' : '字体未加载');
}
```

### 方法3：CSS 测试
```css
.test {
    font-family: 'Alibaba PuHuiTi 3.0';
    font-size: 24px;
    content: "测试文本";
}
```

## 🔍 常见问题

### Q: 字体不显示？
A: 请检查：
1. 字体文件路径是否正确
2. 字体文件名是否拼写正确
3. 浏览器是否刷新
4. 字体是否安装成功

### Q: 字体模糊？
A: 这是正常现象，TrueType 字体在不同分辨率下可能会有差异。可以尝试：
1. 使用 WOFF2 格式（更小、更清晰）
2. 调整 font-smoothing 和 -webkit-font-smoothing

### Q: 如何转换字体格式？
A: 使用字体转换工具：
- online-convert.com
- font-converter.net
- 或使用命令行工具 `fontforge`

## 📝 注意事项

1. **版权声明**：字体可免费商用，但仍需遵守许可证
2. **文件大小**：TTF 格式文件较大，建议使用 WOFF2 格式
3. **加载性能**：使用 `font-display: swap` 提升加载性能
4. **备用字体**：始终提供备用字体栈

## 🎯 推荐使用

对于一般项目，推荐下载以下4个字体：
- Regular (400)
- Medium (500)
- SemiBold (600)
- Bold (700)

这样可以覆盖大部分使用场景。

## 📚 相关资源

- **官方仓库**：https://github.com/alibaba/PuHuiTi
- **字体官网**：https://www.fontspace.com/alibaba-puhuiti
- **字体转换**：https://www.fontsquirrel.com
- **WOFF2 转换**：https://www.fontsquirrel.com/tools/webfont-generator

---

**安装完成后，重启浏览器即可使用新字体！** 🎉
