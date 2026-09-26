/**
 * battle-log.js - 战斗日志系统
 * v0.17.0 - 实时战斗日志滚动 + 伤害统计面板
 *
 * 功能：
 *   - 战斗过程中记录所有行动（攻击/技能/伤害/治疗/BUFF/DEBUFF）
 *   - Canvas 渲染的滚动日志面板
 *   - 角色伤害/治疗统计（DPS 计算）
 *   - 战斗结束时的统计摘要面板
 *
 * 集成方式：
 *   在 battle.js 的关键位置调用 BattleLogger.log() 记录事件
 *   在 BattleScene 渲染循环中调用 BattleLogger.render() 绘制日志
 */

// ============ 日志条目类型 ============
const LOG_TYPE = {
  ACTION:   'action',    // 行动（攻击/技能/大招）
  DAMAGE:   'damage',    // 伤害
  HEAL:     'heal',      // 治疗
  BUFF:     'buff',      // 增益
  DEBUFF:   'debuff',    // 减益
  STATUS:   'status',    // 状态变化（死亡/眩晕/反击）
  SYSTEM:   'system',    // 系统（回合开始/战斗开始/战斗结束）
  CRIT:     'crit',      // 暴击
  CHAIN:    'chain',     // 连击链
  ELEMENT:  'element',   // 元素反应
  RESONANCE:'resonance', // 共鸣效果
};

// 颜色映射
const LOG_COLORS = {
  action:    '#c0c0d0',
  damage:    '#ff6666',
  heal:      '#66cc66',
  buff:      '#66aaff',
  debuff:    '#ff9966',
  status:    '#b090e0',
  system:    '#808090',
  crit:      '#ffcc00',
  chain:     '#66dddd',
  element:   '#ff66aa',
  resonance: '#b090e0',
};

// ============ 日志条目 ============
class LogEntry {
  constructor(type, text, meta = {}) {
    this.type = type;
    this.text = text;
    this.meta = meta;        // { source, target, value, element, ... }
    this.time = performance.now();
    this.alpha = 0;          // 淡入动画
    this.y = 0;              // 渲染 Y 坐标
  }
}

// ============ 伤害统计 ============
class DamageTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.stats = {};   // { charId: { damage, heal, crits, actions, deaths } }
    this.totalDamage = 0;
    this.totalHeal = 0;
    this.startTime = performance.now();
  }

  /** 记录一次行动 */
  recordAction(charId, type, value = 0) {
    if (!this.stats[charId]) {
      this.stats[charId] = { damage: 0, heal: 0, crits: 0, actions: 0, deaths: 0 };
    }
    const s = this.stats[charId];
    s.actions++;

    if (type === 'damage') {
      s.damage += value;
      this.totalDamage += value;
    } else if (type === 'heal') {
      s.heal += value;
      this.totalHeal += value;
    } else if (type === 'crit') {
      s.crits++;
      s.damage += value;
      this.totalDamage += value;
    } else if (type === 'death') {
      s.deaths++;
    }
  }

  /** 获取角色的 DPS */
  getDps(charId) {
    const s = this.stats[charId];
    if (!s) return 0;
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed > 0 ? Math.round(s.damage / elapsed) : 0;
  }

  /** 获取总 DPS */
  getTotalDps() {
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed > 0 ? Math.round(this.totalDamage / elapsed) : 0;
  }

  /** 生成统计摘要 */
  getSummary() {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const entries = Object.entries(this.stats).map(([id, s]) => ({
      charId: id,
      damage: s.damage,
      heal: s.heal,
      crits: s.crits,
      actions: s.actions,
      deaths: s.deaths,
      dps: elapsed > 0 ? Math.round(s.damage / elapsed) : 0,
      damagePercent: this.totalDamage > 0 ? (s.damage / this.totalDamage * 100).toFixed(1) : '0.0'
    }));

    // 按伤害降序排列
    entries.sort((a, b) => b.damage - a.damage);

    return {
      totalTime: elapsed,
      totalDamage: this.totalDamage,
      totalHeal: this.totalHeal,
      totalDps: this.getTotalDps(),
      entries
    };
  }
}

// ============ 战斗日志管理器 ============
class BattleLogger {
  constructor() {
    this.entries = [];
    this.maxEntries = 100;     // 最多保留 100 条
    this.visibleCount = 8;     // 可视行数
    this.scrollOffset = 0;
    this.tracker = new DamageTracker();
    this.showPanel = false;    // 日志面板开关
    this.showStats = false;    // 统计面板开关
    this._panelAlpha = 0;      // 面板淡入

    // 统计面板按钮区域
    this._toggleBtn = null;
    this._statsBtn = null;
  }

