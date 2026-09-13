/**
 * gacha.js - 抽卡系统
 * 概率池、保底机制、抽卡动画状态管理
 */

// ============ 抽卡配置 ============
const GachaConfig = {
  // 卡池定义
  pools: {
    standard: {
      name: '常驻池',
      description: '包含所有常驻角色',
      cost: { single: 160, ten: 1600 }, // 水晶消耗
      rates: {
        ssr: 0.016,   // 1.6% 五星
        sr: 0.13,     // 13% 四星
        r: 0.854      // 85.4% 三星
      },
      pity: {
        ssr: 90,      // 90抽保底五星
        sr: 10        // 10抽保底四星
      }
    },
    limited: {
      name: '限定池',
      description: '限时UP角色',
      cost: { single: 160, ten: 1600 },
      rates: {
        ssr: 0.016,
        sr: 0.13,
        r: 0.854
      },
      pity: {
        ssr: 90,
        sr: 10
      },
      featured: [] // UP角色ID列表，后期填充
    }
  },

  // 角色稀有度池（占位角色，后期替换）
  characters: {
    ssr: [
      { id: 'ssr_01', name: '星辰·莉莉丝', element: 'ice', role: '输出' },
      { id: 'ssr_02', name: '炎帝·焰', element: 'fire', role: '输出' },
      { id: 'ssr_03', name: '天罚·雷恩', element: 'lightning', role: '输出' }
    ],
    sr: [
      { id: 'sr_01', name: '翠风·艾琳', element: 'wind', role: '治疗' },
      { id: 'sr_02', name: '岩壁·戈登', element: 'earth', role: '坦克' },
      { id: 'sr_03', name: '赤炎·马可', element: 'fire', role: '输出' },
      { id: 'sr_04', name: '冰霜·安娜', element: 'ice', role: '辅助' }
    ],
    r: [
      { id: 'r_01', name: '见习剑士', element: 'none', role: '输出' },
      { id: 'r_02', name: '学徒法师', element: 'none', role: '输出' },
      { id: 'r_03', name: '新兵弓手', element: 'none', role: '输出' },
      { id: 'r_04', name: '初级治疗师', element: 'none', role: '治疗' }
    ]
  }
};

// ============ 抽卡引擎 ============
class GachaEngine {
  constructor() {
    this.pityCounter = { ssr: 0, sr: 0 }; // 保底计数
    this.totalPulls = 0;
    this.history = []; // 抽卡历史
  }

  // 加载保底状态
  loadState(state) {
    if (state.pityCounter) this.pityCounter = state.pityCounter;
    if (state.totalPulls) this.totalPulls = state.totalPulls;
  }

  // 导出状态
  saveState() {
    return {
      pityCounter: { ...this.pityCounter },
      totalPulls: this.totalPulls
    };
  }

  // 执行抽卡
  pull(poolId = 'standard', count = 1) {
    const pool = GachaConfig.pools[poolId];
    if (!pool) return [];

    const results = [];
    for (let i = 0; i < count; i++) {
      this.totalPulls++;
      this.pityCounter.ssr++;
      this.pityCounter.sr++;

      let rarity;

      // 保底判定
      if (this.pityCounter.ssr >= pool.pity.ssr) {
        rarity = 'ssr';
      } else if (this.pityCounter.sr >= pool.pity.sr) {
        rarity = Math.random() < pool.rates.ssr / (pool.rates.ssr + pool.rates.sr) ? 'ssr' : 'sr';
      } else {
        // 正常概率
        const roll = Math.random();
        if (roll < pool.rates.ssr) {
          rarity = 'ssr';
        } else if (roll < pool.rates.ssr + pool.rates.sr) {
          rarity = 'sr';
        } else {
          rarity = 'r';
        }
      }

      // 重置保底计数
      if (rarity === 'ssr') this.pityCounter.ssr = 0;
      if (rarity === 'sr' || rarity === 'ssr') this.pityCounter.sr = 0;

      // 从对应稀有度池随机选一个角色
      const charPool = GachaConfig.characters[rarity];
      const char = charPool[Math.floor(Math.random() * charPool.length)];

      const result = {
        ...char,
        rarity,
        isNew: !this.history.some(h => h.id === char.id),
        pullNumber: this.totalPulls
      };

      results.push(result);
      this.history.push(result);
    }

    return results;
  }

  // 检查余额是否足够
  canAfford(currency, poolId = 'standard', count = 1) {
    const pool = GachaConfig.pools[poolId];
    const cost = count === 1 ? pool.cost.single : pool.cost.ten;
    return currency.crystals >= cost;
  }

  // 扣除水晶
  deductCost(currency, poolId = 'standard', count = 1) {
    const pool = GachaConfig.pools[poolId];
    const cost = count === 1 ? pool.cost.single : pool.cost.ten;
    if (currency.crystals < cost) return false;
    currency.crystals -= cost;
    return true;
  }

  // 获取保底信息（UI 展示用）
  getPityInfo(poolId = 'standard') {
    const pool = GachaConfig.pools[poolId];
    return {
      ssrPity: this.pityCounter.ssr,
      ssrMax: pool.pity.ssr,
      srPity: this.pityCounter.sr,
      srMax: pool.pity.sr,
      totalPulls: this.totalPulls
    };
  }
}

// 导出
window.GachaEngine = GachaEngine;
window.GachaConfig = GachaConfig;
