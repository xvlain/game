/**
 * battle.js - 回合制战斗系统
 * 速度条驱动，四人编队，大招不插队
 * 含共鸣系统 + 元素力系统
 * v0.19.0 - 战斗速度倍率集成 + 命中顿帧(hit-stop)效果
 */

// ============ 元素系统（五行：金木水火土） ============
const ElementSystem = {
  types: ['metal', 'wood', 'water', 'fire', 'earth'],
  names: { metal: '金', wood: '木', water: '水', fire: '火', earth: '土', none: '无' },
  colors: {
    metal: '#d4af37',
    wood: '#4caf50',
    water: '#2196f3',
    fire: '#ff6633',
    earth: '#c8a86e',
    none: '#999999'
  },

  // 金→木→土→水→火→金 循环克制
  advantage: {
    metal: 'wood',
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal'
  },

  getAdvantageMultiplier(atkElement, defElement) {
    if (!atkElement || !defElement || atkElement === 'none' || defElement === 'none') return 1.0;
    if (this.advantage[atkElement] === defElement) return 1.2;
    if (this.advantage[defElement] === atkElement) return 0.85;
    return 1.0;
  }
};

// ============ 共鸣系统 ============
const ResonanceSystem = {
  calculate(party) {
    const alive = party.filter(c => c.currentHp > 0);
    const elementCount = {};

    for (const char of alive) {
      const el = char.element || 'none';
      if (el === 'none') continue;
      elementCount[el] = (elementCount[el] || 0) + 1;
    }

    const resonances = [];
    for (const [element, count] of Object.entries(elementCount)) {
      if (count >= 4) {
        resonances.push({ element, tier: 2, count, name: `${ElementSystem.names[element]}之共鸣·二阶` });
      } else if (count >= 2) {
        resonances.push({ element, tier: 1, count, name: `${ElementSystem.names[element]}之共鸣·一阶` });
      }
    }

    resonances.sort((a, b) => b.tier - a.tier || b.count - a.count);
    return resonances.slice(0, 2);
  },

  getBuffs(resonances) {
    const buffs = [];
    for (const res of resonances) {
      if (res.tier === 1) {
        buffs.push({
          type: 'resonance_atk',
          element: res.element,
          value: 0.10,
          energyRegen: 0.15,
          desc: `${res.name}：同元素角色攻击力+10%，元素力回复+15%`
        });
      } else if (res.tier === 2) {
        buffs.push({
          type: 'resonance_atk',
          element: res.element,
          value: 0.25,
          energyRegen: 0.30,
          empowerResonanceSkill: true,
          desc: `${res.name}：攻击力+25%，元素力回复+30%，共鸣技强化`
        });
      }
    }
    return buffs;
  },

  charHasResonance(char, resonance) {
    return char.element === resonance.element && char.currentHp > 0;
  },

  // 获取角色可用的共鸣技能等级（0=不可用, 1=一阶, 2=二阶强化）
  getResonanceTier(char, resonances) {
    for (const res of resonances) {
      if (this.charHasResonance(char, res)) {
        return res.tier;
      }
    }
    return 0;
  }
};

// ============ 元素力系统 ============
const ElementalForceSystem = {
  maxForce: 100,
  normalRecovery: 15,
  skillCost: 25,
  resonanceSkillCostT1: 30,
  resonanceSkillCostT2: 45,

  addForce(char, amount) {
    char.elementalForce = Math.min(this.maxForce, (char.elementalForce || 0) + amount);
  },

  spendForce(char, amount) {
    if ((char.elementalForce || 0) < amount) return false;
    char.elementalForce -= amount;
    return true;
  },

  canUse(char, cost) {
    return (char.elementalForce || 0) >= cost;
  }
};

