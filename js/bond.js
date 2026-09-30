/**
 * bond.js - 角色羁绊系统
 * 角色共同战斗获得羁绊经验，升级解锁属性加成和特殊效果
 * v0.21.0 新增
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享：
 *   - 羁绊图标路径：assets/ui/bond/<角色id>_bond.png
 *   - 美术侧按规范产出即可，本模块自动加载
 */

// ============ 羁绊等级配置 ============
const BondConfig = {
  maxLevel: 10,

  // 每级所需羁绊经验
  expTable: [0, 100, 250, 500, 800, 1200, 1800, 2600, 3600, 5000],

  // 每级解锁的加成效果
  levelBonuses: {
    1:  { name: '初识',     atkBonus: 0,    defBonus: 0,    hpBonus: 0,    desc: '旅途的起点' },
    2:  { name: '熟悉',     atkBonus: 0.02, defBonus: 0.02, hpBonus: 0.02, desc: '彼此有了基本的了解' },
    3:  { name: '信任',     atkBonus: 0.04, defBonus: 0.04, hpBonus: 0.04, desc: '战斗中可以放心把后背交给对方' },
    4:  { name: '默契',     atkBonus: 0.06, defBonus: 0.06, hpBonus: 0.06, desc: '无需言语也能配合无间' },
    5:  { name: '深厚',     atkBonus: 0.08, defBonus: 0.08, hpBonus: 0.08, special: 'counter_boost', specialValue: 0.05, desc: '反击概率+5%' },
    6:  { name: '坚定',     atkBonus: 0.10, defBonus: 0.10, hpBonus: 0.10, special: 'crit_boost', specialValue: 0.03, desc: '暴击率+3%' },
    7:  { name: '生死之交', atkBonus: 0.12, defBonus: 0.12, hpBonus: 0.12, special: 'heal_boost', specialValue: 0.08, desc: '受治疗效果+8%' },
    8:  { name: '灵魂共鸣', atkBonus: 0.15, defBonus: 0.15, hpBonus: 0.15, special: 'energy_boost', specialValue: 0.10, desc: '元素力回复+10%' },
    9:  { name: '命运之绊', atkBonus: 0.18, defBonus: 0.18, hpBonus: 0.18, special: 'revive_chance', specialValue: 0.05, desc: '倒下时5%概率以1HP复活（每场战斗限1次）' },
    10: { name: '永恒誓约', atkBonus: 0.22, defBonus: 0.22, hpBonus: 0.22, special: 'ultimate_boost', specialValue: 0.15, desc: '大招伤害+15%，解锁专属羁绊称号' }
  },

  // 每次战斗获得的羁绊经验（同队角色之间互相获得）
  battleExpPerFight: 15,
  // Boss 战斗额外加成
  bossBattleMultiplier: 2.0,
  // 剧情战斗加成
  storyBattleMultiplier: 1.5,
  // 最大羁绊对数（4人编队 = C(4,2) = 6 对）
  maxPairsInParty: 6
};

// ============ 羁绊关系定义（特殊角色之间有更深的羁绊） ============
const SpecialBonds = {
  // 织星 & 影（序章搭档）
  'zhixing-ying': { bonus: 1.5, title: '命运搭档', desc: '从旅途之初就并肩同行的二人' },
  // 织星 & 曦（光之传承）
  'zhixing-xi': { bonus: 1.3, title: '光之传承', desc: '光之圣女与引导者的特殊联系' },
  // SSR 角色之间
  'ssr_lilith-ssr_yan': { bonus: 1.4, title: '水火交融', desc: '冰与火的碰撞，竟产生了奇妙的化学反应' },
  'ssr_lilith-ssr_lein': { bonus: 1.3, title: '星辰之约', desc: '星辰与天罚，命运的交织' },
  'ssr_yan-ssr_lein': { bonus: 1.3, title: '炎金共鸣', desc: '火焰与金属，锻造与毁灭' },
  // 同元素角色
  // 这里不需要手动列出，系统会自动检测同元素加成
  sameElementBonus: 1.2
};

// ============ 羁绊管理器 ============
class BondManager {
  constructor() {
    // 存储格式: { "charA-charB": { exp, level } }
    // charA 和 charB 按字典序排列，确保唯一键
    this.bonds = {};
  }

  // === 存档接口 ===
  exportData() {
    return { bonds: this.bonds };
  }

  importData(data) {
    if (!data) return;
    this.bonds = data.bonds || {};
  }

  // === 羁绊键生成 ===
  _bondKey(charA, charB) {
    return [charA, charB].sort().join('-');
  }

  // === 获取羁绊数据 ===
  getBond(charA, charB) {
    const key = this._bondKey(charA, charB);
    if (!this.bonds[key]) {
      this.bonds[key] = { exp: 0, level: 1 };
    }
    return this.bonds[key];
  }

  // === 获取角色所有羁绊 ===
  getCharacterBonds(charId) {
    const result = [];
    const state = window.game?.state;
    const roster = state?.roster || [];

    for (const other of roster) {
      if (other.id === charId) continue;
      const key = this._bondKey(charId, other.id);
      if (this.bonds[key]) {
        result.push({
          partnerId: other.id,
          partnerName: other.name,
          bond: this.bonds[key],
          config: BondConfig.levelBonuses[this.bonds[key].level]
        });
      }
    }

    return result.sort((a, b) => b.bond.level - a.bond.level || b.bond.exp - a.bond.exp);
  }

