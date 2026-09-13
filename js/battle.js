/**
 * battle.js - 回合制战斗系统
 * 速度条驱动，四人编队，大招不插队
 * 含共鸣系统 + 元素力系统
 * v0.3.0 - 修复共鸣增益计算 bug，添加共鸣技能消耗逻辑
 */

// ============ 元素系统（五行） ============
const ElementSystem = {
  types: ['fire', 'ice', 'wind', 'earth', 'lightning'],
  names: { fire: '火', ice: '冰', wind: '风', earth: '土', lightning: '雷', none: '无' },
  colors: {
    fire: '#ff6633',
    ice: '#66ccff',
    wind: '#66ff99',
    earth: '#ccaa44',
    lightning: '#ffcc00',
    none: '#999999'
  },

  // 火→冰→雷→风→土→火 循环克制
  advantage: {
    fire: 'ice',
    ice: 'lightning',
    lightning: 'wind',
    wind: 'earth',
    earth: 'fire'
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
      id: 'mage_01', name: '示例·法师', role: '输出', element: 'ice',
      hp: 900, atk: 220, def: 60, spd: 95,
      crit_rate: 0.20, crit_dmg: 1.5,
      skills: {
        normal: { name: '冰刺', type: 'single', multiplier: 1.0, desc: '对单体造成攻击力100%的冰属性伤害' },
        skill: { name: '暴风雪', type: 'aoe', multiplier: 0.7, energyCost: 35, desc: '对全体造成攻击力70%的冰属性伤害' },
        resonance: { name: '冰封共鸣', type: 'aoe', multiplier: 1.2, desc: '消耗元素力释放的共鸣技' },
        ultimate: { name: '绝对零度', type: 'aoe', multiplier: 2.5, energyCost: 100, desc: '对全体造成攻击力250%的冰属性伤害' }
      }
    },
    healer: {
      id: 'healer_01', name: '示例·治疗', role: '治疗', element: 'wind',
      hp: 1100, atk: 120, def: 100, spd: 105,
      crit_rate: 0.05, crit_dmg: 1.5,
      skills: {
        normal: { name: '风刃', type: 'single', multiplier: 0.8, desc: '对单体造成攻击力80%的伤害' },
        skill: { name: '生命之风', type: 'heal_ally', multiplier: 1.5, energyCost: 25, desc: '治疗全体友方，治疗量=攻击力×150%' },
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
        target.currentHp = Math.max(0, target.currentHp - dmg.damage);
        actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 20);

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
        results.push({ target: target.name, damage: dmg.damage, crit: dmg.crit, killed: target.currentHp <= 0, elementAdvantage: dmg.elementAdvantage });
        this._log(`${actor.name} 使用 ${skill.name} 对 ${target.name} 造成 ${dmg.damage} 伤害${dmg.crit ? '（暴击！）' : ''}${advText}`);
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

    setTimeout(() => this._nextTurn(), 600);
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
      if (this.onBattleEnd) this.onBattleEnd('victory');
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