// ============ 角色数据定义 ============
const CharacterStats = {
  templates: {
    warrior: {
      id: 'warrior_01', name: '示例·战士', role: '输出', element: 'fire',
      hp: 1200, atk: 180, def: 80, spd: 100,
      crit_rate: 0.15, crit_dmg: 1.5,
      skills: {
        normal: { name: '斩击', type: 'single', multiplier: 1.0, desc: '对单体造成攻击力100%的伤害' },
        skill: { name: '烈焰斩', type: 'aoe', multiplier: 0.8, energyCost: 30, desc: '对全体造成攻击力80%的火属性伤害' },
        resonance: { name: '焚天共鸣', type: 'single', multiplier: 1.8, desc: '消耗元素力释放的共鸣技' },
        ultimate: { name: '焚天之怒', type: 'single', multiplier: 3.0, energyCost: 100, desc: '对单体造成攻击力300%的火属性伤害' }
      }
    },
    mage: {
      id: 'mage_01', name: '示例·法师', role: '输出', element: 'water',
      hp: 900, atk: 220, def: 60, spd: 95,
      crit_rate: 0.20, crit_dmg: 1.5,
      skills: {
        normal: { name: '水刺', type: 'single', multiplier: 1.0, desc: '对单体造成攻击力100%的水属性伤害' },
        skill: { name: '洪流', type: 'aoe', multiplier: 0.7, energyCost: 35, desc: '对全体造成攻击力70%的水属性伤害' },
        resonance: { name: '洪流共鸣', type: 'aoe', multiplier: 1.2, desc: '消耗元素力释放的共鸣技' },
        ultimate: { name: '汪洋大海', type: 'aoe', multiplier: 2.5, energyCost: 100, desc: '对全体造成攻击力250%的水属性伤害' }
      }
    },
    healer: {
      id: 'healer_01', name: '示例·治疗', role: '治疗', element: 'wood',
      hp: 1100, atk: 120, def: 100, spd: 105,
      crit_rate: 0.05, crit_dmg: 1.5,
      skills: {
        normal: { name: '藤鞭', type: 'single', multiplier: 0.8, desc: '对单体造成攻击力80%的伤害' },
        skill: { name: '生命之藤', type: 'heal_ally', multiplier: 1.5, energyCost: 25, desc: '治疗全体友方，治疗量=攻击力×150%' },
        resonance: { name: '复苏共鸣', type: 'heal_ally', multiplier: 2.0, desc: '消耗元素力释放的共鸣治疗' },
        ultimate: { name: '万物复苏', type: 'heal_ally', multiplier: 3.0, energyCost: 100, desc: '大量治疗全体友方并清除负面状态' }
      }
    },
    tank: {
      id: 'tank_01', name: '示例·守护', role: '坦克', element: 'earth',
      hp: 1800, atk: 100, def: 150, spd: 85,
      crit_rate: 0.05, crit_dmg: 1.5,
      skills: {
        normal: { name: '盾击', type: 'single', multiplier: 0.9, desc: '对单体造成攻击力90%的伤害' },
        skill: { name: '铁壁', type: 'buff_self', multiplier: 0, energyCost: 20, desc: '提升自身防御力50%，持续2回合' },
        resonance: { name: '磐石共鸣', type: 'buff_party', multiplier: 0, desc: '消耗元素力为全体增防' },
        ultimate: { name: '绝对防御', type: 'buff_party', multiplier: 0, energyCost: 100, desc: '全体友方减伤30%，持续2回合' }
      }
    },

    // ===== v0.18.0 新增角色 =====

    // 金元素 - 坦克/辅助（填补五行体系空缺）
    guard: {
      id: 'guard_01', name: '示例·金卫', role: '坦克', element: 'metal',
      hp: 1600, atk: 130, def: 140, spd: 90,
      crit_rate: 0.08, crit_dmg: 1.5,
      skills: {
        normal: { name: '金刃', type: 'single', multiplier: 1.0, desc: '对单体造成攻击力100%的金属性伤害' },
        skill: { name: '金钟罩', type: 'buff_party', multiplier: 0, energyCost: 25, desc: '为全体友方施加金甲护盾，吸收伤害=防御力×200%，持续2回合' },
        resonance: { name: '金刚共鸣', type: 'single', multiplier: 1.6, desc: '消耗元素力释放的共鸣技，破甲效果降低目标防御20%' },
        ultimate: { name: '天罚圣盾', type: 'buff_party', multiplier: 0, energyCost: 100, desc: '全体友方获得反弹护盾（受到伤害的30%反弹给攻击者），持续2回合' }
      }
    },

    // SSR 角色完整战斗数据
    ssr_lilith: {
      id: 'ssr_01', name: '星辰·莉莉丝', role: '输出', element: 'water',
      hp: 1100, atk: 260, def: 70, spd: 105,
      crit_rate: 0.25, crit_dmg: 1.8,
      skills: {
        normal: { name: '星潮', type: 'single', multiplier: 1.1, desc: '对单体造成攻击力110%的水属性伤害' },
        skill: { name: '银河倾泻', type: 'aoe', multiplier: 0.9, energyCost: 30, desc: '对全体造成攻击力90%的水属性伤害，30%概率冰冻' },
        resonance: { name: '星海共鸣', type: 'aoe', multiplier: 1.5, desc: '消耗元素力释放的共鸣技，对全体造成大量伤害' },
        ultimate: { name: '星辰陨落', type: 'aoe', multiplier: 3.2, energyCost: 100, desc: '召唤星辰之力，对全体造成攻击力320%的水属性伤害' }
      }
    },

    ssr_yan: {
      id: 'ssr_02', name: '炎帝·焰', role: '输出', element: 'fire',
      hp: 1050, atk: 280, def: 60, spd: 110,
      crit_rate: 0.30, crit_dmg: 2.0,
      skills: {
        normal: { name: '灼拳', type: 'single', multiplier: 1.1, desc: '对单体造成攻击力110%的火属性伤害' },
        skill: { name: '炼狱火海', type: 'aoe', multiplier: 0.85, energyCost: 30, desc: '对全体造成攻击力85%的火属性伤害，附带灼烧（每回合损失5%HP，2回合）' },
        resonance: { name: '炎帝共鸣', type: 'single', multiplier: 2.0, desc: '消耗元素力释放的共鸣技，超高单体爆发' },
        ultimate: { name: '红莲天照', type: 'single', multiplier: 4.0, energyCost: 100, desc: '对单体造成攻击力400%的火属性伤害，击杀后额外行动一次' }
      }
    },

    ssr_lein: {
      id: 'ssr_03', name: '天罚·雷恩', role: '输出', element: 'metal',
      hp: 1200, atk: 250, def: 90, spd: 100,
      crit_rate: 0.22, crit_dmg: 1.7,
      skills: {
        normal: { name: '雷刃', type: 'single', multiplier: 1.1, desc: '对单体造成攻击力110%的金属性伤害' },
        skill: { name: '天罚裁决', type: 'single', multiplier: 1.6, energyCost: 30, desc: '对单体造成攻击力160%的金属性伤害，无视目标20%防御' },
        resonance: { name: '天罚共鸣', type: 'aoe', multiplier: 1.3, desc: '消耗元素力释放的共鸣技，对全体附带破甲效果' },
        ultimate: { name: '万剑归宗', type: 'aoe', multiplier: 3.0, energyCost: 100, desc: '召唤万剑，对全体造成攻击力300%的金属性伤害，降低目标防御15%' }
      }
    },

    // SR 角色完整战斗数据（补充抽卡池）
    sr_aileen: {
      id: 'sr_01', name: '翠风·艾琳', role: '治疗', element: 'wood',
      hp: 1000, atk: 140, def: 90, spd: 100,
      crit_rate: 0.08, crit_dmg: 1.5,
      skills: {
        normal: { name: '叶刃', type: 'single', multiplier: 0.85, desc: '对单体造成攻击力85%的木属性伤害' },
        skill: { name: '翠风治愈', type: 'heal_ally', multiplier: 1.3, energyCost: 25, desc: '治疗全体友方，治疗量=攻击力×130%' },
        resonance: { name: '翠风共鸣', type: 'heal_ally', multiplier: 1.8, desc: '消耗元素力释放的共鸣治疗' },
        ultimate: { name: '自然之恩', type: 'heal_ally', multiplier: 2.8, energyCost: 100, desc: '大量治疗全体友方并回复20%元素力' }
      }
    },

    sr_gordon: {
      id: 'sr_02', name: '岩壁·戈登', role: '坦克', element: 'earth',
      hp: 1700, atk: 110, def: 135, spd: 80,
      crit_rate: 0.05, crit_dmg: 1.5,
      skills: {
        normal: { name: '岩石投掷', type: 'single', multiplier: 0.9, desc: '对单体造成攻击力90%的土属性伤害' },
        skill: { name: '岩壁守护', type: 'buff_party', multiplier: 0, energyCost: 20, desc: '为全体友方施加护盾，吸收伤害=防御力×150%' },
        resonance: { name: '岩壁共鸣', type: 'buff_party', multiplier: 0, desc: '消耗元素力强化全体防御' },
        ultimate: { name: '大地之墙', type: 'buff_party', multiplier: 0, energyCost: 100, desc: '全体友方减伤40%，持续2回合，并回复10%HP' }
      }
    },

    sr_marco: {
      id: 'sr_03', name: '赤炎·马可', role: '输出', element: 'fire',
      hp: 950, atk: 200, def: 65, spd: 105,
      crit_rate: 0.18, crit_dmg: 1.6,
      skills: {
        normal: { name: '火拳', type: 'single', multiplier: 1.0, desc: '对单体造成攻击力100%的火属性伤害' },
        skill: { name: '烈焰连击', type: 'single', multiplier: 1.5, energyCost: 25, desc: '对单体造成2次攻击力75%的火属性伤害' },
        resonance: { name: '赤炎共鸣', type: 'single', multiplier: 1.8, desc: '消耗元素力释放的共鸣技' },
        ultimate: { name: '凤凰涅槃', type: 'aoe', multiplier: 2.5, energyCost: 100, desc: '对全体造成攻击力250%的火属性伤害，自身回复20%HP' }
      }
    },

    sr_anna: {
      id: 'sr_04', name: '冰霜·安娜', role: '辅助', element: 'water',
      hp: 1050, atk: 160, def: 85, spd: 95,
      crit_rate: 0.12, crit_dmg: 1.5,
      skills: {
        normal: { name: '冰刺', type: 'single', multiplier: 0.95, desc: '对单体造成攻击力95%的水属性伤害' },
        skill: { name: '霜冻领域', type: 'debuff_enemy', multiplier: 0.6, energyCost: 25, desc: '对全体造成攻击力60%的水属性伤害，降低速度20%持续2回合' },
        resonance: { name: '冰霜共鸣', type: 'debuff_enemy', multiplier: 0.8, desc: '消耗元素力释放的共鸣技，大幅降低敌方攻击' },
        ultimate: { name: '极冻冰棺', type: 'single', multiplier: 2.2, energyCost: 100, desc: '对单体造成攻击力220%的水属性伤害，50%概率冰冻1回合' }
      }
    },

    // v0.18.0 新增 SR 角色
    sr_jinwu: {
      id: 'sr_05', name: '金乌·辰', role: '输出', element: 'metal',
      hp: 1000, atk: 190, def: 80, spd: 100,
      crit_rate: 0.18, crit_dmg: 1.6,
      skills: {
        normal: { name: '金刃斩', type: 'single', multiplier: 1.0, desc: '对单体造成攻击力100%的金属性伤害' },
        skill: { name: '金乌烈焰', type: 'single', multiplier: 1.4, energyCost: 25, desc: '对单体造成攻击力140%的金属性伤害，降低目标防御10%' },
        resonance: { name: '金乌共鸣', type: 'aoe', multiplier: 1.1, desc: '消耗元素力释放的共鸣技' },
        ultimate: { name: '日轮天照', type: 'aoe', multiplier: 2.8, energyCost: 100, desc: '召唤金乌之力，对全体造成攻击力280%的金属性伤害' }
      }
    },

    sr_lingmu: {
      id: 'sr_06', name: '灵木·苏', role: '辅助', element: 'wood',
      hp: 1100, atk: 130, def: 95, spd: 95,
      crit_rate: 0.08, crit_dmg: 1.5,
      skills: {
        normal: { name: '藤蔓抽击', type: 'single', multiplier: 0.85, desc: '对单体造成攻击力85%的木属性伤害' },
        skill: { name: '灵木滋养', type: 'heal_single', multiplier: 2.0, energyCost: 20, desc: '治疗HP最低的友方，治疗量=攻击力×200%' },
        resonance: { name: '灵木共鸣', type: 'heal_ally', multiplier: 1.5, desc: '消耗元素力释放的共鸣治疗，并增加元素力回复' },
        ultimate: { name: '万木回春', type: 'heal_ally', multiplier: 2.5, energyCost: 100, desc: '全体友方回复大量HP并增加20%攻击力，持续2回合' }
      }
    }
  },

  create(templateId, level = 1) {
    const tpl = this.templates[templateId];
    if (!tpl) return null;

    const levelMult = 1 + (level - 1) * 0.08;
    return {
      ...JSON.parse(JSON.stringify(tpl)),
      level,
      currentHp: Math.floor(tpl.hp * levelMult),
      maxHp: Math.floor(tpl.hp * levelMult),
      currentEnergy: 0,
      maxEnergy: 100,
      elementalForce: 0,
      baseAtk: Math.floor(tpl.atk * levelMult),
      baseDef: Math.floor(tpl.def * levelMult),
      baseSpd: tpl.spd,
      buffs: [],
      debuffs: [],
      actionValue: 0
    };
  }
};

