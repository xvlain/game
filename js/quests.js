/**
 * quests.js - 每日委托 & 周常任务系统
 * v0.13.0 新增
 *
 * 支持：
 *  - 每日委托（每天 04:00 重置，随机抽取 4 个任务）
 *  - 周常任务（每周一 04:00 重置）
 *  - 活跃度系统（完成委托获得活跃度，满额领取宝箱）
 *  - 任务奖励领取（水晶/金币/经验书/体力药水）
 *  - 本地持久化 + 云端存档同步
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享记忆库
 */

// ============ 任务定义池 ============
const DailyQuestPool = [
  // ── 战斗类 ──
  { id: 'dq_battle_3',    name: '日常训练',     desc: '完成 3 场战斗',          icon: '⚔️', type: 'battle_count',   target: 3,  reward: { coins: 500, crystals: 20 },  activePoints: 10 },
  { id: 'dq_battle_5',    name: '百战精兵',     desc: '完成 5 场战斗',          icon: '🗡️', type: 'battle_count',   target: 5,  reward: { coins: 800, crystals: 40 },  activePoints: 20 },
  { id: 'dq_boss_1',      name: '讨伐强敌',     desc: '完成 1 次每日挑战',      icon: '💀', type: 'daily_boss',     target: 1,  reward: { coins: 1000, crystals: 50 }, activePoints: 25 },
  { id: 'dq_stage_2',     name: '材料收集',     desc: '完成 2 次材料关卡',      icon: '🏰', type: 'stage_count',    target: 2,  reward: { coins: 600 },                activePoints: 15 },
  { id: 'dq_stage_3',     name: '修炼之路',     desc: '完成 3 次任意关卡',      icon: '🏰', type: 'stage_count',    target: 3,  reward: { coins: 800, crystals: 30 },  activePoints: 20 },
  { id: 'dq_crit_5',      name: '精准打击',     desc: '战斗中累计暴击 5 次',    icon: '💥', type: 'crit_count',     target: 5,  reward: { coins: 400 },                activePoints: 10 },
  { id: 'dq_combo_3',     name: '连锁反应',     desc: '触发 3 次连击链',        icon: '🔗', type: 'combo_count',    target: 3,  reward: { coins: 500, crystals: 15 },  activePoints: 15 },

  // ── 抽卡类 ──
  { id: 'dq_gacha_1',     name: '命运之轮',     desc: '进行 1 次召唤',          icon: '✨', type: 'gacha_count',    target: 1,  reward: { coins: 300 },                activePoints: 5 },
  { id: 'dq_gacha_3',     name: '三连召唤',     desc: '进行 3 次召唤',          icon: '🎰', type: 'gacha_count',    target: 3,  reward: { coins: 500, crystals: 10 },  activePoints: 10 },

  // ── 养成类 ──
  { id: 'dq_levelup_1',   name: '角色培养',     desc: '升级任意角色 1 次',      icon: '⬆️', type: 'levelup_count',  target: 1,  reward: { coins: 400 },                activePoints: 10 },
  { id: 'dq_levelup_3',   name: '批量培养',     desc: '升级任意角色 3 次',      icon: '📈', type: 'levelup_count',  target: 3,  reward: { coins: 600, crystals: 20 },  activePoints: 15 },
  { id: 'dq_skillup_1',   name: '技能强化',     desc: '升级任意技能 1 次',      icon: '📚', type: 'skillup_count',  target: 1,  reward: { coins: 500 },                activePoints: 10 },
  { id: 'dq_ascend_1',    name: '突破极限',     desc: '突破任意角色 1 次',      icon: '🔓', type: 'ascend_count',   target: 1,  reward: { coins: 800, crystals: 30 },  activePoints: 20 },

  // ── 日常类 ──
  { id: 'dq_checkin',     name: '每日签到',     desc: '完成今日签到',           icon: '📅', type: 'checkin',        target: 1,  reward: { coins: 200 },                activePoints: 5 },
  { id: 'dq_login',       name: '冒险启程',     desc: '登录游戏',               icon: '🌅', type: 'login',          target: 1,  reward: { coins: 100 },                activePoints: 5 }
];

