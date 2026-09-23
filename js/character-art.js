/**
 * character-art.js - 角色美术渲染系统
 * 立绘加载 + Q版序列帧动画 + 表情切换 + 场景适配
 * v0.11.0 - 与"游戏画面与人物动画制作"任务共享接口
 *
 * 美术产出规范（命名约定）：
 *   立绘:  assets/characters/portraits/<角色id>.png          (720×1024, 透明底)
 *   立绘(表情): assets/characters/portraits/<角色id>_<表情>.png
 *   Q版帧: assets/characters/chibi/<角色id>/<动作>_<帧号>.png (128×128)
 *   头像:  assets/characters/icons/<角色id>.png               (96×96, 圆角)
 *   战斗特效: assets/battle/effects/<特效名>_<帧号>.png
 *
 * 本文件同时服务于"技术实现"和"画面制作"两个定时任务，
 * 修改时请同步更新 RUNBOOK.md 的"美术联动接口"章节。
 */

// ============ 立绘管理器 ============
class PortraitManager {
  constructor() {
    this.cache = {};           // 已加载的立绘 Image 对象
    this.expressionCache = {}; // 表情变体缓存
    this.loadingPromises = {}; // 防重复加载
    this.fallbackColor = '#3a2a5a';
  }

  /**
   * 加载角色立绘
   * @param {string} charId - 角色 ID
   * @param {string} [expression='default'] - 表情（default/happy/sad/angry/surprise）
   * @returns {Promise<Image|null>}
   */
  async load(charId, expression = 'default') {
    const cacheKey = `${charId}_${expression}`;

    // 已缓存
    if (this.expressionCache[cacheKey]) return this.expressionCache[cacheKey];

    // 正在加载
    if (this.loadingPromises[cacheKey]) return this.loadingPromises[cacheKey];

    // 发起加载
    this.loadingPromises[cacheKey] = this._doLoad(charId, expression);
    const result = await this.loadingPromises[cacheKey];
    delete this.loadingPromises[cacheKey];
    return result;
  }

  async _doLoad(charId, expression) {
    const cacheKey = `${charId}_${expression}`;

    // 优先加载表情变体
    if (expression !== 'default') {
      const exprSrc = `assets/characters/portraits/${charId}_${expression}.png`;
      const img = await this._loadImage(exprSrc);
      if (img) {
        this.expressionCache[cacheKey] = img;
        return img;
      }
    }

    // 回退到默认表情
    const defaultSrc = `assets/characters/portraits/${charId}.png`;
    const key = `${charId}_default`;
    if (this.expressionCache[key]) return this.expressionCache[key];

    const img = await this._loadImage(defaultSrc);
    if (img) {
      this.expressionCache[key] = img;
      // 如果表情变体不存在，也映射到默认
      if (expression !== 'default') {
        this.expressionCache[cacheKey] = img;
      }
      return img;
    }

    return null; // 加载失败，使用 fallback 绘制
  }

  _loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /**
   * 在 Canvas 上绘制立绘（带自适应缩放）
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} charId
   * @param {number} x - 中心 X
   * @param {number} y - 底部 Y
   * @param {object} options
   */
  draw(ctx, charId, x, y, options = {}) {
    const {
      width = 200,
      height = 280,
      expression = 'default',
      alpha = 1,
      flip = false,
      shake = false,
      glow = null,          // 元素色发光
      damageFlash = 0       // 受闪白 0~1
    } = options;

    const cacheKey = `${charId}_${expression}`;
    const img = this.expressionCache[cacheKey] || this.expressionCache[`${charId}_default`];

    ctx.save();
    ctx.globalAlpha = alpha;

    if (flip) {
      ctx.translate(x * 2, 0);
      ctx.scale(-1, 1);
    }

    // 受击震动偏移
    let offX = 0, offY = 0;
    if (shake) {
      offX = (Math.random() - 0.5) * 6;
      offY = (Math.random() - 0.5) * 4;
    }

    const drawX = x - width / 2 + offX;
    const drawY = y - height + offY;

    if (img) {
      // 元素发光
      if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 20;
      }

      ctx.drawImage(img, drawX, drawY, width, height);

      // 受击闪白
      if (damageFlash > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255, 255, 255, ${damageFlash})`;
        ctx.fillRect(drawX, drawY, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      // Fallback: 带角色名的占位符
      this._drawFallback(ctx, charId, drawX, drawY, width, height, glow);
    }

    ctx.restore();
  }

  _drawFallback(ctx, charId, x, y, w, h, glow) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#2a1a4a');
    grad.addColorStop(1, '#1a1a2a');
    Renderer.roundRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = grad;
    ctx.fill();

    if (glow) {
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#3a2a5a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 角色名首字
    const name = charId.charAt(0).toUpperCase();
    ctx.fillStyle = '#8080a0';
    ctx.font = `bold ${Math.floor(w * 0.4)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + w / 2, y + h / 2);
  }

