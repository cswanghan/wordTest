/**
 * Lion Festival G3 Spelling Application
 * 用户认证模块
 */

// 当前用户
let currentUser = null;

/**
 * 检查用户是否已登录
 * @returns {Object|null} 用户信息或null
 */
function checkAuth() {
    const userStr = localStorage.getItem('wordtest_current_user');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
            return currentUser;
        } catch (e) {
            console.error('解析用户信息失败:', e);
            localStorage.removeItem('wordtest_current_user');
            return null;
        }
    }
    return null;
}

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码（V1简化处理）
 * @returns {Object} 登录结果
 */
function login(username, password) {
    if (!username || !password) {
        return { success: false, message: '请输入用户名和密码' };
    }

    // 简化验证：用户名不能为空，密码长度>=3
    if (username.length < 2) {
        return { success: false, message: '用户名至少2个字符' };
    }
    if (password.length < 3) {
        return { success: false, message: '密码至少3个字符' };
    }

    // 获取用户数据
    const userData = getUserData(username);
    if (!userData) {
        // 新用户，创建记录
        const newUser = {
            username: username,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            totalSessions: 0,
            totalScore: 0,
            totalWords: 0,
            totalTime: 0,
            avgAccuracy: 0,
            maxStreak: 0,
            preferredGroups: [],
            preferredDifficulty: 'standard'
        };
        saveUserData(username, newUser);
        currentUser = newUser;
    } else {
        // 老用户，更新登录时间
        userData.lastLoginAt = Date.now();
        saveUserData(username, userData);
        currentUser = userData;
    }

    // 保存当前登录状态
    localStorage.setItem('wordtest_current_user', JSON.stringify(currentUser));

    // 记录登录日志
    logger.info('USER_LOGIN', { username, timestamp: Date.now() });

    return { success: true, user: currentUser };
}

/**
 * 用户登出
 */
function logout() {
    if (currentUser) {
        logger.info('USER_LOGOUT', { username: currentUser.username, timestamp: Date.now() });
    }
    currentUser = null;
    localStorage.removeItem('wordtest_current_user');
    renderLogin();
}

/**
 * 获取用户数据
 * @param {string} username - 用户名
 * @returns {Object|null} 用户数据
 */
function getUserData(username) {
    const key = `wordtest_user_${username}`;
    const dataStr = localStorage.getItem(key);
    if (dataStr) {
        try {
            return JSON.parse(dataStr);
        } catch (e) {
            console.error(`解析用户 ${username} 数据失败:`, e);
            return null;
        }
    }
    return null;
}

/**
 * 保存用户数据
 * @param {string} username - 用户名
 * @param {Object} data - 用户数据
 */
function saveUserData(username, data) {
    const key = `wordtest_user_${username}`;
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * 更新用户统计数据
 * @param {Object} sessionData - 本次会话数据
 */
function updateUserStats(sessionData) {
    if (!currentUser) return;

    const userData = getUserData(currentUser.username);
    if (!userData) return;

    // 更新统计数据
    userData.totalSessions += 1;
    userData.totalScore += sessionData.totalScore || 0;
    userData.totalWords += sessionData.totalWords || 0;
    userData.totalTime += sessionData.totalTime || 0;
    userData.maxStreak = Math.max(userData.maxStreak || 0, sessionData.maxStreak || 0);

    // 计算平均准确率
    if (userData.totalSessions > 0) {
        const totalCorrect = userData.totalWords - (userData.totalWords * (userData.avgAccuracy / 100) * (userData.totalSessions - 1));
        const currentAccuracy = sessionData.totalWords > 0 ? ((sessionData.totalWords - sessionData.wrongCount) / sessionData.totalWords * 100) : 0;
        userData.avgAccuracy = ((totalCorrect + (currentAccuracy * sessionData.totalWords / 100)) / (userData.totalWords)) * 100;
    }

    // 记录首选分组
    if (sessionData.groups && sessionData.groups.length > 0) {
        sessionData.groups.forEach(group => {
            if (!userData.preferredGroups.includes(group)) {
                userData.preferredGroups.push(group);
            }
        });
    }

    // 记录首选难度
    userData.preferredDifficulty = sessionData.difficulty || 'standard';

    saveUserData(currentUser.username, userData);
    currentUser = userData;
    localStorage.setItem('wordtest_current_user', JSON.stringify(userData));
}

/**
 * 获取所有用户列表
 * @returns {Array} 用户名列表
 */
function getAllUsers() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wordtest_user_')) {
            const username = key.replace('wordtest_user_', '');
            const userData = getUserData(username);
            if (userData) {
                users.push({
                    username: username,
                    lastLoginAt: userData.lastLoginAt,
                    totalSessions: userData.totalSessions,
                    totalScore: userData.totalScore
                });
            }
        }
    }
    return users.sort((a, b) => b.lastLoginAt - a.lastLoginAt);
}

// 导出函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        login,
        logout,
        getUserData,
        saveUserData,
        updateUserStats,
        getAllUsers,
        get currentUser() { return currentUser; }
    };
}
