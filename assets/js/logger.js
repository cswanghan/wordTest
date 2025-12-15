/**
 * Lion Festival G3 Spelling Application
 * 结构化日志系统
 */

const logger = {
    /**
     * 记录信息级别日志
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    info: function(event, data = {}) {
        this._log('INFO', event, data);
    },

    /**
     * 记录警告级别日志
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    warn: function(event, data = {}) {
        this._log('WARN', event, data);
    },

    /**
     * 记录错误级别日志
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    error: function(event, data = {}) {
        this._log('ERROR', event, data);
    },

    /**
     * 记录用户操作
     * @param {string} action - 操作类型（CLICK, INPUT, VIEW等）
     * @param {string} target - 目标元素
     * @param {Object} data - 附加数据
     */
    userAction: function(action, target, data = {}) {
        this.info(`USER_${action}`, {
            target: target,
            timestamp: Date.now(),
            user: currentUser ? currentUser.username : 'guest',
            ...data
        });
    },

    /**
     * 记录页面访问
     * @param {string} pageName - 页面名称
     * @param {Object} data - 附加数据
     */
    pageView: function(pageName, data = {}) {
        this.info('PAGE_VIEW', {
            page: pageName,
            timestamp: Date.now(),
            user: currentUser ? currentUser.username : 'guest',
            ...data
        });
    },

    /**
     * 记录练习会话
     * @param {Object} sessionData - 会话数据
     */
    session: function(sessionData) {
        this.info('PRACTICE_SESSION', {
            timestamp: Date.now(),
            user: currentUser ? currentUser.username : 'guest',
            ...sessionData
        });
    },

    /**
     * 记录练习题目
     * @param {Object} wordData - 题目数据
     */
    word: function(wordData) {
        this.info('PRACTICE_WORD', {
            timestamp: Date.now(),
            user: currentUser ? currentUser.username : 'guest',
            ...wordData
        });
    },

    /**
     * 记录设置变更
     * @param {string} setting - 设置项
     * @param {*} oldValue - 旧值
     * @param {*} newValue - 新值
     */
    settingChange: function(setting, oldValue, newValue) {
        this.info('SETTING_CHANGE', {
            setting: setting,
            oldValue: oldValue,
            newValue: newValue,
            timestamp: Date.now(),
            user: currentUser ? currentUser.username : 'guest'
        });
    },

    /**
     * 记录性能数据
     * @param {string} metric - 指标名称
     * @param {number} value - 数值
     * @param {Object} data - 附加数据
     */
    performance: function(metric, value, data = {}) {
        this.info('PERFORMANCE', {
            metric: metric,
            value: value,
            timestamp: Date.now(),
            user: currentUser ? currentUser.username : 'guest',
            ...data
        });
    },

    /**
     * 内部日志记录方法
     * @param {string} level - 日志级别
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     * @private
     */
    _log: function(level, event, data) {
        const logEntry = {
            level: level,
            event: event,
            data: data,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        // 存储到localStorage
        this._storeLog(logEntry);

        // 控制台输出（开发环境）
        if (typeof console !== 'undefined') {
            const color = {
                'INFO': '#3b82f6',
                'WARN': '#f59e0b',
                'ERROR': '#ef4444'
            }[level] || '#6b7280';

            console.log(
                `%c[${level}] ${event}`,
                `color: ${color}; font-weight: bold;`,
                logEntry
            );
        }
    },

    /**
     * 存储日志到localStorage
     * @param {Object} logEntry - 日志条目
     * @private
     */
    _storeLog: function(logEntry) {
        const key = 'wordtest_logs';
        const logsStr = localStorage.getItem(key);
        let logs = [];

        if (logsStr) {
            try {
                logs = JSON.parse(logsStr);
            } catch (e) {
                console.error('解析日志失败:', e);
                logs = [];
            }
        }

        logs.push(logEntry);

        // 保留最近1000条日志
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }

        localStorage.setItem(key, JSON.stringify(logs));
    },

    /**
     * 获取所有日志
     * @returns {Array} 日志数组
     */
    getLogs: function() {
        const logsStr = localStorage.getItem('wordtest_logs');
        if (logsStr) {
            try {
                return JSON.parse(logsStr);
            } catch (e) {
                console.error('解析日志失败:', e);
                return [];
            }
        }
        return [];
    },

    /**
     * 按事件类型过滤日志
     * @param {string} event - 事件名称
     * @returns {Array} 过滤后的日志
     */
    getLogsByEvent: function(event) {
        return this.getLogs().filter(log => log.event === event);
    },

    /**
     * 按用户过滤日志
     * @param {string} username - 用户名
     * @returns {Array} 过滤后的日志
     */
    getLogsByUser: function(username) {
        return this.getLogs().filter(log => log.data.user === username);
    },

    /**
     * 清除所有日志
     */
    clearLogs: function() {
        localStorage.removeItem('wordtest_logs');
        this.info('LOGS_CLEARED', { timestamp: Date.now() });
    },

    /**
     * 导出日志为JSON
     * @returns {string} JSON格式的日志
     */
    exportLogs: function() {
        return JSON.stringify(this.getLogs(), null, 2);
    },

    /**
     * 统计日志
     * @returns {Object} 统计信息
     */
    getStats: function() {
        const logs = this.getLogs();
        const stats = {
            total: logs.length,
            byLevel: {},
            byEvent: {},
            byUser: {},
            dateRange: {
                start: logs.length > 0 ? logs[0].date : null,
                end: logs.length > 0 ? logs[logs.length - 1].date : null
            }
        };

        logs.forEach(log => {
            // 按级别统计
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

            // 按事件统计
            stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;

            // 按用户统计
            const user = log.data.user || 'unknown';
            stats.byUser[user] = (stats.byUser[user] || 0) + 1;
        });

        return stats;
    }
};

// 自动记录页面加载
document.addEventListener('DOMContentLoaded', () => {
    logger.info('PAGE_LOADED', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        user: currentUser ? currentUser.username : 'guest'
    });
});

// 记录页面卸载
window.addEventListener('beforeunload', () => {
    logger.info('PAGE_UNLOADED', {
        timestamp: Date.now(),
        user: currentUser ? currentUser.username : 'guest'
    });
});

// 导出logger对象（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}
