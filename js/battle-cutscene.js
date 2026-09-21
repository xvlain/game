/**
 * battle-cutscene.js - 战斗演出系统
 * 技能释放演出 + 大招特写演出 + 战斗开场/胜利演出
 * v0.11.0 - 为后续美术素材接入预留完整接口
 *
 * 演出类型：
 *   - skillCutscene: 元素技/共鸣技释放时的短时演出（0.8-1.2s）
 *   - ultimateCutscene: 大招释放的全屏演出（1.5-2.5s）
 *   - battleIntro: 战斗开场演出（1.0s）
 *   - battleVictory: 胜利演出（1.5s）
 *   - battleDefeat: 失败演出（1.0s）
 */

// ============ 演出控制器 ============
class BattleCutsceneManager {
  constructor() {
    this.active = false;
    this.currentCutscene = null;
    this.queue = [];
    this._onComplete = null;
  }

  /**
   * 播放演出（入队）
   * @param {object} cutsceneDef - 演出定义
   * @returns {Promise} 演出结束后 resolve
   */
  play(cutsceneDef) {
    return new Promise(resolve => {
      this.queue.push({ def: cutsceneDef, resolve });
      if (!this.active) {
        this._playNext();
      }
    });
  }

  async _playNext() {
    if (this.queue.length === 0) {
      this.active = false;
      return;
    }

    this.active = true;
    const { def, resolve } = this.queue.shift();
    this.currentCutscene = new CutsceneInstance(def);

    await this.currentCutscene.run();

    this.currentCutscene = null;
    resolve();
    this._playNext();
  }

  /** 跳过当前演出 */
  skip() {
    if (this.currentCutscene) {
      this.currentCutscene.skip();
    }
  }

  /** 当前是否正在演出 */
  isPlaying() {
    return this.active;
  }
}

// ============ 单次演出实例 ============
class CutsceneInstance {
  constructor(def) {
    this.def = def;
    this.startTime = 0;
    this.duration = def.duration || 1.5;
    this.skipped = false;
    this.finished = false;
  }