const WeeklyQuestPool = [
  { id: 'wq_battle_20',   name: '周常战斗',     desc: '本周完成 20 场战斗',     icon: '⚔️', type: 'battle_count',   target: 20, reward: { coins: 3000, crystals: 200 },  activePoints: 60 },
  { id: 'wq_boss_5',      name: 'Boss 猎手',    desc: '本周完成 5 次每日挑战',  icon: '👹', type: 'daily_boss',     target: 5,  reward: { coins: 2000, crystals: 150 },  activePoints: 50 },
  { id: 'wq_gacha_10',    name: '命运旅者',     desc: '本周召唤 10 次',         icon: '🎲', type: 'gacha_count',    target: 10, reward: { coins: 1500, crystals: 100 },  activePoints: 30 },
  { id: 'wq_levelup_10',  name: '成长之路',     desc: '本周升级角色 10 次',     icon: '📈', type: 'levelup_count',  target: 10, reward: { coins: 2000, crystals: 100 },  activePoints: 40 },
  { id: 'wq_stage_15',    name: '勤劳矿工',     desc: '本周完成 15 次关卡',     icon: '⛏️', type: 'stage_count',    target: 15, reward: { coins: 2500, crystals: 120 },  activePoints: 45 },
  { id: 'wq_combo_10',    name: '连击大师',     desc: '本周触发 10 次连击链',   icon: '🔗', type: 'combo_count',    target: 10, reward: { coins: 1500, crystals: 80 },   activePoints: 35 },
  { id: 'wq_checkin_5',   name: '坚持不懈',     desc: '本周签到 5 天',          icon: '📆', type: 'checkin_days',   target: 5,  reward: { coins: 1000, crystals: 150 },  activePoints: 30 }
];

// ============ 活跃度宝箱配置 ============
const ActiveChestConfig = [
  { threshold: 40,  reward: { coins: 500 },                label: '初级宝箱', icon: '📦' },
  { threshold: 80,  reward: { crystals: 30, coins: 300 },  label: '中级宝箱', icon: '🎁' },
  { threshold: 120, reward: { crystals: 60, coins: 500 },  label: '高级宝箱', icon: '👑' },
  { threshold: 160, reward: { crystals: 100, coins: 800, item: 'exp_book_2', itemAmount: 2 }, label: '至尊宝箱', icon: '💎' }
];

// ============ 任务管理器 ============
class QuestManager {
  constructor() {
    this.storageKey = 'game_quests_v1';
    this.dailyQuests = [];      // 今日 4 个每日委托
    this.weeklyQuests = [];     // 本周周常任务
    this.counters = {};         // { counterKey: number }
    this.dailyActive = 0;       // 今日活跃度
    this.weeklyActive = 0;      // 本周活跃度
    this.chestsClaimed = {};    // { threshold: ISO string }
    this.dailyClaimed = {};     // { questId: ISO string }
    this.weeklyClaimed = {};    // { questId: ISO string }
    this.lastDailyReset = null;
    this.lastWeeklyReset = null;
    this._dailySelectionSeed = 0;
  }