  // === 战斗后增加羁绊经验 ===
  onBattleEnd(partyIds, isBoss = false, isStory = false) {
    if (!partyIds || partyIds.length < 2) return [];

    const multiplier = isBoss ? BondConfig.bossBattleMultiplier
                     : isStory ? BondConfig.storyBattleMultiplier
                     : 1.0;

    const results = [];
    const baseExp = BondConfig.battleExpPerFight;

    // 生成所有配对
    for (let i = 0; i < partyIds.length; i++) {
      for (let j = i + 1; j < partyIds.length; j++) {
        const key = this._bondKey(partyIds[i], partyIds[j]);
        if (!this.bonds[key]) {
          this.bonds[key] = { exp: 0, level: 1 };
        }

        const bond = this.bonds[key];
        if (bond.level >= BondConfig.maxLevel) continue;

        // 计算经验加成
        let expGain = Math.floor(baseExp * multiplier);

        // 特殊羁绊加成
        const specialBond = SpecialBonds[key];
        if (specialBond) {
          expGain = Math.floor(expGain * specialBond.bonus);
        }

        // 同元素加成
        const state = window.game?.state;
        const charA = state?.roster?.find(c => c.id === partyIds[i]);
        const charB = state?.roster?.find(c => c.id === partyIds[j]);
        if (charA?.element && charB?.element && charA.element === charB.element) {
          expGain = Math.floor(expGain * SpecialBonds.sameElementBonus);
        }

        bond.exp += expGain;

        // 检查升级
        const leveledUp = this._checkLevelUp(key);

        results.push({
          charA: partyIds[i],
          charB: partyIds[j],
          expGain,
          newExp: bond.exp,
          level: bond.level,
          leveledUp,
          newLevel: bond.level
        });
      }
    }

    return results;
  }

  // === 升级检查 ===
  _checkLevelUp(bondKey) {
    const bond = this.bonds[bondKey];
    if (!bond || bond.level >= BondConfig.maxLevel) return false;

    let leveled = false;
    while (bond.level < BondConfig.maxLevel) {
      const required = BondConfig.expTable[bond.level] || 9999;
      if (bond.exp >= required) {
        bond.exp -= required;
        bond.level++;
        leveled = true;
      } else {
        break;
      }
    }

    return leveled;
  }

  // === 获取羁绊属性加成（供战斗系统调用）===
  getBondBonus(charId) {
    const state = window.game?.state;
    const party = state?.party || [];
    const partyIds = party.map(p => p.id || p);

    let totalAtkBonus = 0;
    let totalDefBonus = 0;
    let totalHpBonus = 0;
    const specials = [];

    for (const otherId of partyIds) {
      if (otherId === charId) continue;
      const bond = this.getBond(charId, otherId);
      const bonus = BondConfig.levelBonuses[bond.level];
      if (!bonus) continue;

      totalAtkBonus += bonus.atkBonus;
      totalDefBonus += bonus.defBonus;
      totalHpBonus += bonus.hpBonus;

      if (bonus.special) {
        specials.push({
          type: bonus.special,
          value: bonus.specialValue || 0,
          source: `与 ${this._getCharName(otherId)} 的羁绊 Lv.${bond.level} ${bonus.name}`
        });
      }
    }

    return {
      atkBonus: totalAtkBonus,
      defBonus: totalDefBonus,
      hpBonus: totalHpBonus,
      specials
    };
  }

  // === 辅助 ===
  _getCharName(charId) {
    const state = window.game?.state;
    const char = state?.roster?.find(c => c.id === charId);
    return char?.name || charId;
  }

  // 获取特殊羁绊信息
  getSpecialBondInfo(charA, charB) {
    const key = this._bondKey(charA, charB);
    return SpecialBonds[key] || null;
  }

  // 获取角色平均羁绊等级
  getAverageBondLevel(charId) {
    const bonds = this.getCharacterBonds(charId);
    if (bonds.length === 0) return 0;
    const total = bonds.reduce((sum, b) => sum + b.bond.level, 0);
    return total / bonds.length;
  }

  // 获取队伍总羁绊等级（用于共鸣加成的额外效果）
  getPartyBondLevel() {
    const state = window.game?.state;
    const party = state?.party || [];
    const partyIds = party.map(p => p.id || p);
    let total = 0;
    let count = 0;

    for (let i = 0; i < partyIds.length; i++) {
      for (let j = i + 1; j < partyIds.length; j++) {
        const bond = this.getBond(partyIds[i], partyIds[j]);
        total += bond.level;
        count++;
      }
    }

    return count > 0 ? total / count : 0;
  }
}

// ============ 羁绊属性应用到战斗 ============
// 供 battle.js 调用
function applyBondStats(charData, charId) {
  if (!window.bondManager) return charData;

  const bonus = window.bondManager.getBondBonus(charId);
  const result = { ...charData };

  // 百分比加成叠加到基础属性上
  if (bonus.atkBonus > 0) result.atk = Math.floor((result.atk || 0) * (1 + bonus.atkBonus));
  if (bonus.defBonus > 0) result.def = Math.floor((result.def || 0) * (1 + bonus.defBonus));
  if (bonus.hpBonus > 0) {
    result.maxHp = Math.floor((result.maxHp || 0) * (1 + bonus.hpBonus));
    if (result.currentHp !== undefined) {
      result.currentHp = Math.min(result.currentHp, result.maxHp);
    }
  }

  // 合并被动效果（与装备被动合并）
  result.bondPassives = bonus.specials;
  if (!result.equipmentPassives) result.equipmentPassives = [];
  result.allPassives = [...(result.equipmentPassives || []), ...bonus.specials];

  return result;
}

// ============ 羁绊场景名 ============
const BondSceneName = 'bond';
