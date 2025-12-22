# 🔧 MediaPipe 真实手势识别集成指南

## 📋 当前状态

### ✅ 已完成
- 摄像头成功开启
- 真实视频流显示
- 模拟手势系统运行

### ❌ 缺失功能
- **真实手势识别**：当前使用模拟数据
- **手部关键点检测**：需要 MediaPipe 集成
- **手势分类**：需要算法实现

---

## 🎯 需要集成 MediaPipe

当前原型的手势识别部分是模拟的：
```javascript
// 模拟手势数据（实际版本将从 MediaPipe 获取）
let mockGesture = {
    isHandVisible: false,
    cursor: { x: 0, y: 0 },
    gesture: 'none', // 'open_palm', 'closed_fist', 'pointing'
    confidence: 0
};
```

要实现真实识别，需要：

---

## 🚀 MediaPipe 集成步骤

### 1. 加载 MediaPipe 库

```html
<!-- 在 HTML 头部添加 -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
```

### 2. 初始化 MediaPipe Hands

```javascript
// 全局变量
let hands, camera;

// 初始化 MediaPipe
function initializeMediaPipe() {
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    // 配置参数
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // 设置结果回调
    hands.onResults(onResults);
}

// 处理结果
function onResults(results) {
    // results.multiHandLandmarks 包含 21 个关键点
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // 转换为真实手势数据
        mockGesture = {
            isHandVisible: true,
            cursor: calculateCursorPosition(landmarks),
            gesture: classifyGesture(landmarks),
            confidence: 0.95
        };
    } else {
        mockGesture.isHandVisible = false;
    }

    // 继续循环
    camera.send({image: videoElement});
}
```

### 3. 启动摄像头

```javascript
function startRealCamera() {
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 1280,
        height: 720
    });

    camera.start();
}
```

---

## 🧠 手势分类算法

### 计算光标位置
```javascript
function calculateCursorPosition(landmarks) {
    // 使用中指尖作为光标位置
    const tip = landmarks[8]; // index finger tip
    return {
        x: (1 - tip.x) * 100, // 翻转 X 轴（镜像）
        y: tip.y * 100
    };
}
```

### 手势分类
```javascript
function classifyGesture(landmarks) {
    // 计算手指张开度
    const thumbOpen = isFingerOpen(landmarks, 1); // 拇指
    const indexOpen = isFingerOpen(landmarks, 2); // 食指
    const middleOpen = isFingerOpen(landmarks, 3); // 中指
    const ringOpen = isFingerOpen(landmarks, 4); // 无名指
    const pinkyOpen = isFingerOpen(landmarks, 5); // 小指

    // 计算张开度
    const openness = [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen]
        .filter(open => open).length / 5;

    // 分类逻辑
    if (openness > 0.8) {
        return 'open_palm';
    } else if (openness < 0.3) {
        return 'closed_fist';
    } else {
        return 'pointing';
    }
}

// 检查手指是否张开
function isFingerOpen(landmarks, fingerIndex) {
    const fingerTips = [4, 8, 12, 16, 20]; // 5个指尖
    const fingerMCPs = [2, 5, 9, 13, 17]; // 5个掌指关节

    const tip = landmarks[fingerTips[fingerIndex]];
    const mcp = landmarks[fingerMCPs[fingerIndex]];

    // 垂直张开度
    const verticalDistance = Math.abs(tip.y - mcp.y);

    return verticalDistance > 0.05; // 阈值可调
}
```

---

## 📝 完整集成示例

```javascript
// === MediaPipe 集成版本 ===

// 1. 初始化
async function initializeRealGestureDetection() {
    // 加载 MediaPipe
    await Hands.load();

    // 创建实例
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    // 配置
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    // 回调
    hands.onResults((results) => {
        processHandLandmarks(results);
    });

    // 启动摄像头
    startCamera();
}

// 2. 处理手部关键点
function processHandLandmarks(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // 转换为真实数据
        gestureData.isHandVisible = true;
        gestureData.cursor = calculateCursorPosition(landmarks);
        gestureData.gesture = classifyGesture(landmarks);
        gestureData.confidence = 0.95;

        // 更新画布
        drawHandLandmarks(landmarks);
    } else {
        gestureData.isHandVisible = false;
    }
}

// 3. 启动摄像头
async function startCamera() {
    const video = document.getElementById('gesture-video');

    camera = new Camera(video, {
        onFrame: async () => {
            await hands.send({image: video});
        },
        width: 1280,
        height: 720
    });

    camera.start();
}
```

---

## 🔄 更新原型流程

### 替换模拟循环
当前原型使用模拟循环：
```javascript
// 旧的模拟循环
setInterval(() => {
    // 随机移动和手势变化
    startMockGestureSimulation();
}, 1000 / 30);
```

需要替换为：
```javascript
// 新的 MediaPipe 循环
initializeRealGestureDetection();
```

---

## ⚙️ 配置参数优化

| 参数 | 默认值 | 推荐值 | 说明 |
|------|--------|--------|------|
| maxNumHands | 1 | 1 | 检测手数 |
| modelComplexity | 1 | 1 | 模型复杂度（0/1） |
| minDetectionConfidence | 0.5 | 0.7 | 检测置信度 |
| minTrackingConfidence | 0.5 | 0.7 | 跟踪置信度 |

**调优建议：**
- 提高置信度阈值减少误检
- 降低复杂度提高性能
- 单手检测更稳定

---

## 🎨 视觉优化

### 绘制手部关键点
```javascript
function drawHandLandmarks(landmarks) {
    const canvas = document.getElementById('gesture-canvas');
    const ctx = canvas.getContext('2d');

    // 绘制关键点
    landmarks.forEach((landmark) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    });

    // 绘制连接线
    drawConnections(landmarks, ctx);
}
```

---

## ⚠️ 注意事项

### 1. 性能优化
- 降低分辨率（如 640x480）
- 减少检测频率（20 FPS）
- 启用硬件加速

### 2. 准确性调优
- 确保充足光照
- 保持手部在画面中央
- 避免背景干扰

### 3. 兼容性
- 需要现代浏览器
- HTTPS 环境
- WebGL 支持

---

## 🚀 实施计划

### 阶段1：基础集成（1天）
- [ ] 添加 MediaPipe 库
- [ ] 实现基础检测
- [ ] 调试参数

### 阶段2：手势分类（1天）
- [ ] 实现手势算法
- [ ] 优化分类准确性
- [ ] 测试各种手势

### 阶段3：性能优化（1天）
- [ ] 优化帧率
- [ ] 减少延迟
- [ ] 跨浏览器测试

---

## 💡 下一步行动

1. **立即执行**：集成 MediaPipe 库
2. **测试验证**：确保真实手势识别工作
3. **参数调优**：根据实际效果调整阈值
4. **文档更新**：更新原型使用指南

---

**需要立即开始 MediaPipe 集成吗？**

我可以立即开始实现真实的 MediaPipe 手势识别功能。
