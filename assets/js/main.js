/**
 * Lion Festival G3 Spelling Application
 * 主程序入口和状态管理
 */

// 状态管理
const state = {
    view: 'home', // home, printSettings, printPreview, online, result, fullTest, fullTestResult
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
        totalMistakes: 0, // 新增：总错误按键数
        totalCorrectKeys: 0, // 新增：总正确按键数
        wordLogs: [], // 新增：每个单词的详细记录
        currentWordMistakes: [], // 新增：当前单词的错误记录缓存
        startTime: 0,
        currentWordStartTime: 0,
        currentInputIndex: 0 // 指向 blankIndices 的索引
    },
    // 新增：全量测试状态
    fullTestSession: null
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
    // 确保 groups 是数组
    if (!Array.isArray(state.settings.groups)) {
        console.warn('state.settings.groups is not an array:', state.settings.groups);
        state.settings.groups = ['BE', 'KET', 'Culture']; // 重置为默认值
    }
    const groups = state.settings.groups;
    return WORDS.filter(w => groups.includes(w.group));
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
    // 自动朗读第一个词
    if (items.length > 0) {
        speakWord(items[0].en);
    }
}

/**
 * 处理键盘输入
 * @param {string} key - 按键字符
 */
function handleKeyInput(key) {
    if (state.view !== 'online') return;
    const item = state.session.items[state.session.currentIndex];
    if (!item) return;

    // DEBUG LOG
    console.log(`[KeyInput] Key: "${key}", CurrentIdx: ${state.session.currentInputIndex}, Blanks: [${item.blankIndices}]`);

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
    if (targetCharIdx === undefined) {
        console.error('[KeyInput] Error: targetCharIdx is undefined');
        return;
    }

    const correctChar = item.targetToken[targetCharIdx];
    if (!correctChar) {
        console.error(`[KeyInput] Error: correctChar is undefined. Token: "${item.targetToken}", Idx: ${targetCharIdx}`);
        return;
    }

    // DEBUG: Trace comparison details
    console.log(`[KeyInput Check] Key:"${key}", Correct:"${correctChar}", targetIdx:${targetCharIdx}, currentInputIdx:${state.session.currentInputIndex}, Blanks:[${item.blankIndices}]`);

    // 检查输入是否正确
    const isCorrect = key.toLowerCase() === correctChar.toLowerCase();
    
    console.log(`[KeyInput] Expected: "${correctChar}", Actual: "${key}", Match: ${isCorrect}`);

    if (isCorrect) {
        state.session.totalCorrectKeys++; // 记录正确按键
        state.session.currentInputIndex++;
        if (state.session.currentInputIndex >= item.blankIndices.length) {
            handleWordComplete(item);
        } else {
            updateOnlineUI();
        }
    } else {
        // 输入错误
        state.session.currentMistakes++;
        state.session.totalMistakes++; // 记录错误按键
        
        // 记录详细错误指纹
        if (!state.session.currentWordMistakes) state.session.currentWordMistakes = []; // 防御性初始化
        state.session.currentWordMistakes.push({
            position: state.session.currentInputIndex,
            expected: correctChar,
            actual: key,
            timestamp: Date.now(),
            keyPressDuration: 0, // 将通过后续改进记录按键时长
            adjacentLetters: {
                prev: targetCharIdx > 0 ? item.targetToken[targetCharIdx - 1] : null,
                next: targetCharIdx < item.targetToken.length - 1 ? item.targetToken[targetCharIdx + 1] : null
            },
            charType: categorizeChar(correctChar) // 字母类型：vowel(元音), consonant(辅音), 其他
        });

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
    try {
        const endTime = Date.now();
        const timeSec = (endTime - state.session.currentWordStartTime) / 1000;

        // calculateScore returns an object now: { total, base, timeBonus, streakBonus, streakMultiplier, penalty }
        let scoreResult = { total: 0, base: 0, timeBonus: 0, streakBonus: 0, streakMultiplier: 1.0, penalty: 0 };
        try {
             scoreResult = calculateScore(item, timeSec, state.session.currentMistakes, state.session.streak);
        } catch (e) {
            console.error('Error calculating score:', e);
        }

        state.session.score += scoreResult.total;

        const wasPerfect = state.session.currentMistakes === 0;

        // 逻辑调整：只要拼完单词，Streak 就延续！
        if (state.session.currentMistakes <= 3) {
            state.session.streak++;
            if (state.session.streak > state.session.maxStreak) {
                state.session.maxStreak = state.session.streak;
            }
        } else {
            state.session.streak = 0;
        }

        if (wasPerfect) {
            state.session.correctCount++;
            // Perfect 庆祝特效
            if (typeof confetti === 'function') {
                try {
                    confetti({
                        particleCount: 50,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#f59e0b', '#fbbf24', '#ffffff']
                    });
                } catch(e) { console.warn('Confetti error:', e); }
            }
        } else {
            state.session.wrongCount++;
        }

        // 记录题目完成 (Safely)
        try {
            analytics.trackWord({
                wordId: item.id,
                word: item.en,
                timeSec: timeSec,
                mistakes: state.session.currentMistakes,
                score: scoreResult.total,
                scoreDetails: scoreResult,
                perfect: wasPerfect,
                streak: state.session.streak,
                totalScore: state.session.score
            });
        } catch (e) { console.error('Analytics error:', e); }

        // 记录详细学习日志 (Safely)
        try {
            if (!state.session.wordLogs) state.session.wordLogs = [];

            // 分析完美位置（一次输入即正确的位置）
            const perfectPositions = [];
            const blankIndices = item.blankIndices;
            const mistakePositions = (state.session.currentWordMistakes || []).map(m => m.position);
            for (let i = 0; i < blankIndices.length; i++) {
                if (!mistakePositions.includes(i)) {
                    perfectPositions.push(i);
                }
            }

            // 计算平均每个字符的时间
            const avgTimePerChar = Math.round(timeSec * 1000 / item.blankIndices.length);

            // 分析错误模式
            const errorPattern = analyzeErrorPattern(state.session.currentWordMistakes || []);

            state.session.wordLogs.push({
                wordId: item.id,
                word: item.en,
                group: item.group,
                targetToken: item.targetToken,
                startTime: state.session.currentWordStartTime,
                endTime: endTime,
                duration: Math.round(timeSec * 1000), // ms
                mistakesCount: state.session.currentMistakes,
                perfectPositions: perfectPositions,
                avgTimePerChar: avgTimePerChar,
                backspaceCount: calculateBackspaceCount(state.session.currentWordMistakes || []),
                difficulty: state.settings.difficulty,
                mistakesDetails: [...(state.session.currentWordMistakes || [])],
                errorPattern: errorPattern,
                streakBefore: state.session.streak, // 完成前的连击数
                scoreEarned: scoreResult.total
            });
        } catch (e) { console.error('Logging error:', e); }
        
        try {
            logger.info('WORD_COMPLETED', {
                wordId: item.id,
                word: item.en,
                timeSec: timeSec,
                mistakes: state.session.currentMistakes,
                score: scoreResult.total,
                totalScore: state.session.score,
                perfect: wasPerfect,
                streak: state.session.streak
            });
        } catch(e) { console.error('Logger error:', e); }

        // UPDATE UI IMMEDIATELY
        updateOnlineUI();

        // 显示得分反馈
        const fb = document.getElementById('feedback-layer');
        if (fb) {
            let feedbackText = `+${scoreResult.total}`;
            if (scoreResult.streakMultiplier > 1.0) {
                feedbackText += ` (Combo x${scoreResult.streakMultiplier.toFixed(1)})`;
                fb.classList.add('text-purple-500');
                fb.classList.remove('text-amber-500');
            } else {
                fb.classList.add('text-amber-500');
                fb.classList.remove('text-purple-500');
            }

            fb.textContent = feedbackText;
            fb.style.opacity = 1;
            fb.style.transform = 'translateY(-50px)';
        }

        // 延迟进入下一题
        setTimeout(() => {
            state.session.currentIndex++;
            state.session.currentInputIndex = 0;
            state.session.currentMistakes = 0;
            state.session.currentWordMistakes = [];
            state.session.currentWordStartTime = Date.now();

            const fb = document.getElementById('feedback-layer');
            if (fb) {
                fb.style.opacity = 0;
                fb.style.transform = 'translateY(0)';
            }

            // 检查是否还有下一题
            const nextItem = state.session.items[state.session.currentIndex];
            if (nextItem) {
                // 还有题目，继续练习
                updateOnlineUI();
                speakWord(nextItem.en);
            } else {
                // 没有下一题了，结束练习
                finishSession();
            }
        }, 1200);

    } catch (criticalError) {
        console.error('CRITICAL ERROR in handleWordComplete:', criticalError);
        // Fallback: Just try to move to next word immediately to unblock user
        state.session.currentIndex++;
        state.session.currentInputIndex = 0;

        // 检查是否还有下一题
        const nextItem = state.session.items[state.session.currentIndex];
        if (nextItem) {
            updateOnlineUI();
        } else {
            finishSession();
        }
    }
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

    // 标记虚拟键盘正在处理输入，避免input事件重复调用
    if (typeof window.markVirtualKeyboardInput === 'function') {
        window.markVirtualKeyboardInput();
    }

    handleKeyInput(key);
}

/**
 * 新增：前往全量拼写测试设置页
 */
function goToFullTest() {
    analytics.trackClick('GO_TO_FULLTEST');
    logger.userAction('CLICK', 'goToFullTest', { groups: state.settings.groups });

    const words = getFilteredWords();
    if (words.length === 0) {
        logger.warn('FULLTEST_NO_GROUPS', { groups: state.settings.groups });
        alert('请至少选择一个分组');
        return;
    }

    renderFullTestSettings(words);
}

/**
 * 新增：开始全量拼写测试
 * @param {Array} words - 选中的单词列表
 */
function startFullTest(words) {
    analytics.trackClick('START_FULLTEST', {
        wordCount: words.length,
        groups: state.settings.groups
    });

    logger.info('FULLTEST_START', {
        wordCount: words.length,
        groups: state.settings.groups
    });

    // 初始化全量测试会话
    state.fullTestSession = {
        testId: 'fulltest_' + Date.now(),
        words: [...words],
        currentIndex: 0,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        startTime: Date.now(),
        currentWordStartTime: Date.now(),
        totalTime: 0,
        results: []
    };

    renderFullTest();
}

/**
 * 新增：提交当前单词答案
 */
function submitFullTestWord() {
    if (!state.fullTestSession) return;

    const currentWord = state.fullTestSession.words[state.fullTestSession.currentIndex];
    const inputElement = document.getElementById('fulltest-input');
    if (!inputElement) return;

    const userInput = inputElement.value.trim().toLowerCase();
    const correctAnswer = currentWord.en.toLowerCase();
    const isCorrect = userInput === correctAnswer;

    // 计算当前单词用时
    const timeSpent = Date.now() - state.fullTestSession.currentWordStartTime;

    // 计算得分
    let wordScore = 0;
    if (isCorrect) {
        wordScore = 100;
        // 时间奖励
        if (timeSpent <= 10000) {
            wordScore += 10; // 10秒内完成
        } else if (timeSpent <= 20000) {
            wordScore += 5;  // 20秒内完成
        }
        state.fullTestSession.correctCount++;
    } else {
        state.fullTestSession.wrongCount++;
    }

    state.fullTestSession.score += wordScore;
    state.fullTestSession.totalTime += timeSpent;

    // 记录结果
    state.fullTestSession.results.push({
        wordId: currentWord.id,
        word: currentWord.en,
        chinese: currentWord.cn,
        group: currentWord.group,
        userInput: userInput,
        isCorrect: isCorrect,
        timeSpent: timeSpent,
        score: wordScore
    });

    // 显示反馈
    showFullTestFeedback(isCorrect, wordScore);

    // 2秒后进入下一题或结束测试
    setTimeout(() => {
        state.fullTestSession.currentIndex++;

        if (state.fullTestSession.currentIndex >= state.fullTestSession.words.length) {
            // 完成测试
            finishFullTest();
        } else {
            // 下一题
            // 更新当前单词开始时间
            state.fullTestSession.currentWordStartTime = Date.now();
            renderFullTest();
        }
    }, 2000);
}

/**
 * 新增：显示答案反馈
 * @param {boolean} isCorrect - 是否正确
 * @param {number} score - 得分
 */
function showFullTestFeedback(isCorrect, score) {
    const feedbackEl = document.getElementById('fulltest-feedback');
    if (!feedbackEl) return;

    if (isCorrect) {
        feedbackEl.innerHTML = `<span class="text-green-600 font-bold">✓ 正确！+${score}分</span>`;
        feedbackEl.className = 'text-green-600 font-bold text-lg';
    } else {
        const currentWord = state.fullTestSession.words[state.fullTestSession.currentIndex];
        feedbackEl.innerHTML = `<span class="text-red-600 font-bold">✗ 错误！正确答案是：${currentWord.en}</span>`;
        feedbackEl.className = 'text-red-600 font-bold text-lg';
    }

    feedbackEl.style.opacity = '1';
}

/**
 * 新增：完成全量测试
 */
function finishFullTest() {
    const session = state.fullTestSession;
    const totalWords = session.words.length;
    const accuracy = Math.round((session.correctCount / totalWords) * 100);
    const avgTime = Math.round(session.totalTime / totalWords);

    // 记录到analytics
    try {
        analytics.trackSessionComplete({
            totalScore: session.score,
            totalWords: totalWords,
            correctCount: session.correctCount,
            wrongCount: session.wrongCount,
            accuracy: accuracy,
            avgTime: avgTime,
            type: 'fulltest'
        });
    } catch (e) {
        console.error('Analytics error:', e);
    }

    logger.info('FULLTEST_COMPLETE', {
        score: session.score,
        accuracy: accuracy,
        totalWords: totalWords
    });

    renderFullTestResult();
}
