/**
 * Lion Festival G3 Spelling Application
 * 视图渲染模块
 */

const app = document.getElementById('app');
const APP_VERSION = 'v1.2.10';

/**
 * 渲染版本号
 */
function renderVersion() {
    let el = document.getElementById('app-version');
    if (!el) {
        el = document.createElement('div');
        el.id = 'app-version';
        el.className = 'fixed top-1 left-1 z-50 text-[10px] text-gray-300 font-mono pointer-events-none mix-blend-multiply select-none';
        document.body.appendChild(el);
    }
    el.textContent = APP_VERSION;
}

/**
 * 渲染登录页
 */
function renderLogin() {
    renderVersion();
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
                        <div class="bg-yellow-50 p-4 rounded-xl">
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1">金币余额</div>
                            <div class="text-3xl font-black text-amber-600 flex items-center gap-2">
                                <span>💰</span> ${currentUser.coins || 0}
                            </div>
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
                        <button onclick="renderMemoryAnalysis()" class="w-full mt-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-200">
                            📈 记忆分析中心
                        </button>
                        <button onclick="renderStore()" class="w-full mt-3 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-200">
                            🛒 访问商店 (Store)
                        </button>
                    </div>

                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h3 class="text-xl font-black text-gray-800 mb-4">数据管理</h3>
                        <button onclick="exportUserData()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">
                            📊 导出我的数据
                        </button>
                        <button onclick="viewLogs()" class="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition">
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
 * 渲染商店页
 */
function renderStore() {
    state.view = 'store';
    analytics.trackPageView('store');

    const products = [
        { id: 'theme_dark', name: '🌙 夜间模式', desc: '护眼深色主题', price: 200, icon: '🌑' },
        { id: 'theme_lion', name: '🧧 舞狮限定', desc: '红火过大年主题', price: 500, icon: '🦁' }
    ];

    const userItems = currentUser.unlockedItems || [];

    const productHtml = products.map(p => {
        const isOwned = userItems.includes(p.id);
        const canAfford = (currentUser.coins || 0) >= p.price;
        
        let btnHtml = '';
        if (isOwned) {
            btnHtml = `<button disabled class="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed">已拥有</button>`;
        } else if (canAfford) {
            btnHtml = `<button onclick="handlePurchase('${p.id}', ${p.price})" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:scale-105">购买 (${p.price} 💰)</button>`;
        } else {
            btnHtml = `<button disabled class="w-full bg-gray-200 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed">金币不足 (${p.price} 💰)</button>`;
        }

        return `
            <div class="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 flex flex-col items-center text-center">
                <div class="text-6xl mb-4">${p.icon}</div>
                <h3 class="text-xl font-black text-gray-800 mb-1">${p.name}</h3>
                <p class="text-sm text-gray-500 mb-6">${p.desc}</p>
                <div class="mt-auto w-full">
                    ${btnHtml}
                </div>
            </div>
        `;
    }).join('');

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 p-4 fade-in">
            <div class="max-w-4xl mx-auto">
                <!-- 顶部栏 -->
                <div class="bg-white rounded-2xl shadow-lg p-4 mb-6 flex justify-between items-center sticky top-4 z-20">
                    <button onclick="renderUserDashboard()" class="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        返回
                    </button>
                    <h1 class="text-2xl font-black text-amber-600">🦁 积分商店</h1>
                    <div class="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-xl border border-amber-200">
                        <span class="text-xl">💰</span>
                        <span class="font-black text-amber-600 text-xl">${currentUser.coins || 0}</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    ${productHtml}
                </div>
                
                <div class="mt-8 text-center text-gray-400 text-sm">
                    <p>更多商品敬请期待...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 处理购买操作
 */
function handlePurchase(id, price) {
    if (confirm(`确定花费 ${price} 金币购买吗？`)) {
        const result = purchaseItem(id, price);
        if (result.success) {
            alert('购买成功！🎉');
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            renderStore(); // 刷新界面
        } else {
            alert(result.message);
        }
    }
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
    renderVersion();
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
                <div class="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-lg mr-2 border border-amber-200">
                    <span class="text-xl">💰</span>
                    <span class="font-black text-amber-600">${currentUser.coins || 0}</span>
                </div>
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
                    <button onclick="goToFullTest()" class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-purple-200 transition-all transform hover:-translate-y-1 active:translate-y-0">
                        <span class="flex items-center justify-center gap-2">
                            <span>📝</span> 全量拼写测试
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
        <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-amber-50 fade-in">
            <!-- 顶部导航 -->
            <div class="absolute top-4 left-4 z-10">
                <button onclick="renderHome()" class="bg-white/80 hover:bg-white text-gray-500 hover:text-amber-600 font-bold px-4 py-2 rounded-xl shadow-sm border border-amber-100 flex items-center gap-2 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
                    <span>Back</span>
                </button>
            </div>

            <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-100 relative overflow-hidden">
                <!-- 装饰背景 -->
                <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-100 rounded-full opacity-50 pointer-events-none"></div>
                
                <div class="text-center mb-8 relative z-10">
                    <span class="text-5xl block mb-2">🖨️</span>
                    <h2 class="text-3xl font-black text-gray-800">Print Settings</h2>
                    <p class="text-gray-400 font-bold text-sm">Customize your worksheet</p>
                </div>

                <div class="space-y-4 mb-8 relative z-10">
                    <!-- 选项：中文释义 -->
                    <label class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-amber-50 transition border-2 border-transparent hover:border-amber-200 group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                                <span class="font-bold text-lg">CN</span>
                            </div>
                            <div>
                                <span class="block font-bold text-gray-700 group-hover:text-amber-700">Show Meaning</span>
                                <span class="text-xs text-gray-400">显示中文释义</span>
                            </div>
                        </div>
                        <div class="relative inline-block w-12 mr-2 align-middle select-none">
                            <input type="checkbox" checked onchange="state.settings.showCN = this.checked" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out right-6 border-gray-300 checked:right-0 checked:border-amber-500"/>
                            <div class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"></div>
                        </div>
                    </label>

                    <!-- 选项：随机乱序 -->
                    <label class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-amber-50 transition border-2 border-transparent hover:border-amber-200 group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </div>
                            <div>
                                <span class="block font-bold text-gray-700 group-hover:text-amber-700">Shuffle</span>
                                <span class="text-xs text-gray-400">随机打乱顺序</span>
                            </div>
                        </div>
                        <div class="relative inline-block w-12 mr-2 align-middle select-none">
                            <input type="checkbox" onchange="state.settings.shuffle = this.checked" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out right-6 border-gray-300 checked:right-0 checked:border-amber-500"/>
                            <div class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"></div>
                        </div>
                    </label>

                    <!-- 选项：附带答案 -->
                    <label class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-amber-50 transition border-2 border-transparent hover:border-amber-200 group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <span class="block font-bold text-gray-700 group-hover:text-amber-700">Answer Key</span>
                                <span class="text-xs text-gray-400">附带答案页</span>
                            </div>
                        </div>
                        <div class="relative inline-block w-12 mr-2 align-middle select-none">
                            <input type="checkbox" onchange="state.settings.showAnswers = this.checked" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out right-6 border-gray-300 checked:right-0 checked:border-amber-500"/>
                            <div class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"></div>
                        </div>
                    </label>
                </div>

                <button onclick="generateAndPreviewPrint()" class="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-amber-200 transition-all transform hover:-translate-y-1 active:translate-y-0 relative z-10">
                    生成预览 Generate
                </button>
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
        currentWordMistakes: [],
        wordLogs: [],
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
                <div id="streak-container" style="display: none;" class="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-30 w-full justify-center transition-all duration-300">
                    <div class="bg-gradient-to-r from-orange-400 to-amber-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-2xl border-2 border-white">
                        🔥 <span id="streak-count">0</span> COMBO!
                    </div>
                </div>

                <!-- 单词显示容器 -->
                <div id="word-container" class="flex flex-wrap justify-center items-center mb-6 sm:mb-10 select-none px-2 w-full max-w-4xl overflow-x-auto">
                    <!-- Words injected here -->
                </div>

                <!-- 中文提示 -->
                <div id="cn-hint-container" class="transition-all duration-500 opacity-0 translate-y-4 w-full px-4 flex flex-col items-center gap-4">
                    <div id="cn-hint-text" class="text-lg sm:text-2xl text-gray-600 font-bold bg-white px-6 sm:px-8 py-2 sm:py-3 rounded-2xl shadow-sm border border-gray-100 max-w-md text-center">
                        ...
                    </div>
                    <!-- 朗读按钮 -->
                    <button onclick="speakWord(state.session.items[state.session.currentIndex].en)" class="flex items-center gap-2 bg-white hover:bg-amber-50 text-amber-600 px-4 py-2 rounded-xl border border-amber-200 shadow-sm transition-all transform active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <span class="font-bold">Listen</span>
                    </button>
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
                        <button type="button" data-virtual-key="${key}" class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg text-sm transition">
                            ${key}
                        </button>
                    ` : '<div></div>').join('')}
                    <button type="button" data-virtual-key="Backspace" class="col-span-2 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-bold py-2 px-3 rounded-lg text-xs transition">
                        ⌫ 删除
                    </button>
                </div>
                <script>
                    // 使用事件委托处理虚拟键盘，阻止mousedown默认行为避免触发input事件
                    document.addEventListener('DOMContentLoaded', function() {
                        document.body.addEventListener('mousedown', function(e) {
                            if (e.target && e.target.dataset && e.target.dataset.virtualKey) {
                                e.preventDefault();
                                handleVirtualKey(e.target.dataset.virtualKey);
                            }
                        });
                    });
                </script>
            </div>
        </div>
    `;

    // 移动端输入处理
    const mobileInput = document.getElementById('mobile-input');
    if (mobileInput) {
        mobileInput.focus();

        // 标记虚拟键盘正在处理输入，避免重复调用
        let isVirtualKeyboardProcessing = false;

        // 虚拟键盘输入标记方法
        window.markVirtualKeyboardInput = function() {
            isVirtualKeyboardProcessing = true;
            setTimeout(() => {
                isVirtualKeyboardProcessing = false;
            }, 0);
        };

        mobileInput.addEventListener('input', (e) => {
            // 如果虚拟键盘正在处理输入，则跳过input事件（避免重复调用）
            if (isVirtualKeyboardProcessing) {
                return;
            }

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
    
    // Debug: 打印连击状态
    console.log(`[UI] Updating streak: ${state.session.streak}`);

    if (state.session.streak >= 1) { // 修改为 >= 1，让第一个完美单词就有反馈
        streakEl.style.display = 'flex';
        streakEl.style.opacity = '1';
        streakEl.style.transform = 'translate(-50%, 0) scale(1)';
        
        streakCountEl.textContent = state.session.streak;

        // 动态样式：根据连击数改变颜色
        const streakBg = streakEl.querySelector('div');
        if (state.session.streak >= 10) {
            streakBg.className = "bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-2xl animate-bounce ring-4 ring-purple-200 border-2 border-white";
            streakCountEl.innerHTML = `${state.session.streak} 🔥`; 
        } else if (state.session.streak >= 5) {
            streakBg.className = "bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-2xl animate-bounce ring-2 ring-red-200 border-2 border-white";
             streakCountEl.innerHTML = state.session.streak;
        } else {
            streakBg.className = "bg-gradient-to-r from-orange-400 to-amber-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-2xl animate-bounce border-2 border-white";
             streakCountEl.innerHTML = state.session.streak;
        }

    } else {
        streakEl.style.display = 'none'; // 强制隐藏
        streakEl.style.opacity = '0';
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
    const { score, correctCount, wrongCount, items, maxStreak, totalMistakes, totalCorrectKeys, wordLogs } = state.session;

    // 计算按键准确率
    const totalKeys = (totalCorrectKeys || 0) + (totalMistakes || 0);
    const accuracy = totalKeys > 0 ? Math.round((totalCorrectKeys / totalKeys) * 100) : 0;

    const timeSpent = Math.floor((Date.now() - state.session.startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    // 分析本次练习数据
    const analysis = analyzeSessionData(wordLogs);

    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-amber-50 fade-in">
            <div class="bg-white p-4 sm:p-8 rounded-3xl shadow-2xl max-w-4xl w-full relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-red-500"></div>

                <div class="mb-6 text-center">
                    <div class="mb-4 animate-bounce">
                        <span class="text-6xl">🎉</span>
                    </div>
                    <h2 class="text-3xl sm:text-4xl font-black text-gray-800 mb-2">Great Job!</h2>
                    <p class="text-gray-400 font-bold">Session Completed</p>
                </div>

                <!-- 基础统计 -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div class="bg-amber-50 p-3 sm:p-4 rounded-2xl border border-amber-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Score</div>
                        <div class="text-2xl sm:text-4xl font-black text-amber-600">${score}</div>
                    </div>
                    <div class="bg-blue-50 p-3 sm:p-4 rounded-2xl border border-blue-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Accuracy</div>
                        <div class="text-2xl sm:text-4xl font-black text-blue-600">${accuracy}%</div>
                    </div>
                    <div class="bg-purple-50 p-3 sm:p-4 rounded-2xl border border-purple-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Streak</div>
                        <div class="text-2xl sm:text-4xl font-black text-purple-600">${maxStreak}</div>
                    </div>
                    <div class="bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</div>
                        <div class="text-lg sm:text-xl font-black text-gray-600 mt-2">${minutes}m ${seconds}s</div>
                    </div>
                </div>

                <!-- 详细分析 -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 rounded-2xl border-2 border-amber-100 mb-6">
                    <h3 class="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span>📊</span> 本次练习详细报告
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <!-- 表现最好的单词 -->
                        <div class="bg-white p-4 rounded-xl border border-green-200">
                            <h4 class="font-bold text-green-600 mb-2 flex items-center gap-2">
                                <span>✅</span> 表现最佳
                            </h4>
                            ${analysis.bestWords.map(word => `
                                <div class="text-sm">
                                    <span class="font-bold text-gray-800">${word.word}</span>
                                    <span class="text-gray-500">- ${word.time}ms, ${word.mistakes}错误</span>
                                </div>
                            `).join('')}
                        </div>

                        <!-- 需要改进的单词 -->
                        <div class="bg-white p-4 rounded-xl border border-red-200">
                            <h4 class="font-bold text-red-600 mb-2 flex items-center gap-2">
                                <span>⚠️</span> 需要改进
                            </h4>
                            ${analysis.difficultWords.map(word => `
                                <div class="text-sm">
                                    <span class="font-bold text-gray-800">${word.word}</span>
                                    <span class="text-gray-500">- ${word.time}ms, ${word.mistakes}错误</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 错误热力图 -->
                    ${analysis.errorHeatmap.length > 0 ? `
                        <div class="bg-white p-4 rounded-xl border border-amber-200 mb-4">
                            <h4 class="font-bold text-amber-600 mb-3 flex items-center gap-2">
                                <span>🔥</span> 错误热力图
                            </h4>
                            ${analysis.errorHeatmap.map(item => `
                                <div class="mb-2">
                                    <div class="text-sm font-bold text-gray-700 mb-1">${item.word}</div>
                                    <div class="flex flex-wrap gap-1">
                                        ${item.heatmap.map((status, idx) => `
                                            <div class="w-8 h-8 flex items-center justify-center rounded text-xs font-bold border-2 ${
                                                status === 'perfect' ? 'bg-green-100 border-green-500 text-green-700' :
                                                status === 'easy' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                                                status === 'medium' ? 'bg-orange-100 border-orange-500 text-orange-700' :
                                                'bg-red-100 border-red-500 text-red-700'
                                            }">
                                                ${item.targetToken[idx] || ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- 热门错误 -->
                    ${analysis.topErrors.length > 0 ? `
                        <div class="bg-white p-4 rounded-xl border border-blue-200">
                            <h4 class="font-bold text-blue-600 mb-3 flex items-center gap-2">
                                <span>❌</span> 热门错误
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                ${analysis.topErrors.map(err => `
                                    <span class="bg-blue-50 px-3 py-1 rounded-lg text-sm font-bold text-blue-700 border border-blue-200">
                                        ${err.expected} → ${err.actual} <span class="text-blue-500">(${err.count})</span>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- 操作按钮 -->
                <div class="space-y-3">
                    <button onclick="goToOnline()" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95">
                        再来一局 (New Seed)
                    </button>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="renderMemoryAnalysis()" class="w-full bg-white border-2 border-purple-200 hover:border-purple-400 text-purple-600 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                            <span>📈</span> 记忆分析
                        </button>
                        <button onclick="renderHome()" class="w-full bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-600 font-bold py-3 rounded-xl transition">
                            返回主菜单
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 庆祝特效
    if (typeof confetti === 'function') {
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

/**
 * 分析会话数据
 * @param {Array} wordLogs - 单词日志
 * @returns {Object} 分析结果
 */
function analyzeSessionData(wordLogs) {
    if (!wordLogs || wordLogs.length === 0) {
        return {
            bestWords: [],
            difficultWords: [],
            errorHeatmap: [],
            topErrors: []
        };
    }

    // 找出表现最好和最差的单词
    const sortedByPerformance = [...wordLogs].sort((a, b) => {
        // 先按错误数排序，再按时间排序
        if (a.mistakesCount !== b.mistakesCount) {
            return a.mistakesCount - b.mistakesCount;
        }
        return a.duration - b.duration;
    });

    const bestWords = sortedByPerformance.slice(0, 3).map(log => ({
        word: log.word,
        time: log.duration,
        mistakes: log.mistakesCount
    }));

    const difficultWords = sortedByPerformance.slice(-3).reverse().map(log => ({
        word: log.word,
        time: log.duration,
        mistakes: log.mistakesCount
    }));

    // 生成错误热力图
    const errorHeatmap = wordLogs.filter(log => log.mistakesCount > 0).map(log => {
        const heatmap = [];
        const targetToken = log.targetToken;
        for (let i = 0; i < targetToken.length; i++) {
            if (!log.blankIndices.includes(i)) {
                heatmap[i] = 'notblank';
            } else {
                const blankIdx = log.blankIndices.indexOf(i);
                if (log.perfectPositions.includes(blankIdx)) {
                    heatmap[i] = 'perfect';
                } else {
                    const mistakesAtPos = (log.mistakesDetails || []).filter(m => m.position === blankIdx);
                    if (mistakesAtPos.length === 0) {
                        heatmap[i] = 'perfect';
                    } else if (mistakesAtPos.length === 1) {
                        heatmap[i] = 'easy';
                    } else if (mistakesAtPos.length === 2) {
                        heatmap[i] = 'medium';
                    } else {
                        heatmap[i] = 'hard';
                    }
                }
            }
        }
        return {
            word: log.word,
            targetToken: targetToken,
            heatmap: heatmap
        };
    });

    // 统计热门错误
    const errorCounts = {};
    wordLogs.forEach(log => {
        if (log.mistakesDetails) {
            log.mistakesDetails.forEach(err => {
                const key = `${err.expected}_${err.actual}`;
                errorCounts[key] = (errorCounts[key] || 0) + 1;
            });
        }
    });

    const topErrors = Object.entries(errorCounts)
        .map(([key, count]) => {
            const [expected, actual] = key.split('_');
            return { expected, actual, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        bestWords,
        difficultWords,
        errorHeatmap,
        topErrors
    };
}

/**
 * 完成练习
 */
function finishSession() {
    renderResult();
}

/**
 * 渲染记忆分析页面
 */
function renderMemoryAnalysis() {
    if (!currentUser) {
        renderLogin();
        return;
    }

    state.view = 'memoryAnalysis';
    analytics.trackPageView('memoryAnalysis');

    const today = new Date().toISOString().split('T')[0];
    const dailyStats = analytics.getDailyStats(currentUser.username, today);
    const weeklyStats = analytics.getWeeklyStats(currentUser.username);
    const memoryReport = analytics.getMemoryAnalysisReport(currentUser.username);

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 p-4 fade-in">
            <div class="max-w-6xl mx-auto">
                <!-- 顶部导航 -->
                <div class="bg-white rounded-2xl shadow-lg p-4 mb-6 flex justify-between items-center sticky top-4 z-20">
                    <button onclick="renderHome()" class="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        返回首页
                    </button>
                    <h1 class="text-2xl font-black text-purple-600">📊 记忆分析中心</h1>
                    <div class="text-sm text-gray-400">${new Date().toLocaleDateString('zh-CN')}</div>
                </div>

                ${memoryReport.hasData ? `
                    <!-- 今日概览 -->
                    ${dailyStats ? `
                        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <h2 class="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                <span>📅</span> 今日练习概览
                            </h2>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div class="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">完成单词</div>
                                    <div class="text-3xl font-black text-purple-600">${dailyStats.totalWords}</div>
                                </div>
                                <div class="bg-green-50 p-4 rounded-xl border border-green-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">完美单词</div>
                                    <div class="text-3xl font-black text-green-600">${dailyStats.perfectWords}</div>
                                </div>
                                <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">准确率</div>
                                    <div class="text-3xl font-black text-blue-600">${dailyStats.accuracy}%</div>
                                </div>
                                <div class="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">平均用时</div>
                                    <div class="text-3xl font-black text-amber-600">${Math.round(dailyStats.avgTimePerWord / 1000)}s</div>
                                </div>
                            </div>

                            ${dailyStats.mostDifficultWords && dailyStats.mostDifficultWords.length > 0 ? `
                                <div class="mb-4">
                                    <h3 class="font-bold text-gray-700 mb-2">困难单词 (需重点练习)</h3>
                                    <div class="flex flex-wrap gap-2">
                                        ${dailyStats.mostDifficultWords.map(word => `
                                            <div class="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                                <span class="font-bold text-gray-800">${word.word}</span>
                                                <span class="text-sm text-gray-500 ml-2">错误率${Math.round(word.errorRate * 100)}%</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${dailyStats.mostConfusedLetters && dailyStats.mostConfusedLetters.length > 0 ? `
                                <div>
                                    <h3 class="font-bold text-gray-700 mb-2">热门错误</h3>
                                    <div class="flex flex-wrap gap-2">
                                        ${dailyStats.mostConfusedLetters.slice(0, 5).map(err => `
                                            <span class="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 font-bold">
                                                ${err.expected} → ${err.actual} <span class="text-blue-500">(${err.count})</span>
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
                            <span class="text-6xl mb-4 block">📝</span>
                            <h2 class="text-xl font-bold text-gray-600 mb-2">今日暂无练习数据</h2>
                            <p class="text-gray-400">开始练习来查看详细分析</p>
                        </div>
                    `}

                    <!-- 本周统计 -->
                    ${weeklyStats ? `
                        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <h2 class="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                <span>📊</span> 本周学习趋势 (${weeklyStats.weekStart} ~ ${weeklyStats.weekEnd})
                            </h2>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div class="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">总单词数</div>
                                    <div class="text-3xl font-black text-purple-600">${weeklyStats.totalWords}</div>
                                </div>
                                <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">日均单词</div>
                                    <div class="text-3xl font-black text-blue-600">${weeklyStats.avgWordsPerDay}</div>
                                </div>
                                <div class="bg-green-50 p-4 rounded-xl border border-green-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">平均准确率</div>
                                    <div class="text-3xl font-black text-green-600">${weeklyStats.accuracy}%</div>
                                </div>
                                <div class="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                    <div class="text-xs font-bold text-gray-400 uppercase mb-1">准确率变化</div>
                                    <div class="text-3xl font-black ${weeklyStats.trends.accuracyImprovement >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        ${weeklyStats.trends.accuracyImprovement >= 0 ? '+' : ''}${weeklyStats.trends.accuracyImprovement}%
                                    </div>
                                </div>
                            </div>

                            <!-- 进步趋势 -->
                            <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                                <h3 class="font-bold text-gray-700 mb-3">进步趋势</h3>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="flex items-center gap-2">
                                        <span class="text-2xl">${weeklyStats.trends.accuracyImprovement >= 0 ? '📈' : '📉'}</span>
                                        <div>
                                            <div class="text-sm text-gray-500">准确率变化</div>
                                            <div class="font-bold ${weeklyStats.trends.accuracyImprovement >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                ${weeklyStats.trends.accuracyImprovement >= 0 ? '+' : ''}${weeklyStats.trends.accuracyImprovement}%
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-2xl">${weeklyStats.trends.speedImprovement >= 0 ? '🚀' : '🐌'}</span>
                                        <div>
                                            <div class="text-sm text-gray-500">速度变化</div>
                                            <div class="font-bold ${weeklyStats.trends.speedImprovement >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                ${weeklyStats.trends.speedImprovement >= 0 ? '+' : ''}${weeklyStats.trends.speedImprovement}ms
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 智能洞察 -->
                    ${memoryReport.insights && memoryReport.insights.length > 0 ? `
                        <div class="bg-white rounded-2xl shadow-lg p-6">
                            <h2 class="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                <span>💡</span> 智能洞察
                            </h2>
                            <div class="space-y-3">
                                ${memoryReport.insights.map(insight => `
                                    <div class="p-4 rounded-xl border-2 ${
                                        insight.type === 'success' ? 'bg-green-50 border-green-200' :
                                        insight.type === 'warning' ? 'bg-red-50 border-red-200' :
                                        'bg-blue-50 border-blue-200'
                                    }">
                                        <div class="font-bold ${
                                            insight.type === 'success' ? 'text-green-700' :
                                            insight.type === 'warning' ? 'text-red-700' :
                                            'text-blue-700'
                                        } mb-1">
                                            ${insight.title}
                                        </div>
                                        <div class="text-sm text-gray-600">${insight.message}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                ` : `
                    <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <span class="text-8xl mb-6 block">📊</span>
                        <h2 class="text-3xl font-bold text-gray-600 mb-4">开始练习以查看分析</h2>
                        <p class="text-gray-400 mb-6">完成练习后，这里将显示您的详细记忆分析报告</p>
                        <button onclick="renderHome()" class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition">
                            立即开始练习
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
}

/**
 * 生成单词字母长度提示
 * @param {string} word - 单词
 * @returns {string} HTML字符串，包含下划线和空格
 */
function generateWordHint(word) {
    if (!word) return '';

    const parts = word.split(' ');
    const hints = parts.map(part => {
        return '_ '.repeat(part.length).trim();
    });

    // 用实际的空格分隔
    return hints.join(' ');
}

/**
 * 新增：渲染全量测试设置页
 * @param {Array} words - 可用单词列表（可选，默认使用当前设置）
 */
function renderFullTestSettings(words) {
    state.view = 'fullTest';
    analytics.trackPageView('fullTest');

    // 使用传入的 words 或从当前设置获取
    const currentWords = words || getFilteredWords();

    // 统计各分组的单词数量
    const groupStats = {
        BE: WORDS.filter(w => w.group === 'BE').length,
        KET: WORDS.filter(w => w.group === 'KET').length,
        Culture: WORDS.filter(w => w.group === 'Culture').length
    };

    const totalWords = currentWords.length;

    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-amber-50 fade-in">
            <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-100">
                <div class="text-center mb-8">
                    <span class="text-6xl block mb-2">📝</span>
                    <h2 class="text-3xl font-black text-gray-800">全量拼写测试</h2>
                    <p class="text-gray-400 font-bold text-sm mt-2">完整单词拼写测试</p>
                </div>

                <!-- 分组选择 -->
                <div class="mb-6">
                    <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">选择测试范围 Select Groups</label>
                    <div class="flex flex-wrap gap-2" id="fulltest-groups">
                        ${['BE', 'KET', 'Culture'].map(g => `
                            <label class="cursor-pointer select-none group">
                                <input type="checkbox" value="${g}" class="peer sr-only" onchange="console.log('Checkbox changed:', this.value, this.checked); handleFullTestGroupToggle(this);">
                                <div class="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-500 font-bold peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-700 transition-all">
                                    ${g}
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- 分组统计 -->
                <div class="mb-6">
                    <div class="text-sm font-bold text-gray-600 mb-3">测试范围统计</div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="font-bold text-gray-700">BE组</span>
                            <span class="text-gray-500">${groupStats.BE}个单词</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="font-bold text-gray-700">KET组</span>
                            <span class="text-gray-500">${groupStats.KET}个单词</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="font-bold text-gray-700">Culture组</span>
                            <span class="text-gray-500">${groupStats.Culture}个单词</span>
                        </div>
                    </div>
                </div>

                <div class="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-6">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xl">💡</span>
                        <span class="font-bold text-purple-700">测试说明</span>
                    </div>
                    <ul class="text-sm text-purple-600 space-y-1">
                        <li>• 听发音并输入完整单词</li>
                        <li>• 点击慢速按钮听清发音</li>
                        <li>• 显示中文释义辅助理解</li>
                        <li>• 共 <span id="fulltest-total-words">${totalWords}</span> 个单词（已选分组）</li>
                    </ul>
                </div>

                <div class="space-y-3">
                    <button id="fulltest-start-btn" class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black py-4 rounded-2xl text-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0">
                        开始全量测试 (${totalWords}个单词)
                    </button>
                    <button onclick="renderHome()" class="w-full bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-600 font-bold py-3 rounded-xl transition">
                        返回主页
                    </button>
                </div>
            </div>
        </div>
    `;

    // 渲染完成后初始化复选框状态和按钮事件
    setTimeout(() => {
        initFullTestGroupCheckboxes();
        initFullTestStartButton();
    }, 0);
}

/**
 * 初始化全量测试开始按钮
 */
function initFullTestStartButton() {
    const startBtn = document.getElementById('fulltest-start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            const words = getFilteredWords();
            startFullTest(words);
        };
    }
}

/**
 * 初始化全量测试的分组复选框状态
 */
function initFullTestGroupCheckboxes() {
    const container = document.getElementById('fulltest-groups');
    if (!container) return;

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const group = checkbox.value;
        checkbox.checked = state.settings.groups.includes(group);
    });

    // 更新按钮文本以反映当前选择的分组
    updateFullTestStartButtonText();
}

/**
 * 更新全量测试开始按钮文本
 */
function updateFullTestStartButtonText() {
    console.log('=== updateFullTestStartButtonText CALLED ===');
    console.log('Current state.settings.groups:', state.settings.groups);
    console.log('Type of groups:', typeof state.settings.groups);
    console.log('Is array?', Array.isArray(state.settings.groups));

    const filteredWords = getFilteredWords();
    console.log('Filtered words count:', filteredWords.length);
    console.log('Filtered words:', filteredWords);

    const totalWords = filteredWords.length;
    console.log('Total words to display:', totalWords);

    // 更新总单词数显示
    const totalWordsEl = document.getElementById('fulltest-total-words');
    console.log('totalWordsEl element:', totalWordsEl);
    if (totalWordsEl) {
        totalWordsEl.textContent = totalWords;
        console.log('✓ Updated totalWordsEl to:', totalWords);
    } else {
        console.error('✗ ERROR: totalWordsEl not found!');
    }

    // 更新按钮
    const startBtn = document.getElementById('fulltest-start-btn');
    console.log('startBtn element:', startBtn);
    if (startBtn) {
        const newText = totalWords > 0
            ? `开始全量测试 (${totalWords}个单词)`
            : '请选择至少一个分组';
        console.log('Setting button text to:', newText);
        startBtn.textContent = newText;

        if (totalWords > 0) {
            startBtn.disabled = false;
            startBtn.className = 'w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black py-4 rounded-2xl text-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0';
            console.log('✓ Button enabled');
        } else {
            startBtn.disabled = true;
            startBtn.className = 'w-full bg-gray-300 text-gray-500 font-black py-4 rounded-2xl text-xl cursor-not-allowed';
            console.log('✓ Button disabled');
        }
    } else {
        console.error('✗ ERROR: startBtn not found!');
    }
    console.log('=== updateFullTestStartButtonText END ===');
}

/**
 * 处理全量测试分组切换
 * @param {HTMLInputElement} checkbox - 复选框元素
 */
function handleFullTestGroupToggle(checkbox) {
    console.log('handleFullTestGroupToggle called', checkbox.value, checkbox.checked);

    // 更新状态
    updateGroups(checkbox);

    // 更新按钮文本
    updateFullTestStartButtonText();
}

/**
 * 新增：渲染全量测试页面
 */
function renderFullTest() {
    state.view = 'fullTest';
    const session = state.fullTestSession;
    const currentIndex = session.currentIndex;
    const totalWords = session.words.length;
    const currentWord = session.words[currentIndex];
    const progress = Math.round((currentIndex / totalWords) * 100);

    app.innerHTML = `
        <div class="h-screen flex flex-col bg-amber-50 overflow-hidden">
            <!-- 顶部栏 -->
            <div class="bg-white p-4 shadow-sm flex justify-between items-center">
                <button onclick="if(confirm('确定要退出测试吗？进度将丢失。')) renderHome()" class="text-gray-400 hover:text-red-500 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div class="flex flex-col items-center">
                    <span class="text-xs font-bold text-gray-400 uppercase">进度</span>
                    <span class="font-black text-lg text-amber-600">${currentIndex + 1} / ${totalWords}</span>
                </div>

                <div class="flex flex-col items-end">
                    <span class="text-xs font-bold text-gray-400 uppercase">得分</span>
                    <span class="font-black text-lg text-amber-600">${session.score}</span>
                </div>
            </div>

            <!-- 进度条 -->
            <div class="bg-white px-4 py-2 border-b border-gray-100">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-amber-500 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
            </div>

            <!-- 主内容区 -->
            <div class="flex-1 flex flex-col items-center justify-center p-6">
                <div class="w-full max-w-2xl">
                    <!-- 中文提示 -->
                    <div class="text-center mb-8">
                        <div class="text-sm font-bold text-gray-400 uppercase mb-2">中文释义</div>
                        <div class="text-4xl font-black text-gray-800">${currentWord.cn}</div>
                    </div>

                    <!-- 发音按钮 -->
                    <div class="flex justify-center gap-4 mb-4">
                        <button onclick="playNormalPronunciation('${currentWord.en}')" class="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            <span>播放</span>
                        </button>
                        <button onclick="playSlowPronunciation('${currentWord.en}')" class="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>慢速</span>
                        </button>
                    </div>

                    <!-- 退格按钮 -->
                    <div class="flex justify-center mb-8">
                        <button onclick="handleFullTestBackspace()" class="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 8l10.5 10.5a1 1 0 001.414 0L17 8M5 12h14" />
                            </svg>
                            <span>退格</span>
                        </button>
                    </div>

                    <!-- 字母长度提示和输入框组合 -->
                    <div class="mb-6">
                        <div class="text-center text-sm font-bold text-gray-400 uppercase mb-2">字母长度提示</div>
                        <div class="flex justify-center items-center flex-wrap gap-1 sm:gap-2 mb-4" id="fulltest-letter-boxes">
                            <!-- 字母框将在这里动态生成 -->
                        </div>
                        <!-- 隐藏的输入框用于键盘输入 -->
                        <input type="text" id="fulltest-input" class="opacity-0 absolute pointer-events-none" autocomplete="off" />
                    </div>

                    <!-- 反馈区域 -->
                    <div id="fulltest-feedback" class="text-center mb-6 min-h-[40px] flex items-center justify-center opacity-0 transition-all"></div>

                    <!-- 按钮 -->
                    <div class="flex justify-center gap-4">
                        <button onclick="submitFullTestWord()" class="bg-amber-500 hover:bg-amber-600 text-white font-black py-4 px-8 rounded-xl text-xl shadow-lg transition transform hover:scale-105">
                            提交答案
                        </button>
                    </div>
                </div>
            </div>

            <!-- 底部进度 -->
            <div class="bg-white p-4 border-t border-gray-100">
                <div class="flex justify-center gap-1 flex-wrap">
                    ${Array.from({ length: totalWords }, (_, i) => {
                        const isCompleted = i < currentIndex;
                        const isCurrent = i === currentIndex;
                        return `<div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isCompleted ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-amber-500 text-white' :
                            'bg-gray-200 text-gray-500'
                        }">${i + 1}</div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    // 聚焦到输入框并生成字母框
    setTimeout(() => {
        const input = document.getElementById('fulltest-input');
        if (input) input.focus();

        // 生成字母框
        generateFullTestLetterBoxes(currentWord.en);
    }, 100);
}

/**
 * 生成全量测试的字母框
 * @param {string} word - 单词
 */
function generateFullTestLetterBoxes(word) {
    const container = document.getElementById('fulltest-letter-boxes');
    if (!container) return;

    // 清空容器
    container.innerHTML = '';

    // 为每个字母生成一个框
    word.split('').forEach((char, index) => {
        const letterBox = document.createElement('div');
        letterBox.className = 'w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl font-mono rounded-lg transition-all duration-200 mx-0.5 bg-gray-100 border-gray-300 text-transparent border-b-4';
        letterBox.textContent = '';
        letterBox.dataset.index = index;
        letterBox.dataset.char = char;
        container.appendChild(letterBox);
    });
}

/**
 * 新增：渲染全量测试结果页
 * @param {Object} sessionData - 全量测试会话数据，如果不传则从 state 获取
 */
function renderFullTestResult(sessionData) {
    state.view = 'fullTestResult';

    // 如果没有传入 sessionData，尝试从 state 获取
    const session = sessionData || state.fullTestSession;

    if (!session) {
        console.error('错误: 无法获取测试会话数据');
        alert('发生错误，无法显示测试结果，请返回首页重试');
        renderHome();
        return;
    }

    const totalWords = session.words ? session.words.length : 0;
    const accuracy = totalWords > 0 ? Math.round((session.correctCount / totalWords) * 100) : 0;
    const totalTimeSec = Math.round(session.totalTime / 1000);
    const minutes = Math.floor(totalTimeSec / 60);
    const seconds = totalTimeSec % 60;

    // 找出未掌握的单词
    const wrongWords = session.results ? session.results.filter(r => !r.isCorrect) : [];

    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-amber-50 fade-in">
            <div class="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-purple-500"></div>

                <div class="mb-6">
                    <span class="text-6xl block mb-2">🎉</span>
                    <h2 class="text-4xl font-black text-gray-800 mb-2">测试完成！</h2>
                    <p class="text-gray-400 font-bold">全量拼写测试结果</p>
                </div>

                <!-- 基础统计 -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">总得分</div>
                        <div class="text-3xl font-black text-amber-600">${session.score}</div>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">准确率</div>
                        <div class="text-3xl font-black text-blue-600">${accuracy}%</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">已掌握</div>
                        <div class="text-3xl font-black text-green-600">${session.correctCount}/${totalWords}</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">用时</div>
                        <div class="text-2xl font-black text-purple-600">${minutes}m ${seconds}s</div>
                    </div>
                </div>

                <!-- 掌握情况 -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-100 mb-6">
                    <h3 class="text-xl font-black text-gray-800 mb-4">掌握情况分析</h3>

                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="bg-white p-4 rounded-xl border border-green-200">
                            <div class="text-2xl font-black text-green-600">${session.correctCount}</div>
                            <div class="text-sm text-gray-500 font-bold">已掌握</div>
                        </div>
                        <div class="bg-white p-4 rounded-xl border border-yellow-200">
                            <div class="text-2xl font-black text-yellow-600">0</div>
                            <div class="text-sm text-gray-500 font-bold">需复习</div>
                        </div>
                        <div class="bg-white p-4 rounded-xl border border-red-200">
                            <div class="text-2xl font-black text-red-600">${session.wrongCount}</div>
                            <div class="text-sm text-gray-500 font-bold">困难单词</div>
                        </div>
                    </div>

                    ${wrongWords.length > 0 ? `
                        <div class="bg-white p-4 rounded-xl border border-red-200 text-left">
                            <h4 class="font-bold text-red-600 mb-2">需要复习的单词：</h4>
                            <div class="space-y-2">
                                ${wrongWords.map(w => `
                                    <div class="flex items-center justify-between p-2 bg-red-50 rounded">
                                        <span class="font-bold text-gray-800">${w.word}</span>
                                        <span class="text-sm text-gray-500">${w.chinese}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white p-4 rounded-xl border border-green-200">
                            <span class="text-green-600 font-bold">🎉 恭喜！所有单词都已掌握！</span>
                        </div>
                    `}
                </div>

                <!-- 操作按钮 -->
                <div class="space-y-3">
                    <button onclick="startFullTest(getFilteredWords())" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:scale-105">
                        重新测试
                    </button>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="renderHome()" class="w-full bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-600 font-bold py-3 rounded-xl transition">
                            返回主页
                        </button>
                        <button onclick="goToOnline()" class="w-full bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-600 font-bold py-3 rounded-xl transition">
                            挖空练习
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