  /** 加载本地数据 */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.counters = data.counters || {};
        this.dailyActive = data.dailyActive || 0;
        this.weeklyActive = data.weeklyActive || 0;
        this.chestsClaimed = data.chestsClaimed || {};
        this.dailyClaimed = data.dailyClaimed || {};
        this.weeklyClaimed = data.weeklyClaimed || {};
        this.lastDailyReset = data.lastDailyReset || null;
        this.lastWeeklyReset = data.lastWeeklyReset || null;
        this._dailySelectionSeed = data._dailySelectionSeed || 0;
      }
    } catch (e) {
      console.warn('[Quests] 加载失败:', e);
    }

    this._checkReset();
    this._ensureDailyQuests();
    this._ensureWeeklyQuests();
  }

  /** 保存到本地 */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        counters: this.counters,
        dailyActive: this.dailyActive,
        weeklyActive: this.weeklyActive,
        chestsClaimed: this.chestsClaimed,
        dailyClaimed: this.dailyClaimed,
        weeklyClaimed: this.weeklyClaimed,
        lastDailyReset: this.lastDailyReset,
        lastWeeklyReset: this.lastWeeklyReset,
        _dailySelectionSeed: this._dailySelectionSeed,
        version: 1
      }));
    } catch (e) {
      console.warn('[Quests] 保存失败:', e);
    }
  }

  /** 检查并执行重置 */
  _checkReset() {
    const now = new Date();

    // 每日重置：每天 04:00
    const dailyResetHour = 4;
    const todayReset = new Date(now);
    todayReset.setHours(dailyResetHour, 0, 0, 0);
    if (now < todayReset) {
      todayReset.setDate(todayReset.getDate() - 1);
    }

    if (!this.lastDailyReset || new Date(this.lastDailyReset) < todayReset) {
      this._resetDaily();
      this.lastDailyReset = todayReset.toISOString();
    }

    // 周常重置：每周一 04:00
    const weeklyReset = new Date(todayReset);
    const dayOfWeek = now.getDay(); // 0=Sun
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weeklyReset.setDate(weeklyReset.getDate() - daysSinceMonday);

    if (!this.lastWeeklyReset || new Date(this.lastWeeklyReset) < weeklyReset) {
      this._resetWeekly();
      this.lastWeeklyReset = weeklyReset.toISOString();
    }
  }

  /** 每日重置 */
  _resetDaily() {
    this.dailyActive = 0;
    this.dailyClaimed = {};
    this.chestsClaimed = {};

    // 重置每日相关计数器
    const dailyTypes = ['battle_count', 'daily_boss', 'stage_count', 'crit_count', 'combo_count',
                        'gacha_count', 'levelup_count', 'skillup_count', 'ascend_count', 'checkin', 'login'];
    for (const t of dailyTypes) {
      this.counters[t] = 0;
    }

    // 随机选 4 个每日委托
    this._dailySelectionSeed = Date.now();
    this.dailyQuests = [];
    this._ensureDailyQuests();
    this.save();

    console.log('[Quests] 每日委托已重置');
  }

  /** 周常重置 */
  _resetWeekly() {
    this.weeklyActive = 0;
    this.weeklyClaimed = {};
    this.weeklyQuests = [];
    this._ensureWeeklyQuests();
    this.save();

    console.log('[Quests] 周常任务已重置');
  }

  /** 确保有 4 个每日委托 */
  _ensureDailyQuests() {
    if (this.dailyQuests.length >= 4) return;

    // 基于种子的伪随机选择
    const pool = [...DailyQuestPool];
    const selected = [];
    let seed = this._dailySelectionSeed || Date.now();

    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    // 确保至少包含一个"登录"任务
    const loginQuest = pool.find(q => q.id === 'dq_login');
    if (loginQuest) {
      selected.push(loginQuest);
      pool.splice(pool.indexOf(loginQuest), 1);
    }

    while (selected.length < 4 && pool.length > 0) {
      const idx = Math.floor(seededRandom() * pool.length);
      selected.push(pool[idx]);
      pool.splice(idx, 1);
    }

    this.dailyQuests = selected;
  }

  /** 确保有周常任务 */
  _ensureWeeklyQuests() {
    if (this.weeklyQuests.length > 0) return;
    // 周常全部启用
    this.weeklyQuests = [...WeeklyQuestPool];
  }

  /** 事件触发：更新计数器 */
  onEvent(eventType, amount = 1) {
    if (!eventType) return;

    // 更新计数器
    this.counters[eventType] = (this.counters[eventType] || 0) + amount;
    this.save();
  }

  /** 获取任务进度 */
  getQuestProgress(quest) {
    const current = this.counters[quest.type] || 0;
    return { current: Math.min(current, quest.target), target: quest.target, completed: current >= quest.target };
  }

  /** 领取每日委托奖励 */
  claimDaily(questId, gameState) {
    if (this.dailyClaimed[questId]) return { success: false, reason: '已领取' };

    const quest = this.dailyQuests.find(q => q.id === questId);
    if (!quest) return { success: false, reason: '任务不存在' };

    const progress = this.getQuestProgress(quest);
    if (!progress.completed) return { success: false, reason: '未完成' };

    // 发放奖励
    this._applyReward(gameState, quest.reward);

    // 增加活跃度
    this.dailyActive += quest.activePoints;

    // 标记已领取
    this.dailyClaimed[questId] = new Date().toISOString();
    this.save();

    return { success: true, reward: quest.reward, activePoints: quest.activePoints };
  }

  /** 领取周常任务奖励 */
  claimWeekly(questId, gameState) {
    if (this.weeklyClaimed[questId]) return { success: false, reason: '已领取' };

    const quest = this.weeklyQuests.find(q => q.id === questId);
    if (!quest) return { success: false, reason: '任务不存在' };

    const progress = this.getQuestProgress(quest);
    if (!progress.completed) return { success: false, reason: '未完成' };

    // 周常使用周计数器（需要独立存储）
    const weekCounterKey = `week_${quest.type}`;
    const weekCurrent = this.counters[weekCounterKey] || 0;
    if (weekCurrent < quest.target) return { success: false, reason: '未完成' };

    this._applyReward(gameState, quest.reward);
    this.weeklyActive += quest.activePoints;
    this.weeklyClaimed[questId] = new Date().toISOString();
    this.save();

    return { success: true, reward: quest.reward, activePoints: quest.activePoints };
  }

  /** 领取活跃度宝箱 */
  claimChest(threshold, gameState) {
    if (this.chestsClaimed[threshold]) return { success: false, reason: '已领取' };
    if (this.dailyActive < threshold) return { success: false, reason: '活跃度不足' };

    const chest = ActiveChestConfig.find(c => c.threshold === threshold);
    if (!chest) return { success: false, reason: '宝箱不存在' };

    this._applyReward(gameState, chest.reward);
    this.chestsClaimed[threshold] = new Date().toISOString();
    this.save();

    return { success: true, reward: chest.reward, chest };
  }

  /** 发放奖励到游戏状态 */
  _applyReward(gameState, reward) {
    if (!gameState || !reward) return;

    if (reward.coins) {
      gameState.currency.coins = (gameState.currency.coins || 0) + reward.coins;
    }
    if (reward.crystals) {
      gameState.currency.crystals = (gameState.currency.crystals || 0) + reward.crystals;
    }
    if (reward.item) {
      gameState.inventory = gameState.inventory || {};
      const amount = reward.itemAmount || 1;
      gameState.inventory[reward.item] = (gameState.inventory[reward.item] || 0) + amount;
    }
  }

  /** 导出存档数据 */
  exportData() {
    return {
      counters: { ...this.counters },
      dailyActive: this.dailyActive,
      weeklyActive: this.weeklyActive,
      chestsClaimed: { ...this.chestsClaimed },
      dailyClaimed: { ...this.dailyClaimed },
      weeklyClaimed: { ...this.weeklyClaimed },
      lastDailyReset: this.lastDailyReset,
      lastWeeklyReset: this.lastWeeklyReset,
      _dailySelectionSeed: this._dailySelectionSeed
    };
  }

  /** 导入存档数据 */
  importData(data) {
    if (!data) return;
    if (data.counters) {
      for (const [key, val] of Object.entries(data.counters)) {
        this.counters[key] = Math.max(this.counters[key] || 0, val);
      }
    }
    if (data.dailyActive !== undefined) this.dailyActive = data.dailyActive;
    if (data.weeklyActive !== undefined) this.weeklyActive = data.weeklyActive;
    if (data.chestsClaimed) Object.assign(this.chestsClaimed, data.chestsClaimed);
    if (data.dailyClaimed) Object.assign(this.dailyClaimed, data.dailyClaimed);
    if (data.weeklyClaimed) Object.assign(this.weeklyClaimed, data.weeklyClaimed);
    if (data.lastDailyReset) this.lastDailyReset = data.lastDailyReset;
    if (data.lastWeeklyReset) this.lastWeeklyReset = data.lastWeeklyReset;
    if (data._dailySelectionSeed) this._dailySelectionSeed = data._dailySelectionSeed;
    this.save();
  }

  /** 获取每日委托状态列表 */
  getDailyStatus() {
    return this.dailyQuests.map(q => ({
      ...q,
      progress: this.getQuestProgress(q),
      claimed: !!this.dailyClaimed[q.id]
    }));
  }

  /** 获取周常任务状态列表 */
  getWeeklyStatus() {
    return this.weeklyQuests.map(q => {
      const weekCounterKey = `week_${q.type}`;
      const current = this.counters[weekCounterKey] || 0;
      return {
        ...q,
        progress: { current: Math.min(current, q.target), target: q.target, completed: current >= q.target },
        claimed: !!this.weeklyClaimed[q.id]
      };
    });
  }

  /** 获取宝箱状态 */
  getChestStatus() {
    return ActiveChestConfig.map(c => ({
      ...c,
      claimable: this.dailyActive >= c.threshold && !this.chestsClaimed[c.threshold],
      claimed: !!this.chestsClaimed[c.threshold]
    }));
  }
}

