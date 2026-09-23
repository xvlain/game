/**
 * chibi-animator.js - Q版战斗角色动画系统
 * 管理 Q 版角色 sprite 序列帧的加载、播放和渲染
 * v1.0.0 - 初始版本
 * 
 * 依赖：engine.js (Renderer, GameAssets)
 * 素材路径：assets/characters/chibi/<角色id>/<动作>_<帧号>.png
 * 立绘路径：assets/characters/portraits/<角色id>.png
 * 头像路径：assets/characters/icons/<角色id>.png
 * 
 * 风格参考：《重返未来1999》战斗中略微Q版形象（非大头Q版）
 */

// ============ 动画状态定义 ============
const ChibiAnimState = {
  IDLE: 'idle',
  ATTACK: 'attack',
  SKILL: 'skill',
  ULTIMATE: 'ultimate',
  HIT: 'hit',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
};

// ============ 动画配置 ============
const ChibiAnimConfig = {
  idle: {
    frames: 2,
    fps: 3,           // 慢速呼吸感
    loop: true,
    priority: 0
  },
  attack: {
    frames: 4,
    fps: 12,
    loop: false,
    priority: 3,
    revertTo: 'idle'
  },
  skill: {
    frames: 5,
    fps: 10,
    loop: false,
    priority: 4,
    revertTo: 'idle'
  },
  ultimate: {
    frames: 6,
    fps: 10,
    loop: false,
    priority: 5,
    revertTo: 'idle'
  },
  hit: {
    frames: 2,
    fps: 8,
    loop: false,
    priority: 2,
    revertTo: 'idle'
  },
  victory: {
    frames: 3,
    fps: 5,
    loop: true,
    priority: 1
  },
  defeat: {
    frames: 2,
    fps: 4,
    loop: false,
    priority: 1
  }
};

// ============ 单个角色动画控制器 ============
class ChibiSprite {
  /**
   * @param {string} charId - 角色 ID（如 'warrior_01'）
   * @param {object} options
   * @param {number} options.x - 渲染位置 X
   * @param {number} options.y - 渲染位置 Y
   * @param {number} options.width - 渲染宽度（默认 128）
   * @param {number} options.height - 渲染高度（默认 128）
   * @param {boolean} options.flip - 是否水平翻转（敌人朝左）
   * @param {number} options.scale - 缩放倍率（默认 1）
   */
  constructor(charId, options = {}) {
    this.charId = charId;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.baseWidth = options.width || 128;
    this.baseHeight = options.height || 128;
    this.flip = options.flip || false;
    this.scale = options.scale || 1;
    
    // 动画状态
    this.currentState = ChibiAnimState.IDLE;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.playing = true;
    this.visible = true;
    this.alpha = 1;
    
    // 帧缓存
    this.frames = {};  // { state: [Image, Image, ...] }
    this.loaded = false;
    this.loadFailed = {};  // { state: bool }
    
    // 运动参数（用于攻击/受击位移）
    this.offsetX = 0;
    this.offsetY = 0;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.shakeAmount = 0;
    this.shakeTimer = 0;
    
    // 闪烁（受击白闪）
    this.flashTimer = 0;
    this.flashColor = '#ffffff';
    
    // 阴影
    this.drawShadow = true;
    
    // 回调
    this.onAnimationEnd = null;
  }

  /**
   * 预加载所有动画帧
   * @param {string} basePath - 资源根路径
   */
  preload(basePath = '') {
    const dir = `${basePath}assets/characters/chibi/${this.charId}/`;
    const promises = [];
    
    for (const [state, config] of Object.entries(ChibiAnimConfig)) {
      const frames = [];
      for (let i = 0; i < config.frames; i++) {
        const frameStr = String(i).padStart(2, '0');
        const img = new Image();
        img.src = `${dir}${state}_${frameStr}.png`;
        frames.push(img);
        
        promises.push(new Promise(resolve => {
          img.onload = resolve;
          img.onerror = () => {
            // 标记该状态不可用
            this.loadFailed[state] = true;
            resolve(); // 不阻塞其他帧
          };
        }));
      }
      this.frames[state] = frames;
    }
    
    return Promise.all(promises).then(() => {
      this.loaded = true;
      console.log(`[ChibiSprite] ${this.charId} frames loaded`);
    });
  }

  /**
   * 检查某个动画状态是否有可用素材
   */
  hasState(state) {
    if (this.loadFailed[state]) return false;
    const frames = this.frames[state];
    if (!frames || frames.length === 0) return false;
    // 至少第一帧加载成功
    return frames[0] && frames[0].complete && frames[0].naturalWidth > 0;
  }

