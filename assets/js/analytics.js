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
        let dailyStats = JSON.parse(localStorage.getItem(key) || JSON.stringify(this._getEmptyDailyStats()));

        wordLogs.forEach(log => {
            dailyStats.totalWords++;
            dailyStats.totalTime += log.duration;
            dailyStats.perfectWords += (log.mistakesCount === 0) ? 1 : 0;
            dailyStats.totalMistakes += log.mistakesCount || 0;
            dailyStats.totalScore += log.scoreEarned || 0;

            // 更新连击统计
            if (log.streakBefore >= 3) {
                dailyStats.longStreaks++;
            }

            // 单词分析
            if (!dailyStats.wordAnalysis[log.wordId]) {
                dailyStats.wordAnalysis[log.wordId] = {
                    word: log.word,
                    group: log.group,
                    count: 0,
                    totalTime: 0,
                    mistakes: 0,
                    perfectCount: 0,
                    avgTime: 0,
                    errorDetails: {},
                    lastPracticed: log.endTime
                };
            }
            const wordStat = dailyStats.wordAnalysis[log.wordId];
            wordStat.count++;
            wordStat.totalTime += log.duration;
            wordStat.mistakes += log.mistakesCount || 0;
            wordStat.perfectCount += (log.mistakesCount === 0) ? 1 : 0;
            wordStat.avgTime = Math.round(wordStat.totalTime / wordStat.count);
            wordStat.lastPracticed = log.endTime;

            // 聚合详细错误指纹
            if (log.mistakesDetails && log.mistakesDetails.length > 0) {
                log.mistakesDetails.forEach(err => {
                    const errorKey = `${err.position}_${err.expected}_${err.actual}`;
                    wordStat.errorDetails[errorKey] = (wordStat.errorDetails[errorKey] || 0) + 1;

                    // 全局混淆对分析 (Expected -> Actual)
                    const pairKey = `${err.expected}_${err.actual}`;
                    dailyStats.confusedPairs[pairKey] = (dailyStats.confusedPairs[pairKey] || 0) + 1;

                    // 字母类型错误分析
                    const charTypeKey = `${err.charType}_${err.expected}`;
                    dailyStats.charTypeErrors[charTypeKey] = (dailyStats.charTypeErrors[charTypeKey] || 0) + 1;
                });
            }

            // 分组统计
            if (!dailyStats.groupStats[log.group]) {
                dailyStats.groupStats[log.group] = {
                    count: 0,
                    totalTime: 0,
                    mistakes: 0,
                    perfectCount: 0
                };
            }
            dailyStats.groupStats[log.group].count++;
            dailyStats.groupStats[log.group].totalTime += log.duration;
            dailyStats.groupStats[log.group].mistakes += log.mistakesCount || 0;
            if (log.mistakesCount === 0) {
                dailyStats.groupStats[log.group].perfectCount++;
            }
        });

        // 计算平均值
        dailyStats.avgTimePerWord = dailyStats.totalWords > 0 ? Math.round(dailyStats.totalTime / dailyStats.totalWords) : 0;
        dailyStats.avgMistakesPerWord = dailyStats.totalWords > 0 ? Math.round((dailyStats.totalMistakes / dailyStats.totalWords) * 100) / 100 : 0;
        dailyStats.accuracy = dailyStats.totalWords > 0 ? Math.round((dailyStats.perfectWords / dailyStats.totalWords) * 100) : 0;

        // 计算最困难的单词（按错误率和平均时间）
        dailyStats.mostDifficultWords = this._calculateMostDifficultWords(dailyStats.wordAnalysis);

        // 计算最混淆的字母对
        dailyStats.mostConfusedLetters = this._calculateMostConfusedLetters(dailyStats.confusedPairs);

        localStorage.setItem(key, JSON.stringify(dailyStats));

        // 更新每周统计
        this._updateWeeklyStats(dateStr);
    },

    /**
     * 获取空的每日统计数据结构
     * @returns {Object} 空的统计数据
     * @private
     */
    _getEmptyDailyStats: function() {
        return {
            date: new Date().toISOString().split('T')[0],
            totalWords: 0,
            perfectWords: 0,
            totalTime: 0,
            totalMistakes: 0,
            totalScore: 0,
            avgTimePerWord: 0,
            avgMistakesPerWord: 0,
            accuracy: 0,
            longStreaks: 0,
            wordAnalysis: {},
            confusedPairs: {},
            charTypeErrors: {},
            groupStats: {},
            mostDifficultWords: [],
            mostConfusedLetters: []
        };
    },

    /**
     * 计算最困难的单词
     * @param {Object} wordAnalysis - 单词分析数据
     * @returns {Array} 最困难的单词列表
     * @private
     */
    _calculateMostDifficultWords: function(wordAnalysis) {
        const words = Object.entries(wordAnalysis).map(([wordId, data]) => {
            const errorRate = data.count > 0 ? data.mistakes / data.count : 0;
            return {
                wordId: parseInt(wordId),
                word: data.word,
                group: data.group,
                count: data.count,
                avgTime: data.avgTime,
                errorRate: Math.round(errorRate * 100) / 100,
                difficulty: errorRate > 0.3 ? 'hard' : errorRate > 0.1 ? 'medium' : 'easy'
            };
        });

        // 按错误率和平均时间排序
        return words
            .filter(w => w.count >= 2) // 只显示练习2次以上的单词
            .sort((a, b) => (b.errorRate - a.errorRate) || (b.avgTime - a.avgTime))
            .slice(0, 5);
    },

    /**
     * 计算最混淆的字母对
     * @param {Object} confusedPairs - 混淆字母对
     * @returns {Array} 最混淆的字母对列表
     * @private
     */
    _calculateMostConfusedLetters: function(confusedPairs) {
        const pairs = Object.entries(confusedPairs)
            .map(([pair, count]) => {
                const [expected, actual] = pair.split('_');
                return { expected, actual, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return pairs;
    },

    /**
     * 更新每周统计
     * @param {string} dateStr - 日期字符串
     * @private
     */
    _updateWeeklyStats: function(dateStr) {
        if (!currentUser) return;

        // 计算周开始日期（周一）
        const date = new Date(dateStr);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
        const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];

        const weekKey = `wordtest_weekly_stats_${currentUser.username}_${weekStart}`;
        let weeklyStats = JSON.parse(localStorage.getItem(weekKey) || JSON.stringify(this._getEmptyWeeklyStats(weekStart)));

        // 获取本周所有日期
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const dayStr = day.toISOString().split('T')[0];

            const dailyKey = `wordtest_daily_stats_${currentUser.username}_${dayStr}`;
            const dailyStr = localStorage.getItem(dailyKey);
            if (dailyStr) {
                try {
                    const dailyData = JSON.parse(dailyStr);
                    weeklyStats.dailyStats[dayStr] = dailyData;
                    weeklyStats.totalWords += dailyData.totalWords || 0;
                    weeklyStats.perfectWords += dailyData.perfectWords || 0;
                    weeklyStats.totalTime += dailyData.totalTime || 0;
                    weeklyStats.totalMistakes += dailyData.totalMistakes || 0;
                    weeklyStats.totalScore += dailyData.totalScore || 0;
                    weeklyStats.longStreaks += dailyData.longStreaks || 0;
                } catch (e) {
                    console.error('解析每日数据失败:', e);
                }
            }
        }

        // 计算周平均值
        weeklyStats.avgWordsPerDay = Math.round(weeklyStats.totalWords / 7);
        weeklyStats.avgTimePerWord = weeklyStats.totalWords > 0 ? Math.round(weeklyStats.totalTime / weeklyStats.totalWords) : 0;
        weeklyStats.accuracy = weeklyStats.totalWords > 0 ? Math.round((weeklyStats.perfectWords / weeklyStats.totalWords) * 100) : 0;

        // 计算趋势
        weeklyStats.trends = this._calculateWeeklyTrends(weeklyStats.dailyStats);

        localStorage.setItem(weekKey, JSON.stringify(weeklyStats));
    },

    /**
     * 获取空的每周统计数据结构
     * @param {string} weekStart - 周开始日期
     * @returns {Object} 空的周统计数据
     * @private
     */
    _getEmptyWeeklyStats: function(weekStart) {
        return {
            weekStart: weekStart,
            weekEnd: new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalWords: 0,
            perfectWords: 0,
            totalTime: 0,
            totalMistakes: 0,
            totalScore: 0,
            longStreaks: 0,
            avgWordsPerDay: 0,
            avgTimePerWord: 0,
            accuracy: 0,
            dailyStats: {},
            trends: {
                accuracyImprovement: 0,
                speedImprovement: 0,
                newWordsMastered: 0,
                problemWords: 0
            }
        };
    },

    /**
     * 计算每周趋势
     * @param {Object} dailyStats - 每日统计数据
     * @returns {Object} 趋势数据
     * @private
     */
    _calculateWeeklyTrends: function(dailyStats) {
        const dates = Object.keys(dailyStats).sort();
        if (dates.length < 2) {
            return {
                accuracyImprovement: 0,
                speedImprovement: 0,
                newWordsMastered: 0,
                problemWords: 0
            };
        }

        // 计算前半周和后半周的平均准确率
        const midPoint = Math.floor(dates.length / 2);
        const firstHalf = dates.slice(0, midPoint);
        const secondHalf = dates.slice(midPoint);

        let firstHalfAccuracy = 0;
        let secondHalfAccuracy = 0;
        let firstHalfSpeed = 0;
        let secondHalfSpeed = 0;

        firstHalf.forEach(date => {
            const data = dailyStats[date];
            if (data.totalWords > 0) {
                firstHalfAccuracy += data.accuracy;
                firstHalfSpeed += data.avgTimePerWord;
            }
        });

        secondHalf.forEach(date => {
            const data = dailyStats[date];
            if (data.totalWords > 0) {
                secondHalfAccuracy += data.accuracy;
                secondHalfSpeed += data.avgTimePerWord;
            }
        });

        const firstHalfCount = firstHalf.length;
        const secondHalfCount = secondHalf.length;

        return {
            accuracyImprovement: firstHalfCount > 0 && secondHalfCount > 0
                ? Math.round(((secondHalfAccuracy / secondHalfCount) - (firstHalfAccuracy / firstHalfCount)) * 10) / 10
                : 0,
            speedImprovement: firstHalfCount > 0 && secondHalfCount > 0
                ? Math.round(((firstHalfSpeed / firstHalfCount) - (secondHalfSpeed / secondHalfCount)) * 10) / 10
                : 0,
            newWordsMastered: 0, // 需要更复杂的逻辑来计算
            problemWords: 0      // 需要更复杂的逻辑来计算
        };
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
    },

    /**
     * 获取指定日期的每日统计
     * @param {string} username - 用户名
     * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)，为空则获取今天
     * @returns {Object|null} 每日统计数据
     */
    getDailyStats: function(username, dateStr = null) {
        if (!username) return null;

        const date = dateStr || new Date().toISOString().split('T')[0];
        const key = `wordtest_daily_stats_${username}_${date}`;
        const statsStr = localStorage.getItem(key);

        if (!statsStr) return null;

        try {
            return JSON.parse(statsStr);
        } catch (e) {
            console.error('解析每日统计数据失败:', e);
            return null;
        }
    },

    /**
     * 获取指定周的每周统计
     * @param {string} username - 用户名
     * @param {string} weekStart - 周开始日期 (YYYY-MM-DD)，为空则获取本周
     * @returns {Object|null} 每周统计数据
     */
    getWeeklyStats: function(username, weekStart = null) {
        if (!username) return null;

        if (!weekStart) {
            // 计算本周开始日期（周一）
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];
        }

        const key = `wordtest_weekly_stats_${username}_${weekStart}`;
        const statsStr = localStorage.getItem(key);

        if (!statsStr) return null;

        try {
            return JSON.parse(statsStr);
        } catch (e) {
            console.error('解析每周统计数据失败:', e);
            return null;
        }
    },

    /**
     * 获取最近N天的每日统计
     * @param {string} username - 用户名
     * @param {number} days - 天数
     * @returns {Array} 每日统计数据数组
     */
    getRecentDailyStats: function(username, days = 7) {
        if (!username) return [];

        const stats = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dailyStats = this.getDailyStats(username, dateStr);
            if (dailyStats) {
                stats.unshift(dailyStats); // 按时间正序添加
            }
        }

        return stats;
    },

    /**
     * 获取最近N周的每周统计
     * @param {string} username - 用户名
     * @param {number} weeks - 周数
     * @returns {Array} 每周统计数据数组
     */
    getRecentWeeklyStats: function(username, weeks = 4) {
        if (!username) return [];

        const stats = [];
        const today = new Date();

        for (let i = 0; i < weeks; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 7));
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];

            const weeklyStats = this.getWeeklyStats(username, weekStart);
            if (weeklyStats) {
                stats.unshift(weeklyStats); // 按时间正序添加
            }
        }

        return stats;
    },

    /**
     * 获取用户记忆分析报告
     * @param {string} username - 用户名
     * @returns {Object} 记忆分析报告
     */
    getMemoryAnalysisReport: function(username) {
        if (!username) return null;

        const today = new Date().toISOString().split('T')[0];
        const dailyStats = this.getDailyStats(username, today);
        const weeklyStats = this.getWeeklyStats(username);

        if (!dailyStats && !weeklyStats) {
            return {
                message: '暂无练习数据',
                hasData: false
            };
        }

        const report = {
            hasData: true,
            date: today,
            summary: {
                today: dailyStats ? {
                    wordsPracticed: dailyStats.totalWords,
                    perfectWords: dailyStats.perfectWords,
                    accuracy: dailyStats.accuracy,
                    avgTime: dailyStats.avgTimePerWord,
                    totalMistakes: dailyStats.totalMistakes
                } : null,
                thisWeek: weeklyStats ? {
                    totalWords: weeklyStats.totalWords,
                    avgWordsPerDay: weeklyStats.avgWordsPerDay,
                    accuracy: weeklyStats.accuracy,
                    accuracyImprovement: weeklyStats.trends.accuracyImprovement,
                    speedImprovement: weeklyStats.trends.speedImprovement
                } : null
            },
            insights: []
        };

        // 生成洞察
        if (dailyStats) {
            // 今日最困难单词
            if (dailyStats.mostDifficultWords && dailyStats.mostDifficultWords.length > 0) {
                report.insights.push({
                    type: 'warning',
                    title: '今日困难单词',
                    message: `建议重点练习: ${dailyStats.mostDifficultWords.slice(0, 3).map(w => w.word).join(', ')}`
                });
            }

            // 热门错误
            if (dailyStats.mostConfusedLetters && dailyStats.mostConfusedLetters.length > 0) {
                const topError = dailyStats.mostConfusedLetters[0];
                report.insights.push({
                    type: 'info',
                    title: '常见错误',
                    message: `注意区分 "${topError.expected}" 和 "${topError.actual}" (今日${topError.count}次)`
                });
            }

            // 准确率评估
            if (dailyStats.accuracy >= 90) {
                report.insights.push({
                    type: 'success',
                    title: '表现优秀',
                    message: `今日准确率${dailyStats.accuracy}%，继续保持！`
                });
            } else if (dailyStats.accuracy < 70) {
                report.insights.push({
                    type: 'warning',
                    title: '需要改进',
                    message: `今日准确率${dailyStats.accuracy}%，建议放慢速度，专注准确性`
                });
            }
        }

        return report;
    }
};

// 导出analytics对象（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = analytics;
}