  /** 重置（战斗开始时调用） */
  reset() {
    this.entries = [];
    this.scrollOffset = 0;
    this.tracker.reset();
    this.showPanel = false;
    this.showStats = false;
    this._panelAlpha = 0;
  }

  /** 记录一条日志 */
  log(type, text, meta = {}) {
    const entry = new LogEntry(type, text, meta);
    this.entries.push(entry);

    // 超出上限则截断
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // 自动滚动到底部
    this._autoScroll();

    // 同步更新统计追踪器
    if (type === LOG_TYPE.DAMAGE || type === LOG_TYPE.CRIT) {
      const source = meta.source || 'unknown';
      const value = meta.value || 0;
      this.tracker.recordAction(source, type === LOG_TYPE.CRIT ? 'crit' : 'damage', value);
    } else if (type === LOG_TYPE.HEAL) {
      this.tracker.recordAction(meta.source || 'unknown', 'heal', meta.value || 0);
    } else if (type === LOG_TYPE.STATUS && meta.event === 'death') {
      this.tracker.recordAction(meta.target || 'unknown', 'death', 0);
    }
  }

  /** 快捷方法 — 攻击行动 */
  logAttack(attacker, defender, damage, options = {}) {
    const { isCrit = false, isSkill = false, skillName = '', element = '' } = options;
    const type = isCrit ? LOG_TYPE.CRIT : LOG_TYPE.DAMAGE;
    const prefix = isCrit ? '暴击！' : '';
    const skillPart = isSkill ? `使用「${skillName}」` : '普攻';
    const elemPart = element ? `[${element}]` : '';

    this.log(type, `${attacker} ${skillPart}${elemPart} → ${defender} ${prefix}${damage} 伤害`, {
      source: attacker,
      target: defender,
      value: damage,
      element,
      isCrit,
      isSkill
    });
  }

  /** 快捷方法 — 治疗 */
  logHeal(healer, target, amount) {
    this.log(LOG_TYPE.HEAL, `${healer} 治疗 ${target} +${amount} HP`, {
      source: healer,
      target: target,
      value: amount
    });
  }

  /** 快捷方法 — 角色死亡 */
  logDeath(charName) {
    this.log(LOG_TYPE.STATUS, `${charName} 倒下了！`, {
      target: charName,
      event: 'death'
    });
  }

  /** 快捷方法 — 回合开始 */
  logTurnStart(turn, actorName) {
    this.log(LOG_TYPE.SYSTEM, `── 第${turn}回合 · ${actorName}的回合 ──`, { turn });
  }

  /** 快捷方法 — 连击链 */
  logChain(attacker, chainCount, bonusDamage) {
    this.log(LOG_TYPE.CHAIN, `连击 ×${chainCount}！额外伤害 +${bonusDamage}`, {
      source: attacker,
      chainCount,
      bonusDamage
    });
  }

  /** 快捷方法 — 元素反应 */
  logElement(element, effect) {
    this.log(LOG_TYPE.ELEMENT, `元素反应 [${element}] ${effect}`, { element });
  }

  /** 快捷方法 — 共鸣触发 */
  logResonance(level, element, effect) {
    this.log(LOG_TYPE.RESONANCE, `${level}阶共鸣[${element}] ${effect}`, { level, element });
  }

  /** 快捷方法 — 战斗开始 */
  logBattleStart(description) {
    this.log(LOG_TYPE.SYSTEM, `══ ${description || '战斗开始！'} ══`, {});
  }

  /** 快捷方法 — 战斗结束 */
  logBattleEnd(victory) {
    this.log(LOG_TYPE.SYSTEM,
      victory ? '══ 战斗胜利！ ══' : '══ 战斗失败… ══',
      { victory }
    );
  }

  /** 切换日志面板 */
  togglePanel() {
    this.showPanel = !this.showPanel;
  }

  /** 切换统计面板 */
  toggleStats() {
    this.showStats = !this.showStats;
  }

  /** 自动滚动 */
  _autoScroll() {
    if (this.entries.length > this.visibleCount) {
      this.scrollOffset = this.entries.length - this.visibleCount;
    }
  }

