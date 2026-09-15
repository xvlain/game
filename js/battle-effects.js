/**
 * battle-effects.js - 五行元素战斗特效系统
 * Canvas 粒子特效，用于战斗动画表现
 * v1.0.0 - 金木水火土五元素特效 + 通用战斗特效
 * 
 * 依赖：engine.js (Renderer)
 * 接口约定：assets/battle/effects/ 目录存放序列帧素材（可选）
 * 本模块提供纯代码粒子特效，无需图片资源即可运行
 */

// ============ 粒子系统核心 ============
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 200;
  }

  emit(config) {
    const count = config.count || 10;
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      this.particles.push(new Particle(config));
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.dead) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  clear() {
    this.particles = [];
  }

  get active() {
    return this.particles.length > 0;
  }
}

class Particle {
  constructor(config) {
    this.x = config.x + (Math.random() - 0.5) * (config.spread || 20);
    this.y = config.y + (Math.random() - 0.5) * (config.spread || 20);
    this.vx = (config.vx || 0) + (Math.random() - 0.5) * (config.vxSpread || 2);
    this.vy = (config.vy || 0) + (Math.random() - 0.5) * (config.vySpread || 2);
    this.gravity = config.gravity || 0;
    this.life = config.life || 1.0;
    this.maxLife = this.life;
    this.size = config.size || 4;
    this.sizeDecay = config.sizeDecay || 0;
    this.color = config.color || '#ffffff';
    this.alpha = config.alpha || 1.0;
    this.alphaDecay = config.alphaDecay || 0;
    this.shape = config.shape || 'circle'; // circle, square, triangle, star, line
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * (config.rotationSpeed || 0);
    this.glow = config.glow || false;
    this.glowColor = config.glowColor || this.color;
    this.trail = config.trail || false;
    this.trailPositions = [];
    this.dead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    // Trail tracking
    if (this.trail && this.trailPositions.length < 8) {
      this.trailPositions.push({ x: this.x, y: this.y });
    } else if (this.trail) {
      this.trailPositions.shift();
      this.trailPositions.push({ x: this.x, y: this.y });
    }

    this.vy += this.gravity * dt;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.rotation += this.rotationSpeed * dt;

    if (this.sizeDecay) {
      this.size -= this.sizeDecay * dt;
      if (this.size <= 0) { this.dead = true; return; }
    }
    if (this.alphaDecay) {
      this.alpha -= this.alphaDecay * dt;
      if (this.alpha <= 0) { this.dead = true; return; }
    }

    // Fade based on remaining life
    const lifeRatio = this.life / this.maxLife;
    this.alpha = Math.min(this.alpha, lifeRatio);
  }