// ============ 事件监听集成 ============
const QuestEventBridge = {
  /** 战斗完成后触发 */
  onBattleComplete(isBoss, isDaily, critCount, comboCount) {
    if (!window.questManager) return;
    const qm = window.questManager;

    qm.onEvent('battle_count', 1);
    qm.onEvent('week_battle_count', 1);

    if (isBoss) {
      qm.onEvent('daily_boss', 1);
      qm.onEvent('week_daily_boss', 1);
    }

    if (isDaily) {
      qm.onEvent('daily_boss', 1);
    }

    if (critCount > 0) {
      qm.onEvent('crit_count', critCount);
    }

    if (comboCount > 0) {
      qm.onEvent('combo_count', comboCount);
      qm.onEvent('week_combo_count', comboCount);
    }
  },

  /** 关卡完成后触发 */
  onStageComplete(stageId) {
    if (!window.questManager) return;
    const qm = window.questManager;

    qm.onEvent('stage_count', 1);
    qm.onEvent('week_stage_count', 1);
  },

  /** 抽卡后触发 */
  onGachaPull(count) {
    if (!window.questManager) return;
    const qm = window.questManager;

    qm.onEvent('gacha_count', count);
    qm.onEvent('week_gacha_count', count);
  },

  /** 升级后触发 */
  onLevelUp() {
    if (!window.questManager) return;
    const qm = window.questManager;

    qm.onEvent('levelup_count', 1);
    qm.onEvent('week_levelup_count', 1);
  },

  /** 技能升级后触发 */
  onSkillUp() {
    if (!window.questManager) return;
    window.questManager.onEvent('skillup_count', 1);
  },

  /** 突破后触发 */
  onAscend() {
    if (!window.questManager) return;
    window.questManager.onEvent('ascend_count', 1);
  },

  /** 签到后触发 */
  onCheckIn(day) {
    if (!window.questManager) return;
    const qm = window.questManager;

    qm.onEvent('checkin', 1);
    qm.onEvent('checkin_days', 1);
    qm.onEvent('week_checkin_days', 1);
  },

  /** 登录后触发 */
  onLogin() {
    if (!window.questManager) return;
    window.questManager.onEvent('login', 1);
  }
};

window.QuestManager = QuestManager;
window.QuestEventBridge = QuestEventBridge;
window.DailyQuestPool = DailyQuestPool;
window.WeeklyQuestPool = WeeklyQuestPool;
window.ActiveChestConfig = ActiveChestConfig;
