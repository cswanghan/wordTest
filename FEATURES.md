# 功能演示指南

## 🆕 新增功能说明

### 1. 用户登录系统

#### 登录页面
- 访问应用时会自动跳转到登录页
- 输入用户名和密码（至少3位）
- 首次登录自动创建账户
- 数据保存在浏览器本地存储

#### 用户数据面板
- 点击首页右上角用户头像进入
- 查看练习统计数据：
  - 总练习次数
  - 总得分
  - 平均准确率
  - 最佳连击数
- 查看最近练习记录
- 导出个人数据（JSON格式）
- 查看操作日志
- 清除所有数据

### 2. 结构化日志系统

#### 日志记录类型
- **用户操作**：点击按钮、键盘输入、页面访问
- **练习过程**：每道题的用时、错误次数、得分
- **设置变更**：分组选择、难度调整
- **会话管理**：登录、登出、练习开始/结束
- **性能监控**：按键错误率、速度统计

#### 查看日志
1. 进入用户数据面板
2. 点击"📋 查看操作日志"
3. 可以看到：
   - 总日志数统计
   - 按级别分类（INFO/WARN/ERROR）
   - 详细的操作记录表格

#### 日志示例
```json
{
  "level": "INFO",
  "event": "USER_CLICK",
  "data": {
    "target": "START_ONLINE_PRACTICE",
    "groups": ["BE", "KET"],
    "difficulty": "standard",
    "timestamp": 1734245678901
  }
}
```

### 3. 数据统计功能

#### 用户统计
- 总练习次数
- 总得分
- 练习总单词数
- 总练习时间
- 平均得分
- 平均准确率
- 平均每题用时
- 最佳连击数
- 最喜欢的词汇分组

#### 历史记录
- 自动保存最近100次练习会话
- 每次记录包含：
  - 练习时间
  - 使用的分组
  - 难度等级
  - 用时
  - 得分
  - 正确题数

#### 数据导出
- 点击"📊 导出我的数据"
- 导出JSON格式文件，包含：
  - 用户基本信息
  - 所有练习会话记录
  - 所有操作日志

### 4. 交互日志记录

#### 已记录的交互
- ✅ 分组选择（BE/KET/Culture）
- ✅ 难度选择（Standard/Challenge）
- ✅ 模式切换（在线/打印）
- ✅ 所有按钮点击
- ✅ 键盘输入（每个字母）
- ✅ 退格键使用
- ✅ 页面访问
- ✅ 设置变更
- ✅ 登录/登出
- ✅ 数据导出/清除

#### 日志存储位置
所有日志保存在浏览器的localStorage中：
- `wordtest_logs` - 所有操作日志
- `wordtest_user_[username]` - 用户数据
- `wordtest_history_[username]` - 练习历史

## 🔍 如何检查日志

### 方法1：用户界面
1. 登录后进入数据面板
2. 点击"查看操作日志"
3. 浏览或筛选日志记录

### 方法2：浏览器控制台
打开浏览器开发者工具（F12），在Console中输入：
```javascript
// 查看所有日志
console.log(logger.getLogs());

// 查看特定用户的日志
console.log(logger.getLogsByUser('用户名'));

// 查看统计信息
console.log(logger.getStats());
```

### 方法3：导出日志
1. 在数据面板点击"导出我的数据"
2. 获取完整的JSON日志文件
3. 用任何文本编辑器或JSON查看器打开

## 📊 数据分析示例

### 分析用户练习习惯
```javascript
const stats = analytics.getUserStats('用户名');
console.log('最喜欢的分组:', stats.favoriteGroup);
console.log('平均准确率:', stats.avgAccuracy);
console.log('练习频率:', stats.sessionsByDay);
```

### 分析错误模式
```javascript
const logs = logger.getLogsByEvent('KEY_INPUT');
const errors = logs.filter(log => !log.data.correct);
console.log('错误次数:', errors.length);
console.log('错误详情:', errors);
```

### 分析练习进度
```javascript
const history = analytics.getSessionHistory('用户名', 10);
const scoreTrend = history.map(s => ({
  date: new Date(s.startTime),
  score: s.results.totalScore
}));
console.log('分数趋势:', scoreTrend);
```

## 🔒 数据安全

- 所有数据仅存储在用户浏览器本地
- 不会上传到任何服务器
- 用户可以随时清除所有数据
- 换电脑或清理浏览器数据会丢失历史记录

## 🚀 后续可扩展

1. **后端集成**：将日志发送到后端服务器进行集中存储和分析
2. **数据可视化**：添加图表展示练习趋势和进度
3. **错题本**：基于日志自动生成错题集
4. **学习建议**：根据数据为用户提供个性化建议
5. **社交功能**：与其他用户比较成绩（可选）

---

更多功能正在开发中，敬请期待！ 🎉
