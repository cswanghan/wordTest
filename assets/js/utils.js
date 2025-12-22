/**
 * Lion Festival G3 Spelling Application
 * 工具函数模块
 */

/**
 * 生成基于种子的随机数
 * @param {number} seed - 随机种子
 * @returns {Function} 返回一个生成[0,1)之间随机数的函数
 */
function seededRandom(seed) {
    let m = 0x80000000;
    let a = 1103515245;
    let c = 12345;
    let s = seed ? seed : Math.floor(Math.random() * (m - 1));

    return function() {
        s = (a * s + c) % m;
        return s / m;
    }
}

/**
 * 打乱数组顺序
 * @param {Array} array - 要打乱的数组
 * @param {Function} rng - 随机数生成函数
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array, rng) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * 生成挖空练习项
 * @param {Object} wordObj - 单词对象
 * @param {Function} rng - 随机数生成函数
 * @param {string} difficulty - 难度等级 (standard/challenge)
 * @returns {Object} 挖空后的练习项
 */
function generateDrillItem(wordObj, rng, difficulty) {
    const tokens = wordObj.en.split(' ');

    // 选择最长词作为挖空目标
    let maxLen = 0;
    let targetIndices = [];
    tokens.forEach((token, index) => {
        if (token.length > maxLen) {
            maxLen = token.length;
            targetIndices = [index];
        } else if (token.length === maxLen) {
            targetIndices.push(index);
        }
    });

    const targetTokenIndex = targetIndices[Math.floor(rng() * targetIndices.length)];
    const targetToken = tokens[targetTokenIndex];

    // 根据难度确定最小可见字母数
    let minVisible = 2;
    if (difficulty === 'challenge') {
        minVisible = 1;
    }

    // 计算最大挖空数
    let maxBlanks = Math.max(1, targetToken.length - minVisible);

    // 随机确定挖空数量（2-3个）
    let blankCount = Math.floor(rng() * 2) + 2;
    if (blankCount > maxBlanks) {
        blankCount = maxBlanks;
    }

    // 获取可用的挖空位置（标准模式不挖首字母）
    const availableIndices = [];
    for (let i = 0; i < targetToken.length; i++) {
        if (difficulty === 'standard' && i === 0) continue;
        availableIndices.push(i);
    }

    // 随机打乱位置
    for (let i = availableIndices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    // 选择前N个位置作为挖空位置
    const blankIndices = availableIndices.slice(0, blankCount).sort((a, b) => a - b);

    // 生成显示文本
    let displayTokens = [...tokens];
    let maskedTokenArr = targetToken.split('');
    blankIndices.forEach(idx => {
        maskedTokenArr[idx] = '_';
    });
    displayTokens[targetTokenIndex] = maskedTokenArr.join('');

    return {
        ...wordObj,
        targetTokenIndex,
        targetToken,
        blankIndices,
        displayEn: displayTokens.join(' ')
    };
}

/**
 * 计算单题得分 (V2 with tiered streak multiplier)
 * @param {Object} item - 练习项
 * @param {number} timeSec - 用时（秒）
 * @param {number} mistakes - 错误次数
 * @param {number} streak - 当前连击数 (不包含本题)
 * @returns {Object} 得分详情 { total, base, timeBonus, streakBonus, streakMultiplier, penalty }
 */
function calculateScore(item, timeSec, mistakes, streak) {
    const L = item.targetToken.length;
    const B = item.blankIndices.length;
    const P = item.en.includes(' ') ? 1 : 0;

    // 1. 基础分 (Base Score)
    // 基于挖空数量和单词长度
    let base = Math.round(Math.max(10, 10 * B + L));

    // 2. 错误惩罚 (Penalty)
    const penalty = 5 * mistakes;

    // 3. 速度奖励 (Time Bonus)
    // 设定“标准时间”：每个空1.5秒 + 单词长度0.2秒
    const parTime = 1.5 * B + 0.2 * L + 1.0;
    let timeBonus = 0;
    if (timeSec < parTime && mistakes === 0) {
        // 只有全对才有速度奖励，最高 +20%
        const ratio = Math.min(1, (parTime - timeSec) / parTime);
        timeBonus = Math.round(base * 0.2 * ratio);
    }

    // 4. 连击加成 (Streak Bonus)
    // 阶梯式倍率：
    // Streak 0-2: 1.0x (无加成)
    // Streak 3-5: 1.2x
    // Streak 6-9: 1.5x
    // Streak 10+: 2.0x
    let streakMultiplier = 1.0;
    
    // 宽容模式：允许少量错误依然享受 Streak 加成
    if (mistakes <= 1) {
        // 注意：这里的 streak 是"本题之前的连击数"，本题算对后是 streak+1
        const effectiveStreak = streak + 1;
        if (effectiveStreak >= 10) streakMultiplier = 2.0;
        else if (effectiveStreak >= 6) streakMultiplier = 1.5;
        else if (effectiveStreak >= 3) streakMultiplier = 1.2;
    }

    // 计算总分
    // 公式: (基础分 + 速度分) * 连击倍率 - 惩罚
    let rawTotal = (base + timeBonus) * streakMultiplier - penalty;
    const total = Math.max(0, Math.round(rawTotal));
    const streakBonusPoints = Math.round((base + timeBonus) * (streakMultiplier - 1.0));

    return {
        total,
        base,
        timeBonus,
        streakBonus: streakBonusPoints,
        streakMultiplier,
        penalty
    };
}

/**
 * 单词语音朗读
 * @param {string} text - 要朗读的文本
 * @param {string} lang - 语言 (默认 en-US)
 */
function speakWord(text, lang = 'en-US') {
    if (!('speechSynthesis' in window)) {
        console.warn('当前浏览器不支持语音合成');
        return;
    }

    // 取消当前正在进行的朗读
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // 语速稍微慢一点点，方便听清
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

/**
 * 慢速播放单词发音（新增功能）
 * @param {string} text - 要朗读的文本
 * @param {string} lang - 语言 (默认 en-US)
 */
function playSlowPronunciation(text, lang = 'en-US') {
    if (!('speechSynthesis' in window)) {
        console.warn('当前浏览器不支持语音合成');
        return;
    }

    // 取消当前正在进行的朗读
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.6; // 慢速播放：0.6倍速
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

/**
 * 标准速度播放单词（新增功能）
 * @param {string} text - 要朗读的文本
 * @param {string} lang - 语言 (默认 en-US)
 */
function playNormalPronunciation(text, lang = 'en-US') {
    if (!('speechSynthesis' in window)) {
        console.warn('当前浏览器不支持语音合成');
        return;
    }

    // 取消当前正在进行的朗读
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // 标准速度
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

/**
 * 字母分类函数
 * @param {string} char - 单个字母
 * @returns {string} 字母类型：vowel(元音), consonant(辅音), other(其他)
 */
function categorizeChar(char) {
    if (!char || typeof char !== 'string') return 'other';

    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];

    const lowerChar = char.toLowerCase();
    if (vowels.includes(lowerChar)) return 'vowel';
    if (consonants.includes(lowerChar)) return 'consonant';
    return 'other';
}

/**
 * 计算两个字符串的编辑距离（Levenshtein Distance）
 * 用于分析拼写错误的相似度
 * @param {string} str1 - 字符串1
 * @param {string} str2 - 字符串2
 * @returns {number} 编辑距离
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * 分析错误模式
 * @param {Array} mistakes - 错误详情数组
 * @returns {Object} 错误模式分析结果
 */
function analyzeErrorPattern(mistakes) {
    if (!mistakes || mistakes.length === 0) {
        return {
            hasMistakes: false,
            confusedLetters: {},
            mostCommonError: null,
            errorTypes: {
                substitution: 0,
                adjacentKeys: 0,
                phonetic: 0
            },
            errorPositions: [],
            difficulty: 'perfect'
        };
    }

    const pattern = {
        hasMistakes: true,
        confusedLetters: {},
        mostCommonError: null,
        errorTypes: {
            substitution: 0,  // 替换错误
            adjacentKeys: 0,  // 相邻键错误
            phonetic: 0       // 发音相似错误
        },
        errorPositions: mistakes.map(m => m.position),
        difficulty: mistakes.length <= 1 ? 'easy' : mistakes.length <= 3 ? 'medium' : 'hard'
    };

    // 统计混淆字母
    mistakes.forEach(mistake => {
        const key = `${mistake.expected}→${mistake.actual}`;
        pattern.confusedLetters[key] = (pattern.confusedLetters[key] || 0) + 1;

        // 判断错误类型
        if (isAdjacentKey(mistake.expected, mistake.actual)) {
            pattern.errorTypes.adjacentKeys++;
        } else if (isPhoneticSimilar(mistake.expected, mistake.actual)) {
            pattern.errorTypes.phonetic++;
        } else {
            pattern.errorTypes.substitution++;
        }
    });

    // 找出最常见错误
    let maxCount = 0;
    for (let [key, count] of Object.entries(pattern.confusedLetters)) {
        if (count > maxCount) {
            maxCount = count;
            pattern.mostCommonError = key;
        }
    }

    return pattern;
}

/**
 * 检查两个字母是否是键盘相邻键
 * @param {string} char1 - 字母1
 * @param {string} char2 - 字母2
 * @returns {boolean} 是否相邻
 */
function isAdjacentKey(char1, char2) {
    const keyboardMap = {
        'q': ['w', 'a'], 'w': ['q', 'e', 's'], 'e': ['w', 'r', 'd'],
        'r': ['e', 't', 'f'], 't': ['r', 'y', 'g'], 'y': ['t', 'u', 'h'],
        'u': ['y', 'i', 'j'], 'i': ['u', 'o', 'k'], 'o': ['i', 'p', 'l'],
        'p': ['o', 'l'],
        'a': ['q', 's', 'z'], 's': ['a', 'w', 'd', 'x'], 'd': ['s', 'e', 'f', 'c'],
        'f': ['d', 'r', 'g', 'v'], 'g': ['f', 't', 'h', 'b'], 'h': ['g', 'y', 'j', 'n'],
        'j': ['h', 'u', 'k', 'm'], 'k': ['j', 'i', 'l'], 'l': ['k', 'o', 'p'],
        'z': ['a', 'x'], 'x': ['z', 's', 'c'], 'c': ['x', 'd', 'v'],
        'v': ['c', 'f', 'b'], 'b': ['v', 'g', 'n'], 'n': ['b', 'h', 'm'],
        'm': ['n', 'j']
    };

    const lower1 = char1.toLowerCase();
    const lower2 = char2.toLowerCase();

    return keyboardMap[lower1]?.includes(lower2) || keyboardMap[lower2]?.includes(lower1) || false;
}

/**
 * 检查两个字母是否发音相似
 * @param {string} char1 - 字母1
 * @param {string} char2 - 字母2
 * @returns {boolean} 是否相似
 */
function isPhoneticSimilar(char1, char2) {
    const phoneticGroups = [
        ['b', 'p'], ['d', 't'], ['g', 'k'], ['z', 's'],
        ['v', 'f'], ['l', 'r'], ['m', 'n'],
        ['i', 'y'], ['e', 'a']
    ];

    const lower1 = char1.toLowerCase();
    const lower2 = char2.toLowerCase();

    return phoneticGroups.some(group => group.includes(lower1) && group.includes(lower2));
}

/**
 * 计算退格次数
 * @param {Array} mistakes - 错误详情数组
 * @returns {number} 退格次数
 */
function calculateBackspaceCount(mistakes) {
    // 这里简化处理，实际应该跟踪退格键的使用
    // 现在根据错误数量估算
    return mistakes.length;
}
