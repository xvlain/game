/**
 * battle-chain.js - 连击链 / 反击 / 元素连锁系统
 * v0.13.0 新增
 *
 * 增强回合制战斗的策略深度：
 *  - 连击链（Chain）：同一回合内多次攻击同一目标，伤害递增
 *  - 反击（Counter）：被攻击时有概率触发反击
 *  - 元素连锁（Elemental Chain）：连续使用克制属性触发额外伤害
 *  - 破防（Break）：连续攻击积累破防值，满后触发眩晕
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享记忆库
 */

// ============ 连击链系统 ============
const ChainSystem = {
  /**
   * 连击链状态（每场战斗初始化一次）
   * @returns {Object} chain state
   */
  create() {
    return {
      currentChain: 0,          // 当前连击数
      chainTarget: null,        // 连击目标 ID
      chainDamage: 0,           // 连击累计伤害
      maxChain: 0,              // 本场最高连击
      chainLog: [],             // 连击记录
      elementSequence: [],      // 元素序列（用于元素连锁）
      breakGauge: {},           // { targetId: gaugeValue } 破防槽
      counterReady: false,      // 反击就绪
      counterCharId: null       // 反击角色
    };
  },

  /**
   * 记录一次攻击，更新连击链
   * @param {Object} state - 连击链状态
   * @param {Object} attacker - 攻击者
   * @param {Object} defender - 防御者
   * @param {number} damage - 本次伤害
   * @param {string} skillType - 技能类型 (normal/skill/ultimate/resonance)
   * @returns {Object} chainResult - 连击结果（含加成信息）
   */
  recordHit(state, attacker, defender, damage, skillType) {
    const result = {
      chainCount: 0,
      chainBonus: 0,        // 连击增伤百分比
      elementChain: false,  // 是否触发元素连锁
      elementBonus: 0,      // 元素连锁增伤
      isBreak: false,       // 是否触发破防
      isCounter: false,     // 是否触发反击
      totalDamage: damage   // 最终伤害（含加成）
    };

    // ── 连击链判定 ──
    if (state.chainTarget === defender.id && state.currentChain > 0) {
      // 继续连击
      state.currentChain++;
    } else {
      // 新目标 / 连击重置
      state.chainTarget = defender.id;
      state.currentChain = 1;
    }

    state.chainDamage += damage;
    result.chainCount = state.currentChain;

    // 连击增伤：每连 +5%，上限 30%（6连后封顶）
    const chainBonusRate = Math.min(0.30, (state.currentChain - 1) * 0.05);
    result.chainBonus = Math.floor(damage * chainBonusRate);
    result.totalDamage += result.chainBonus;

    // 更新最高连击
    if (state.currentChain > state.maxChain) {
      state.maxChain = state.currentChain;
    }

    // ── 元素连锁判定 ──
    state.elementSequence.push(attacker.element);
    if (state.elementSequence.length > 3) {
      state.elementSequence.shift(); // 保留最近 3 次
    }

    if (state.elementSequence.length >= 2) {
      const lastTwo = state.elementSequence.slice(-2);
      // 两次相同元素攻击 → 元素连锁
      if (lastTwo[0] === lastTwo[1] && lastTwo[0] !== 'none') {
        result.elementChain = true;
        result.elementBonus = Math.floor(damage * 0.15); // +15%
        result.totalDamage += result.elementBonus;
      }
    }

    // ── 破防槽累积 ──
    const targetId = defender.id;
    state.breakGauge[targetId] = (state.breakGauge[targetId] || 0) + this._getBreakValue(skillType);

    const breakThreshold = this._getBreakThreshold(defender);
    if (state.breakGauge[targetId] >= breakThreshold) {
      result.isBreak = true;
      state.breakGauge[targetId] = 0; // 破防后清零
    }

    // 记录日志
    state.chainLog.push({
      attacker: attacker.name,
      defender: defender.name,
      damage: result.totalDamage,
      chain: state.currentChain,
      elementChain: result.elementChain,
      isBreak: result.isBreak,
      timestamp: Date.now()
    });

    // 保持日志上限
    if (state.chainLog.length > 20) state.chainLog.shift();

    return result;
  },

  /** 获取技能对破防槽的累积值 */
  _getBreakValue(skillType) {
    switch (skillType) {
      case 'normal': return 10;
      case 'skill': return 20;
      case 'resonance': return 30;
      case 'ultimate': return 50;
      default: return 10;
    }
  },

  /** 获取目标的破防阈值（基于防御力） */
  _getBreakThreshold(target) {
    const def = target.baseDef || target.def || 50;
    return 80 + Math.floor(def * 0.5); // 防御越高越难破防
  },

  /** 回合结束时重置连击链 */
  resetChain(state) {
    if (!state) return;
    state.currentChain = 0;
    state.chainTarget = null;
    state.chainDamage = 0;
    state.elementSequence = [];
  },

  /** 获取连击链统计摘要 */
  getSummary(state) {
    if (!state) return { maxChain: 0, totalChains: 0 };
    return {
      maxChain: state.maxChain,
      totalChains: state.chainLog.filter(l => l.chain > 1).length,
      totalElementChains: state.chainLog.filter(l => l.elementChain).length,
      totalBreaks: state.chainLog.filter(l => l.isBreak).length
    };
  }
};