  /**
   * 切换动画状态
   * @param {string} newState - 目标状态
   * @param {object} options
   * @param {boolean} options.force - 强制切换（忽略优先级）
   * @param {function} options.onEnd - 动画结束回调
   */
  setState(newState, options = {}) {
    const newConfig = ChibiAnimConfig[newState];
    if (!newConfig) return;
    
    const currentConfig = ChibiAnimConfig[this.currentState];
    
    // 优先级检查：高优先级动画不能被低优先级打断
    if (!options.force && currentConfig && newConfig.priority < currentConfig.priority) {
      if (!ChibiAnimConfig[this.currentState]?.loop) {
        // 当前动画未结束，不允许打断
        return;
      }
    }
    
    // 检查素材可用性
    if (!this.hasState(newState)) {
      // 降级到 idle
      if (newState !== ChibiAnimState.IDLE && this.hasState(ChibiAnimState.IDLE)) {
        this.setState(ChibiAnimState.IDLE);
        return;
      }
    }
    
    this.currentState = newState;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.onAnimationEnd = options.onEnd || null;
  }

  /**
   * 触发攻击位移动画（前冲 → 回位）
   */
  playAttackMotion(direction = 1) {
    const distance = 40 * direction;
    this.targetOffsetX = distance;
    
    // 0.15秒后回位
    setTimeout(() => {
      this.targetOffsetX = 0;
    }, 150);
  }

  /**
   * 触发受击效果
   */
  playHitReaction(direction = 1) {
    // 后退
    this.targetOffsetX = 15 * direction;
    setTimeout(() => {
      this.targetOffsetX = 0;
    }, 100);
    
    // 白闪
    this.flashTimer = 200;
    
    // 震动
    this.shakeAmount = 3;
    this.shakeTimer = 200;
  }

  /**
   * 每帧更新
   * @param {number} dt - 毫秒间隔
   */
  update(dt) {
    if (!this.playing || !this.visible) return;
    
    // 帧动画
    const config = ChibiAnimConfig[this.currentState];
    if (config) {
      this.frameTimer += dt;
      const frameDuration = 1000 / config.fps;
      
      if (this.frameTimer >= frameDuration) {
        this.frameTimer -= frameDuration;
        this.currentFrame++;
        
        if (this.currentFrame >= config.frames) {
          if (config.loop) {
            this.currentFrame = 0;
          } else {
            this.currentFrame = config.frames - 1; // 停在最后一帧
            // 触发结束回调
            if (this.onAnimationEnd) {
              this.onAnimationEnd(this.currentState);
              this.onAnimationEnd = null;
            }
            // 自动回到 idle
            if (config.revertTo) {
              this.setState(config.revertTo, { force: true });
            }
          }
        }
      }
    }
    
    // 位移插值
    const lerpSpeed = 0.15;
    this.offsetX += (this.targetOffsetX - this.offsetX) * lerpSpeed;
    this.offsetY += (this.targetOffsetY - this.offsetY) * lerpSpeed;
    
    // 震动衰减
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeAmount = 0;
      }
    }
    
    // 闪烁衰减
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }
  }

  /**
   * 渲染
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.visible || this.alpha <= 0) return;
    
    const drawX = this.x + this.offsetX + (this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeAmount * 2 : 0);
    const drawY = this.y + this.offsetY;
    const w = this.baseWidth * this.scale;
    const h = this.baseHeight * this.scale;
    
    // 阴影
    if (this.drawShadow) {
      ctx.save();
      ctx.globalAlpha = 0.3 * this.alpha;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(drawX, drawY + h * 0.48, w * 0.35, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // 获取当前帧图片
    const frames = this.frames[this.currentState];
    if (!frames) return;
    const img = frames[Math.min(this.currentFrame, frames.length - 1)];
    if (!img || !img.complete || !img.naturalWidth) {
      // 素材不可用，绘制占位符
      this._renderPlaceholder(ctx, drawX, drawY, w, h);
      return;
    }
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // 翻转
    if (this.flip) {
      ctx.translate(drawX, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, drawX - w / 2, drawY - h / 2, w, h);
    }
    
    // 受击白闪叠加
    if (this.flashTimer > 0) {
      const flashAlpha = (this.flashTimer / 200) * 0.6;
      ctx.globalAlpha = flashAlpha;
      ctx.globalCompositeOperation = 'lighter';
      if (this.flip) {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(img, drawX - w / 2, drawY - h / 2, w, h);
      }
    }
    
    ctx.restore();
  }

  /**
   * 素材不可用时的占位符渲染
   */
  _renderPlaceholder(ctx, x, y, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.7;
    
    // 占位方块
    const size = Math.min(w, h) * 0.7;
    ctx.fillStyle = '#2a2040';
    ctx.strokeStyle = '#6a4a9a';
    ctx.lineWidth = 2;
    
    // 身体（圆角矩形）
    const bx = x - size * 0.3;
    const by = y - size * 0.35;
    const bw = size * 0.6;
    const bh = size * 0.7;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();
    
    // 头（圆）
    const headR = size * 0.22;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.35, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#e8d0c0';
    ctx.fill();
    ctx.strokeStyle = '#6a4a9a';
    ctx.stroke();
    
    // 状态文字
    ctx.fillStyle = '#8080a0';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentState, x, y + size * 0.5);
    
    ctx.restore();
  }
}

