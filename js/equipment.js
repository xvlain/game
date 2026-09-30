/**
 * equipment.js - 装备系统
 * 装备定义 / 穿戴 / 属性加成 / 强化 / 分解
 * v0.21.0 新增
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享：
 *   - 装备图标路径：assets/ui/equipment/<装备id>.png
 *   - 美术侧按规范产出即可，本模块自动加载
 */

// ============ 装备定义 ============
const EquipmentDefs = {
  // --- 武器类 (weapon) ---
  // R 武器
  wpn_r_sword_1: {
    id: 'wpn_r_sword_1', name: '铁剑', slot: 'weapon', rarity: 'r',
    baseStats: { atk: 15 }, maxLevel: 10,
    desc: '普通铁剑，入门武器。'
  },
  wpn_r_staff_1: {
    id: 'wpn_r_staff_1', name: '木杖', slot: 'weapon', rarity: 'r',
    baseStats: { atk: 10, hp: 50 }, maxLevel: 10,
    desc: '普通木制法杖。'
  },
  wpn_r_shield_1: {
    id: 'wpn_r_shield_1', name: '圆盾', slot: 'weapon', rarity: 'r',
    baseStats: { atk: 5, def: 10, hp: 100 }, maxLevel: 10,
    desc: '简易防护圆盾。'
  },
  // SR 武器
  wpn_sr_flame_blade: {
    id: 'wpn_sr_flame_blade', name: '焰刃', slot: 'weapon', rarity: 'sr',
    baseStats: { atk: 35, crit: 3 }, maxLevel: 20,
    passive: { type: 'element_dmg_bonus', element: 'fire', value: 0.08 },
    desc: '注入火元素力量的弯刀，攻击附带灼烧。'
  },
  wpn_sr_crystal_staff: {
    id: 'wpn_sr_crystal_staff', name: '水晶法杖', slot: 'weapon', rarity: 'sr',
    baseStats: { atk: 28, hp: 150 }, maxLevel: 20,
    passive: { type: 'heal_bonus', value: 0.10 },
    desc: '镶嵌水元素水晶的法杖，强化治愈效果。'
  },
  wpn_sr_metal_greatsword: {
    id: 'wpn_sr_metal_greatsword', name: '金纹大剑', slot: 'weapon', rarity: 'sr',
    baseStats: { atk: 40, def: 8 }, maxLevel: 20,
    passive: { type: 'element_dmg_bonus', element: 'metal', value: 0.08 },
    desc: '铭刻金元素符文的重剑，坚不可摧。'
  },
  wpn_sr_vine_bow: {
    id: 'wpn_sr_vine_bow', name: '灵藤弓', slot: 'weapon', rarity: 'sr',
    baseStats: { atk: 32, spd: 12 }, maxLevel: 20,
    passive: { type: 'element_dmg_bonus', element: 'wood', value: 0.08 },
    desc: '以千年灵藤为弦的长弓，箭矢蕴含木元素生机。'
  },
  wpn_sr_earth_hammer: {
    id: 'wpn_sr_earth_hammer', name: '岩锤', slot: 'weapon', rarity: 'sr',
    baseStats: { atk: 38, def: 12, hp: 100 }, maxLevel: 20,
    passive: { type: 'element_dmg_bonus', element: 'earth', value: 0.08 },
    desc: '以山岩铸就的巨锤，每一击都撼动大地。'
  },
  // SSR 武器
  wpn_ssr_stellar_blade: {
    id: 'wpn_ssr_stellar_blade', name: '星辰之刃', slot: 'weapon', rarity: 'ssr',
    baseStats: { atk: 65, crit: 8, critDmg: 15 }, maxLevel: 30,
    passive: { type: 'burst_dmg_bonus', value: 0.20 },
    desc: '传说中以陨铁锻造的神兵，蕴含星辰之力。'
  },
  wpn_ssr_abyss_tome: {
    id: 'wpn_ssr_abyss_tome', name: '深渊魔典', slot: 'weapon', rarity: 'ssr',
    baseStats: { atk: 55, hp: 300, spd: 8 }, maxLevel: 30,
    passive: { type: 'elemental_energy_regen', value: 0.15 },
    desc: '记载着远古禁忌知识的神秘典籍。'
  },
  wpn_ssr_dawn_lance: {
    id: 'wpn_ssr_dawn_lance', name: '曙光圣枪', slot: 'weapon', rarity: 'ssr',
    baseStats: { atk: 60, def: 15, hp: 200 }, maxLevel: 30,
    passive: { type: 'resonance_skill_bonus', value: 0.15 },
    desc: '光之圣女传承的圣枪，能驱散一切黑暗。'
  },

  // --- 护甲类 (armor) ---
  // R 护甲
  arm_r_leather: {
    id: 'arm_r_leather', name: '皮甲', slot: 'armor', rarity: 'r',
    baseStats: { def: 10, hp: 80 }, maxLevel: 10,
    desc: '简易皮质护甲。'
  },
  arm_r_robe: {
    id: 'arm_r_robe', name: '布衣', slot: 'armor', rarity: 'r',
    baseStats: { def: 5, hp: 120 }, maxLevel: 10,
    desc: '普通的旅者布衣。'
  },
  // SR 护甲
  arm_sr_flame_robe: {
    id: 'arm_sr_flame_robe', name: '焰纹法袍', slot: 'armor', rarity: 'sr',
    baseStats: { def: 18, hp: 250, spd: 5 }, maxLevel: 20,
    passive: { type: 'element_resist', element: 'fire', value: 0.12 },
    desc: '以火元素丝线编织的法袍，抵御火焰伤害。'
  },
  arm_sr_crystal_mail: {
    id: 'arm_sr_crystal_mail', name: '水晶轻甲', slot: 'armor', rarity: 'sr',
    baseStats: { def: 25, hp: 350 }, maxLevel: 20,
    passive: { type: 'element_resist', element: 'water', value: 0.12 },
    desc: '水晶碎片镶嵌的轻甲，坚固而灵活。'
  },
  arm_sr_metal_plate: {
    id: 'arm_sr_metal_plate', name: '金纹战甲', slot: 'armor', rarity: 'sr',
    baseStats: { def: 35, hp: 500 }, maxLevel: 20,
    passive: { type: 'damage_reduction', value: 0.05 },
    desc: '金元素加持的重型战甲，大幅减免伤害。'
  },
  // SSR 护甲
  arm_ssr_shadow_cloak: {
    id: 'arm_ssr_shadow_cloak', name: '暗影斗篷', slot: 'armor', rarity: 'ssr',
    baseStats: { def: 40, hp: 600, spd: 15 }, maxLevel: 30,
    passive: { type: 'dodge_chance', value: 0.08 },
    desc: '暗影织就的神秘斗篷，有概率完全闪避攻击。'
  },
  arm_ssr_dawn_aegis: {
    id: 'arm_ssr_dawn_aegis', name: '曙光之壁', slot: 'armor', rarity: 'ssr',
    baseStats: { def: 55, hp: 800 }, maxLevel: 30,
    passive: { type: 'shield_on_battle_start', value: 0.15 },
    desc: '传说中光之文明的至高防具，战斗开始自动展开光盾。'
  },

  // --- 饰品类 (accessory) ---
  // R 饰品
  acc_r_ring_1: {
    id: 'acc_r_ring_1', name: '铜戒指', slot: 'accessory', rarity: 'r',
    baseStats: { hp: 100 }, maxLevel: 10,
    desc: '普通的铜制戒指。'
  },
  acc_r_amulet_1: {
    id: 'acc_r_amulet_1', name: '护身符', slot: 'accessory', rarity: 'r',
    baseStats: { def: 8, hp: 60 }, maxLevel: 10,
    desc: '简易的旅行护身符。'
  },
  // SR 饰品
  acc_sr_fire_gem: {
    id: 'acc_sr_fire_gem', name: '火焰宝石', slot: 'accessory', rarity: 'sr',
    baseStats: { atk: 20, crit: 4 }, maxLevel: 20,
    passive: { type: 'element_dmg_bonus', element: 'fire', value: 0.10 },
    desc: '炽热的火元素宝石，增幅火焰之力。'
  },
  acc_sr_water_pearl: {
    id: 'acc_sr_water_pearl', name: '沧海珠', slot: 'accessory', rarity: 'sr',
    baseStats: { hp: 300, def: 10 }, maxLevel: 20,
    passive: { type: 'heal_received_bonus', value: 0.10 },
    desc: '深海孕育的珍珠，提升受治疗效果。'
  },
  acc_sr_wind_boots: {
    id: 'acc_sr_wind_boots', name: '疾风靴', slot: 'accessory', rarity: 'sr',
    baseStats: { spd: 20, atk: 10 }, maxLevel: 20,
    passive: { type: 'initiative_bonus', value: 15 },
    desc: '风元素附魔的轻靴，战斗开始抢先行动。'
  },
  acc_sr_earth_belt: {
    id: 'acc_sr_earth_belt', name: '大地腰带', slot: 'accessory', rarity: 'sr',
    baseStats: { def: 20, hp: 400 }, maxLevel: 20,
    passive: { type: 'damage_reduction', value: 0.06 },
    desc: '以山岩精华编织的腰带，坚如磐石。'
  },
  // SSR 饰品
  acc_ssr_fate_ring: {
    id: 'acc_ssr_fate_ring', name: '命运之环', slot: 'accessory', rarity: 'ssr',
    baseStats: { atk: 30, crit: 10, hp: 300 }, maxLevel: 30,
    passive: { type: 'crit_dmg_bonus', value: 25 },
    desc: '传说能改写命运的戒指，暴击伤害大幅提升。'
  },
  acc_ssr_resonance_orb: {
    id: 'acc_ssr_resonance_orb', name: '共鸣宝珠', slot: 'accessory', rarity: 'ssr',
    baseStats: { atk: 25, hp: 400, spd: 10 }, maxLevel: 30,
    passive: { type: 'resonance_tier_bonus', value: 1 },
    desc: '强化元素共鸣的宝珠，共鸣效果提升一个等级。'
  }
};