// ============ 战斗引擎 ============
class BattleEngine {
  constructor() {
    this.state = 'idle';
    this.party = [];
    this.enemies = [];
    this.turnOrder = [];
    this.currentActor = null;
    this.currentActionIndex = 0;
    this.turnCount = 0;
    this.battleLog = [];
    this.onStateChange = null;
    this.onActionComplete = null;
    this.onBattleEnd = null;
    this.animationQueue = [];
    // v0.13.0 连击链管理器
    this.chainManager = (typeof BattleChainManager !== 'undefined') ? new BattleChainManager() : null;
    this.critCount = 0;   // 本场暴击次数
    this.comboCount = 0;  // 本场连击链次数
    // v0.19.0 战斗速度 & 命中顿帧
    this.speedMultiplier = 1;       // 战斗速度倍率（1 / 1.5 / 2）
    this.hitStopSignal = null;      // 命中顿帧信号 { duration, type }
  }

  init(partyTemplates, enemyConfigs) {
    this.party = partyTemplates.map(t => {
      const char = CharacterStats.create(t.id, t.level || 1);
      char.isEnemy = false;
      char.team = 'player';
      return char;
    });

    this.enemies = enemyConfigs.map((e, i) => ({
      id: e.id || `enemy_${i}`,
      name: e.name,
      element: e.element || 'none',
      level: e.level || 1,
      hp: e.hp, maxHp: e.hp, currentHp: e.hp,
      atk: e.atk, def: e.def, spd: e.spd || 90,
      crit_rate: e.crit_rate || 0.05, crit_dmg: e.crit_dmg || 1.5,
      currentEnergy: 0, maxEnergy: 100, elementalForce: 0,
      actionValue: 0,
      buffs: [], debuffs: [],
      isEnemy: true, team: 'enemy',
      skills: e.skills || this._defaultEnemySkills()
    }));

    this._updateResonance();
    this.state = 'starting';
    this.turnCount = 0;
    this.battleLog = [];
    this._log('战斗开始！');

    if (this.resonances && this.resonances.length > 0) {
      for (const res of this.resonances) {
        this._log(`✦ 触发 ${res.name}`);
      }
    }
  }

