/**
 * achievements.js - 成就 / 里程碑追踪系统
 * v0.11.0 新增
 *
 * 记录玩家的关键里程碑事件，提供解锁通知。
 * 数据存储在 localStorage，与云端存档同步。
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享记忆库
 */

// ============ 成就定义 ============
const AchievementDefs = [
  // ── 剧情 ──
  { id: 'first_story_node',   name: '旅途开始',       desc: '完成第一个剧情节点',        icon: '📖', hidden: false, reward: { crystals: 50, coins: 200 } },
  { id: 'ch1_complete',       name: '黎明之前',       desc: '完成序章·黎明之前',         icon: '🌅', hidden: false, reward: { crystals: 100, coins: 500 } },
  { id: 'ch2_unlock',         name: '新篇章',         desc: '解锁第二章',               icon: '🗺️', hidden: false, reward: { crystals: 50, coins: 300 } },
  { id: 'ch2_complete',       name: '命运交汇',       desc: '完成第二章·命运交汇',       icon: '⚡', hidden: false, reward: { crystals: 150, coins: 800 } },
  { id: 'all_ch1_nodes',      name: '探索者',         desc: '完成序章所有节点（含分支）', icon: '🔍', hidden: false, reward: { crystals: 80, coins: 400 } },

  // ── 战斗 ──
  { id: 'first_battle',       name: '初次交锋',       desc: '完成第一场战斗',            icon: '⚔️', hidden: false, reward: { crystals: 20, coins: 100 } },
  { id: 'battle_10',          name: '百战之师',       desc: '累计完成 10 场战斗',         icon: '🗡️', hidden: false, reward: { crystals: 60, coins: 400 } },
  { id: 'battle_50',          name: '无双勇者',       desc: '累计完成 50 场战斗',         icon: '🏆', hidden: false, reward: { crystals: 150, coins: 1000 } },
  { id: 'first_boss_kill',    name: '挑战者',         desc: '击败第一个 Boss',           icon: '💀', hidden: false, reward: { crystals: 40, coins: 300 } },
  { id: 'daily_boss_clear',   name: '日常猎人',       desc: '完成一次每日挑战',          icon: '📅', hidden: false, reward: { crystals: 30, coins: 200 } },

  // ── 抽卡 ──
  { id: 'first_gacha',        name: '命运之轮',       desc: '进行第一次召唤',            icon: '✨', hidden: false, reward: { crystals: 20, coins: 100 } },
  { id: 'first_ssr',          name: '星辰眷顾',       desc: '获得第一个 SSR 角色',        icon: '🌟', hidden: false, reward: { crystals: 100, coins: 500 } },
  { id: 'gacha_10',           name: '十连勇者',       desc: '完成一次十连召唤',          icon: '🎰', hidden: false, reward: { crystals: 30, coins: 200 } },
  { id: 'gacha_50',           name: '资深旅者',       desc: '累计召唤 50 次',            icon: '🃏', hidden: false, reward: { crystals: 80, coins: 600 } },
  { id: 'roster_5',           name: '小有阵容',       desc: '收集 5 名角色',             icon: '👥', hidden: false, reward: { crystals: 50, coins: 300 } },
  { id: 'roster_10',          name: '角色大师',       desc: '收集 10 名角色',            icon: '🏅', hidden: false, reward: { crystals: 100, coins: 800 } },

  // ── 养成 ──
  { id: 'first_levelup',      name: '成长之路',       desc: '第一次升级角色',            icon: '⬆️', hidden: false, reward: { crystals: 20, coins: 100 } },
  { id: 'first_ascend',       name: '突破极限',       desc: '第一次突破角色',            icon: '🔓', hidden: false, reward: { crystals: 40, coins: 300 } },
  { id: 'first_skillup',      name: '技艺精进',       desc: '第一次升级技能',            icon: '📚', hidden: false, reward: { crystals: 20, coins: 150 } },
  { id: 'level_40',           name: '中坚力量',       desc: '将任意角色提升至 Lv.40',    icon: '💪', hidden: false, reward: { crystals: 80, coins: 500 } },
  { id: 'level_80',           name: '满级传说',       desc: '将任意角色提升至 Lv.80',    icon: '👑', hidden: false, reward: { crystals: 200, coins: 1500 } },

  // ── 关卡 ──
  { id: 'first_stage',        name: '初次历练',       desc: '完成第一个材料关卡',         icon: '🏰', hidden: false, reward: { crystals: 20, coins: 150 } },
  { id: 'stage_3star',        name: '完美通关',       desc: '获得关卡三星评价',           icon: '⭐', hidden: false, reward: { crystals: 50, coins: 300 } },

  // ── 签到 ──
  { id: 'checkin_7',          name: '坚持一周',       desc: '连续签到 7 天',             icon: '📆', hidden: false, reward: { crystals: 80, coins: 500 } },
  { id: 'checkin_30',         name: '月度旅者',       desc: '连续签到 30 天',            icon: '🗓️', hidden: false, reward: { crystals: 200, coins: 1500 } },

  // ── 隐藏成就 ──
  { id: 'crystals_10000',     name: '水晶富翁',       desc: '持有 10000 水晶',           icon: '💎', hidden: true,  reward: { coins: 2000 } },
  { id: 'coins_50000',        name: '金库满仓',       desc: '持有 50000 金币',           icon: '🪙', hidden: true,  reward: { crystals: 100 } },
  { id: 'all_elements',       name: '五行齐聚',       desc: '编队中包含全部五种元素',     icon: '☯️', hidden: true,  reward: { crystals: 80, coins: 500 } }
];

