/**
 * Lion Festival G3 Spelling Application
 * 主程序入口和状态管理
 */

// 状态管理
const state = {
    view: 'home', // home, printSettings, printPreview, online, result
    seed: Date.now(),
    settings: {
        groups: ['BE', 'KET', 'Culture'],
        difficulty: 'standard', // standard, challenge
        showCN: true,
        shuffle: false, // 打印模式：是否乱序
        showAnswers: false // 打印模式：是否附带答案
    },
    session: {
        items: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctCount: 0,
        wrongCount: 0,
        currentMistakes: 0,
        startTime: 0,
        currentWordStartTime: 0,
        currentInputIndex: 0 // 指向 blankIndices 的索引
    }
};

/**
 * 更新分组选择
 * @param {HTMLInputElement} checkbox - 复选框元素
 */
function updateGroups(checkbox) {
    const val = checkbox.value;
    if (checkbox.checked) {
        if (!state.settings.groups.includes(val)) {
            state.settings.groups.push(val);
        }
    } else {
        state.settings.groups = state.settings.groups.filter(g => g !== val);
    }
}

/**
 * 获取过滤后的单词列表
 * @returns {Array} 过滤后的单词数组
 */
function getFilteredWords() {
    return WORDS.filter(w => state.settings.groups.includes(w.group));
}

/**
 * 前往打印设置页
 */
function goToPrintSettings() {
    const words = getFilteredWords();
    if (words.length === 0) {
        alert('请至少选择一个分组 (Please select at least one group)');
        return;
    }
    renderPrintSettings();
}

/**
 * 生成并预览打印单
 */
function generateAndPreviewPrint() {
    state.seed = Date.now();
    const rng = seededRandom(state.seed);
    let words = getFilteredWords();

    if (state.settings.shuffle) {
        words = shuffleArray([...words], rng);
    }

    const items = words.map(w => generateDrillItem(w, rng, state.settings.difficulty));
    renderPrintPreview(items);
}

/**
 * 开始在线练习
 */
function goToOnline() {
    const words = getFilteredWords();
    if (words.length === 0) {
        alert('请至少选择一个分组');
        return;
    }

    state.seed = Date.now();
    const rng = seededRandom(state.seed);
    const shuffledWords = shuffleArray([...words], rng);
    const items = shuffledWords.map(w => generateDrillItem(w, rng, state.settings.difficulty));

    renderOnline(items);
}

/**
 * 处理键盘输入
 * @param {string} key - 按键字符
 */
function handleKeyInput(key) {
    if (state.view !== 'online') return;
    const item = state.session.items[state.session.currentIndex];
    if (!item) return;

    // 处理退格键
    if (key === 'Backspace') {
        if (state.session.currentInputIndex > 0) {
            state.session.currentInputIndex--;
            updateOnlineUI();
        }
        return;
    }

    // 只接受字母
    if (!/^[a-zA-Z]$/.test(key)) return;
    if (state.session.currentInputIndex >= item.blankIndices.length) return;

    const targetCharIdx = item.blankIndices[state.session.currentInputIndex];
    if (targetCharIdx === undefined) return;

    const correctChar = item.targetToken[targetCharIdx];
    if (!correctChar) return;

    // 检查输入是否正确
    if (key.toLowerCase() === correctChar.toLowerCase()) {
        state.session.currentInputIndex++;
        if (state.session.currentInputIndex >= item.blankIndices.length) {
            handleWordComplete(item);
        } else {
            updateOnlineUI();
        }
    } else {
        // 输入错误
        state.session.currentMistakes++;
        const container = document.getElementById('word-container');
        container.classList.remove('shake');
        void container.offsetWidth;
        container.classList.add('shake');
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

/**
 * 处理单词完成
 * @param {Object} item - 完成的练习项
 */
function handleWordComplete(item) {
    const endTime = Date.now();
    const timeSec = (endTime - state.session.currentWordStartTime) / 1000;

    const earnedPoints = calculateScore(item, timeSec, state.session.currentMistakes, state.session.streak);

    if (state.session.currentMistakes === 0) {
        state.session.correctCount++;
        state.session.streak++;
        if (state.session.streak > state.session.maxStreak) {
            state.session.maxStreak = state.session.streak;
        }
    } else {
        state.session.wrongCount++;
        state.session.streak = 0;
    }

    updateOnlineUI();

    // 显示得分反馈
    const fb = document.getElementById('feedback-layer');
    if (fb) {
        fb.textContent = `+${earnedPoints}`;
        fb.style.opacity = 1;
        fb.style.transform = 'translateY(-50px)';
    }

    // 延迟进入下一题
    setTimeout(() => {
        state.session.currentIndex++;
        state.session.currentInputIndex = 0;
        state.session.currentMistakes = 0;
        state.session.currentWordStartTime = Date.now();

        const fb = document.getElementById('feedback-layer');
        if (fb) {
            fb.style.opacity = 0;
            fb.style.transform = 'translateY(0)';
        }

        updateOnlineUI();
    }, 800);
}

// 键盘事件监听
document.addEventListener('keydown', (e) => {
    if (state.view !== 'online') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    handleKeyInput(e.key);
});

// 初始化应用
renderHome();
