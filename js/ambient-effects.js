/**
 * ambient-effects.js - 场景氛围粒子系统
 * 为剧情对话、地图场景提供环境粒子效果
 * v0.20.0 - 初版
 *
 * 效果类型：
 *   - fireflies: 萤火（户外夜晚场景）
 *   - dust_motes: 浮尘光粒（室内/洞穴场景）
 *   - crystal_glow: 晶体微光（水晶洞穴/暗影场景）
 *   - falling_leaves: 飘落叶片（森林场景）
 *   - mist: 薄雾流动（神秘/暗影场景）
 *   - star_sparkle: 星辰微光（星空/破晓场景）
 *   - embers: 余烬飘散（战斗/火焰场景）
 */

// ============ 氛围粒子管理器 ============
class AmbientParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 60;
    this.effectType = null;
    this._bgKey = null;       // 当前背景键名
    this._time = 0;
    this._spawnTimer = 0;
    this._active = false;
  }

  /**
   * 根据背景键名自动选择粒子效果类型
   * @param {string} bgKey - 背景资源键名（如 'story_dark_forest'）
   */
  setBackground(bgKey) {
    if (bgKey === this._bgKey) return;
    this._bgKey = bgKey;
    this.effectType = this._classifyBackground(bgKey);
    this.particles = [];
    this._spawnTimer = 0;
    this._active = true;
  }

  /** 手动设置效果类型 */
  setEffect(type) {
    if (type === this.effectType && this._active) return;
    this.effectType = type;
    this.particles = [];
    this._spawnTimer = 0;
    this._active = true;
  }

  /** 停止粒子效果 */
  stop() {
    this._active = false;
    this.particles = [];
  }

  /** 背景分类映射 */
  _classifyBackground(bgKey) {
    if (!bgKey) return 'dust_motes';

    // 暗影/水晶洞穴场景
    if (bgKey.includes('shadow') || bgKey.includes('crystal') || bgKey.includes('cave')) {
      return 'crystal_glow';
    }
    // 森林场景
    if (bgKey.includes('forest') || bgKey.includes('dark_forest') || bgKey.includes('moonlit')) {
      return 'fireflies';
    }
    // 星空/破晓场景
    if (bgKey.includes('star') || bgKey.includes('dawn') || bgKey.includes('abyss') || bgKey.includes('void')) {
      return 'star_sparkle';
    }
    // 古道/旅途场景
    if (bgKey.includes('path') || bgKey.includes('ancient_path') || bgKey.includes('crossroads') || bgKey.includes('town')) {
      return 'dust_motes';
    }
    // 废墟/遗迹场景
    if (bgKey.includes('ruins') || bgKey.includes('awakening')) {
      return 'mist';
    }
    // 战斗/竞技场场景
    if (bgKey.includes('arena') || bgKey.includes('battle') || bgKey.includes('chaos')) {
      return 'embers';
    }
    // 标题/UI 场景
    if (bgKey.includes('title') || bgKey.includes('loading')) {
      return 'star_sparkle';
    }

    return 'dust_motes';
  }

  /** 每帧更新 */
  update(dt) {
    if (!this._active || !this.effectType) return;

    this._time += dt;
    this._spawnTimer += dt;

    // 按类型生成粒子
    const config = EFFECT_CONFIGS[this.effectType];
    if (!config) return;

    const spawnInterval = config.spawnInterval || 0.15;
    while (this._spawnTimer >= spawnInterval && this.particles.length < (config.maxParticles || 60)) {
      this._spawnTimer -= spawnInterval;
      this.particles.push(this._createParticle(config));
    }

    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      // 更新位置
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // 更新相位（用于摆动/闪烁）
      p.phase += (p.phaseSpeed || 1) * dt;
      // 生命周期进度
      p.progress = 1 - (p.life / p.maxLife);
    }
  }

  /** 创建单个粒子 */
  _createParticle(config) {
    const W = 1280, H = 720;
    const base = {
      life: config.life || 3,
      maxLife: config.life || 3,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: config.phaseSpeed || (0.5 + Math.random() * 1.5),
      progress: 0
    };

    switch (config.type) {
      case 'fireflies':
        return {
          ...base,
          x: Math.random() * W,
          y: H * 0.3 + Math.random() * H * 0.5,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 10,
          size: 1.5 + Math.random() * 2.5,
          life: 2 + Math.random() * 4,
          maxLife: 6,
          color: config.color || '#aaffaa',
          glowColor: config.glowColor || '#44ff66',
          wobble: 20 + Math.random() * 30,
          wobbleY: 10 + Math.random() * 20,
          baseX: 0, baseY: 0,
          _init: true
        };

      case 'dust_motes':
        return {
          ...base,
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 5,
          vy: -3 - Math.random() * 8,
          size: 0.8 + Math.random() * 1.5,
          life: 3 + Math.random() * 5,
          maxLife: 8,
          color: config.color || '#ffeedd'
        };

      case 'crystal_glow':
        return {
          ...base,
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 4,
          size: 1 + Math.random() * 2,
          life: 2 + Math.random() * 3,
          maxLife: 5,
          color: config.color || '#bb88ff',
          glowColor: config.glowColor || '#6644cc',
          pulse: true
        };

      case 'falling_leaves':
        return {
          ...base,
          x: Math.random() * (W + 200) - 100,
          y: -20 - Math.random() * 50,
          vx: 10 + Math.random() * 20,
          vy: 15 + Math.random() * 25,
          size: 3 + Math.random() * 4,
          life: 4 + Math.random() * 4,
          maxLife: 8,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 3,
          wobble: 30 + Math.random() * 40,
          color: config.colors ? config.colors[Math.floor(Math.random() * config.colors.length)] : '#88aa44'
        };

      case 'mist':
        return {
          ...base,
          x: -100 + Math.random() * (W + 200),
          y: H * 0.5 + Math.random() * H * 0.5,
          vx: 5 + Math.random() * 10,
          vy: (Math.random() - 0.5) * 2,
          size: 40 + Math.random() * 60,
          life: 5 + Math.random() * 5,
          maxLife: 10,
          color: config.color || 'rgba(100, 80, 140, 0.06)'
        };

      case 'star_sparkle':
        return {
          ...base,
          x: Math.random() * W,
          y: Math.random() * H * 0.7,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: 1 + Math.random() * 2,
          life: 1 + Math.random() * 3,
          maxLife: 4,
          color: config.color || '#ffffff',
          glowColor: config.glowColor || '#aaccff',
          twinkle: true
        };

      case 'embers':
        return {
          ...base,
          x: Math.random() * W,
          y: H * 0.6 + Math.random() * H * 0.4,
          vx: (Math.random() - 0.5) * 10,
          vy: -8 - Math.random() * 15,
          size: 1 + Math.random() * 2.5,
          life: 2 + Math.random() * 3,
          maxLife: 5,
          color: config.color || '#ff8844',
          glowColor: config.glowColor || '#ff4400'
        };

      default:
        return { ...base, x: 0, y: 0, vx: 0, vy: 0, size: 1, color: '#fff' };
    }
  }

  /** 渲染所有粒子 */
  render(ctx) {
    if (!this._active || this.particles.length === 0) return;

    ctx.save();
    const config = EFFECT_CONFIGS[this.effectType];
    if (!config) { ctx.restore(); return; }

    switch (config.type) {
      case 'fireflies':    this._renderFireflies(ctx); break;
      case 'dust_motes':   this._renderDustMotes(ctx); break;
      case 'crystal_glow': this._renderCrystalGlow(ctx); break;
      case 'falling_leaves': this._renderFallingLeaves(ctx); break;
      case 'mist':         this._renderMist(ctx); break;
      case 'star_sparkle': this._renderStarSparkle(ctx); break;
      case 'embers':       this._renderEmbers(ctx); break;
    }

    ctx.restore();
  }

  // ========== 渲染方法 ==========

  /** 萤火渲染 */
  _renderFireflies(ctx) {
    for (const p of this.particles) {
      if (!p._init) {
        p.baseX = p.x;
        p.baseY = p.y;
        p._init = false;
      }
      // 正弦摆动
      const wobbleX = Math.sin(p.phase) * p.wobble;
      const wobbleY = Math.cos(p.phase * 0.7) * p.wobbleY;
      const px = p.baseX + wobbleX + p.vx * p.progress;
      const py = p.baseY + wobbleY + p.vy * p.progress;

      // 生命周期透明度
      const fadeIn = Math.min(p.progress * 5, 1);
      const fadeOut = Math.min((1 - p.progress) * 3, 1);
      const alpha = fadeIn * fadeOut;

      // 闪烁
      const flicker = 0.5 + 0.5 * Math.sin(p.phase * 3);
      const finalAlpha = alpha * (0.4 + flicker * 0.6);

      // 外发光
      const glowSize = p.size * (3 + flicker * 2);
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
      gradient.addColorStop(0, p.glowColor || '#44ff66');
      gradient.addColorStop(0.3, p.color);
      gradient.addColorStop(1, 'transparent');

      ctx.globalAlpha = finalAlpha * 0.3;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // 核心亮点
      ctx.globalAlpha = finalAlpha * 0.8;
      ctx.fillStyle = '#ffffee';
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** 浮尘光粒渲染 */
  _renderDustMotes(ctx) {
    for (const p of this.particles) {
      const fadeIn = Math.min(p.progress * 4, 1);
      const fadeOut = Math.min((1 - p.progress) * 3, 1);
      const alpha = fadeIn * fadeOut * 0.5;

      const flicker = 0.6 + 0.4 * Math.sin(p.phase * 2);

      ctx.globalAlpha = alpha * flicker;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // 微弱光晕
      ctx.globalAlpha = alpha * flicker * 0.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** 晶体微光渲染 */
  _renderCrystalGlow(ctx) {
    for (const p of this.particles) {
      const fadeIn = Math.min(p.progress * 3, 1);
      const fadeOut = Math.min((1 - p.progress) * 2, 1);
      const alpha = fadeIn * fadeOut;

      const pulse = p.pulse ? (0.5 + 0.5 * Math.sin(p.phase * 2)) : 1;

      // 六芒星形状
      ctx.globalAlpha = alpha * 0.6 * pulse;
      ctx.fillStyle = p.color;
      this._drawStar(ctx, p.x, p.y, p.size, p.size * 2, 6, p.phase * 0.3);

      // 中心光点
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 光晕
      ctx.globalAlpha = alpha * 0.15 * pulse;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      grad.addColorStop(0, p.glowColor || p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** 飘落叶片渲染 */
  _renderFallingLeaves(ctx) {
    for (const p of this.particles) {
      const fadeIn = Math.min(p.progress * 5, 1);
      const fadeOut = Math.min((1 - p.progress) * 2, 1);
      const alpha = fadeIn * fadeOut;

      // 左右摇摆
      const sway = Math.sin(p.phase) * p.wobble;
      const px = p.x + sway;
      const py = p.y;

      p.rotation += p.rotSpeed * 0.016; // 近似帧时间

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha * 0.7;

      // 叶片形状（椭圆+叶脉）
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 叶脉
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-p.size * 0.8, 0);
      ctx.lineTo(p.size * 0.8, 0);
      ctx.stroke();

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /** 薄雾渲染 */
  _renderMist(ctx) {
    for (const p of this.particles) {
      const fadeIn = Math.min(p.progress * 2, 1);
      const fadeOut = Math.min((1 - p.progress) * 1.5, 1);
      const alpha = fadeIn * fadeOut;

      const wobbleY = Math.sin(p.phase * 0.5) * 15;

      ctx.globalAlpha = alpha * 0.06;
      const grad = ctx.createRadialGradient(p.x, p.y + wobbleY, 0, p.x, p.y + wobbleY, p.size);
      grad.addColorStop(0, 'rgba(120, 100, 180, 0.3)');
      grad.addColorStop(0.5, 'rgba(80, 60, 140, 0.1)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + wobbleY, p.size * 1.5, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** 星辰微光渲染 */
  _renderStarSparkle(ctx) {
    for (const p of this.particles) {
      const fadeIn = Math.min(p.progress * 4, 1);
      const fadeOut = Math.min((1 - p.progress) * 3, 1);
      const alpha = fadeIn * fadeOut;

      const twinkle = p.twinkle ? Math.abs(Math.sin(p.phase * 3)) : 1;
      const finalAlpha = alpha * twinkle;

      // 十字光芒
      ctx.globalAlpha = finalAlpha * 0.7;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 0.5;
      const len = p.size * (1.5 + twinkle * 1.5);

      ctx.beginPath();
      ctx.moveTo(p.x - len, p.y);
      ctx.lineTo(p.x + len, p.y);
      ctx.moveTo(p.x, p.y - len);
      ctx.lineTo(p.x, p.y + len);
      ctx.stroke();

      // 中心亮点
      ctx.globalAlpha = finalAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // 光晕
      if (p.glowColor) {
        ctx.globalAlpha = finalAlpha * 0.2;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, p.glowColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** 余烬渲染 */
  _renderEmbers(ctx) {
    for (const p of this.particles) {
      const fadeIn = Math.min(p.progress * 4, 1);
      const fadeOut = Math.min((1 - p.progress) * 2, 1);
      const alpha = fadeIn * fadeOut;

      const flicker = 0.5 + 0.5 * Math.sin(p.phase * 4);

      // 外发光
      ctx.globalAlpha = alpha * 0.3 * flicker;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      grad.addColorStop(0, p.glowColor || '#ff4400');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // 核心
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // 白热中心
      ctx.globalAlpha = alpha * flicker;
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** 辅助：绘制星形 */
  _drawStar(ctx, cx, cy, innerR, outerR, points, rotation) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i + rotation;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

// ============ 效果配置表 ============
const EFFECT_CONFIGS = {
  fireflies: {
    type: 'fireflies',
    maxParticles: 35,
    spawnInterval: 0.2,
    life: 4,
    color: '#aaffaa',
    glowColor: '#44ff66'
  },
  dust_motes: {
    type: 'dust_motes',
    maxParticles: 45,
    spawnInterval: 0.12,
    life: 5,
    color: '#ffeedd'
  },
  crystal_glow: {
    type: 'crystal_glow',
    maxParticles: 30,
    spawnInterval: 0.2,
    life: 4,
    color: '#bb88ff',
    glowColor: '#6644cc'
  },
  falling_leaves: {
    type: 'falling_leaves',
    maxParticles: 25,
    spawnInterval: 0.3,
    life: 5,
    colors: ['#88aa44', '#aa8833', '#cc6633', '#99aa55', '#bb9944']
  },
  mist: {
    type: 'mist',
    maxParticles: 15,
    spawnInterval: 0.5,
    life: 7,
    color: 'rgba(100, 80, 140, 0.3)'
  },
  star_sparkle: {
    type: 'star_sparkle',
    maxParticles: 40,
    spawnInterval: 0.15,
    life: 3,
    color: '#ffffff',
    glowColor: '#aaccff'
  },
  embers: {
    type: 'embers',
    maxParticles: 35,
    spawnInterval: 0.15,
    life: 3,
    color: '#ff8844',
    glowColor: '#ff4400'
  }
};

// ============ 全局单例 ============
window.ambientParticles = new AmbientParticleSystem();