// ============ 装备槽位定义 ============
const EquipmentSlots = {
  weapon:    { name: '武器', icon: '⚔️', statPriority: ['atk', 'crit', 'critDmg'] },
  armor:     { name: '护甲', icon: '🛡️', statPriority: ['def', 'hp'] },
  accessory: { name: '饰品', icon: '💎', statPriority: ['hp', 'atk', 'spd'] }
};

// ============ 稀有度配置 ============
const EquipRarity = {
  r:    { name: 'R',    color: '#8899aa', levelGrowth: 1.0, enhanceCost: 500 },
  sr:   { name: 'SR',   color: '#b388ff', levelGrowth: 1.5, enhanceCost: 1200 },
  ssr:  { name: 'SSR',  color: '#ffd700', levelGrowth: 2.0, enhanceCost: 3000 }
};

// ============ 装备管理器 ============
class EquipmentManager {
  constructor() {
    // 玩家拥有的装备实例
    // 每个实例: { uid, id, level, equippedTo (角色id | null) }
    this.inventory = [];
    this._nextUid = 1;
  }

  // === 存档接口 ===
  exportData() {
    return {
      inventory: this.inventory,
      nextUid: this._nextUid
    };
  }

  importData(data) {
    if (!data) return;
    this.inventory = data.inventory || [];
    this._nextUid = data.nextUid || this.inventory.length + 1;
  }