  _updateResonance() {
    this.resonances = ResonanceSystem.calculate(this.party);
    this.resonanceBuffs = ResonanceSystem.getBuffs(this.resonances);
  }

  _defaultEnemySkills() {
    return {
      normal: { name: '攻击', type: 'single', multiplier: 1.0 },
      skill: { name: '强击', type: 'single', multiplier: 1.5, energyCost: 30 },
      ultimate: { name: '致命一击', type: 'single', multiplier: 2.5, energyCost: 100 }
    };
  }

  startBattle() {
    this.state = 'running';
    this.critCount = 0;
    this.comboCount = 0;
    if (this.chainManager) this.chainManager.initBattle();
    this._nextTurn();
  }

  _nextTurn() {
    const allCombatants = [...this.party.filter(c => c.currentHp > 0), ...this.enemies.filter(c => c.currentHp > 0)];
    if (allCombatants.length === 0) return;

    let nextActor = null;
    let minTurns = Infinity;

    for (const c of allCombatants) {
      const turnsNeeded = Math.ceil((100 - c.actionValue) / c.spd);
      if (turnsNeeded < minTurns || (turnsNeeded === minTurns && c.spd > (nextActor?.spd || 0))) {
        minTurns = turnsNeeded;
        nextActor = c;
      }
    }

    for (const c of allCombatants) {
      c.actionValue += c.spd * minTurns;
    }

    nextActor.actionValue = 0;
    this.currentActor = nextActor;
    this.turnCount++;

    // v0.13.0 眩晕检测：被眩晕的角色跳过回合
    const isStunned = nextActor.debuffs && nextActor.debuffs.some(d => d.type === 'stun' && d.turns > 0);
    if (isStunned) {
      this._log(`💫 ${nextActor.name} 处于眩晕状态，跳过回合`);
      // 移除一层眩晕
      nextActor.debuffs = nextActor.debuffs.map(d => {
        if (d.type === 'stun') return { ...d, turns: d.turns - 1 };
        return d;
      }).filter(d => d.turns > 0);
      // 直接跳到下一个角色（v0.19.0 应用速度倍率）
      setTimeout(() => this._nextTurn(), Math.floor(400 / this.speedMultiplier));
      if (this.onStateChange) this.onStateChange('stunned', nextActor);
      return;
    }

    if (nextActor.team === 'player') {
      this.state = 'player_turn';
      this._log(`— 第${this.turnCount}行动 — ${nextActor.name} 的回合`);
    } else {
      this.state = 'enemy_turn';
      this._log(`— 第${this.turnCount}行动 — ${nextActor.name} 的回合`);
      setTimeout(() => this._enemyAI(nextActor), 800);
    }

    if (this.onStateChange) this.onStateChange(this.state, this.currentActor);
  }