// ============ Q版角色管理器 ============
const ChibiManager = {
  sprites: new Map(),  // { charId: ChibiSprite }
  
  /**
   * 创建一个 Q 版角色 sprite 并加入管理
   */
  create(charId, options = {}) {
    const sprite = new ChibiSprite(charId, options);
    this.sprites.set(charId + '_' + Math.random().toString(36).slice(2, 6), sprite);
    return sprite;
  },

  /**
   * 预加载所有可见角色的帧素材
   * @param {string} basePath
   */
  preloadAll(basePath = '') {
    const promises = [];
    for (const sprite of this.sprites.values()) {
      promises.push(sprite.preload(basePath));
    }
    return Promise.all(promises);
  },

  /**
   * 更新所有角色动画
   */
  update(dt) {
    for (const sprite of this.sprites.values()) {
      sprite.update(dt);
    }
  },

  /**
   * 渲染所有角色
   */
  render(ctx) {
    for (const sprite of this.sprites.values()) {
      sprite.render(ctx);
    }
  },

  /**
   * 移除角色
   */
  remove(sprite) {
    for (const [key, s] of this.sprites.entries()) {
      if (s === sprite) {
        this.sprites.delete(key);
        return;
      }
    }
  },

  /**
   * 清空所有角色
   */
  clear() {
    this.sprites.clear();
  }
};

// ============ 角色立绘渲染器 ============
/**
 * PortraitRenderer - 在 UI 场景中渲染角色立绘
 * 支持立绘加载、淡入淡出、呼吸动画、元素光效
 */
const PortraitRenderer = {
  cache: {},  // { charId: Image }
  
  /**
   * 预加载立绘
   */
  preload(charId, basePath = '') {
    if (this.cache[charId]) return Promise.resolve(this.cache[charId]);
    
    return new Promise(resolve => {
      const img = new Image();
      img.src = `${basePath}assets/characters/portraits/${charId}.png`;
      img.onload = () => {
        this.cache[charId] = img;
        resolve(img);
      };
      img.onerror = () => {
        this.cache[charId] = null;
        resolve(null);
      };
    });
  },

  /**
   * 渲染立绘（带呼吸动画和元素光效）
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} charId
   * @param {number} x - 中心 X
   * @param {number} y - 底部 Y
   * @param {number} height - 显示高度
   * @param {object} options
   */
  render(ctx, charId, x, y, height, options = {}) {
    const img = this.cache[charId];
    const aspectRatio = 800 / 1200; // 标准立绘比例
    const width = height * aspectRatio;
    
    // 呼吸动画
    const breathe = options.noBreathe ? 0 : Math.sin(Date.now() * 0.002) * 2;
    const drawY = y + breathe;
    
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      
      if (options.alpha !== undefined) {
        ctx.globalAlpha = options.alpha;
      }
      
      // 元素背景光效
      if (options.elementGlow) {
        const elementColor = ElementSystem?.colors?.[options.element] || '#9966ff';
        const glowPhase = (Math.sin(Date.now() * 0.003) + 1) / 2;
        const glowRadius = width * 0.6 + glowPhase * 20;
        
        const gradient = ctx.createRadialGradient(x, drawY - height * 0.4, 0, x, drawY - height * 0.4, glowRadius);
        gradient.addColorStop(0, elementColor + '40');
        gradient.addColorStop(0.5, elementColor + '15');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - glowRadius, drawY - height - glowRadius, glowRadius * 2, height + glowRadius * 2);
      }
      
      // 翻转
      if (options.flip) {
        ctx.translate(x, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -width / 2, -height, width, height);
      } else {
        ctx.drawImage(img, x - width / 2, drawY - height, width, height);
      }
      
      ctx.restore();
    } else {
      // 立绘不可用，绘制剪影占位
      this._renderSilhouette(ctx, x, drawY, width, height, options);
    }
  },

  /**
   * 剪影占位渲染
   */
  _renderSilhouette(ctx, x, y, w, h, options = {}) {
    ctx.save();
    ctx.globalAlpha = (options.alpha || 1) * 0.5;
    
    // 人形轮廓
    const gradient = ctx.createLinearGradient(x, y - h, x, y);
    const elementColor = ElementSystem?.colors?.[options.element] || '#6a4a9a';
    gradient.addColorStop(0, elementColor + '60');
    gradient.addColorStop(1, elementColor + '20');
    ctx.fillStyle = gradient;
    
    // 头
    ctx.beginPath();
    ctx.arc(x, y - h + w * 0.25, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    
    // 身体
    ctx.beginPath();
    ctx.moveTo(x - w * 0.2, y - h + w * 0.4);
    ctx.lineTo(x + w * 0.2, y - h + w * 0.4);
    ctx.lineTo(x + w * 0.25, y);
    ctx.lineTo(x - w * 0.25, y);
    ctx.closePath();
    ctx.fill();
    
    // "立绘待制作" 提示
    ctx.fillStyle = '#606080';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('立绘待制作', x, y + 15);
    
    ctx.restore();
  }
};