  // === 装备获取 ===
  addEquipment(defId) {
    const def = EquipmentDefs[defId];
    if (!def) {
      console.warn('[Equipment] 未知装备定义:', defId);
      return null;
    }
    const instance = {
      uid: this._nextUid++,
      id: defId,
      level: 1,
      equippedTo: null
    };
    this.inventory.push(instance);
    return instance;
  }

  removeEquipment(uid) {
    const idx = this.inventory.findIndex(e => e.uid === uid);
    if (idx === -1) return false;
    this.inventory.splice(idx, 1);
    return true;
  }

  // === 装备穿戴 ===
  equip(charId, equipUid) {
    const instance = this.inventory.find(e => e.uid === equipUid);
    if (!instance) return { success: false, error: '装备不存在' };

    const def = EquipmentDefs[instance.id];
    if (!def) return { success: false, error: '装备定义不存在' };

    // 如果装备已经穿在别人身上，先脱下
    if (instance.equippedTo) {
      instance.equippedTo = null;
    }

    // 检查角色是否已在该槽位穿戴了装备
    const existingEquip = this.inventory.find(
      e => e.equippedTo === charId && EquipmentDefs[e.id]?.slot === def.slot
    );
    if (existingEquip) {
      existingEquip.equippedTo = null;
    }

    instance.equippedTo = charId;
    return { success: true, swappedOut: existingEquip?.uid || null };
  }

