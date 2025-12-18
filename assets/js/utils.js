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
        return s / (m - 1);
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
 * 计算单题得分
 * @param {Object} item - 练习项
 * @param {number} timeSec - 用时（秒）
 * @param {number} mistakes - 错误次数
 * @param {number} streak - 当前连击数
 * @returns {number} 得分
 */
function calculateScore(item, timeSec, mistakes, streak) {
    const L = item.targetToken.length;
    const B = item.blankIndices.length;
    const P = item.en.includes(' ') ? 1 : 0;

    // 基础分（难度分）
    let base = Math.round(Math.max(10, 8 * B + 0.6 * L + 3 * P));

    // 错误惩罚
    const penalty = 2 * mistakes;

    // 速度奖励（最高+30%）
    const parTime = 1.2 * B + 0.15 * L + 0.8 * P;
    const speedRatio = Math.max(0, Math.min(0.3, (parTime - timeSec) / parTime));
    const timeBonus = Math.round(base * speedRatio);

    // 连击加成（最高+25%，仅perfect生效）
    let streakBonus = 0;
    if (mistakes === 0) {
        streakBonus = Math.round(base * Math.min(0.05 * streak, 0.25));
    }

    // 最终得分
    const wordScore = Math.max(0, base + timeBonus + streakBonus - penalty);
    return wordScore;
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