  /** 预加载指定角色的所有常用表情 */
  async preloadExpressions(charId, expressions = ['default', 'happy', 'sad', 'angry', 'surprise']) {
    const promises = expressions.map(expr => this.load(charId, expr));
    await Promise.allSettled(promises);
  }

  /** 清除缓存（场景切换时可选） */
  clearCache() {
    this.expressionCache = {};
  }
}

// ============ Q版序列帧动画器 ============
class ChibiAnimator {
  constructor() {
    this.animations = {};  // charId → SpriteAnimation
    this.frameCache = {};  // 帧缓存
  }

  /**
   * 注册角色的 Q 版动画集
   * @param {string} charId
   * @param {object} animDefs - { idle: { frames: 4, fps: 8 }, attack: { frames: 6, fps: 12 }, ... }
   */
  register(charId, animDefs) {
    this.animations[charId] = {};
    for (const [action, def] of Object.entries(animDefs)) {
      this.animations[charId][action] = {
        frames: def.frames || 4,
        fps: def.fps || 8,
        loop: def.loop !== false,
        loaded: false,
        images: []
      };
    }
  }

  /**
   * 加载指定动作的所有帧
   * @param {string} charId
   * @param {string} action
   */
  async loadAction(charId, action) {
    const anim = this.animations[charId]?.[action];
    if (!anim || anim.loaded) return;

    const promises = [];
    for (let i = 0; i < anim.frames; i++) {
      const src = `assets/characters/chibi/${charId}/${action}_${String(i).padStart(2, '0')}.png`;
      const cacheKey = `${charId}/${action}_${i}`;
      if (this.frameCache[cacheKey]) {
        anim.images.push(this.frameCache[cacheKey]);
        continue;
      }
      promises.push(
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            this.frameCache[cacheKey] = img;
            anim.images.push(img);
            resolve(true);
          };
          img.onerror = () => {
            anim.images.push(null); // 占位 null
            resolve(false);
          };
          img.src = src;
        })
      );
    }

    await Promise.allSettled(promises);
    anim.loaded = true;
  }

  /**
   * 播放动画
   * @param {string} charId
   * @param {string} action
   * @returns {{ frame: number, progress: number, finished: boolean }}
   */
  play(charId, action) {
    const anim = this.animations[charId]?.[action];
    if (!anim) return { frame: 0, progress: 0, finished: true };

    if (!anim._playing || anim._currentAction !== action) {
      anim._playing = true;
      anim._currentAction = action;
      anim._startTime = performance.now();
      anim._frame = 0;
    }

    const elapsed = (performance.now() - anim._startTime) / 1000;
    const frameDuration = 1 / anim.fps;
    const totalDuration = anim.frames * frameDuration;

    let frame;
    if (anim.loop) {
      frame = Math.floor(elapsed / frameDuration) % anim.frames;
    } else {
      frame = Math.min(Math.floor(elapsed / frameDuration), anim.frames - 1);
    }

    const progress = anim.loop
      ? (elapsed % totalDuration) / totalDuration
      : Math.min(elapsed / totalDuration, 1);

    return {
      frame,
      progress,
      finished: !anim.loop && progress >= 1
    };
  }

  /**
   * 停止指定角色的动画
   */
  stop(charId) {
    for (const action of Object.values(this.animations[charId] || {})) {
      action._playing = false;
      action._currentAction = null;
    }
  }

  /**
   * 绘制 Q 版角色帧
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} charId
   * @param {string} action
   * @param {number} x - 中心 X
   * @param {number} y - 底部 Y
   * @param {object} options
   */
  draw(ctx, charId, action, x, y, options = {}) {
    const {
      size = 96,
      flip = false,
      alpha = 1,
      scale = 1,
      bounce = false
    } = options;

    const anim = this.animations[charId]?.[action];
    const state = this.play(charId, action);
    const img = anim?.images[state.frame];

    const drawSize = size * scale;

    // 弹跳偏移
    let bounceY = 0;
    if (bounce) {
      bounceY = Math.sin(performance.now() / 200) * 3;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    if (flip) {
      ctx.translate(x * 2, 0);
      ctx.scale(-1, 1);
    }

    if (img) {
      ctx.drawImage(img,
        x - drawSize / 2, y - drawSize + bounceY,
        drawSize, drawSize
      );
    } else {
      // Fallback: 元素色圆形占位
      this._drawChibiFallback(ctx, charId, x, y, drawSize, bounceY);
    }

    ctx.restore();

    return state;
  }

  _drawChibiFallback(ctx, charId, x, y, size, bounceY) {
    const r = size / 2;
    const cx = x;
    const cy = y - r + bounceY;

    // 身体
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a4a';
    ctx.fill();
    ctx.strokeStyle = '#4a3a6a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.25, cy - r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.05, r * 0.08, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.25, cy - r * 0.05, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // 角色名
    ctx.fillStyle = '#8080b0';
    ctx.font = `${Math.floor(r * 0.5)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(charId.substring(0, 2), cx, cy + r * 0.35);
  }

  /** 检查角色是否有可用的 Q 版素材 */
  hasChibi(charId) {
    return !!this.animations[charId];
  }
}

// ============ 角色美术管理器（统一入口） ============
class CharacterArtManager {
  constructor() {
    this.portraits = new PortraitManager();
    this.chibi = new ChibiAnimator();
    this._initDefaultChibiDefs();
  }

  /** 为所有已知角色注册默认 Q 版动画定义 */
  _initDefaultChibiDefs() {
    const defaultAnims = {
      idle:   { frames: 2, fps: 3, loop: true },
      attack: { frames: 4, fps: 12, loop: false },
      skill:  { frames: 5, fps: 10, loop: false },
      ultimate: { frames: 6, fps: 10, loop: false },
      hit:    { frames: 2, fps: 8, loop: false },
      victory:{ frames: 6, fps: 8, loop: true }
    };

    // 默认可用角色
    const defaultChars = ['zhixing', 'ying', 'warrior_01', 'mage_01', 'healer_01', 'tank_01'];
    for (const id of defaultChars) {
      this.chibi.register(id, { ...defaultAnims });
    }
  }

  /** 注册新角色美术资源 */
  registerCharacter(charId, animDefs) {
    this.chibi.register(charId, animDefs || {
      idle:   { frames: 2, fps: 3, loop: true },
      attack: { frames: 4, fps: 12, loop: false },
      skill:  { frames: 5, fps: 10, loop: false },
      ultimate: { frames: 6, fps: 10, loop: false },
      hit:    { frames: 2, fps: 8, loop: false },
      victory:{ frames: 6, fps: 8, loop: true }
    });
  }

  /** 批量预加载指定角色的美术资源 */
  async preload(charIds) {
    const promises = [];
    for (const id of charIds) {
      promises.push(this.portraits.load(id, 'default'));
      // 预加载 idle 帧
      if (this.chibi.animations[id]) {
        promises.push(this.chibi.loadAction(id, 'idle'));
      }
    }
    await Promise.allSettled(promises);
  }

  /**
   * 绘制角色立绘（剧情/对话场景）
   */
  drawPortrait(ctx, charId, x, y, options = {}) {
    this.portraits.draw(ctx, charId, x, y, options);
  }

  /**
   * 绘制 Q 版角色（战斗场景）
   */
  drawChibi(ctx, charId, action, x, y, options = {}) {
    return this.chibi.draw(ctx, charId, action, x, y, options);
  }

  /**
   * 绘制角色头像（小图标，编队/图鉴/战斗 HP 条旁）
   */
  drawIcon(ctx, charId, x, y, radius, options = {}) {
    const { element = 'none', isActive = false, isDead = false } = options;
    const iconKey = `icon_${charId}`;
    const img = window.game?.assets.getImage(iconKey);

    if (img) {
      ctx.save();
      // 外圈
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#5cb8ff' : (isDead ? '#333' : '#303060');
      ctx.fill();

      // 裁剪圆形
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);

      if (isDead) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      ctx.restore();
    } else {
      // 回退到 Renderer 的占位头像
      Renderer.drawAvatar(ctx, x, y, radius, charId, element, options);
    }
  }
}

// ============ 导出 ============
window.PortraitManager = PortraitManager;
window.ChibiAnimator = ChibiAnimator;
window.CharacterArtManager = CharacterArtManager;