  unequip(charId, slot) {
    const instance = this.inventory.find(
      e => e.equippedTo === charId && EquipmentDefs[e.id]?.slot === slot
    );
    if (!instance) return false;
    instance.equippedTo = null;
    return true;
  }

  unequipAll(charId) {
    const equipped = this.inventory.filter(e => e.equippedTo === charId);
    equipped.forEach(e => e.equippedTo = null);
    return equipped.length;
  }

  // === 获取角色装备 ===
  getCharacterEquipment(charId) {
    const result = {};
    for (const slot of Object.keys(EquipmentSlots)) {
      const equip = this.inventory.find(
        e => e.equippedTo === charId && EquipmentDefs[e.id]?.slot === slot
      );
      result[slot] = equip || null;
    }
    return result;
  }

  getEquippedBySlot(charId, slot) {
    return this.inventory.find(
      e => e.equippedTo === charId && EquipmentDefs[e.id]?.slot === slot
    ) || null;
  }

  // === 强化 ===
  enhance(equipUid) {
    const instance = this.inventory.find(e => e.uid === equipUid);
    if (!instance) return { success: false, error: '装备不存在' };

    const def = EquipmentDefs[instance.id];
    if (!def) return { success: false, error: '装备定义不存在' };

    if (instance.level >= def.maxLevel) {
      return { success: false, error: '已达最大等级' };
    }

    const cost = this._getEnhanceCost(instance);
    const state = window.game?.state;
    if (!state || (state.currency?.coins || 0) < cost) {
      return { success: false, error: '金币不足', cost };
    }

    state.currency.coins -= cost;
    instance.level++;

    return {
      success: true,
      newLevel: instance.level,
      stats: this._calculateStats(instance)
    };
  }

  _getEnhanceCost(instance) {
    const def = EquipmentDefs[instance.id];
    const rarityConf = EquipRarity[def.rarity];
    return Math.floor(rarityConf.enhanceCost * (1 + instance.level * 0.3));
  }

  // === 属性计算 ===
  _calculateStats(instance) {
    const def = EquipmentDefs[instance.id];
    if (!def) return {};

    const growthRate = EquipRarity[def.rarity].levelGrowth;
    const stats = {};

    for (const [key, baseValue] of Object.entries(def.baseStats)) {
      stats[key] = Math.floor(baseValue * (1 + (instance.level - 1) * 0.05 * growthRate));
    }

    return stats;
  }

  // 获取角色所有装备的总属性加成
  getTotalBonus(charId) {
    const bonus = { atk: 0, def: 0, hp: 0, spd: 0, crit: 0, critDmg: 0 };
    const passives = [];

    const equipped = this.inventory.filter(e => e.equippedTo === charId);
    for (const instance of equipped) {
      const stats = this._calculateStats(instance);
      for (const [key, value] of Object.entries(stats)) {
        if (bonus.hasOwnProperty(key)) {
          bonus[key] += value;
        }
      }

      const def = EquipmentDefs[instance.id];
      if (def?.passive) {
        passives.push({ ...def.passive, source: def.name });
      }
    }

    return { stats: bonus, passives };
  }

  // === 分解 ===
  salvage(equipUid) {
    const instance = this.inventory.find(e => e.uid === equipUid);
    if (!instance) return { success: false, error: '装备不存在' };

    if (instance.equippedTo) {
      return { success: false, error: '请先卸下装备' };
    }

    const def = EquipmentDefs[instance.id];
    const rarityConf = EquipRarity[def.rarity];
    const coins = Math.floor(rarityConf.enhanceCost * instance.level * 0.5);

    this.removeEquipment(equipUid);
    return { success: true, coins };
  }