  /** 更新（引擎主循环调用） */
  update(dt) {
    // 日志条目淡入
    for (const entry of this.entries) {
      if (entry.alpha < 1) {
        entry.alpha = Math.min(1, entry.alpha + dt * 5);
      }
    }

    // 面板淡入
    if (this.showPanel && this._panelAlpha < 1) {
      this._panelAlpha = Math.min(1, this._panelAlpha + dt * 4);
    } else if (!this.showPanel && this._panelAlpha > 0) {
      this._panelAlpha = Math.max(0, this._panelAlpha - dt * 4);
    }
  }

  /** 渲染日志面板（在战斗场景之上叠加） */
  render(ctx, canvasW, canvasH) {
    if (this._panelAlpha <= 0 && !this.showPanel) return;

    const panelW = 380;
    const panelH = Math.min(260, canvasH - 120);
    const panelX = canvasW - panelW - 10;
    const panelY = 80;

    ctx.save();
    ctx.globalAlpha = this._panelAlpha * 0.85;

    // 背景
    ctx.fillStyle = 'rgba(10, 10, 25, 0.88)';
    Renderer.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 80, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = this._panelAlpha;

    // 标题栏
    ctx.fillStyle = 'rgba(30, 25, 50, 0.9)';
    Renderer.roundRect(ctx, panelX, panelY, panelW, 28, 8);
    ctx.fill();
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#b090e0';
    ctx.textAlign = 'left';
    ctx.fillText('战斗日志', panelX + 10, panelY + 18);

    // 日志内容
    const lineH = 18;
    const startY = panelY + 36;
    const visibleStart = Math.max(0, this.scrollOffset);
    const visibleEnd = Math.min(this.entries.length, visibleStart + this.visibleCount);

    ctx.beginPath();
    ctx.rect(panelX + 4, startY - 2, panelW - 8, panelH - 44);
    ctx.clip();

    for (let i = visibleStart; i < visibleEnd; i++) {
      const entry = this.entries[i];
      const y = startY + (i - visibleStart) * lineH;

      ctx.globalAlpha = this._panelAlpha * entry.alpha;
      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = LOG_COLORS[entry.type] || '#c0c0d0';
      ctx.textAlign = 'left';

      // 截断过长文本
      const maxTextW = panelW - 20;
      let text = entry.text;
      if (ctx.measureText(text).width > maxTextW) {
        while (text.length > 5 && ctx.measureText(text + '…').width > maxTextW) {
          text = text.slice(0, -1);
        }
        text += '…';
      }
      ctx.fillText(text, panelX + 10, y + 12);
    }

    ctx.restore();

    // 渲染统计面板（如果开启）
    if (this.showStats) {
      this._renderStatsPanel(ctx, canvasW, canvasH);
    }
  }