  run() {
    return new Promise(resolve => {
      this.startTime = performance.now();
      this._resolve = resolve;

      const tick = () => {
        if (this.skipped || this.finished) {
          this._cleanup();
          resolve();
          return;
        }

        const elapsed = (performance.now() - this.startTime) / 1000;
        const progress = Math.min(elapsed / this.duration, 1);

        this._render(progress);

        if (progress >= 1) {
          this.finished = true;
          this._cleanup();
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    });
  }

  skip() {
    this.skipped = true;
  }

  _cleanup() {
    // 清理临时渲染状态
    if (window.game) {
      window.game._cutsceneOverlay = null;
    }
  }

  _render(progress) {
    if (!window.game) return;
    const ctx = window.game.ctx;
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // 将渲染指令注入 game 的覆盖层
    window.game._cutsceneOverlay = {
      type: this.def.type,
      progress,
      actor: this.def.actor,
      element: this.def.element,
      skillName: this.def.skillName,
      render: (ctx) => this._renderFrame(ctx, W, H, progress)
    };
  }

  _renderFrame(ctx, W, H, t) {
    switch (this.def.type) {
      case 'ultimate':  this._renderUltimate(ctx, W, H, t); break;
      case 'skill':     this._renderSkill(ctx, W, H, t); break;
      case 'intro':     this._renderIntro(ctx, W, H, t); break;
      case 'victory':   this._renderVictory(ctx, W, H, t); break;
      case 'defeat':    this._renderDefeat(ctx, W, H, t); break;
    }
  }

  // ========== 大招特写演出 ==========
  _renderUltimate(ctx, W, H, t) {
    const actor = this.def.actor;
    const element = this.def.element || 'none';
    const elemColor = ElementSystem.colors[element] || '#fff';
    const skillName = this.def.skillName || '大招';

    // Phase 1 (0~0.3): 黑幕 + 角色立绘滑入 + 蓄力粒子
    if (t < 0.3) {
      const p = t / 0.3;
      // 黑幕淡入
      ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * Easing.easeOut(p)})`;
      ctx.fillRect(0, 0, W, H);

      // 角色立绘从左侧滑入
      const slideX = W * 0.35 * Easing.easeOut(p);
      const portraitX = W * 0.25 + slideX - W * 0.25 * Easing.easeOut(p);

      if (window.characterArt) {
        window.characterArt.drawPortrait(ctx, actor?.id || 'warrior',
          portraitX, H * 0.85, {
            width: 280 * p,
            height: 400 * p,
            glow: elemColor,
            alpha: Easing.easeOut(p)
          });
      }

      // 蓄力粒子（向角色中心汇聚）
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i + t * 3;
        const dist = (1 - p) * 300 + 50;
        const px = portraitX + Math.cos(angle) * dist;
        const py = H * 0.5 + Math.sin(angle) * dist;
        const size = 3 + (1 - p) * 5;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = elemColor;
        ctx.globalAlpha = 0.5 + p * 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 元素光环
      ctx.beginPath();
      ctx.arc(portraitX, H * 0.5, 120 + p * 30, 0, Math.PI * 2);
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 3 * (1 - p * 0.5);
      ctx.globalAlpha = 0.3 + p * 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Phase 2 (0.3~0.5): 技能名展示 + 闪光
    else if (t < 0.5) {
      const p = (t - 0.3) / 0.2;

      // 保持黑幕
      ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
      ctx.fillRect(0, 0, W, H);

      // 角色立绘固定
      if (window.characterArt) {
        window.characterArt.drawPortrait(ctx, actor?.id || 'warrior',
          W * 0.35, H * 0.85, {
            width: 280,
            height: 400,
            glow: elemColor
          });
      }

      // 技能名从右滑入
      const nameX = W * 0.65 + (1 - Easing.easeOut(p)) * 200;
      ctx.save();
      ctx.globalAlpha = Easing.easeOut(p);

      // 技能名背景条
      ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
      Renderer.roundRect(ctx, nameX - 20, H * 0.38, 380, 80, 8);
      ctx.fill();

      // 元素色装饰线
      ctx.fillStyle = elemColor;
      ctx.fillRect(nameX - 20, H * 0.38, 6, 80);

      // 技能名文字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px "Noto Serif SC", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = elemColor;
      ctx.shadowBlur = 15;
      ctx.fillText(skillName, nameX, H * 0.38 + 40);

      ctx.restore();

      // 闪光脉冲
      if (p > 0.5) {
        const flashP = (p - 0.5) / 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - flashP) * 0.3})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // Phase 3 (0.5~0.75): 攻击演出（粒子爆发 + 屏幕震动）
    else if (t < 0.75) {
      const p = (t - 0.5) / 0.25;

      // 背景闪白后恢复
      ctx.fillStyle = `rgba(0, 0, 0, ${0.8 - p * 0.6})`;
      ctx.fillRect(0, 0, W, H);

      // 粒子爆发
      const burstCount = 40;
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 / burstCount) * i + i * 0.3;
        const speed = 200 + (i % 5) * 80;
        const dist = p * speed * (0.5 + Math.random() * 0.5);
        const px = W * 0.6 + Math.cos(angle) * dist;
        const py = H * 0.5 + Math.sin(angle) * dist;
        const size = (1 - p) * (4 + (i % 3) * 3);
        const alpha = (1 - p) * 0.8;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = elemColor;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 冲击波环
      ctx.beginPath();
      ctx.arc(W * 0.6, H * 0.5, p * 250, 0, Math.PI * 2);
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 4 * (1 - p);
      ctx.globalAlpha = (1 - p) * 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 触发屏幕震动
      if (p < 0.3 && window._screenShake) {
        window._screenShake.active = true;
        window._screenShake.intensity = 8 * (1 - p / 0.3);
      }
    }

    // Phase 4 (0.75~1.0): 淡出
    else {
      const p = (t - 0.75) / 0.25;
      ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * (1 - Easing.easeOut(p))})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ========== 元素技/共鸣技演出 ==========
  _renderSkill(ctx, W, H, t) {
    const element = this.def.element || 'none';
    const elemColor = ElementSystem.colors[element] || '#fff';
    const skillName = this.def.skillName || '技能';
    const isResonance = this.def.isResonance || false;

    // 短暂半透明遮罩
    const overlayAlpha = t < 0.2 ? Easing.easeOut(t / 0.2) * 0.5
      : t > 0.8 ? (1 - Easing.easeIn((t - 0.8) / 0.2)) * 0.5
        : 0.5;
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // 共鸣技特殊效果：双环
    if (isResonance) {
      const p1 = t;
      const p2 = Math.max(0, t - 0.15);

      for (const p of [p1, p2]) {
        if (p <= 0) continue;
        const radius = p * 200;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = elemColor;
        ctx.lineWidth = 3 * (1 - p);
        ctx.globalAlpha = (1 - p) * 0.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 技能名闪现
    if (t < 0.6) {
      const nameAlpha = t < 0.15 ? Easing.easeOut(t / 0.15)
        : t > 0.4 ? 1 - Easing.easeIn((t - 0.4) / 0.2) : 1;
      ctx.save();
      ctx.globalAlpha = nameAlpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = elemColor;
      ctx.shadowBlur = 12;
      ctx.fillText(skillName, W / 2, H * 0.2);
      ctx.restore();
    }

    // 元素粒子流
    const particleCount = isResonance ? 30 : 15;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = 100 + (i % 4) * 40;
      const dist = t * speed;
      const px = W / 2 + Math.cos(angle + t * 2) * dist;
      const py = H / 2 + Math.sin(angle + t * 2) * dist;
      const size = (1 - t) * 3;
      const alpha = (1 - t) * 0.5;

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = elemColor;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ========== 战斗开场演出 ==========
  _renderIntro(ctx, W, H, t) {
    // 从黑到透明的幕帘
    const alpha = 1 - Easing.easeOut(t);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, W, H);

    // "BATTLE" 文字缩放
    if (t < 0.7) {
      const textP = t / 0.7;
      const scale = 1 + (1 - Easing.easeOut(textP)) * 0.5;
      const textAlpha = textP < 0.2 ? Easing.easeOut(textP / 0.2)
        : textP > 0.5 ? 1 - Easing.easeIn((textP - 0.5) / 0.2) : 1;

      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff6633';
      ctx.shadowBlur = 20;
      ctx.fillText('⚔ BATTLE ⚔', 0, 0);
      ctx.restore();
    }
  }

  // ========== 胜利演出 ==========
  _renderVictory(ctx, W, H, t) {
    // 金色粒子雨
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 137.508; // 黄金角度
      const x = (seed % W);
      const y = ((seed * 0.7 + t * 400) % (H + 100)) - 50;
      const size = 2 + (i % 3) * 2;
      const alpha = 0.3 + (i % 5) * 0.1;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? '#ffd700' : '#ffaa33';
      ctx.globalAlpha = alpha * Easing.easeOut(Math.min(t * 3, 1));
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // "VICTORY" 文字
    if (t > 0.2) {
      const textP = (t - 0.2) / 0.8;
      ctx.save();
      ctx.globalAlpha = Easing.easeOut(Math.min(textP * 2, 1));
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 52px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 20;
      ctx.fillText('✦ VICTORY ✦', W / 2, H * 0.35);
      ctx.restore();
    }
  }

  // ========== 失败演出 ==========
  _renderDefeat(ctx, W, H, t) {
    // 红色脉冲暗幕
    ctx.fillStyle = `rgba(30, 0, 0, ${Easing.easeOut(t) * 0.7})`;
    ctx.fillRect(0, 0, W, H);

    // "DEFEAT" 文字
    if (t > 0.3) {
      const textP = (t - 0.3) / 0.7;
      ctx.save();
      ctx.globalAlpha = Easing.easeOut(Math.min(textP * 2, 1));
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fillText('DEFEAT', W / 2, H * 0.4);
      ctx.restore();
    }
  }
}

// ============ 演出工厂函数 ============
const CutsceneFactory = {
  /** 创建大招特写 */
  ultimate(actor, element, skillName) {
    return {
      type: 'ultimate',
      duration: 2.5,
      actor,
      element,
      skillName
    };
  },

  /** 创建元素技/共鸣技演出 */
  skill(element, skillName, isResonance = false) {
    return {
      type: 'skill',
      duration: isResonance ? 1.2 : 0.8,
      element,
      skillName,
      isResonance
    };
  },

  /** 战斗开场 */
  intro() {
    return { type: 'intro', duration: 1.0 };
  },

  /** 胜利 */
  victory() {
    return { type: 'victory', duration: 1.5 };
  },

  /** 失败 */
  defeat() {
    return { type: 'defeat', duration: 1.0 };
  }
};

// ============ 导出 ============
window.BattleCutsceneManager = BattleCutsceneManager;
window.CutsceneInstance = CutsceneInstance;
window.CutsceneFactory = CutsceneFactory;