  playerAction(skillKey, targetIndex) {
    if (this.state !== 'player_turn') return;

    const actor = this.currentActor;
    const skill = actor.skills[skillKey];
    if (!skill) return;

    // 共鸣技能需要检查元素力
    if (skillKey === 'resonance') {
      const resTier = ResonanceSystem.getResonanceTier(actor, this.resonances);
      if (resTier === 0) {
        this._log(`${actor.name} 未激活共鸣，无法使用共鸣技！`);
        return;
      }
      const cost = resTier === 2 ? ElementalForceSystem.resonanceSkillCostT2 : ElementalForceSystem.resonanceSkillCostT1;
      if (!ElementalForceSystem.canUse(actor, cost)) {
        this._log(`${actor.name} 元素力不足！(需要${cost})`);
        return;
      }
      ElementalForceSystem.spendForce(actor, cost);
    }

    // 其他技能检查能量
    if (skill.energyCost && skillKey !== 'resonance') {
      if (actor.currentEnergy < skill.energyCost) {
        this._log(`${actor.name} 能量不足！`);
        return;
      }
      actor.currentEnergy -= skill.energyCost;
    }

    this.state = 'animating';
    this._executeAction(actor, skill, skillKey, targetIndex);
  }

  _executeAction(actor, skill, skillKey, targetIndex) {
    const results = [];

    switch (skill.type) {
      case 'single': {
        const targets = actor.team === 'player' ? this.enemies.filter(c => c.currentHp > 0) : this.party.filter(c => c.currentHp > 0);
        const target = targets[targetIndex] || targets[0];
        if (!target) break;

        const dmg = this._calcDamage(actor, target, skill);
        let finalDamage = dmg.damage;

        // v0.13.0 连击链系统
        if (this.chainManager) {
          const chainResult = this.chainManager.onAttack(actor, target, dmg.damage, skillKey, skill);
          finalDamage = chainResult.totalDamage;

          if (chainResult.chainCount > 1) {
            this.comboCount++;
            this._log(`⚡ ${chainResult.chainCount}连击！(+${chainResult.chainBonus})`);
          }
          if (chainResult.elementChain) {
            this._log(`✦ 元素连锁！(+${chainResult.elementBonus})`);
          }
          if (chainResult.isBreak) {
            this._log(`💥 破防！${target.name} 眩晕 1 回合`);
            target.debuffs.push({ type: 'stun', turns: 1, value: 0 });
          }
        }

        target.currentHp = Math.max(0, target.currentHp - finalDamage);
        actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 20);

        if (dmg.crit) this.critCount++;

        // v0.13.0 反击系统
        if (this.chainManager && target.currentHp > 0) {
          const counter = this.chainManager.processCounter();
          if (counter) {
            CounterSystem.apply(counter, actor);
            this._log(`🔄 ${counter.message}`);
            // 反击触发粒子特效信号
            if (typeof window !== 'undefined' && window._battleEffects) {
              window._battleEffects.push({ type: 'counter', target: actor.id });
            }
          }
        }

        // 普攻回复元素力（含共鸣增益加成）
        if (skillKey === 'normal') {
          let forceRegen = ElementalForceSystem.normalRecovery;
          let bonusRegen = 0;
          if (this.resonanceBuffs) {
            for (const rb of this.resonanceBuffs) {
              if (ResonanceSystem.charHasResonance(actor, rb)) {
                bonusRegen += Math.floor(forceRegen * rb.energyRegen);
              }
            }
          }
          ElementalForceSystem.addForce(actor, forceRegen + bonusRegen);
        }

        const advText = dmg.elementAdvantage ? '（克制！）' : '';
        results.push({ target: target.name, damage: finalDamage, crit: dmg.crit, killed: target.currentHp <= 0, elementAdvantage: dmg.elementAdvantage });
        this._log(`${actor.name} 使用 ${skill.name} 对 ${target.name} 造成 ${finalDamage} 伤害${dmg.crit ? '（暴击！）' : ''}${advText}`);
        break;
      }

      case 'aoe': {
        const targets = actor.team === 'player' ? this.enemies.filter(c => c.currentHp > 0) : this.party.filter(c => c.currentHp > 0);
        for (const target of targets) {
          const dmg = this._calcDamage(actor, target, skill);
          target.currentHp = Math.max(0, target.currentHp - dmg.damage);
          results.push({ target: target.name, damage: dmg.damage, crit: dmg.crit, killed: target.currentHp <= 0 });
        }
        actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 30);
        this._log(`${actor.name} 使用 ${skill.name} 对全体造成伤害`);
        break;
      }