  render(ctx) {
    if (this.dead || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Glow effect
    if (this.glow) {
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = this.glowColor;
    }

    // Trail
    if (this.trail && this.trailPositions.length > 1) {
      ctx.save();
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 0.5;
      ctx.beginPath();
      const first = this.trailPositions[0];
      ctx.moveTo(first.x - this.x, first.y - this.y);
      for (let i = 1; i < this.trailPositions.length; i++) {
        const tp = this.trailPositions[i];
        ctx.lineTo(tp.x - this.x, tp.y - this.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.lineTo(this.size, this.size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        this._drawStar(ctx, this.size);
        break;
      case 'line':
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();
        break;
      case 'ring':
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  _drawStar(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
}

// ============ 五行元素特效 ============
const ElementEffects = {
  // 粒子系统实例
  systems: new Map(),

  getSystem(id) {
    if (!this.systems.has(id)) {
      this.systems.set(id, new ParticleSystem());
    }
    return this.systems.get(id);
  },

  /**
   * 金元素特效 - 金色闪光、金属碎片飞溅
   * @param {number} x - 特效中心 X
   * @param {number} y - 特效中心 Y
   * @param {string} type - 特效类型: attack, skill, ultimate
   */
  metal(x, y, type = 'attack') {
    const sys = this.getSystem('metal');
    const configs = {
      attack: {
        count: 15, spread: 30,
        vx: 0, vy: -1, vxSpread: 4, vySpread: 3,
        gravity: 0.5, life: 0.8,
        size: 3, sizeDecay: 2,
        color: '#d4af37', shape: 'star',
        glow: true, glowColor: '#ffd700',
        alphaDecay: 0.5
      },
      skill: {
        count: 30, spread: 50,
        vx: 0, vy: -2, vxSpread: 6, vySpread: 4,
        gravity: 0.3, life: 1.2,
        size: 5, sizeDecay: 1.5,
        color: '#ffd700', shape: 'triangle',
        glow: true, glowColor: '#ffec80',
        rotationSpeed: 5, alphaDecay: 0.3
      },
      ultimate: [
        // 金色光环扩散
        { count: 40, spread: 10,
          vx: 0, vy: 0, vxSpread: 8, vySpread: 8,
          gravity: 0, life: 1.5,
          size: 4, sizeDecay: 0.5,
          color: '#ffd700', shape: 'star',
          glow: true, glowColor: '#fff5cc',
          trail: true, alphaDecay: 0.2 },
        // 金属碎片
        { count: 25, spread: 20,
          vx: 0, vy: -3, vxSpread: 5, vySpread: 6,
          gravity: 1, life: 1.0,
          size: 6, sizeDecay: 3,
          color: '#b8860b', shape: 'square',
          rotationSpeed: 8, alphaDecay: 0.4 }
      ]
    };

    const config = configs[type] || configs.attack;
    if (Array.isArray(config)) {
      config.forEach(c => sys.emit({ x, y, ...c }));
    } else {
      sys.emit({ x, y, ...config });
    }
  },

  /**
   * 木元素特效 - 藤蔓生长、绿叶飘散
   */
  wood(x, y, type = 'attack') {
    const sys = this.getSystem('wood');
    const configs = {
      attack: {
        count: 12, spread: 25,
        vx: 0, vy: -2, vxSpread: 3, vySpread: 2,
        gravity: 0.2, life: 1.0,
        size: 4, sizeDecay: 1,
        color: '#4caf50', shape: 'triangle',
        glow: false, rotationSpeed: 3,
        alphaDecay: 0.3
      },
      skill: [
        // 藤蔓（向上生长的线条）
        { count: 8, spread: 40,
          vx: 0, vy: -4, vxSpread: 2, vySpread: 1,
          gravity: -0.5, life: 1.5,
          size: 6, sizeDecay: 0,
          color: '#2e7d32', shape: 'line',
          glow: true, glowColor: '#66bb6a',
          rotationSpeed: 1, alphaDecay: 0.2 },
        // 飘散绿叶
        { count: 20, spread: 60,
          vx: 1, vy: -1, vxSpread: 3, vySpread: 2,
          gravity: 0.3, life: 1.8,
          size: 5, sizeDecay: 0.5,
          color: '#81c784', shape: 'triangle',
          rotationSpeed: 4, alphaDecay: 0.15 }
      ],
      ultimate: [
        // 大型藤蔓爆发
        { count: 35, spread: 15,
          vx: 0, vy: -5, vxSpread: 6, vySpread: 3,
          gravity: -0.3, life: 2.0,
          size: 8, sizeDecay: 1,
          color: '#388e3c', shape: 'line',
          glow: true, glowColor: '#a5d6a7',
          trail: true, alphaDecay: 0.15 },
        // 花瓣绽放
        { count: 30, spread: 30,
          vx: 0, vy: -1, vxSpread: 5, vySpread: 5,
          gravity: 0.1, life: 2.0,
          size: 4, sizeDecay: 0.5,
          color: '#c8e6c9', shape: 'star',
          glow: true, glowColor: '#e8f5e9',
          rotationSpeed: 2, alphaDecay: 0.1 }
      ]
    };

    const config = configs[type] || configs.attack;
    if (Array.isArray(config)) {
      config.forEach(c => sys.emit({ x, y, ...c }));
    } else {
      sys.emit({ x, y, ...config });
    }
  },

  /**
   * 水元素特效 - 水花飞溅、冰晶闪烁
   */
  water(x, y, type = 'attack') {
    const sys = this.getSystem('water');
    const configs = {
      attack: {
        count: 15, spread: 20,
        vx: 0, vy: -1, vxSpread: 4, vySpread: 3,
        gravity: 1.0, life: 0.8,
        size: 3, sizeDecay: 1,
        color: '#2196f3', shape: 'circle',
        glow: true, glowColor: '#64b5f6',
        alphaDecay: 0.5
      },
      skill: [
        // 水流冲击
        { count: 25, spread: 40,
          vx: 3, vy: -2, vxSpread: 4, vySpread: 3,
          gravity: 0.5, life: 1.0,
          size: 4, sizeDecay: 1,
          color: '#1976d2', shape: 'circle',
          glow: true, glowColor: '#42a5f5',
          trail: true, alphaDecay: 0.3 },
        // 水花飞溅
        { count: 15, spread: 30,
          vx: 0, vy: -4, vxSpread: 5, vySpread: 2,
          gravity: 2, life: 0.6,
          size: 2, sizeDecay: 0,
          color: '#bbdefb', shape: 'circle',
          glow: false, alphaDecay: 0.5 }
      ],
      ultimate: [
        // 巨浪
        { count: 50, spread: 80,
          vx: 2, vy: -1, vxSpread: 6, vySpread: 4,
          gravity: 0.3, life: 1.8,
          size: 6, sizeDecay: 1,
          color: '#0d47a1', shape: 'circle',
          glow: true, glowColor: '#1565c0',
          trail: true, alphaDecay: 0.15 },
        // 水雾
        { count: 30, spread: 100,
          vx: 0, vy: -0.5, vxSpread: 2, vySpread: 1,
          gravity: -0.1, life: 2.0,
          size: 10, sizeDecay: 2,
          color: '#90caf9', shape: 'circle',
          glow: true, glowColor: '#e3f2fd',
          alpha: 0.5, alphaDecay: 0.1 }
      ]
    };

    const config = configs[type] || configs.attack;
    if (Array.isArray(config)) {
      config.forEach(c => sys.emit({ x, y, ...c }));
    } else {
      sys.emit({ x, y, ...config });
    }
  },

  /**
   * 火元素特效 - 火焰燃烧、火星飞溅
   */
  fire(x, y, type = 'attack') {
    const sys = this.getSystem('fire');
    const configs = {
      attack: {
        count: 15, spread: 20,
        vx: 0, vy: -3, vxSpread: 2, vySpread: 2,
        gravity: -0.5, life: 0.7,
        size: 5, sizeDecay: 3,
        color: '#ff6633', shape: 'circle',
        glow: true, glowColor: '#ff9966',
        alphaDecay: 0.5
      },
      skill: [
        // 火焰柱
        { count: 30, spread: 30,
          vx: 0, vy: -5, vxSpread: 3, vySpread: 2,
          gravity: -1, life: 1.0,
          size: 6, sizeDecay: 2,
          color: '#ff4444', shape: 'circle',
          glow: true, glowColor: '#ff8800',
          trail: true, alphaDecay: 0.3 },
        // 火星
        { count: 20, spread: 40,
          vx: 0, vy: -2, vxSpread: 5, vySpread: 4,
          gravity: -0.2, life: 1.2,
          size: 2, sizeDecay: 0.5,
          color: '#ffcc00', shape: 'star',
          glow: true, glowColor: '#ffee58',
          alphaDecay: 0.2 }
      ],
      ultimate: [
        // 火焰风暴
        { count: 50, spread: 20,
          vx: 0, vy: -4, vxSpread: 7, vySpread: 5,
          gravity: -1.5, life: 1.5,
          size: 8, sizeDecay: 2,
          color: '#d32f2f', shape: 'circle',
          glow: true, glowColor: '#ff5722',
          trail: true, alphaDecay: 0.15 },
        // 火花四射
        { count: 40, spread: 50,
          vx: 0, vy: -1, vxSpread: 8, vySpread: 8,
          gravity: 0.5, life: 1.0,
          size: 3, sizeDecay: 1,
          color: '#ffb74d', shape: 'star',
          glow: true, glowColor: '#fff176',
          alphaDecay: 0.3 },
        // 烟雾
        { count: 15, spread: 60,
          vx: 0, vy: -1, vxSpread: 2, vySpread: 1,
          gravity: -0.3, life: 2.0,
          size: 12, sizeDecay: 2,
          color: '#424242', shape: 'circle',
          glow: false, alpha: 0.3, alphaDecay: 0.08 }
      ]
    };

    const config = configs[type] || configs.attack;
    if (Array.isArray(config)) {
      config.forEach(c => sys.emit({ x, y, ...c }));
    } else {
      sys.emit({ x, y, ...config });
    }
  },

  /**
   * 土元素特效 - 岩石碎裂、沙尘飞扬
   */
  earth(x, y, type = 'attack') {
    const sys = this.getSystem('earth');
    const configs = {
      attack: {
        count: 12, spread: 25,
        vx: 0, vy: 1, vxSpread: 3, vySpread: 2,
        gravity: 2, life: 0.8,
        size: 5, sizeDecay: 2,
        color: '#c8a86e', shape: 'square',
        glow: false, rotationSpeed: 3,
        alphaDecay: 0.4
      },
      skill: [
        // 岩石升起
        { count: 20, spread: 50,
          vx: 0, vy: -3, vxSpread: 3, vySpread: 2,
          gravity: 1.5, life: 1.2,
          size: 8, sizeDecay: 2,
          color: '#8d6e63', shape: 'square',
          glow: false, rotationSpeed: 2,
          alphaDecay: 0.2 },
        // 沙尘
        { count: 25, spread: 60,
          vx: 1, vy: -1, vxSpread: 3, vySpread: 2,
          gravity: 0.3, life: 1.5,
          size: 6, sizeDecay: 1,
          color: '#d7ccc8', shape: 'circle',
          glow: false, alpha: 0.5, alphaDecay: 0.15 }
      ],
      ultimate: [
        // 地震裂片
        { count: 40, spread: 30,
          vx: 0, vy: -6, vxSpread: 6, vySpread: 4,
          gravity: 3, life: 1.0,
          size: 10, sizeDecay: 3,
          color: '#795548', shape: 'square',
          glow: false, rotationSpeed: 5,
          alphaDecay: 0.2 },
        // 沙暴
        { count: 50, spread: 80,
          vx: 2, vy: -1, vxSpread: 5, vySpread: 3,
          gravity: 0.5, life: 2.0,
          size: 5, sizeDecay: 0.5,
          color: '#bcaaa4', shape: 'circle',
          glow: false, alpha: 0.4, alphaDecay: 0.1 },
        // 金色核心闪光
        { count: 10, spread: 10,
          vx: 0, vy: -2, vxSpread: 2, vySpread: 2,
          gravity: 0, life: 0.5,
          size: 15, sizeDecay: 10,
          color: '#c8a86e', shape: 'ring',
          glow: true, glowColor: '#d4af37',
          alphaDecay: 1 }
      ]
    };

    const config = configs[type] || configs.attack;
    if (Array.isArray(config)) {
      config.forEach(c => sys.emit({ x, y, ...c }));
    } else {
      sys.emit({ x, y, ...config });
    }
  },

  // 通用：按元素名调用
  play(element, x, y, type = 'attack') {
    const fn = this[element];
    if (typeof fn === 'function') {
      fn.call(this, x, y, type);
    }
  },

  // 更新所有粒子系统
  update(dt) {
    for (const sys of this.systems.values()) {
      sys.update(dt);
    }
  },

  // 渲染所有粒子系统
  render(ctx) {
    for (const sys of this.systems.values()) {
      sys.render(ctx);
    }
  },

  // 清除所有粒子
  clear() {
    for (const sys of this.systems.values()) {
      sys.clear();
    }
  },

  // 检查是否有活跃粒子
  get active() {
    for (const sys of this.systems.values()) {
      if (sys.active) return true;
    }
    return false;
  }
};

// ============ 通用战斗特效 ============
const BattleEffects = {
  system: new ParticleSystem(),

  /**
   * 受击特效 - 白色闪光 + 碎片
   */
  hit(x, y) {
    this.system.emit({
      x, y, count: 10, spread: 15,
      vx: 0, vy: 0, vxSpread: 5, vySpread: 5,
      gravity: 0, life: 0.4,
      size: 3, sizeDecay: 3,
      color: '#ffffff', shape: 'star',
      glow: true, glowColor: '#ffffff',
      alphaDecay: 1
    });
    // 冲击环
    this.system.emit({
      x, y, count: 1, spread: 0,
      vx: 0, vy: 0, vxSpread: 0, vySpread: 0,
      gravity: 0, life: 0.3,
      size: 5, sizeDecay: -30,
      color: '#ffffff', shape: 'ring',
      glow: true, glowColor: '#ffffff',
      alphaDecay: 2
    });
  },

  /**
   * 暴击特效 - 大型闪光 + 震屏感
   */
  critical(x, y) {
    // 核心闪光
    this.system.emit({
      x, y, count: 1, spread: 0,
      vx: 0, vy: 0, vxSpread: 0, vySpread: 0,
      gravity: 0, life: 0.5,
      size: 20, sizeDecay: 20,
      color: '#ffffff', shape: 'circle',
      glow: true, glowColor: '#ffff00',
      alphaDecay: 1
    });
    // 放射线
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.system.emit({
        x, y, count: 3, spread: 5,
        vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
        vxSpread: 1, vySpread: 1,
        gravity: 0, life: 0.6,
        size: 4, sizeDecay: 2,
        color: '#ffcc00', shape: 'line',
        glow: true, glowColor: '#ffee58',
        rotation: angle, alphaDecay: 0.8
      });
    }
  },

  /**
   * 治愈特效 - 绿色/白色上升粒子
   */
  heal(x, y) {
    this.system.emit({
      x, y: y + 30, count: 20, spread: 40,
      vx: 0, vy: -3, vxSpread: 1, vySpread: 1,
      gravity: -0.5, life: 1.2,
      size: 4, sizeDecay: 1,
      color: '#69f0ae', shape: 'star',
      glow: true, glowColor: '#b9f6ca',
      alphaDecay: 0.2
    });
    // 绿色光环
    this.system.emit({
      x, y, count: 1, spread: 0,
      vx: 0, vy: 0, vxSpread: 0, vySpread: 0,
      gravity: 0, life: 0.8,
      size: 10, sizeDecay: -20,
      color: '#00e676', shape: 'ring',
      glow: true, glowColor: '#69f0ae',
      alphaDecay: 0.8
    });
  },

  /**
   * 共鸣触发特效 - 元素色冲击波
   */
  resonance(x, y, element) {
    const color = ElementSystem?.colors?.[element] || '#9966ff';
    
    // 冲击波环
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.system.emit({
          x, y, count: 1, spread: 0,
          vx: 0, vy: 0, vxSpread: 0, vySpread: 0,
          gravity: 0, life: 0.8,
          size: 5 + i * 10, sizeDecay: -40,
          color, shape: 'ring',
          glow: true, glowColor: color,
          alphaDecay: 0.6
        });
      }, i * 100);
    }

    // 元素粒子上升
    this.system.emit({
      x, y, count: 30, spread: 50,
      vx: 0, vy: -2, vxSpread: 4, vySpread: 3,
      gravity: -0.3, life: 1.5,
      size: 5, sizeDecay: 1,
      color, shape: 'star',
      glow: true, glowColor: color,
      trail: true, alphaDecay: 0.15
    });
  },

  /**
   * 大招蓄力特效 - 能量聚集
   */
  ultimateCharge(x, y, element) {
    const color = ElementSystem?.colors?.[element] || '#ff66ff';
    
    // 向中心聚集的粒子（反向运动）
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 40;
      const startX = x + Math.cos(angle) * dist;
      const startY = y + Math.sin(angle) * dist;
      const vx = (x - startX) / 30;
      const vy = (y - startY) / 30;

      this.system.emit({
        x: startX, y: startY, count: 1, spread: 5,
        vx, vy, vxSpread: 0.5, vySpread: 0.5,
        gravity: 0, life: 1.0,
        size: 3, sizeDecay: 0,
        color, shape: 'circle',
        glow: true, glowColor: color,
        trail: true, alphaDecay: 0.3
      });
    }
  },

  /**
   * 大招释放特效 - 全屏闪光 + 元素爆发
   */
  ultimateRelease(x, y, element) {
    const color = ElementSystem?.colors?.[element] || '#ff66ff';
    
    // 全屏白光
    this.system.emit({
      x, y, count: 1, spread: 0,
      vx: 0, vy: 0, vxSpread: 0, vySpread: 0,
      gravity: 0, life: 0.3,
      size: 800, sizeDecay: 0,
      color: '#ffffff', shape: 'circle',
      glow: false, alpha: 0.6, alphaDecay: 2
    });

    // 元素爆发
    ElementEffects.play(element, x, y, 'ultimate');

    // 冲击波
    this.system.emit({
      x, y, count: 3, spread: 0,
      vx: 0, vy: 0, vxSpread: 0, vySpread: 0,
      gravity: 0, life: 0.8,
      size: 20, sizeDecay: -80,
      color, shape: 'ring',
      glow: true, glowColor: '#ffffff',
      alphaDecay: 0.5
    });
  },

  /**
   * 速度条移动特效
   */
  speedLine(fromX, fromY, toX, toY, color = '#88ccff') {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(dist / 10);

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      setTimeout(() => {
        this.system.emit({
          x: fromX + dx * t, y: fromY + dy * t,
          count: 2, spread: 5,
          vx: dx * 0.01, vy: dy * 0.01,
          vxSpread: 1, vySpread: 1,
          gravity: 0, life: 0.3,
          size: 2, sizeDecay: 2,
          color, shape: 'circle',
          glow: true, glowColor: color,
          alphaDecay: 1
        });
      }, i * 20);
    }
  },

  update(dt) {
    this.system.update(dt);
  },

  render(ctx) {
    this.system.render(ctx);
  },

  clear() {
    this.system.clear();
  }
};

// ============ 导出 ============
window.ParticleSystem = ParticleSystem;
window.ElementEffects = ElementEffects;
window.BattleEffects = BattleEffects;