// ============ 反击系统 ============
const CounterSystem = {
  /**
   * 判定是否触发反击
   * @param {Object} defender - 防御者角色
   * @param {Object} attacker - 攻击者角色
   * @param {Object} skill - 使用的技能
   * @returns {Object|null} 反击结果，null 表示未触发
   */
  check(defender, attacker, skill) {
    if (!defender || defender.currentHp <= 0) return null;
    if (skill && skill.type === 'buff_self') return null; // buff 不触发反击

    // 基础反击概率
    let counterRate = this._getCounterRate(defender);

    // 被克制属性攻击时反击率降低
    const elemMult = ElementSystem.getAdvantageMultiplier(attacker.element, defender.element);
    if (elemMult > 1) {
      counterRate *= 0.5; // 被克制时反击率减半
    } else if (elemMult < 1) {
      counterRate *= 1.5; // 克制对方时反击率提升
    }

    // 大招不触发反击
    if (skill && skill.energyCost >= 100) return null;

    if (Math.random() >= counterRate) return null;

    // 反击成功 → 计算反击伤害
    const atkStat = defender.baseAtk || defender.atk;
    const defStat = attacker.baseDef || attacker.def;
    const defMult = 1 - defStat / (defStat + 500);
    const baseDamage = Math.floor(atkStat * 0.6 * defMult * (0.9 + Math.random() * 0.2));

    return {
      defender: defender.name,
      attacker: attacker.name,
      damage: Math.max(1, baseDamage),
      element: defender.element,
      message: `${defender.name} 反击！对 ${attacker.name} 造成 ${baseDamage} 伤害`
    };
  },

  /** 获取角色反击概率 */
  _getCounterRate(char) {
    // 坦克反击率 20%，输出 10%，治疗 5%
    switch (char.role) {
      case '坦克': return 0.20;
      case '输出': return 0.10;
      case '治疗': return 0.05;
      default: return 0.08;
    }
  },

  /** 反击伤害应用 */
  apply(counterResult, attacker) {
    if (!counterResult || !attacker) return;
    attacker.currentHp = Math.max(0, attacker.currentHp - counterResult.damage);
  }
};

// ============ 战斗增强集成模块 ============
class BattleChainManager {
  constructor() {
    this.state = ChainSystem.create();
    this.pendingCounter = null; // 待处理的反击
    this.turnChainCount = 0;    // 本回合连击数（用于委托任务统计）
  }

  /** 战斗开始时初始化 */
  initBattle() {
    this.state = ChainSystem.create();
    this.pendingCounter = null;
    this.turnChainCount = 0;
  }

  /** 记录一次攻击 */
  onAttack(attacker, defender, damage, skillType, skill) {
    // 记录连击链
    const chainResult = ChainSystem.recordHit(this.state, attacker, defender, damage, skillType);
    this.turnChainCount++;

    // 检查反击
    const counter = CounterSystem.check(defender, attacker, skill);
    if (counter) {
      this.pendingCounter = counter;
    }

    return chainResult;
  }

  /** 应用反击伤害 */
  processCounter() {
    if (!this.pendingCounter) return null;
    const counter = this.pendingCounter;
    this.pendingCounter = null;
    return counter;
  }

  /** 回合结束时重置 */
  onTurnEnd() {
    ChainSystem.resetChain(this.state);
    this.turnChainCount = 0;
  }

  /** 战斗结束时获取统计 */
  getSummary() {
    return ChainSystem.getSummary(this.state);
  }

  /** 获取本场战斗触发的连击链总数 */
  getTotalComboTriggers() {
    return this.state.chainLog.filter(l => l.chain > 1).length;
  }
}

window.ChainSystem = ChainSystem;
window.CounterSystem = CounterSystem;
window.BattleChainManager = BattleChainManager;
