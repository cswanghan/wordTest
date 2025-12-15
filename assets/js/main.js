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
    const wasChecked = checkbox.checked;

    if (wasChecked) {
        if (!state.settings.groups.includes(val)) {
            state.settings.groups.push(val);
        }
    } else {
        state.settings.groups = state.settings.groups.filter(g => g !== val);
    }

    // 记录设置变更
    analytics.trackSettingChange('groups', { action: wasChecked ? 'add' : 'remove', value: val });
    logger.userAction('GROUP_TOGGLE', 'checkbox', { group: val, checked: wasChecked });
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
    analytics.trackClick('GO_TO_PRINT_SETTINGS');
    logger.userAction('CLICK', 'goToPrintSettings', { groups: state.settings.groups });

    const words = getFilteredWords();
    if (words.length === 0) {
        logger.warn('PRINT_SETTINGS_NO_GROUPS', { groups: state.settings.groups });
        alert('请至少选择一个分组 (Please select at least one group)');
        return;
    }
    renderPrintSettings();
}

/**
 * 生成并预览打印单
 */
function generateAndPreviewPrint() {
    analytics.trackClick('GENERATE_PRINT');
    logger.userAction('CLICK', 'generateAndPreviewPrint', {
        settings: state.settings,
        seed: state.seed
    });

    state.seed = Date.now();
    const rng = seededRandom(state.seed);
    let words = getFilteredWords();

    if (state.settings.shuffle) {
        words = shuffleArray([...words], rng);
    }

    const items = words.map(w => generateDrillItem(w, rng, state.settings.difficulty));
    renderPrintPreview(items);

    logger.info('PRINT_GENERATED', {
        seed: state.seed,
        wordCount: items.length,
        groups: state.settings.groups,
        difficulty: state.settings.difficulty
    });
}

/**
 * 开始在线练习
 */
function goToOnline() {
    analytics.trackClick('START_ONLINE_PRACTICE');
    logger.userAction('CLICK', 'goToOnline', {
        groups: state.settings.groups,
        difficulty: state.settings.difficulty
    });

    const words = getFilteredWords();
    if (words.length === 0) {
        logger.warn('ONLINE_NO_GROUPS', { groups: state.settings.groups });
        alert('请至少选择一个分组');
        return;
    }

    state.seed = Date.now();
    const rng = seededRandom(state.seed);
    const shuffledWords = shuffleArray([...words], rng);
    const items = shuffledWords.map(w => generateDrillItem(w, rng, state.settings.difficulty));

    // 开始练习会话记录
    analytics.trackSessionStart({
        groups: state.settings.groups,
        difficulty: state.settings.difficulty,
        showCN: state.settings.showCN
    });

    logger.info('PRACTICE_SESSION_START', {
        seed: state.seed,
        wordCount: items.length,
        groups: state.settings.groups,
        difficulty: state.settings.difficulty
    });

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
            analytics.trackKeyInput('Backspace', true, {
                wordId: item.id,
                position: state.session.currentInputIndex
            });
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
    const isCorrect = key.toLowerCase() === correctChar.toLowerCase();

    if (isCorrect) {
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
        if (container) {
            container.classList.remove('shake');
            void container.offsetWidth;
            container.classList.add('shake');
        }
        if (navigator.vibrate) navigator.vibrate(50);
    }

    // 记录按键日志
    analytics.trackKeyInput(key, isCorrect, {
        wordId: item.id,
        word: item.en,
        position: state.session.currentInputIndex,
        expected: correctChar
    });
}

/**
 * 处理单词完成
 * @param {Object} item - 完成的练习项
 */
function handleWordComplete(item) {
    const endTime = Date.now();
    const timeSec = (endTime - state.session.currentWordStartTime) / 1000;

    const earnedPoints = calculateScore(item, timeSec, state.session.currentMistakes, state.session.streak);

    // 关键修复：将得分加到总分中
    state.session.score += earnedPoints;

    const wasPerfect = state.session.currentMistakes === 0;

    if (wasPerfect) {
        state.session.correctCount++;
        state.session.streak++;
        if (state.session.streak > state.session.maxStreak) {
            state.session.maxStreak = state.session.streak;
        }
    } else {
        state.session.wrongCount++;
        state.session.streak = 0;
    }

    // 记录题目完成
    analytics.trackWord({
        wordId: item.id,
        word: item.en,
        timeSec: timeSec,
        mistakes: state.session.currentMistakes,
        score: earnedPoints,
        perfect: wasPerfect,
        streak: state.session.streak,
        totalScore: state.session.score
    });

    logger.info('WORD_COMPLETED', {
        wordId: item.id,
        word: item.en,
        timeSec: timeSec,
        mistakes: state.session.currentMistakes,
        score: earnedPoints,
        totalScore: state.session.score,
        perfect: wasPerfect,
        streak: state.session.streak
    });

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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    logger.info('APP_INITIALIZING', { timestamp: Date.now() });

    // 检查登录状态
    if (checkAuth()) {
        logger.info('AUTO_LOGIN', { username: currentUser.username });
        renderHome();
    } else {
        logger.info('NO_AUTH', { timestamp: Date.now() });
        renderLogin();
    }
});

// 修改 finishSession 函数以记录会话完成
const originalFinishSession = finishSession;
finishSession = function() {
    // 记录会话完成
    const sessionData = {
        totalScore: state.session.score,
        totalWords: state.session.items.length,
        correctCount: state.session.correctCount,
        wrongCount: state.session.wrongCount,
        maxStreak: state.session.maxStreak,
        groups: state.settings.groups,
        difficulty: state.settings.difficulty
    };

    analytics.trackSessionComplete(sessionData);
    updateUserStats(sessionData);

    logger.info('PRACTICE_SESSION_END', sessionData);

    // 调用原始函数
    if (originalFinishSession) {
        originalFinishSession();
    }
};

/**
 * 处理虚拟键盘输入（移动端）
 * @param {string} key - 按键字符
 */
function handleVirtualKey(key) {
    if (state.view !== 'online') return;
    logger.userAction('VIRTUAL_KEY', 'mobile-keyboard', { key });
    handleKeyInput(key);
}
