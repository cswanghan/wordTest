/**
 * Lion Festival G3 Spelling Application
 * 数据配置模块
 */

// 词库数据
const WORDS = [
    // BE Group
    { id: 1, group: 'BE', en: 'get dressed', cn: '穿衣服' },
    { id: 2, group: 'BE', en: 'eat breakfast', cn: '吃早饭' },
    { id: 3, group: 'BE', en: 'brush my teeth', cn: '刷牙' },
    { id: 4, group: 'BE', en: 'firefighter', cn: '消防员' },
    { id: 5, group: 'BE', en: 'scientist', cn: '科学家' },
    { id: 6, group: 'BE', en: 'police officer', cn: '警察' },
    { id: 7, group: 'BE', en: 'cashier', cn: '收银员' },
    { id: 8, group: 'BE', en: 'study for a test', cn: '备考' },
    { id: 9, group: 'BE', en: 'practice the piano', cn: '练钢琴' },
    { id: 10, group: 'BE', en: 'take out the trash', cn: '倒垃圾' },

    // KET Group
    { id: 11, group: 'KET', en: 'daughter', cn: '女儿' },
    { id: 12, group: 'KET', en: 'cousin', cn: '表/堂兄弟姐妹' },
    { id: 13, group: 'KET', en: 'husband', cn: '丈夫' },
    { id: 14, group: 'KET', en: 'garage', cn: '车库' },
    { id: 15, group: 'KET', en: 'curtains', cn: '窗帘' },
    { id: 16, group: 'KET', en: 'carpet', cn: '地毯' },
    { id: 17, group: 'KET', en: 'barbecue', cn: '烧烤' },
    { id: 18, group: 'KET', en: 'biscuit', cn: '饼干' },
    { id: 19, group: 'KET', en: 'sandwich', cn: '三明治' },
    { id: 20, group: 'KET', en: 'cereal', cn: '麦片' },

    // Culture Group
    { id: 21, group: 'Culture', en: 'South America', cn: '南美洲' },
    { id: 22, group: 'Culture', en: 'Brazil', cn: '巴西' },
    { id: 23, group: 'Culture', en: 'Colombia', cn: '哥伦比亚' },
    { id: 24, group: 'Culture', en: 'Peru', cn: '秘鲁' },
    { id: 25, group: 'Culture', en: 'Argentina', cn: '阿根廷' },
    { id: 26, group: 'Culture', en: 'Carnival', cn: '狂欢节' },
    { id: 27, group: 'Culture', en: 'Samba', cn: '桑巴' },
    { id: 28, group: 'Culture', en: 'culture', cn: '文化' },
    { id: 29, group: 'Culture', en: 'festival', cn: '节日' },
    { id: 30, group: 'Culture', en: 'costume', cn: '服装' },
];

// 导出数据（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORDS };
}