// ============ 角色头像渲染器 ============
const CharIconRenderer = {
  cache: {},

  preload(charId, basePath = '') {
    if (this.cache[charId]) return Promise.resolve(this.cache[charId]);
    
    return new Promise(resolve => {
      const img = new Image();
      img.src = `${basePath}assets/characters/icons/${charId}.png`;
      img.onload = () => {
        this.cache[charId] = img;
        resolve(img);
      };
      img.onerror = () => {
        this.cache[charId] = null;
        resolve(null);
      };
    });
  },

  /**
   * 渲染角色头像图标
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} charId
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} radius - 半径
   * @param {object} options
   */
  render(ctx, charId, x, y, radius, options = {}) {
    const img = this.cache[charId];
    
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      
      // 裁剪为圆形
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
      
      // 边框
      const borderColor = options.active ? '#ffd700' : (ElementSystem?.colors?.[options.element] || '#4a3a8a');
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = options.active ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 降级到 Renderer.drawAvatar
      if (typeof Renderer !== 'undefined' && Renderer.drawAvatar) {
        Renderer.drawAvatar(ctx, x, y, radius, charId, options.element || 'none', {
          isActive: options.active
        });
      }
    }
  }
};

// ============ 战斗场景角色布局 ============
/**
 * BattleFormation - 管理战斗中角色的位置和大小
 */
const BattleFormation = {
  // 玩家队伍位置（左侧）
  playerSlots: [
    { x: 200, y: 250, scale: 1.3 },  // 前排 1
    { x: 260, y: 350, scale: 1.3 },  // 前排 2
    { x: 140, y: 280, scale: 1.1 },  // 后排 1
    { x: 180, y: 380, scale: 1.1 },  // 后排 2
  ],
  
  // 敌方位置（右侧）
  enemySlots: [
    { x: 900, y: 250, scale: 1.3 },
    { x: 960, y: 350, scale: 1.3 },
    { x: 840, y: 280, scale: 1.1 },
    { x: 880, y: 380, scale: 1.1 },
  ],

  /**
   * 获取指定位置的坐标信息
   * @param {string} team - 'player' | 'enemy'
   * @param {number} index - 队伍位置索引 (0-3)
   */
  getPosition(team, index) {
    const slots = team === 'player' ? this.playerSlots : this.enemySlots;
    const slot = slots[Math.min(index, slots.length - 1)];
    return { ...slot };
  }
};

// ============ 导出 ============
if (typeof window !== 'undefined') {
  window.ChibiAnimState = ChibiAnimState;
  window.ChibiAnimConfig = ChibiAnimConfig;
  window.ChibiSprite = ChibiSprite;
  window.ChibiManager = ChibiManager;
  window.PortraitRenderer = PortraitRenderer;
  window.CharIconRenderer = CharIconRenderer;
  window.BattleFormation = BattleFormation;
}