  /** 渲染统计面板 */
  _renderStatsPanel(ctx, canvasW, canvasH) {
    const summary = this.tracker.getSummary();
    const panelW = 360;
    const panelH = 200;
    const panelX = 10;
    const panelY = 80;

    ctx.save();
    ctx.globalAlpha = 0.9;

    // 背景
    ctx.fillStyle = 'rgba(10, 10, 25, 0.92)';
    Renderer.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 80, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 标题
    ctx.fillStyle = 'rgba(30, 25, 50, 0.9)';
    Renderer.roundRect(ctx, panelX, panelY, panelW, 28, 8);
    ctx.fill();
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'left';
    ctx.fillText('伤害统计', panelX + 10, panelY + 18);

    // 总览
    const elapsed = Math.round(summary.totalTime);
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText(`用时 ${elapsed}s | 总伤害 ${summary.totalDamage} | 总DPS ${summary.totalDps}`,
      panelX + 10, panelY + 50);

    // 角色排名
    const startY = panelY + 68;
    const rowH = 26;

    for (let i = 0; i < summary.entries.length; i++) {
      const e = summary.entries[i];
      const y = startY + i * rowH;
      if (y + rowH > panelY + panelH - 10) break;

      // 排名色
      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#a0a0b0'];
      ctx.fillStyle = rankColors[i] || '#a0a0b0';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${i + 1}`, panelX + 20, y + 8);

      // 角色名
      ctx.font = '12px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e0e0e0';
      const displayName = (e.charId || '').substring(0, 8);
      ctx.fillText(displayName, panelX + 38, y + 8);

      // 伤害数值
      ctx.fillStyle = '#ff8888';
      ctx.textAlign = 'right';
      ctx.fillText(`${e.damage}`, panelX + 170, y + 8);

      // DPS
      ctx.fillStyle = '#88aaff';
      ctx.fillText(`DPS:${e.dps}`, panelX + 240, y + 8);

      // 伤害占比条
      const barX = panelX + 250;
      const barW = 90;
      const barH = 6;
      const barY = y + 3;
      const pct = parseFloat(e.damagePercent) / 100;

      ctx.fillStyle = 'rgba(50, 50, 70, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      if (pct > 0) {
        ctx.fillStyle = rankColors[i] || '#8080a0';
        ctx.fillRect(barX, barY, barW * pct, barH);
      }

      // 百分比文字
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#808090';
      ctx.textAlign = 'right';
      ctx.fillText(`${e.damagePercent}%`, panelX + 350, y + 8);
    }

    ctx.restore();
  }

  /** 渲染战斗结束摘要（全屏覆盖） */
  renderEndSummary(ctx, canvasW, canvasH) {
    const summary = this.tracker.getSummary();
    const panelW = 500;
    const panelH = 340;
    const panelX = (canvasW - panelW) / 2;
    const panelY = (canvasH - panelH) / 2;

    ctx.save();

    // 暗幕
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 面板背景
    ctx.fillStyle = 'rgba(15, 15, 35, 0.95)';
    Renderer.roundRect(ctx, panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.strokeStyle = '#5c4d9a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标题
    ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('战斗统计', canvasW / 2, panelY + 35);

    // 总览
    const elapsed = Math.round(summary.totalTime);
    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#b0b0c0';
    ctx.fillText(`总用时: ${elapsed}s | 总伤害: ${summary.totalDamage} | 总治疗: ${summary.totalHeal}`,
      canvasW / 2, panelY + 65);

    // 分割线
    ctx.strokeStyle = 'rgba(90, 80, 150, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 20, panelY + 80);
    ctx.lineTo(panelX + panelW - 20, panelY + 80);
    ctx.stroke();

    // 表头
    const tableY = panelY + 100;
    const cols = [panelX + 30, panelX + 160, panelX + 260, panelX + 340, panelX + 420];
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#8080a0';
    ctx.textAlign = 'left';
    ctx.fillText('角色', cols[0], tableY);
    ctx.fillText('伤害', cols[1], tableY);
    ctx.textAlign = 'center';
    ctx.fillText('DPS', cols[2] + 20, tableY);
    ctx.fillText('暴击', cols[3] + 10, tableY);
    ctx.fillText('占比', cols[4], tableY);

    // 角色数据
    const rowH = 32;
    for (let i = 0; i < summary.entries.length; i++) {
      const e = summary.entries[i];
      const y = tableY + 28 + i * rowH;

      // 交替行背景
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(30, 30, 55, 0.4)';
        ctx.fillRect(panelX + 15, y - 10, panelW - 30, rowH);
      }

      ctx.font = '13px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';

      // 排名标记
      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#a0a0b0'];
      ctx.fillStyle = rankColors[i] || '#a0a0b0';
      ctx.fillText(`${i + 1}.`, cols[0] - 5, y + 8);

      // 角色名
      ctx.fillStyle = '#e0e0e0';
      const displayName = (e.charId || '').substring(0, 10);
      ctx.fillText(displayName, cols[0] + 18, y + 8);

      // 伤害
      ctx.fillStyle = '#ff8888';
      ctx.fillText(`${e.damage}`, cols[1], y + 8);

      // DPS
      ctx.fillStyle = '#88aaff';
      ctx.textAlign = 'center';
      ctx.fillText(`${e.dps}`, cols[2] + 20, y + 8);

      // 暴击数
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`${e.crits}`, cols[3] + 10, y + 8);

      // 占比
      ctx.fillStyle = '#b0b0c0';
      ctx.textAlign = 'right';
      ctx.fillText(`${e.damagePercent}%`, cols[4] + 30, y + 8);

      // 占比条
      const barX = cols[0] + 18;
      const barW = panelW - 60;
      const barH = 3;
      const barY = y + 16;
      const pct = parseFloat(e.damagePercent) / 100;
      ctx.fillStyle = 'rgba(50, 50, 70, 0.4)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = rankColors[i] || '#5c4d9a';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }

    ctx.restore();
  }
}

// 全局实例
window.BattleLogger = BattleLogger;
window.LOG_TYPE = LOG_TYPE;