// ============ 成就管理器 ============
class AchievementManager {
  constructor() {
    this.storageKey = 'game_achievements_v1';
    this.unlocked = {};       // { achievementId: { unlockedAt: ISO string } }
    this.claimed = {};        // { achievementId: { claimedAt: ISO string } }  v0.13.0 新增
    this.counters = {};       // { counterKey: number }  用于累计计数
    this.pendingNotifications = []; // 待展示的解锁通知
  }

  /** 从 localStorage 加载 */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.unlocked = data.unlocked || {};
        this.claimed = data.claimed || {};
        this.counters = data.counters || {};
      }
    } catch (e) {
      console.warn('[Achievements] 加载失败:', e);
    }
  }

  /** 保存到 localStorage */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        unlocked: this.unlocked,
        claimed: this.claimed,
        counters: this.counters,
        version: 1
      }));
    } catch (e) {
      console.warn('[Achievements] 保存失败:', e);
    }
  }

  /** 解锁成就 */
  unlock(achievementId) {
    if (this.unlocked[achievementId]) return false; // 已解锁

    const def = AchievementDefs.find(d => d.id === achievementId);
    if (!def) return false;

    this.unlocked[achievementId] = { unlockedAt: new Date().toISOString() };
    this.save();

    // 加入通知队列
    this.pendingNotifications.push({
      id: achievementId,
      name: def.name,
      desc: def.desc,
      icon: def.icon,
      timer: 4.0 // 显示 4 秒
    });

    console.log(`[Achievements] 解锁: ${def.name} — ${def.desc}`);
    return true;
  }

  /** 增加计数器并检查相关成就 */
  increment(key, amount = 1) {
    this.counters[key] = (this.counters[key] || 0) + amount;
    this.save();
    return this.counters[key];
  }

  /** 获取计数 */
  getCount(key) {
    return this.counters[key] || 0;
  }

  /** 检查是否已解锁 */
  isUnlocked(achievementId) {
    return !!this.unlocked[achievementId];
  }

  /** 获取所有成就状态（用于 UI 展示） */
  getAll() {
    return AchievementDefs.map(def => ({
      ...def,
      unlocked: !!this.unlocked[def.id],
      unlockedAt: this.unlocked[def.id]?.unlockedAt || null,
      claimable: !!this.unlocked[def.id] && !this.claimed[def.id] && !!def.reward,
      claimed: !!this.claimed[def.id],
      claimedAt: this.claimed[def.id]?.claimedAt || null
    }));
  }

  /** v0.13.0 领取成就奖励 */
  claimReward(achievementId, gameState) {
    if (!this.unlocked[achievementId]) return { success: false, reason: '未解锁' };
    if (this.claimed[achievementId]) return { success: false, reason: '已领取' };

    const def = AchievementDefs.find(d => d.id === achievementId);
    if (!def || !def.reward) return { success: false, reason: '无奖励' };

    // 发放奖励
    if (def.reward.crystals) {
      gameState.currency.crystals = (gameState.currency.crystals || 0) + def.reward.crystals;
    }
    if (def.reward.coins) {
      gameState.currency.coins = (gameState.currency.coins || 0) + def.reward.coins;
    }
    if (def.reward.item) {
      gameState.inventory = gameState.inventory || {};
      gameState.inventory[def.reward.item] = (gameState.inventory[def.reward.item] || 0) + (def.reward.itemAmount || 1);
    }

    this.claimed[achievementId] = { claimedAt: new Date().toISOString() };
    this.save();

    return { success: true, reward: def.reward };
  }

  /** v0.13.0 获取未领取奖励的成就数量 */
  getClaimableCount() {
    return AchievementDefs.filter(d => this.unlocked[d.id] && !this.claimed[d.id] && d.reward).length;
  }

  /** v0.13.0 获取已领取的成就数量 */
  getClaimedCount() {
    return Object.keys(this.claimed).length;
  }

  /** 获取解锁数量 */
  getUnlockedCount() {
    return Object.keys(this.unlocked).length;
  }

  /** 获取总数 */
  getTotalCount() {
    return AchievementDefs.length;
  }

  /** 获取下一个通知（每帧调用） */
  getNextNotification(dt) {
    if (this.pendingNotifications.length === 0) return null;

    const notif = this.pendingNotifications[0];
    notif.timer -= dt;

    if (notif.timer <= 0) {
      this.pendingNotifications.shift();
      return null;
    }

    return notif;
  }

  /** 导出存档数据（用于云端同步） */
  exportData() {
    return {
      unlocked: { ...this.unlocked },
      claimed: { ...this.claimed },
      counters: { ...this.counters }
    };
  }

  /** 导入存档数据 */
  importData(data) {
    if (!data) return;
    if (data.unlocked) {
      for (const [id, info] of Object.entries(data.unlocked)) {
        if (!this.unlocked[id]) {
          this.unlocked[id] = info;
        }
      }
    }
    if (data.claimed) {
      for (const [id, info] of Object.entries(data.claimed)) {
        if (!this.claimed[id]) {
          this.claimed[id] = info;
        }
      }
    }
    if (data.counters) {
      for (const [key, val] of Object.entries(data.counters)) {
        this.counters[key] = Math.max(this.counters[key] || 0, val);
      }
    }
    this.save();
  }
}