      case 'heal_ally': {
        const targets = this.party.filter(c => c.currentHp > 0);
        for (const target of targets) {
          const heal = Math.floor(actor.atk * skill.multiplier * (1 + Math.random() * 0.1));
          target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
          results.push({ target: target.name, heal });
        }
        actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 25);
        this._log(`${actor.name} 使用 ${skill.name} 治疗全体`);
        break;
      }

      case 'buff_self': {
        actor.buffs.push({ type: 'def_up', value: 0.5, turns: 2 });
        actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 15);
        results.push({ target: actor.name, buff: '防御力+50%' });
        this._log(`${actor.name} 使用 ${skill.name}，防御力提升！`);
        break;
      }

      case 'buff_party': {
        for (const ally of this.party.filter(c => c.currentHp > 0)) {
          ally.buffs.push({ type: 'dmg_reduce', value: 0.3, turns: 2 });
        }
        actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 35);
        results.push({ buff: '全体减伤30%' });
        this._log(`${actor.name} 使用 ${skill.name}，全体减伤！`);
        break;
      }
    }

    this._tickBuffs(actor);

    if (this._checkBattleEnd()) return;

    if (this.onActionComplete) {
      this.onActionComplete(actor, skill, results);
    }

    // v0.19.0 命中顿帧信号：暴击和大招触发短暂停顿，增强打击感
    const hasCrit = results.some(r => r.crit);
    const isUltimate = skillKey === 'ultimate';
    const isResonance = skillKey === 'resonance';
    if (hasCrit || isUltimate || isResonance) {
      this.hitStopSignal = {
        duration: isUltimate ? 120 : (hasCrit ? 80 : 60), // ms
        type: isUltimate ? 'ultimate' : (hasCrit ? 'crit' : 'resonance'),
        timestamp: Date.now()
      };
    }

    // v0.13.0 回合结束重置连击链
    if (this.chainManager) this.chainManager.onTurnEnd();

    // v0.19.0 应用速度倍率：基础 600ms / 速度倍率
    setTimeout(() => this._nextTurn(), Math.floor(600 / this.speedMultiplier));
  }

  // v0.19.0 设置战斗速度倍率
  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.5, Math.min(3, multiplier));
  }

  _calcDamage(attacker, defender, skill) {
    const atkStat = attacker.baseAtk || attacker.atk;
    const defStat = defender.baseDef || defender.def;

    let buffMult = 1;
    for (const b of attacker.buffs) {
      if (b.type === 'atk_up') buffMult += b.value;
    }

    if (this.resonanceBuffs) {
      for (const rb of this.resonanceBuffs) {
        if (rb.type === 'resonance_atk' && ResonanceSystem.charHasResonance(attacker, rb)) {
          buffMult += rb.value;
        }
      }
    }

    let baseDmg = atkStat * skill.multiplier * buffMult;

    let defReduce = 1;
    for (const b of defender.buffs) {
      if (b.type === 'def_up') defReduce -= b.value * 0.5;
      if (b.type === 'dmg_reduce') defReduce -= b.value;
    }
    defReduce = Math.max(0.1, defReduce);

    const defMult = 1 - defStat / (defStat + 500);
    const elementMult = ElementSystem.getAdvantageMultiplier(attacker.element, defender.element);

    let damage = Math.floor(baseDmg * defMult * defReduce * elementMult * (0.9 + Math.random() * 0.2));

    const critRate = attacker.crit_rate || 0.05;
    const isCrit = Math.random() < critRate;
    if (isCrit) {
      damage = Math.floor(damage * (attacker.crit_dmg || 1.5));
    }

    return { damage: Math.max(1, damage), crit: isCrit, elementAdvantage: elementMult > 1 };
  }

  _enemyAI(actor) {
    let skillKey = 'normal';
    if (actor.currentEnergy >= 100 && actor.skills.ultimate) {
      skillKey = 'ultimate';
    } else if (actor.currentEnergy >= (actor.skills.skill?.energyCost || 30) && Math.random() > 0.4) {
      skillKey = 'skill';
    }

    const skill = actor.skills[skillKey];
    if (skill.energyCost) {
      actor.currentEnergy -= skill.energyCost;
    }

    const aliveParty = this.party.filter(c => c.currentHp > 0);
    if (aliveParty.length === 0) return;

    aliveParty.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
    const targetIndex = this.party.indexOf(aliveParty[0]);

    this.state = 'animating';
    this._executeAction(actor, skill, skillKey, targetIndex);
  }

  _tickBuffs(actor) {
    actor.buffs = actor.buffs.filter(b => { b.turns--; return b.turns > 0; });
    actor.debuffs = actor.debuffs.filter(b => { b.turns--; return b.turns > 0; });
  }

  _checkBattleEnd() {
    const partyAlive = this.party.filter(c => c.currentHp > 0).length;
    const enemyAlive = this.enemies.filter(c => c.currentHp > 0).length;

    this._updateResonance();

    if (enemyAlive === 0) {
      this.state = 'victory';
      this._log('战斗胜利！');
      if (this.onBattleEnd) {
        const chainStats = this.chainManager ? this.chainManager.getSummary() : { maxChain: 0, totalChains: 0 };
        this.onBattleEnd('victory', {
          critCount: this.critCount,
          comboCount: this.comboCount,
          chainStats
        });
      }
      return true;
    }

    if (partyAlive === 0) {
      this.state = 'defeat';
      this._log('战斗失败…');
      if (this.onBattleEnd) this.onBattleEnd('defeat');
      return true;
    }

    return false;
  }

  getActivePlayer() {
    if (this.state === 'player_turn') return this.currentActor;
    return null;
  }

  getValidTargets(actor) {
    if (!actor) return [];
    if (actor.team === 'player') {
      return this.enemies.filter(c => c.currentHp > 0);
    }
    return this.party.filter(c => c.currentHp > 0);
  }

  _log(msg) {
    this.battleLog.push(msg);
    if (this.battleLog.length > 50) this.battleLog.shift();
  }
}

window.BattleEngine = BattleEngine;
window.CharacterStats = CharacterStats;
window.ElementSystem = ElementSystem;
window.ResonanceSystem = ResonanceSystem;
window.ElementalForceSystem = ElementalForceSystem;