  // === 掉落表 ===
  static getStageDrops(stageType, difficulty = 1) {
    // stageType: 'farm' | 'daily' | 'story' | 'boss'
    const dropTable = {
      farm: {
        r: 0.40, sr: 0.08, ssr: 0.005
      },
      daily: {
        r: 0.50, sr: 0.15, ssr: 0.02
      },
      story: {
        r: 0.30, sr: 0.12, ssr: 0.01
      },
      boss: {
        r: 0.60, sr: 0.25, ssr: 0.05
      }
    };

    const rates = dropTable[stageType] || dropTable.farm;
    // 难度修正
    const adjusted = {
      r: Math.min(0.8, rates.r + difficulty * 0.02),
      sr: Math.min(0.4, rates.sr + difficulty * 0.02),
      ssr: Math.min(0.1, rates.ssr + difficulty * 0.005)
    };

    return adjusted;
  }

  // 根据稀有度随机获取一件装备
  static rollEquipment(rarity) {
    const candidates = Object.values(EquipmentDefs).filter(d => d.rarity === rarity);
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)].id;
  }

  // 根据关卡类型生成掉落
  static generateDrops(stageType, difficulty = 1) {
    const drops = [];
    const rates = this.getStageDrops(stageType, difficulty);
    const maxDrops = stageType === 'boss' ? 3 : 2;

    for (let i = 0; i < maxDrops; i++) {
      const roll = Math.random();
      let rarity = null;

      if (roll < rates.ssr) rarity = 'ssr';
      else if (roll < rates.ssr + rates.sr) rarity = 'sr';
      else if (roll < rates.ssr + rates.sr + rates.r) rarity = 'r';

      if (rarity) {
        const defId = this.rollEquipment(rarity);
        if (defId) drops.push(defId);
      }
    }

    return drops;
  }

  // === 查询 ===
  getInventoryBySlot(slot) {
    return this.inventory
      .filter(e => EquipmentDefs[e.id]?.slot === slot)
      .sort((a, b) => {
        const ra = EquipmentDefs[a.id]?.rarity || 'r';
        const rb = EquipmentDefs[b.id]?.rarity || 'r';
        const rarityOrder = { ssr: 3, sr: 2, r: 1 };
        return (rarityOrder[rb] || 0) - (rarityOrder[ra] || 0) || b.level - a.level;
      });
  }

  getUnequipped() {
    return this.inventory.filter(e => !e.equippedTo);
  }

  getEquippedCount() {
    return this.inventory.filter(e => e.equippedTo).length;
  }

  get totalCount() {
    return this.inventory.length;
  }
}

// ============ 装备属性应用到战斗 ============
// 供 battle.js 调用，将装备属性叠加到角色基础属性上
function applyEquipmentStats(charData, charId) {
  if (!window.equipmentManager) return charData;

  const bonus = window.equipmentManager.getTotalBonus(charId);
  const result = { ...charData };

  // 基础属性叠加
  if (bonus.stats.atk) result.atk = (result.atk || 0) + bonus.stats.atk;
  if (bonus.stats.def) result.def = (result.def || 0) + bonus.stats.def;
  if (bonus.stats.hp) result.maxHp = (result.maxHp || 0) + bonus.stats.hp;
  if (result.currentHp !== undefined) {
    result.currentHp = Math.min(result.currentHp, result.maxHp);
  }
  if (bonus.stats.spd) result.spd = (result.spd || 0) + bonus.stats.spd;
  if (bonus.stats.crit) result.crit = (result.crit || 0) + bonus.stats.crit;
  if (bonus.stats.critDmg) result.critDmg = (result.critDmg || 0) + bonus.stats.critDmg;

  // 记录被动效果（供战斗系统读取）
  result.equipmentPassives = bonus.passives;

  return result;
}

// ============ 装备场景（UI渲染在 ui.js 中） ============
// 提供场景名常量
const EquipmentSceneName = 'equipment';
