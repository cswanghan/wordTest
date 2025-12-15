/**
 * Lion Festival G3 Spelling Application
 * 视图渲染模块
 */

const app = document.getElementById('app');

/**
 * 渲染登录页
 */
function renderLogin() {
    state.view = 'login';
    analytics.trackPageView('login');

    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 fade-in">
            <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-100">
                <div class="text-center mb-8">
                    <span class="text-6xl block mb-2">🦁</span>
                    <h1 class="text-4xl font-black text-amber-600 mb-2">Lion Festival</h1>
                    <p class="text-gray-500 font-bold">G3 Spelling Challenge</p>
                </div>

                <form onsubmit="handleLogin(event)" class="space-y-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-600 mb-2">用户名</label>
                        <input type="text" id="login-username" required minlength="2"
                               class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:outline-none transition text-lg"
                               placeholder="请输入用户名">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-600 mb-2">密码</label>
                        <input type="password" id="login-password" required minlength="3"
                               class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:outline-none transition text-lg"
                               placeholder="请输入密码（至少3位）">
                    </div>

                    <button type="submit" class="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black py-4 rounded-2xl text-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0">
                        登录 / 注册
                    </button>
                </form>

                <div class="mt-6 text-center text-xs text-gray-400">
                    <p>首次登录将自动创建账户</p>
                    <p class="mt-2">数据将保存在本地浏览器中</p>
                </div>
            </div>
        </div>
    `;

    // 聚焦到用户名输入框
    setTimeout(() => {
        document.getElementById('login-username').focus();
    }, 100);
}

/**
 * 处理登录表单提交
 * @param {Event} event - 表单事件
 */
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    analytics.trackClick('LOGIN_BUTTON', { username });

    const result = login(username, password);
    if (result.success) {
        logger.info('LOGIN_SUCCESS', { username, timestamp: Date.now() });
        renderHome();
    } else {
        logger.warn('LOGIN_FAILED', { username, reason: result.message });
        alert(result.message);
    }
}

/**
 * 渲染用户数据面板
 */
function renderUserDashboard() {
    state.view = 'dashboard';
    analytics.trackPageView('dashboard');

    if (!currentUser) {
        renderLogin();
        return;
    }

    const stats = analytics.getUserStats(currentUser.username);
    const recentSessions = analytics.getSessionHistory(currentUser.username, 5);
    const allUsers = getAllUsers();

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 p-4 fade-in">
            <!-- 顶部栏 -->
            <div class="max-w-6xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-black">
                                ${currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-gray-800">${currentUser.username}</h2>
                                <p class="text-gray-500">加入时间：${new Date(currentUser.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button onclick="logout()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold transition">
                            退出登录
                        </button>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-amber-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">总练习次数</div>
                            <div class="text-3xl font-black text-amber-600">${stats.totalSessions}</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">总得分</div>
                            <div class="text-3xl font-black text-blue-600">${stats.totalScore}</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">平均准确率</div>
                            <div class="text-3xl font-black text-purple-600">${stats.avgAccuracy}%</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">最佳连击</div>
                            <div class="text-3xl font-black text-green-600">${stats.maxStreak}</div>
                        </div>
                    </div>
                </div>

                <!-- 最近练习记录 -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 class="text-xl font-black text-gray-800 mb-4">最近练习记录</h3>
                    <div class="space-y-3">
                        ${recentSessions.length > 0 ? recentSessions.map(session => `
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <div class="flex-1">
                                    <div class="font-bold text-gray-800">${new Date(session.startTime).toLocaleString()}</div>
                                    <div class="text-sm text-gray-500 mt-1">
                                        分组：${session.settings?.groups?.join(', ') || 'N/A'} |
                                        难度：${session.settings?.difficulty || 'standard'} |
                                        用时：${Math.round(session.duration / 1000)}秒
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-black text-amber-600">${session.results?.totalScore || 0}</div>
                                    <div class="text-sm text-gray-500">
                                        ${session.results?.totalWords || 0}题
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<div class="text-gray-400 text-center py-8">暂无练习记录</div>'}
                    </div>
                </div>

                <!-- 用户操作 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-xl font-black text-gray-800 mb-4">开始练习</h3>
                        <button onclick="renderHome()" class="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-all transform hover:scale-105">
                            🏠 返回首页
                        </button>
                        <button onclick="exportUserData()" class="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">
                            📊 导出我的数据
                        </button>
                    </div>

                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-xl font-black text-gray-800 mb-4">数据管理</h3>
                        <button onclick="viewLogs()" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition">
                            📋 查看操作日志
                        </button>
                        <button onclick="if(confirm('确定要清除所有数据吗？此操作不可恢复！')) clearAllUserData()" class="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">
                            🗑️ 清除所有数据
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 导出用户数据
 */
function exportUserData() {
    analytics.trackClick('EXPORT_DATA');
    const data = analytics.exportUserData(currentUser.username);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordtest_${currentUser.username}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logger.info('DATA_EXPORTED', { username: currentUser.username });
}

/**
 * 查看操作日志
 */
function viewLogs() {
    analytics.trackClick('VIEW_LOGS');
    const logs = logger.getLogsByUser(currentUser.username);
    const stats = logger.getStats();

    const logHtml = logs.slice(-50).reverse().map(log => `
        <tr class="border-b border-gray-100">
            <td class="py-2 px-4 text-xs font-mono">${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td class="py-2 px-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${
                    log.level === 'INFO' ? 'bg-blue-100 text-blue-700' :
                    log.level === 'WARN' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }">${log.level}</span>
            </td>
            <td class="py-2 px-4 text-sm font-bold">${log.event}</td>
            <td class="py-2 px-4 text-sm text-gray-600">${JSON.stringify(log.data)}</td>
        </tr>
    `).join('');

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 p-4">
            <div class="max-w-6xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-black text-gray-800">📋 操作日志</h2>
                        <button onclick="renderUserDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold transition">
                            ← 返回
                        </button>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">总日志数</div>
                            <div class="text-2xl font-black text-blue-600">${stats.total}</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">INFO</div>
                            <div class="text-2xl font-black text-green-600">${stats.byLevel.INFO || 0}</div>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">WARN</div>
                            <div class="text-2xl font-black text-yellow-600">${stats.byLevel.WARN || 0}</div>
                        </div>
                        <div class="bg-red-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">ERROR</div>
                            <div class="text-2xl font-black text-red-600">${stats.byLevel.ERROR || 0}</div>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase">时间</th>
                                    <th class="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase">级别</th>
                                    <th class="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase">事件</th>
                                    <th class="py-3 px-4 text-left text-xs font-bold text-gray-400 uppercase">详情</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logHtml || '<tr><td colspan="4" class="py-8 text-center text-gray-400">暂无日志</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 清除所有用户数据
 */
function clearAllUserData() {
    analytics.trackClick('CLEAR_ALL_DATA');
    analytics.clearUserData(currentUser.username);
    logger.clearLogs();
    alert('所有数据已清除！');
    renderUserDashboard();
}

/**
 * 渲染首页
 */
function renderHome() {
    if (!currentUser) {
        renderLogin();
        return;
    }

    state.view = 'home';
    analytics.trackPageView('home');

    const stats = analytics.getUserStats(currentUser.username);

    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center p-4 fade-in">
            <!-- 用户信息栏 -->
            <div class="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ${currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div class="hidden sm:block">
                    <div class="font-bold text-gray-800 text-sm">${currentUser.username}</div>
                    <div class="text-xs text-gray-500">${stats.totalSessions}次练习</div>
                </div>
                <button onclick="renderUserDashboard()" class="ml-2 text-gray-400 hover:text-amber-600 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            <div class="text-center mb-10">
                <span class="text-6xl block mb-2">🦁</span>
                <h1 class="text-5xl font-black text-amber-600 mb-2 tracking-tight">Lion Festival</h1>
                <h2 class="text-xl font-bold text-gray-500 tracking-widest uppercase">G3 Spelling Challenge</h2>
            </div>

            <div class="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border-4 border-amber-100">
                <!-- 分组选择 -->
                <div class="mb-6">
                    <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">词汇分组 Word Groups</label>
                    <div class="flex flex-wrap gap-2">
                        ${['BE', 'KET', 'Culture'].map(g => `
                            <label class="cursor-pointer select-none group">
                                <input type="checkbox" value="${g}" class="peer sr-only" checked onchange="updateGroups(this)">
                                <div class="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-500 font-bold peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-700 transition-all">
                                    ${g}
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- 难度选择 -->
                <div class="mb-8">
                    <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">难度 Difficulty</label>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer">
                            <input type="radio" name="difficulty" value="standard" checked onclick="state.settings.difficulty='standard'" class="peer sr-only">
                            <div class="text-center py-3 rounded-lg border-2 border-gray-200 peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-700 font-bold transition-all">
                                <span class="block text-sm">Standard</span>
                                <span class="text-xs font-normal opacity-70">保留首字母</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="difficulty" value="challenge" onclick="state.settings.difficulty='challenge'" class="peer sr-only">
                            <div class="text-center py-3 rounded-lg border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 font-bold transition-all">
                                <span class="block text-sm">Challenge</span>
                                <span class="text-xs font-normal opacity-70">随机难度++</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- 模式入口 -->
                <div class="space-y-3">
                    <button onclick="goToOnline()" class="w-full relative overflow-hidden group bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-amber-200 transition-all transform hover:-translate-y-1 active:translate-y-0">
                        <span class="relative z-10 flex items-center justify-center gap-2">
                            <span>🎮</span> 开始闯关 (Online)
                        </span>
                    </button>
                    <button onclick="goToPrintSettings()" class="w-full bg-white border-2 border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50 font-bold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-2">
                        <span>🖨️</span> 生成打印单 (Print)
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 渲染打印设置页
 */
function renderPrintSettings() {
    state.view = 'printSettings';
    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 fade-in">
            <div class="max-w-md w-full">
                <button onclick="renderHome()" class="text-gray-400 hover:text-amber-600 font-bold mb-6 flex items-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
                    返回
                </button>

                <div class="bg-white p-8 rounded-2xl shadow-lg border-t-8 border-amber-500">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span>🖨️</span> 打印设置
                    </h2>

                    <div class="space-y-4 mb-8">
                        <label class="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                            <span class="font-bold text-gray-700">显示中文释义</span>
                            <div class="relative inline-block w-12 mr-2 align-middle select-none">
                                <input type="checkbox" checked onchange="state.settings.showCN = this.checked" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out right-6 border-gray-300 checked:right-0 checked:border-amber-500"/>
                                <div class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"></div>
                            </div>
                        </label>

                        <label class="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                            <span class="font-bold text-gray-700">随机打乱顺序</span>
                            <input type="checkbox" onchange="state.settings.shuffle = this.checked" class="w-6 h-6 text-amber-600 rounded focus:ring-amber-500">
                        </label>

                        <label class="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                            <span class="font-bold text-gray-700">附带答案页</span>
                            <input type="checkbox" onchange="state.settings.showAnswers = this.checked" class="w-6 h-6 text-amber-600 rounded focus:ring-amber-500">
                        </label>
                    </div>

                    <button onclick="generateAndPreviewPrint()" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all transform active:scale-95">
                        生成 A4 预览
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 渲染打印预览页
 * @param {Array} items - 练习项数组
 */
function renderPrintPreview(items) {
    state.view = 'printPreview';
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const seedStr = state.seed.toString().slice(-6);

    // 按分组组织题目
    const groups = {};
    if (state.settings.shuffle) {
        groups['Mixed Review'] = items;
    } else {
        items.forEach(item => {
            if (!groups[item.group]) groups[item.group] = [];
            groups[item.group].push(item);
        });
    }

    let contentHtml = '';
    for (let g in groups) {
        contentHtml += `<div class="break-inside-avoid mb-6">`;
        contentHtml += `<h3 class="text-lg font-black mt-4 mb-2 border-b-2 border-gray-300 pb-1 text-gray-700 uppercase tracking-wider">${g} <span class="text-xs font-normal text-gray-400 ml-2">(${groups[g].length} items)</span></h3>`;
        contentHtml += `<div class="grid grid-cols-1 gap-y-3 text-lg">`;

        groups[g].forEach((item, idx) => {
            let formattedEn = item.displayEn.split('').map(c => {
                if (c === '_') return '<span class="inline-block w-6 border-b-2 border-gray-800 text-transparent mx-0.5 leading-none">_</span>';
                if (c === ' ') return '<span class="mx-2">&nbsp;</span>';
                return `<span class="font-bold text-gray-800">${c}</span>`;
            }).join('');

            contentHtml += `
                <div class="flex items-center py-1 break-inside-avoid">
                    <span class="w-8 text-gray-400 font-bold text-sm select-none">${item.id}.</span>
                    <div class="font-mono text-xl tracking-wide flex-1 leading-8">${formattedEn}</div>
                    ${state.settings.showCN ? `<div class="text-gray-600 font-medium w-36 text-right text-sm border-l pl-2 border-gray-200">${item.cn}</div>` : ''}
                </div>
            `;
        });
        contentHtml += `</div></div>`;
    }

    // 答案页
    let answerHtml = '';
    if (state.settings.showAnswers) {
        answerHtml = `
            <div class="print-sheet break-before-page">
                <div class="flex justify-between items-center mb-6 border-b-2 border-gray-200 pb-2">
                    <h2 class="text-xl font-bold text-gray-700">Reference Answers</h2>
                    <span class="text-sm text-gray-400">Seed: ${seedStr}</span>
                </div>
                <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 font-mono">
                    ${items.map(item => `<div class="py-1 border-b border-gray-100"><span class="font-bold mr-2 w-6 inline-block">${item.id}.</span> ${item.en}</div>`).join('')}
                </div>
            </div>`;
    }

    app.innerHTML = `
        <div class="no-print fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 p-4 z-50 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-4">
                <button onclick="renderPrintSettings()" class="text-gray-500 hover:text-black font-bold text-sm">← 设置</button>
                <div class="h-6 w-px bg-gray-300"></div>
                <span class="font-bold text-gray-800 hidden sm:block">打印预览</span>
                <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Seed: ${seedStr}</span>
            </div>
            <div class="flex gap-3">
                <button onclick="generateAndPreviewPrint()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition">
                    🔄 重新随机
                </button>
                <button onclick="window.print()" class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    打印 / 存为 PDF
                </button>
            </div>
        </div>
        <div class="pt-20 pb-10 bg-gray-500 min-h-screen flex flex-col items-center gap-8 overflow-y-auto">
            <div class="print-sheet print-only">
                <div class="flex justify-between items-end mb-6 border-b-4 border-amber-400 pb-4">
                    <div>
                        <h1 class="text-3xl font-black text-gray-800 tracking-tight">LION FESTIVAL</h1>
                        <p class="text-gray-500 font-bold uppercase tracking-widest text-sm">G3 Spelling Challenge</p>
                    </div>
                    <div class="text-right text-xs text-gray-400 font-mono">
                        <p>Date: ${dateStr}</p>
                        <p>Code: ${seedStr}</p>
                    </div>
                </div>
                <div class="flex justify-between mb-8">
                    <div class="flex-1 mr-8 relative">
                        <div class="absolute bottom-0 left-0 w-full border-b border-gray-400"></div>
                        <span class="text-gray-400 text-sm font-bold absolute bottom-1 left-0">Name:</span>
                    </div>
                    <div class="w-32 relative">
                        <div class="absolute bottom-0 left-0 w-full border-b border-gray-400"></div>
                        <span class="text-gray-400 text-sm font-bold absolute bottom-1 left-0">Score:</span>
                    </div>
                </div>
                ${contentHtml}
                <div class="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-300">
                    Lion Festival G3 • Keep Practicing!
                </div>
            </div>
            ${answerHtml}
        </div>
    `;
    document.querySelectorAll('.print-sheet').forEach(el => el.style.display = 'block');
}

/**
 * 渲染在线练习页
 * @param {Array} items - 练习项数组
 */
function renderOnline(items) {
    state.view = 'online';
    state.session = {
        items: items,
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctCount: 0,
        wrongCount: 0,
        currentMistakes: 0,
        startTime: Date.now(),
        currentWordStartTime: Date.now(),
        currentInputIndex: 0,
        logs: []
    };

    // 渲染静态框架（只执行一次）
    app.innerHTML = `
        <div class="h-screen flex flex-col bg-amber-50 overflow-hidden">
            <!-- 顶部栏 -->
            <div class="bg-white p-3 sm:p-4 shadow-sm flex justify-between items-center z-20">
                <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button onclick="if(confirm('确定要退出练习吗？进度将丢失。')) renderHome()" class="text-gray-400 hover:text-red-500 transition p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-gray-400 uppercase">Current</span>
                        <span class="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-xs" id="group-display">-</span>
                    </div>
                </div>

                <div class="flex flex-col items-center w-20 sm:w-1/3 px-2">
                    <div class="text-xs font-bold text-gray-400 mb-1" id="progress-text">0 / 0</div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="progress-bar" class="bg-amber-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                </div>

                <div class="flex flex-col items-end flex-shrink-0">
                    <span class="text-xs font-bold text-gray-400 uppercase">Score</span>
                    <span class="font-black text-lg sm:text-xl text-amber-600" id="score-display">0</span>
                </div>
            </div>

            <!-- 主内容区 -->
            <div class="flex-1 flex flex-col items-center justify-center relative p-2 sm:p-4 overflow-hidden">

                <!-- 连击提示 -->
                <div id="streak-container" class="absolute top-4 sm:top-10 left-1/2 transform -translate-x-1/2 pointer-events-none transition-all duration-300 opacity-0 scale-50 z-10">
                    <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full font-black text-base sm:text-lg shadow-lg animate-bounce">
                        🔥 <span id="streak-count">0</span> COMBO!
                    </div>
                </div>

                <!-- 单词显示容器 -->
                <div id="word-container" class="flex flex-wrap justify-center items-center mb-6 sm:mb-10 select-none px-2 w-full max-w-4xl overflow-x-auto">
                    <!-- Words injected here -->
                </div>

                <!-- 中文提示 -->
                <div id="cn-hint-container" class="transition-all duration-500 opacity-0 translate-y-4 w-full px-4 flex justify-center">
                    <div id="cn-hint-text" class="text-lg sm:text-2xl text-gray-600 font-bold bg-white px-6 sm:px-8 py-2 sm:py-3 rounded-2xl shadow-sm border border-gray-100 max-w-md text-center">
                        ...
                    </div>
                </div>

                <!-- 得分反馈浮层 -->
                <div id="feedback-layer" class="absolute pointer-events-none text-2xl sm:text-4xl font-black text-amber-500 opacity-0 transition-all duration-500 transform translate-y-0">
                    +0
                </div>

            </div>

            <!-- 底部键盘提示 -->
            <div class="bg-white p-3 sm:p-4 text-center text-gray-400 text-xs sm:text-sm border-t border-gray-100 flex-shrink-0">
                <div class="hidden sm:block">直接使用键盘输入 • Backspace 删除</div>
                <div class="sm:hidden text-amber-600 font-bold mb-2">点击下方输入框</div>
                <!-- 隐藏的输入框（用于移动端输入） -->
                <input type="text" id="mobile-input" class="opacity-0 absolute pointer-events-none" autocomplete="off" />
                <!-- 移动端虚拟键盘 -->
                <div class="sm:hidden grid grid-cols-10 gap-1 max-w-md mx-auto">
                    ${'QWERTYUIOP'.split('').concat(['']).concat('ASDFGHJKL'.split('')).concat(['']).concat('ZXCVBNM'.split('')).map(key => key ? `
                        <button type="button" onclick="handleVirtualKey('${key}')" class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg text-sm transition">
                            ${key}
                        </button>
                    ` : '<div></div>').join('')}
                    <button type="button" onclick="handleVirtualKey('Backspace')" class="col-span-2 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-bold py-2 px-3 rounded-lg text-xs transition">
                        ⌫ 删除
                    </button>
                </div>
            </div>
        </div>
    `;

    // 移动端输入处理
    const mobileInput = document.getElementById('mobile-input');
    if (mobileInput) {
        mobileInput.focus();
        mobileInput.addEventListener('input', (e) => {
            const char = e.data;
            if (char) {
                handleKeyInput(char);
            } else if (e.inputType === 'deleteContentBackward') {
                handleKeyInput('Backspace');
            }
            mobileInput.value = '';
        });
        // 保持聚焦
        mobileInput.addEventListener('blur', () => {
            if (state.view === 'online') setTimeout(() => mobileInput.focus(), 0);
        });
    }

    updateOnlineUI();
}

/**
 * 更新在线练习UI（仅更新内容，不破坏DOM结构）
 */
function updateOnlineUI() {
    const item = state.session.items[state.session.currentIndex];
    if (!item) {
        finishSession();
        return;
    }

    // 更新顶部信息
    document.getElementById('group-display').textContent = item.group;
    document.getElementById('progress-text').textContent = `${state.session.currentIndex + 1} / ${state.session.items.length}`;
    const progressPercent = ((state.session.currentIndex) / state.session.items.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('score-display').textContent = state.session.score;

    // 更新连击
    const streakEl = document.getElementById('streak-container');
    const streakCountEl = document.getElementById('streak-count');
    if (state.session.streak > 1) {
        streakEl.classList.remove('opacity-0', 'scale-50');
        streakEl.classList.add('opacity-100', 'scale-100');
        streakCountEl.textContent = state.session.streak;
    } else {
        streakEl.classList.add('opacity-0', 'scale-50');
        streakEl.classList.remove('opacity-100', 'scale-100');
    }

    // 更新中文提示
    const cnContainer = document.getElementById('cn-hint-container');
    const cnText = document.getElementById('cn-hint-text');
    if (state.settings.showCN) {
        cnText.textContent = item.cn;
        cnContainer.classList.remove('opacity-0', 'translate-y-4');
        cnContainer.classList.add('opacity-100', 'translate-y-0');
    } else {
        cnContainer.classList.add('opacity-0', 'translate-y-4');
    }

    // 构建单词 DOM
    const tokens = item.en.split(' ');
    let wordHtml = '';

    tokens.forEach((token, tIdx) => {
        const isTarget = (tIdx === item.targetTokenIndex);
        // 为每个token添加适当的外边距
        wordHtml += `<div class="flex items-center ${tIdx > 0 ? 'ml-4' : ''} mb-4">`;

        if (isTarget) {
            // 目标词：需要挖空的词
            for (let i = 0; i < token.length; i++) {
                const char = token[i];
                let isBlank = false;
                let isCurrentFocus = false;
                let isFilled = false;
                let displayChar = char;
                // 默认状态：透明边框，确保对齐
                let statusClass = "bg-gray-50 border-transparent text-gray-700 border-b-4";

                const blankIdxInArr = item.blankIndices.indexOf(i);
                if (blankIdxInArr !== -1) {
                    isBlank = true;

                    // 根据 currentInputIndex 判断状态
                    if (blankIdxInArr < state.session.currentInputIndex) {
                        // 已经填入的位置
                        isFilled = true;
                        statusClass = "bg-green-100 border-green-500 text-green-700 font-bold border-b-4";
                    } else if (blankIdxInArr === state.session.currentInputIndex) {
                        // 当前应该输入的位置
                        isCurrentFocus = true;
                        displayChar = '';
                        statusClass = "bg-amber-50 border-amber-500 text-amber-800 border-b-4 shadow-lg scale-110 z-10";
                    } else {
                        // 还未轮到的位置
                        displayChar = '';
                        statusClass = "bg-gray-100 border-gray-300 text-transparent border-b-4";
                    }
                }

                wordHtml += `
                    <div class="w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl font-mono rounded-lg transition-all duration-200 mx-0.5 ${statusClass} ${isCurrentFocus ? 'cursor-blink' : ''}">
                        ${isFilled ? char : displayChar}
                    </div>
                `;
            }
        } else {
            // 非目标词：正常显示，不使用字母框
            wordHtml += `<span class="text-3xl sm:text-4xl font-mono text-gray-800">${token}</span>`;
        }

        wordHtml += `</div>`;
    });

    document.getElementById('word-container').innerHTML = wordHtml;
}

/**
 * 渲染结果页
 */
function renderResult() {
    state.view = 'result';
    const { score, correctCount, wrongCount, items, maxStreak } = state.session;
    const wrongRate = items.length > 0 ? Math.round((wrongCount / items.length) * 100) : 0;
    const timeSpent = Math.floor((Date.now() - state.session.startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-amber-50 fade-in">
            <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-red-500"></div>
                <div class="mb-6 animate-bounce">
                    <span class="text-6xl">🎉</span>
                </div>
                <h2 class="text-4xl font-black text-gray-800 mb-2">Great Job!</h2>
                <p class="text-gray-400 mb-8 font-bold">Session Completed</p>
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Score</div>
                        <div class="text-4xl font-black text-amber-600">${score}</div>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Accuracy</div>
                        <div class="text-4xl font-black text-blue-600">${100 - wrongRate}%</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Streak</div>
                        <div class="text-4xl font-black text-purple-600">${maxStreak}</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</div>
                        <div class="text-xl font-black text-gray-600 mt-2">${minutes}m ${seconds}s</div>
                    </div>
                </div>
                <div class="space-y-3">
                    <button onclick="goToOnline()" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95">
                        再来一局 (New Seed)
                    </button>
                    <button onclick="renderHome()" class="w-full bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-600 font-bold py-4 rounded-xl transition">
                        返回主菜单
                    </button>
                </div>
            </div>
        </div>
    `;

    // 庆祝特效
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

/**
 * 完成练习
 */
function finishSession() {
    renderResult();
}