// ============ 成就触发检查器 ============
const AchievementChecker = {
  /** 战斗完成后检查 */
  onBattleComplete(isBoss = false, stageId = '') {
    if (!window.achievementManager) return;
    const am = window.achievementManager;

    am.unlock('first_battle');

    const battles = am.increment('total_battles');
    if (battles >= 10) am.unlock('battle_10');
    if (battles >= 50) am.unlock('battle_50');

    if (isBoss) am.unlock('first_boss_kill');
    if (stageId === 'daily_boss') am.unlock('daily_boss_clear');
  },

  /** 抽卡后检查 */
  onGachaPull(results) {
    if (!window.achievementManager) return;
    const am = window.achievementManager;

    am.unlock('first_gacha');

    const totalPulls = am.increment('total_pulls', results.length);
    if (results.length >= 10) am.unlock('gacha_10');
    if (totalPulls >= 50) am.unlock('gacha_50');

    for (const r of results) {
      if (r.rarity === 'ssr') {
        am.unlock('first_ssr');
        break;
      }
    }
  },

  /** 图鉴更新后检查 */
  onRosterUpdate(roster) {
    if (!window.achievementManager || !roster) return;
    const am = window.achievementManager;
    const count = roster.length;

    if (count >= 5) am.unlock('roster_5');
    if (count >= 10) am.unlock('roster_10');

    // 检查五行齐聚
    const elements = new Set(roster.map(c => c.element).filter(e => e && e !== 'none'));
    if (elements.size >= 5) am.unlock('all_elements');
  },

  /** 升级后检查 */
  onLevelUp(newLevel) {
    if (!window.achievementManager) return;
    const am = window.achievementManager;

    am.unlock('first_levelup');
    if (newLevel >= 40) am.unlock('level_40');
    if (newLevel >= 80) am.unlock('level_80');
  },

  /** 突破后检查 */
  onAscend() {
    if (!window.achievementManager) return;
    window.achievementManager.unlock('first_ascend');
  },

  /** 技能升级后检查 */
  onSkillUp() {
    if (!window.achievementManager) return;
    window.achievementManager.unlock('first_skillup');
  },

  /** 剧情节点完成后检查 */
  onStoryNodeComplete(nodeId, chapterId, allNodesComplete) {
    if (!window.achievementManager) return;
    const am = window.achievementManager;

    am.unlock('first_story_node');

    if (chapterId === 'ch1') {
      if (nodeId === 'ch1_end') am.unlock('ch1_complete');
      if (allNodesComplete) am.unlock('all_ch1_nodes');
    }

    if (chapterId === 'ch2') {
      if (nodeId === 'ch2_end') am.unlock('ch2_complete');
    }
  },

  /** 章节解锁后检查 */
  onChapterUnlock(chapterId) {
    if (!window.achievementManager) return;
    if (chapterId === 'ch2') window.achievementManager.unlock('ch2_unlock');
  },

  /** 签到后检查 */
  onCheckIn(day) {
    if (!window.achievementManager) return;
    const am = window.achievementManager;
    if (day >= 7) am.unlock('checkin_7');
    if (day >= 30) am.unlock('checkin_30');
  },

  /** 资源变动后检查 */
  onCurrencyChange(currency) {
    if (!window.achievementManager || !currency) return;
    const am = window.achievementManager;
    if (currency.crystals >= 10000) am.unlock('crystals_10000');
    if (currency.coins >= 50000) am.unlock('coins_50000');
  },

  /** 关卡完成后检查 */
  onStageComplete(stars) {
    if (!window.achievementManager) return;
    const am = window.achievementManager;
    am.unlock('first_stage');
    if (stars >= 3) am.unlock('stage_3star');
  }
};

window.AchievementManager = AchievementManager;
window.AchievementDefs = AchievementDefs;
window.AchievementChecker = AchievementChecker;
