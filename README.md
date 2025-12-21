# Lion Festival G3 Spelling 拼写练习系统

一个专为小学生设计的交互式拼写练习工具，支持在线闯关和打印练习两种模式。

![Lion Festival G3 Spelling](https://img.shields.io/badge/Lion-Festival%20G3-brightgreen)
![Status](https://img.shields.io/badge/Status-Production%20Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特色

### 🎮 在线模式
- **键盘闯关**：逐字输入，即时反馈
- **智能计分系统**：
  - 基础分：根据难度和词长计算
  - 错误惩罚：每次错误扣2分
  - 速度奖励：完成越快得分越高（最高+30%）
  - 连击加成：连续无错误答题可获得额外加成（最高+25%）
- **实时统计**：显示进度、得分、连击数
- **庆祝动画**：完成后自动播放庆祝特效

### 🖨️ 打印模式
- **A4格式**：标准打印尺寸，自动分页
- **随机挖空**：每次生成不同的挖空位置
- **灵活配置**：
  - 可选是否显示中文释义
  - 支持题目顺序打乱
  - 可附加答案页
- **一键打印**：支持浏览器直接打印或保存为PDF

### 📚 词库内容
内置30个精选单词，分为三个主题组：

- **BE组（10个）**：日常生活动词短语
  - get dressed, eat breakfast, brush my teeth...
- **KET组（10个）**：剑桥英语KET核心词汇
  - daughter, cousin, husband, garage...
- **Culture组（10个）**：文化地理主题
  - South America, Brazil, Carnival, Samba...

### 🎯 难度选择
- **Standard（标准）**：保留首字母，降低难度
- **Challenge（挑战）**：随机挖空，增加挑战性

## 🚀 快速开始

### 方式一：直接打开
1. 下载或克隆项目到本地
2. 双击打开 `index.html` 文件
3. 开始使用！

### 方式二：本地服务器
```bash
# 使用 Python 3
python -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server

# 访问 http://localhost:8000
```

## 📖 使用说明

### 在线闯关模式
1. 在首页选择要练习的词汇分组
2. 选择难度等级
3. 点击"开始闯关"按钮
4. 使用键盘输入正确答案
   - 输入正确：自动跳到下一个空
   - 输入错误：红色提示，需重新输入
   - Backspace：删除上一个字母
5. 完成所有题目后查看成绩统计

### 打印练习模式
1. 在首页选择要练习的词汇分组
2. 点击"生成打印单"按钮
3. 在设置页配置：
   - 是否显示中文释义
   - 是否随机打乱题目顺序
   - 是否附带答案页
4. 点击"生成 A4 预览"
5. 在预览页点击"打印"按钮，或保存为PDF

## 🏗️ 项目结构

```
wordTest/
├── index.html              # 主页面
├── assets/
│   ├── css/
│   │   └── styles.css      # 样式文件
│   └── js/
│       ├── data.js         # 词库数据
│       ├── utils.js        # 工具函数
│       ├── views.js        # 视图渲染
│       └── main.js         # 主程序入口
├── demo.html               # 原始演示文件（已废弃）
├── prd.md                  # 产品需求文档
└── README.md               # 项目说明文档
```

## 🔧 技术实现

### 核心技术栈
- **HTML5**：页面结构
- **CSS3**：样式与动画
- **Tailwind CSS**：快速样式开发
- **JavaScript (ES6+)**：逻辑实现
- **Canvas Confetti**：庆祝特效

### 核心算法

#### 1. 挖空生成算法
```javascript
// 选择最长词作为挖空目标
// 随机确定2-3个挖空位置（标准模式不挖首字母）
// 生成带下划线的显示文本
```

#### 2. 智能计分系统
```javascript
// 基础分 = round(max(10, 8 * B + 0.6 * L + 3 * P))
// 错误惩罚 = 2 * mistakes
// 速度奖励 = Base * clamp((ParTime - t) / ParTime, 0, 0.3)
// 连击加成 = (mistakes === 0) ? Base * min(0.05 * streak, 0.25) : 0
// 最终得分 = max(0, Base + TimeBonus + StreakBonus - MistakePenalty)
```

其中：
- B = 挖空字母数
- L = 目标词字母数
- P = 是否为短语（1或0）
- t = 完成用时（秒）
- mistakes = 错误次数
- streak = 当前连击数

#### 3. 随机数生成（可复现）
使用种子随机数算法，确保：
- 同一seed生成相同的挖空结果
- 每次生成打印单都有新的seed
- 支持结果追溯和复现

## 🎨 界面设计

### 设计原则
- **简洁明了**：清晰的信息层级
- **友好交互**：即时反馈和动画效果
- **无障碍**：支持键盘导航和屏幕阅读器
- **响应式**：适配桌面和移动设备

### 色彩系统
- 主色：琥珀色（Amber）- 温暖、活力
- 辅助色：橙色、红色 - 强调和提示
- 中性色：灰色系 - 文字和背景

## 📱 兼容性

### 浏览器支持
- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ 移动端浏览器

### 功能支持
- 键盘输入：所有现代浏览器
- 打印功能：支持浏览器打印API
- 动画效果：支持CSS3动画
- 触摸事件：支持移动端触摸

## 🔍 开发说明

### 自定义词库
编辑 `assets/js/data.js` 文件中的 `WORDS` 数组：

```javascript
const WORDS = [
    { id: 1, group: 'BE', en: 'get dressed', cn: '穿衣服' },
    // 添加更多单词...
];
```

### 样式定制
编辑 `assets/css/styles.css` 文件，或使用Tailwind CSS类名。

### 功能扩展
- 添加新视图：编辑 `assets/js/views.js`
- 添加新工具函数：编辑 `assets/js/utils.js`
- 修改逻辑：编辑 `assets/js/main.js`

## 🐛 已知问题

1. 移动端虚拟键盘可能遮挡输入框
2. 打印预览在不同浏览器中可能有轻微差异
3. 超长单词在移动端显示可能换行

## 📝 更新日志

### v1.0.0 (2025-12-15)
- ✅ 完成基础功能开发
- ✅ 实现在线闯关模式
- ✅ 实现打印预览模式
- ✅ 实现智能计分系统
- ✅ 添加庆祝动画特效
- ✅ 完成项目文档

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

**Han Wang** - [cswanghan](https://github.com/cswanghan)

## 🙏 致谢

- 感谢所有为教育技术贡献力量的开发者
- 感谢 Tailwind CSS 提供的优秀工具
- 感谢 Canvas Confetti 提供的特效库

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [提交问题](https://github.com/cswanghan/wordTest/issues)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
