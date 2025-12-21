/**
 * Lion Festival G3 Spelling Application
 * 数据分析模块
 */

const analytics = {
    /**
     * 记录练习会话开始
     * @param {Object} settings - 练习设置
     */
    trackSessionStart: function(settings) {
        const sessionId = this._generateId();
        const sessionData = {
            sessionId: sessionId,
            startTime: Date.now(),
            settings: settings,
            words: [],
            events: []
        };
        sessionStorage.setItem('wordtest_current_session', JSON.stringify(sessionData));
        logger.session({ action: 'start', sessionId, settings });
        return sessionData;
    },

    /**
     * 记录练习题目
     * @param {Object} wordData - 题目数据
     */
    trackWord: function(wordData) {
        const sessionStr = sessionStorage.getItem('wordtest_current_session');
        if (!sessionStr) return;

        const session = JSON.parse(sessionStr);
        const wordRecord = {
            ...wordData,
            timestamp: Date.now()
        };
        session.words.push(wordRecord);
        sessionStorage.setItem('wordtest_current_session', JSON.stringify(session));
        logger.word(wordRecord);
    },

    /**
     * 记录按键输入
     * @param {string} key - 按键
     * @param {boolean} correct - 是否正确
     * @param {Object} context - 上下文信息
     */
    trackKeyInput: function(key, correct, context = {}) {
        logger.userAction('KEY_INPUT', 'keyboard', {
            key: key,
            correct: correct,
            wordId: context.wordId,
            position: context.position,
            timestamp: Date.now()
        });

        // 记录性能数据
        if (!correct) {
            logger.performance('KEY_ERROR', 1, context);
        }
    },

    /**
     * 记录点击事件
     * @param {string} target - 目标元素
     * @param {Object} data - 附加数据
     */
    trackClick: function(target, data = {}) {
        logger.userAction('CLICK', target, data);
    },

    /**
     * 记录页面访问
     * @param {string} page - 页面名称
     */
    trackPageView: function(page) {
        logger.pageView(page);
    },

    /**
     * 记录设置变更
     * @param {string} setting - 设置项
     * @param {*} value - 值
     */
    trackSettingChange: function(setting, value) {
        const oldValue = state.settings[setting];
        state.settings[setting] = value;
        logger.settingChange(setting, oldValue, value);
    },

    /**
     * 完成练习会话
     * @param {Object} results - 结果数据
     * @returns {Object} 完整的会话数据
     */
    trackSessionComplete: function(results) {
        const sessionStr = sessionStorage.getItem('wordtest_current_session');
        if (!sessionStr) return null;

        const session = JSON.parse(sessionStr);
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        session.results = results;

        // 保存到用户历史
        this._saveSessionToHistory(session);

        // 新增：聚合每日单词数据
        if (state.session.wordLogs && state.session.wordLogs.length > 0) {
            this._saveDailyWordStats(state.session.wordLogs);
        }

        // 清除当前会话
        sessionStorage.removeItem('wordtest_current_session');

        logger.session({
            action: 'complete',
            sessionId: session.sessionId,
            duration: session.duration,
            results: results
        });

        return session;
    },

    /**
     * 保存每日单词聚合统计
     * @param {Array} wordLogs - 本次会话的单词日志
     * @private
     */
    _saveDailyWordStats: function(wordLogs) {
        if (!currentUser) return;
        
        const dateStr = new Date().toISOString().split('T')[0];
        const key = `wordtest_daily_stats_${currentUser.username}_${dateStr}`;
        let dailyStats = JSON.parse(localStorage.getItem(key) || '{"totalWords":0, "totalTime":0, "wordAnalysis":{}, "confusedPairs":{}}');

        wordLogs.forEach(log => {
            dailyStats.totalWords++;
            dailyStats.totalTime += log.duration;

            // 单词分析
            if (!dailyStats.wordAnalysis[log.wordId]) {
                dailyStats.wordAnalysis[log.wordId] = { count: 0, totalTime: 0, mistakes: 0, errorDetails: {} };
            }
            const wordStat = dailyStats.wordAnalysis[log.wordId];
            wordStat.count++;
            wordStat.totalTime += log.duration;
            wordStat.mistakes += log.mistakesCount;

            // 聚合详细错误指纹
            if (log.mistakesDetails && log.mistakesDetails.length > 0) {
                log.mistakesDetails.forEach(err => {
                    const errorKey = `${err.position}_${err.expected}_${err.actual}`;
                    wordStat.errorDetails[errorKey] = (wordStat.errorDetails[errorKey] || 0) + 1;

                    // 全局混淆对分析 (Expected -> Actual)
                    const pairKey = `${err.expected}_${err.actual}`;
                    dailyStats.confusedPairs[pairKey] = (dailyStats.confusedPairs[pairKey] || 0) + 1;
                });
            }
        });

        localStorage.setItem(key, JSON.stringify(dailyStats));
    },

    /**
     * 获取用户使用统计
     * @param {string} username - 用户名
     * @returns {Object} 统计数据
     */
    getUserStats: function(username) {
        const historyKey = `wordtest_history_${username}`;
        const historyStr = localStorage.getItem(historyKey);
        let history = [];

        if (historyStr) {
            try {
                history = JSON.parse(historyStr);
            } catch (e) {
                console.error('解析历史数据失败:', e);
            }
        }

        const stats = {
            totalSessions: history.length,
            totalWords: 0,
            totalScore: 0,
            totalTime: 0,
            avgScore: 0,
            avgAccuracy: 0,
            avgTimePerWord: 0,
            maxStreak: 0,
            favoriteGroup: null,
            sessionsByDay: {},
            scoreTrend: []
        };

        if (history.length === 0) return stats;

        let totalCorrect = 0;
        let totalWords = 0;

        history.forEach(session => {
            if (session.results) {
                stats.totalSessions++;
                stats.totalScore += session.results.totalScore || 0;
                stats.totalTime += session.duration || 0;
                totalWords += session.results.totalWords || 0;
                totalCorrect += (session.results.totalWords - session.results.wrongCount) || 0;
                stats.maxStreak = Math.max(stats.maxStreak, session.results.maxStreak || 0);

                // 按天统计
                const date = new Date(session.startTime).toISOString().split('T')[0];
                stats.sessionsByDay[date] = (stats.sessionsByDay[date] || 0) + 1;

                // 分数趋势
                stats.scoreTrend.push({
                    date: session.startTime,
                    score: session.results.totalScore || 0
                });
            }
        });

        stats.totalWords = totalWords;
        stats.avgScore = stats.totalSessions > 0 ? Math.round(stats.totalScore / stats.totalSessions) : 0;
        stats.avgAccuracy = totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0;
        stats.avgTimePerWord = totalWords > 0 ? Math.round((stats.totalTime / totalWords) / 1000) : 0;

        // 计算最受欢迎的分组
        const groupCount = {};
        history.forEach(session => {
            if (session.settings && session.settings.groups) {
                session.settings.groups.forEach(group => {
                    groupCount[group] = (groupCount[group] || 0) + 1;
                });
            }
        });
        const favoriteGroup = Object.keys(groupCount).reduce((a, b) => groupCount[a] > groupCount[b] ? a : b, null);
        stats.favoriteGroup = favoriteGroup;

        return stats;
    },

    /**
     * 获取最近会话历史
     * @param {string} username - 用户名
     * @param {number} limit - 限制数量
     * @returns {Array} 会话历史
     */
    getSessionHistory: function(username, limit = 10) {
        const historyKey = `wordtest_history_${username}`;
        const historyStr = localStorage.getItem(historyKey);
        let history = [];

        if (historyStr) {
            try {
                history = JSON.parse(historyStr);
            } catch (e) {
                console.error('解析历史数据失败:', e);
            }
        }

        return history
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    },

    /**
     * 获取所有用户的使用统计
     * @returns {Object} 所有用户的统计数据
     */
    getAllUsersStats: function() {
        const users = getAllUsers();
        const stats = {};

        users.forEach(user => {
            stats[user.username] = this.getUserStats(user.username);
        });

        return stats;
    },

    /**
     * 导出用户数据
     * @param {string} username - 用户名
     * @returns {string} JSON格式的数据
     */
    exportUserData: function(username) {
        const userData = getUserData(username);
        const sessionHistory = this.getSessionHistory(username, 1000);
        const logs = logger.getLogsByUser(username);

        return JSON.stringify({
            user: userData,
            sessions: sessionHistory,
            logs: logs,
            exportedAt: Date.now()
        }, null, 2);
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     * @private
     */
    _generateId: function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 保存会话到历史记录
     * @param {Object} session - 会话数据
     * @private
     */
    _saveSessionToHistory: function(session) {
        if (!currentUser) return;

        const historyKey = `wordtest_history_${currentUser.username}`;
        const historyStr = localStorage.getItem(historyKey);
        let history = [];

        if (historyStr) {
            try {
                history = JSON.parse(historyStr);
            } catch (e) {
                console.error('解析历史数据失败:', e);
                history = [];
            }
        }

        history.push(session);

        // 保留最近100次会话
        if (history.length > 100) {
            history = history.slice(-100);
        }

        localStorage.setItem(historyKey, JSON.stringify(history));
    },

    /**
     * 清除用户数据
     * @param {string} username - 用户名
     */
    clearUserData: function(username) {
        localStorage.removeItem(`wordtest_user_${username}`);
        localStorage.removeItem(`wordtest_history_${username}`);
        logger.info('USER_DATA_CLEARED', { username, timestamp: Date.now() });
    },

    /**
     * 获取详细的使用报告
     * @param {string} username - 用户名
     * @returns {Object} 详细报告
     */
    getDetailedReport: function(username) {
        const stats = this.getUserStats(username);
        const history = this.getSessionHistory(username, 30);
        const logs = logger.getLogsByUser(username);

        const report = {
            summary: stats,
            recentSessions: history.map(session => ({
                date: new Date(session.startTime).toLocaleString(),
                duration: Math.round(session.duration / 1000) + 's',
                score: session.results?.totalScore || 0,
                words: session.results?.totalWords || 0,
                accuracy: session.results?.totalWords > 0
                    ? Math.round(((session.results.totalWords - session.results.wrongCount) / session.results.totalWords) * 100) + '%'
                    : '0%',
                groups: session.settings?.groups?.join(', ') || 'N/A',
                difficulty: session.settings?.difficulty || 'standard'
            })),
            activity: {
                last7Days: this._getActivityByDays(logs, 7),
                last30Days: this._getActivityByDays(logs, 30)
            },
            logStats: {
                totalActions: logs.length,
                byType: this._groupLogsByType(logs)
            }
        };

        return report;
    },

    /**
     * 按天获取活动数据
     * @param {Array} logs - 日志数组
     * @param {number} days - 天数
     * @returns {Object} 活动统计
     * @private
     */
    _getActivityByDays: function(logs, days) {
        const result = {};
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            result[dateStr] = 0;
        }

        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            if (result.hasOwnProperty(logDate)) {
                result[logDate]++;
            }
        });

        return result;
    },

    /**
     * 按类型分组日志
     * @param {Array} logs - 日志数组
     * @returns {Object} 分组统计
     * @private
     */
    _groupLogsByType: function(logs) {
        const groups = {};
        logs.forEach(log => {
            const type = log.event.split('_')[0] || 'OTHER';
            groups[type] = (groups[type] || 0) + 1;
        });
        return groups;
    }
};

// 导出analytics对象（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = analytics;
}
