/**
 * scene-effects.js - 场景视觉增强系统
 * v0.23.0 新增
 *
 * 模块：
 *   1. ParallaxBackground  - 多层视差背景（深度感/沉浸感）
 *   2. EnhancedTransitions - 高级场景转场（粒子擦除/水墨晕染/元素渐变/百叶窗）
 *   3. WeatherSystem       - 动态天气与环境光效（雨/雪/雾/光线/昼夜）
 *   4. DialogueFX          - 对话场景演出增强（角色入场/情绪特效/文字动效）
 *   5. CinematicTitle      - 电影感标题动画序列
 *   6. ScreenFX            - 屏幕级后处理（暗角/色差/胶片颗粒/泛光）
 *
 * 全局单例：window.sceneEffects
 * 依赖：engine.js, ambient-effects.js
 */

// ============ 1. 视差背景系统 ============
class ParallaxBackground {
  constructor() {
    this.layers = [];       // 每层 { image, speedX, speedY, offsetX, offsetY, scale, alpha, blendMode }
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.autoScrollSpeed = { x: 0, y: 0 }; // 自动慢速滚动
    this._time = 0;
    this.enabled = true;
  }

  /**
   * 从单张背景图生成多层视差
   * @param {HTMLImageElement} baseImage - 基础背景图
   * @param {object} config - 配置
   */
  initFromImage(baseImage, config = {}) {
    this.layers = [];
    const layers = config.layers || 3;
    const depthFactors = config.depthFactors || [0.02, 0.05, 0.1]; // 远→近
    const alphas = config.alphas || [0.4, 0.6, 1.0];
    const scales = config.scales || [1.15, 1.08, 1.0];

    for (let i = 0; i < layers; i++) {
      this.layers.push({
        image: baseImage,
        depthFactor: depthFactors[i] || 0.05,
        offsetX: 0,
        offsetY: 0,
        scale: scales[i] || 1.0,
        alpha: alphas[i] || 1.0,
        blendMode: i < layers - 1 ? 'screen' : 'source-over',
        // 每层叠加不同的色调滤镜
        tint: config.tints ? config.tints[i] : null,
        // 微动参数（模拟风吹/光线变化）
        wobbleAmp: config.wobbleAmp || (i < layers - 1 ? 3 : 0),
        wobbleSpeed: config.wobbleSpeed || (0.3 + i * 0.2)
      });
    }

    this.autoScrollSpeed = config.autoScroll || { x: 0.3, y: 0 };
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
  }

  /** 设置视差摄像机偏移（可绑定鼠标/触摸） */
  setCamera(x, y) {
    this.targetCameraX = x;
    this.targetCameraY = y;
  }

  update(dt) {
    if (!this.enabled) return;
    this._time += dt;

    // 自动滚动
    this.targetCameraX += this.autoScrollSpeed.x * dt;
    this.targetCameraY += this.autoScrollSpeed.y * dt;

    // 平滑跟随
    const lerp = 1 - Math.pow(0.05, dt);
    this.cameraX += (this.targetCameraX - this.cameraX) * lerp;
    this.cameraY += (this.targetCameraY - this.cameraY) * lerp;
  }

  render(ctx, W, H) {
    if (!this.enabled || this.layers.length === 0) return;

    for (const layer of this.layers) {
      if (!layer.image) continue;

      const parallaxX = this.cameraX * layer.depthFactor;
      const parallaxY = this.cameraY * layer.depthFactor;

      // 微动（模拟风吹/光晕漂移）
      const wobbleX = Math.sin(this._time * layer.wobbleSpeed) * layer.wobbleAmp;
      const wobbleY = Math.cos(this._time * layer.wobbleSpeed * 0.7) * layer.wobbleAmp * 0.5;

      const dx = -parallaxX + wobbleX;
      const dy = -parallaxY + wobbleY;

      const scaledW = W * layer.scale;
      const scaledH = H * layer.scale;
      const offsetX = (W - scaledW) / 2 + dx;
      const offsetY = (H - scaledH) / 2 + dy;

      ctx.save();
      ctx.globalAlpha = layer.alpha;

      if (layer.blendMode !== 'source-over') {
        ctx.globalCompositeOperation = layer.blendMode;
      }

      ctx.drawImage(layer.image, offsetX, offsetY, scaledW, scaledH);

      // 色调叠加
      if (layer.tint) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = layer.tint;
        ctx.fillRect(offsetX, offsetY, scaledW, scaledH);
      }

      ctx.restore();
    }
  }

  /** 重置视差状态 */
  reset() {
    this.layers = [];
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this._time = 0;
  }
}

// ============ 2. 高级场景转场系统 ============
class EnhancedTransitions {
  constructor() {
    this.active = false;
    this.type = 'fade';
    this.progress = 0;
    this.duration = 0.6;
    this.phase = 'out'; // 'out' → switch → 'in'
    this._onMidpoint = null;
    this._onComplete = null;
    this._particles = [];
    this._seed = Math.random() * 1000;
    this.config = {};
  }

  /**
   * 播放转场
   * @param {string} type - fade | particle_wipe | ink_wash | element_burst | blinds | diamond | circle_reveal
   * @param {object} config - { duration, element, color, direction, onComplete }
   */
  play(type, config = {}) {
    if (this.active) return;
    this.active = true;
    this.type = type;
    this.duration = config.duration || 0.6;
    this.progress = 0;
    this.phase = 'out';
    this.config = config;
    this._onMidpoint = config.onMidpoint || null;
    this._onComplete = config.onComplete || null;
    this._seed = Math.random() * 1000;
    this._midpointFired = false;

    // 初始化粒子
    if (type === 'particle_wipe') {
      this._initParticleWipe(config);
    } else if (type === 'ink_wash') {
      this._initInkWash(config);
    }
  }

  _initParticleWipe(config) {
    this._particles = [];
    const count = 60;
    const direction = config.direction || 'left'; // left | right | center
    for (let i = 0; i < count; i++) {
      this._particles.push({
        x: direction === 'left' ? -20 : direction === 'right' ? 1300 : 640,
        y: Math.random() * 720,
        size: Math.random() * 8 + 4,
        speed: Math.random() * 300 + 200,
        delay: Math.random() * 0.3,
        color: config.color || '#7c5cbf',
        alpha: Math.random() * 0.6 + 0.4,
        angle: direction === 'left' ? 0 : direction === 'right' ? Math.PI : Math.random() * Math.PI * 2
      });
    }
  }

  _initInkWash(config) {
    this._inkDrops = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      this._inkDrops.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        maxRadius: Math.random() * 300 + 200,
        delay: i * 0.05,
        color: config.color || 'rgba(10, 10, 30, 0.95)'
      });
    }
  }

  update(dt) {
    if (!this.active) return;

    this.progress += dt / this.duration;

    // 中点回调（场景切换时机）
    if (this.progress >= 0.5 && !this._midpointFired) {
      this._midpointFired = true;
      this.phase = 'in';
      if (this._onMidpoint) this._onMidpoint();
    }

    if (this.progress >= 1) {
      this.active = false;
      this.progress = 1;
      if (this._onComplete) this._onComplete();
    }
  }

  render(ctx, W, H) {
    if (!this.active) return;

    const t = Math.min(this.progress, 1);
    // 三角函数映射：0→1→0（前半展开遮罩，后半收起遮罩）
    const maskT = t < 0.5 ? t * 2 : (1 - t) * 2;
    const eased = this._easeInOutCubic(maskT);

    switch (this.type) {
      case 'particle_wipe':
        this._renderParticleWipe(ctx, W, H, t, eased);
        break;
      case 'ink_wash':
        this._renderInkWash(ctx, W, H, t, eased);
        break;
      case 'element_burst':
        this._renderElementBurst(ctx, W, H, t, eased);
        break;
      case 'blinds':
        this._renderBlinds(ctx, W, H, t, eased);
        break;
      case 'diamond':
        this._renderDiamond(ctx, W, H, t, eased);
        break;
      case 'circle_reveal':
        this._renderCircleReveal(ctx, W, H, t, eased);
        break;
      default:
        this._renderFade(ctx, W, H, t, eased);
    }
  }

  _renderFade(ctx, W, H, t, eased) {
    const alpha = t < 0.5 ? eased : eased;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  _renderParticleWipe(ctx, W, H, t, eased) {
    // 底幕
    const baseAlpha = t < 0.5 ? eased * 0.8 : eased * 0.8;
    ctx.fillStyle = `rgba(5, 5, 15, ${baseAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // 粒子流
    for (const p of this._particles) {
      const effectiveT = Math.max(0, t - p.delay);
      if (effectiveT <= 0) continue;

      const travelDist = effectiveT * p.speed;
      const px = p.x + Math.cos(p.angle) * travelDist;
      const py = p.y + Math.sin(p.angle) * travelDist * 0.3 +
                 Math.sin(effectiveT * 5 + this._seed) * 15;

      const alpha = p.alpha * (1 - Math.abs(t - 0.5) * 2) * 1.5;
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.beginPath();
      ctx.arc(px, py, p.size * (0.5 + eased * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.fill();
      ctx.restore();
    }
  }

  _renderInkWash(ctx, W, H, t, eased) {
    if (!this._inkDrops) return;

    for (const drop of this._inkDrops) {
      const effectiveT = Math.max(0, t - drop.delay);
      if (effectiveT <= 0) continue;

      const radius = drop.maxRadius * this._easeOutQuart(Math.min(effectiveT * 2, 1));
      const alpha = t < 0.7 ? eased * 0.95 : eased * 0.95;

      ctx.save();
      ctx.globalAlpha = alpha;

      // 不规则墨水边缘（使用多层圆弧叠加）
      const gradient = ctx.createRadialGradient(
        drop.x, drop.y, 0,
        drop.x, drop.y, radius
      );
      gradient.addColorStop(0, 'rgba(10, 10, 30, 0.95)');
      gradient.addColorStop(0.7, 'rgba(10, 10, 30, 0.8)');
      gradient.addColorStop(0.9, 'rgba(20, 15, 40, 0.4)');
      gradient.addColorStop(1, 'rgba(20, 15, 40, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      // 使用多段贝塞尔曲线模拟不规则边缘
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI * 2 / segments) * i;
        const wobble = 1 + Math.sin(angle * 3 + this._seed + effectiveT * 2) * 0.15;
        const r = radius * wobble;
        const x = drop.x + Math.cos(angle) * r;
        const y = drop.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  _renderElementBurst(ctx, W, H, t, eased) {
    const color = this.config.color || '#7c5cbf';
    const cx = W / 2, cy = H / 2;

    // 底幕
    ctx.fillStyle = `rgba(0, 0, 0, ${eased * 0.7})`;
    ctx.fillRect(0, 0, W, H);

    // 元素光芒从中心爆发
    const rayCount = 16;
    const burstRadius = eased * Math.max(W, H);
    ctx.save();
    ctx.globalAlpha = eased * (1 - Math.abs(t - 0.5) * 1.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 / rayCount) * i + t * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(angle) * burstRadius,
        cy + Math.sin(angle) * burstRadius
      );
      ctx.stroke();
    }

    // 中心光球
    const glowRadius = eased * 80;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glow.addColorStop(0, color);
    glow.addColorStop(0.5, color + '88');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);
    ctx.restore();
  }

  _renderBlinds(ctx, W, H, t, eased) {
    const blindCount = 8;
    const blindH = H / blindCount;

    ctx.fillStyle = '#000';
    for (let i = 0; i < blindCount; i++) {
      const delay = i * 0.04;
      const localT = Math.max(0, Math.min(1, (t - delay) / (1 - delay * blindCount * 0.5)));
      const localEased = this._easeInOutCubic(localT < 0.5 ? localT * 2 : (1 - localT) * 2);
      const h = blindH * localEased;
      const y = i * blindH + (blindH - h) / 2;
      ctx.fillRect(0, y, W, h);
    }
  }

  _renderDiamond(ctx, W, H, t, eased) {
    const cx = W / 2, cy = H / 2;
    const maxDist = W + H;
    const size = eased * maxDist;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill('evenodd');
    ctx.restore();
  }

  _renderCircleReveal(ctx, W, H, t, eased) {
    const cx = W / 2, cy = H / 2;
    const maxRadius = Math.sqrt(W * W + H * H) / 2;
    const radius = maxRadius * (t < 0.5 ? (1 - eased) : eased);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2, true);
    ctx.fillStyle = '#000';
    ctx.fill('evenodd');
    ctx.restore();
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }
}

// ============ 3. 动态天气与环境光效系统 ============
class WeatherSystem {
  constructor() {
    this.type = 'none'; // none | rain | snow | fog | light_rays | dust_storm | sakura | embers
    this.intensity = 1.0;
    this.particles = [];
    this._time = 0;
    this.enabled = true;
    this.transitionAlpha = 0;
    this.targetAlpha = 0;
    this.config = {};
  }

  /**
   * 设置天气类型
   * @param {string} type
   * @param {object} config - { intensity, wind, color, ... }
   */
  setWeather(type, config = {}) {
    if (this.type === type && !config.force) return;
    this.type = type;
    this.config = config;
    this.intensity = config.intensity || 1.0;
    this.targetAlpha = 1;
    this.particles = [];
    this._initWeather(type, config);
  }

  _initWeather(type, config) {
    const W = 1280, H = 720;
    switch (type) {
      case 'rain':
        for (let i = 0; i < 150 * this.intensity; i++) {
          this.particles.push(this._createRainDrop(W, H, config));
        }
        break;
      case 'snow':
        for (let i = 0; i < 80 * this.intensity; i++) {
          this.particles.push(this._createSnowFlake(W, H, config));
        }
        break;
      case 'fog':
        for (let i = 0; i < 6; i++) {
          this.particles.push(this._createFogPatch(W, H, config));
        }
        break;
      case 'light_rays':
        for (let i = 0; i < 5; i++) {
          this.particles.push(this._createLightRay(W, H, config));
        }
        break;
      case 'sakura':
        for (let i = 0; i < 40 * this.intensity; i++) {
          this.particles.push(this._createSakuraPetal(W, H, config));
        }
        break;
      case 'embers':
        for (let i = 0; i < 30 * this.intensity; i++) {
          this.particles.push(this._createEmber(W, H, config));
        }
        break;
      case 'dust_storm':
        for (let i = 0; i < 60 * this.intensity; i++) {
          this.particles.push(this._createDustParticle(W, H, config));
        }
        break;
    }
  }

  _createRainDrop(W, H, config) {
    const wind = config.wind || 0.3;
    return {
      x: Math.random() * (W + 200) - 100,
      y: Math.random() * H - H,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 600 + 400,
      windSpeed: wind * (Math.random() * 100 + 50),
      alpha: Math.random() * 0.3 + 0.15,
      thickness: Math.random() * 1.5 + 0.5
    };
  }

  _createSnowFlake(W, H, config) {
    return {
      x: Math.random() * W,
      y: Math.random() * H - H,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 60 + 30,
      wobbleAmp: Math.random() * 30 + 10,
      wobbleSpeed: Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.6 + 0.3
    };
  }

  _createFogPatch(W, H, config) {
    return {
      x: Math.random() * W * 1.5 - W * 0.25,
      y: H * 0.4 + Math.random() * H * 0.4,
      width: Math.random() * 600 + 300,
      height: Math.random() * 150 + 80,
      speed: Math.random() * 20 + 10,
      alpha: Math.random() * 0.15 + 0.05,
      phase: Math.random() * Math.PI * 2
    };
  }

  _createLightRay(W, H, config) {
    const angle = config.angle || -0.3;
    return {
      x: Math.random() * W,
      width: Math.random() * 60 + 20,
      alpha: Math.random() * 0.08 + 0.02,
      angle: angle + (Math.random() - 0.5) * 0.1,
      pulseSpeed: Math.random() * 0.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      color: config.rayColor || 'rgba(255, 240, 200, 0.5)'
    };
  }

  _createSakuraPetal(W, H, config) {
    return {
      x: Math.random() * W * 1.2 - W * 0.1,
      y: Math.random() * H - H,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 40 + 20,
      windSpeed: Math.random() * 60 + 30,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3,
      wobbleAmp: Math.random() * 40 + 20,
      wobbleFreq: Math.random() * 2 + 1,
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.3,
      color: config.color || (Math.random() > 0.5 ? '#ffb7c5' : '#ff92a5')
    };
  }

  _createEmber(W, H, config) {
    return {
      x: Math.random() * W,
      y: H + Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 80 + 40,
      windSpeed: (Math.random() - 0.5) * 40,
      alpha: Math.random() * 0.8 + 0.2,
      life: 0,
      maxLife: Math.random() * 3 + 2,
      color: config.color || (Math.random() > 0.3 ? '#ff6633' : '#ffaa33')
    };
  }

  _createDustParticle(W, H, config) {
    return {
      x: -50 + Math.random() * 100,
      y: Math.random() * H,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 200 + 100,
      alpha: Math.random() * 0.3 + 0.1,
      wobbleAmp: Math.random() * 20 + 5,
      wobbleSpeed: Math.random() * 3 + 1,
      phase: Math.random() * Math.PI * 2,
      color: config.color || '#c8a060'
    };
  }

  update(dt) {
    if (!this.enabled) return;
    this._time += dt;

    // 平滑淡入淡出
    const lerp = 1 - Math.pow(0.05, dt);
    this.transitionAlpha += (this.targetAlpha - this.transitionAlpha) * lerp;

    const W = 1280, H = 720;

    switch (this.type) {
      case 'rain':
        for (const p of this.particles) {
          p.y += p.speed * dt;
          p.x += p.windSpeed * dt;
          if (p.y > H + 20) {
            p.y = -p.length;
            p.x = Math.random() * (W + 200) - 100;
          }
        }
        break;

      case 'snow':
        for (const p of this.particles) {
          p.y += p.speed * dt;
          p.x += Math.sin(this._time * p.wobbleSpeed + p.phase) * p.wobbleAmp * dt;
          if (p.y > H + 10) {
            p.y = -10;
            p.x = Math.random() * W;
          }
        }
        break;

      case 'fog':
        for (const p of this.particles) {
          p.x += p.speed * dt;
          p.phase += dt * 0.3;
          if (p.x > W + p.width) {
            p.x = -p.width;
          }
        }
        break;

      case 'sakura':
        for (const p of this.particles) {
          p.y += p.speed * dt;
          p.x += p.windSpeed * dt + Math.sin(this._time * p.wobbleFreq + p.phase) * p.wobbleAmp * dt;
          p.rotation += p.rotSpeed * dt;
          if (p.y > H + 20 || p.x > W + 50) {
            p.y = -20;
            p.x = Math.random() * W * 0.8 - W * 0.1;
          }
        }
        break;

      case 'embers':
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.life += dt;
          p.y -= p.speed * dt;
          p.x += p.windSpeed * dt + Math.sin(this._time * 2 + i) * 10 * dt;
          p.alpha = (1 - p.life / p.maxLife) * 0.8;
          if (p.life >= p.maxLife || p.y < -20) {
            // 重生
            p.x = Math.random() * W;
            p.y = H + Math.random() * 50;
            p.life = 0;
            p.alpha = Math.random() * 0.8 + 0.2;
          }
        }
        break;

      case 'dust_storm':
        for (const p of this.particles) {
          p.x += p.speed * dt;
          p.y += Math.sin(this._time * p.wobbleSpeed + p.phase) * p.wobbleAmp * dt;
          if (p.x > W + 50) {
            p.x = -50;
            p.y = Math.random() * H;
          }
        }
        break;
    }
  }

  render(ctx, W, H) {
    if (!this.enabled || this.transitionAlpha < 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.transitionAlpha;

    switch (this.type) {
      case 'rain':
        this._renderRain(ctx, W, H);
        break;
      case 'snow':
        this._renderSnow(ctx, W, H);
        break;
      case 'fog':
        this._renderFog(ctx, W, H);
        break;
      case 'light_rays':
        this._renderLightRays(ctx, W, H);
        break;
      case 'sakura':
        this._renderSakura(ctx, W, H);
        break;
      case 'embers':
        this._renderEmbers(ctx, W, H);
        break;
      case 'dust_storm':
        this._renderDustStorm(ctx, W, H);
        break;
    }

    ctx.restore();
  }

  _renderRain(ctx, W, H) {
    ctx.strokeStyle = 'rgba(180, 200, 230, 0.4)';
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha * this.transitionAlpha;
      ctx.lineWidth = p.thickness;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.windSpeed * 0.02, p.y + p.length);
      ctx.stroke();
    }

    // 地面水花
    ctx.globalAlpha = 0.1 * this.transitionAlpha;
    const splashCount = 15;
    for (let i = 0; i < splashCount; i++) {
      const sx = (i * 97 + this._time * 200) % W;
      const sy = H - 5 + Math.sin(this._time * 10 + i * 3) * 3;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 8, 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180, 200, 230, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  _renderSnow(ctx, W, H) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha * this.transitionAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#aaccff';
      ctx.shadowBlur = p.size * 2;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  _renderFog(ctx, W, H) {
    for (const p of this.particles) {
      const pulseAlpha = p.alpha * (0.7 + Math.sin(p.phase) * 0.3);
      ctx.globalAlpha = pulseAlpha * this.transitionAlpha;

      const gradient = ctx.createRadialGradient(
        p.x + p.width / 2, p.y, 0,
        p.x + p.width / 2, p.y, p.width / 2
      );
      gradient.addColorStop(0, 'rgba(180, 180, 200, 0.15)');
      gradient.addColorStop(0.6, 'rgba(150, 150, 180, 0.08)');
      gradient.addColorStop(1, 'rgba(150, 150, 180, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(p.x, p.y - p.height / 2, p.width, p.height);
    }
  }

  _renderLightRays(ctx, W, H) {
    for (const ray of this.particles) {
      const pulseAlpha = ray.alpha * (0.6 + Math.sin(this._time * ray.pulseSpeed + ray.phase) * 0.4);
      ctx.globalAlpha = pulseAlpha * this.transitionAlpha;

      ctx.save();
      ctx.translate(ray.x, 0);
      ctx.rotate(ray.angle);

      const gradient = ctx.createLinearGradient(0, 0, 0, H * 1.5);
      gradient.addColorStop(0, ray.color);
      gradient.addColorStop(0.5, ray.color.replace('0.5', '0.2'));
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-ray.width / 2, 0);
      ctx.lineTo(ray.width / 2, 0);
      ctx.lineTo(ray.width * 1.5, H * 1.5);
      ctx.lineTo(-ray.width, H * 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  _renderSakura(ctx, W, H) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * this.transitionAlpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // 花瓣形状
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 高光
      ctx.globalAlpha = p.alpha * 0.3 * this.transitionAlpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(p.size * 0.2, -p.size * 0.1, p.size * 0.3, p.size * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  _renderEmbers(ctx, W, H) {
    for (const p of this.particles) {
      if (p.alpha <= 0) continue;
      ctx.globalAlpha = p.alpha * this.transitionAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 4;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  _renderDustStorm(ctx, W, H) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha * this.transitionAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // 沙暴整体色调叠加
    ctx.globalAlpha = 0.08 * this.transitionAlpha;
    ctx.fillStyle = '#c8a060';
    ctx.fillRect(0, 0, W, H);
  }

  /** 停止天气效果 */
  stop() {
    this.targetAlpha = 0;
  }

  /** 立即清除 */
  clear() {
    this.type = 'none';
    this.particles = [];
    this.transitionAlpha = 0;
    this.targetAlpha = 0;
  }
}

// ============ 4. 对话场景演出增强 ============
class DialogueFX {
  constructor() {
    this.effects = [];
    this._time = 0;
    this.screenFlash = { active: false, alpha: 0, color: '#fff' };
    this.emotionParticles = [];
    this.textEffects = { shake: 0, scale: 1, color: null };
  }

  /** 屏幕闪光（用于冲击性台词） */
  triggerFlash(color = '#fff', duration = 0.15) {
    this.screenFlash = {
      active: true,
      alpha: 0.4,
      maxAlpha: 0.4,
      color,
      duration,
      elapsed: 0
    };
  }

  /** 情绪粒子（在角色周围生成元素/情绪粒子） */
  triggerEmotion(charSlot, emotion, element) {
    const W = 1280, H = 720;
    const baseX = charSlot === 'left' ? W * 0.25 : W * 0.75;
    const baseY = H * 0.4;
    const colorMap = {
      'angry': '#ff4444',
      'sad': '#4488cc',
      'happy': '#ffcc44',
      'surprised': '#ffffff',
      'fear': '#8844aa',
      'love': '#ff6688',
      'determined': '#ff8833'
    };
    const color = colorMap[emotion] || '#7c5cbf';

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
      this.emotionParticles.push({
        x: baseX + (Math.random() - 0.5) * 40,
        y: baseY + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * (Math.random() * 60 + 30),
        vy: Math.sin(angle) * (Math.random() * 60 + 30) - 20,
        size: Math.random() * 4 + 2,
        alpha: 0.8,
        color,
        life: 0,
        maxLife: Math.random() * 0.8 + 0.4
      });
    }
  }

  /** 文字特效（台词级别的视觉强调） */
  setTextEffect(effect) {
    this.textEffects = {
      shake: effect.shake || 0,
      scale: effect.scale || 1,
      color: effect.color || null,
      glow: effect.glow || null,
      duration: effect.duration || 0,
      elapsed: 0
    };
  }

  /** 根据台词内容自动推断并应用特效 */
  autoDetectTextEffect(text, speaker) {
    // 感叹号密集 → 震动
    if ((text.match(/[！!]/g) || []).length >= 2) {
      this.setTextEffect({ shake: 3, duration: 0.3 });
      return;
    }
    // 问号/震惊 → 闪光
    if (text.includes('！？') || text.includes('什么') || text.includes('不可能')) {
      this.triggerFlash('#ffffff', 0.1);
      return;
    }
    // 长省略号 → 低沉
    if (text.includes('……') && text.length < 15) {
      this.setTextEffect({ color: '#8888aa', scale: 0.95, duration: 2 });
      return;
    }
  }

  update(dt) {
    this._time += dt;

    // 屏幕闪光
    if (this.screenFlash.active) {
      this.screenFlash.elapsed += dt;
      const t = this.screenFlash.elapsed / this.screenFlash.duration;
      this.screenFlash.alpha = this.screenFlash.maxAlpha * (1 - t);
      if (t >= 1) {
        this.screenFlash.active = false;
      }
    }

    // 情绪粒子
    for (let i = this.emotionParticles.length - 1; i >= 0; i--) {
      const p = this.emotionParticles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 30 * dt; // 上浮
      p.alpha = (1 - p.life / p.maxLife) * 0.8;
      p.size *= (1 - dt * 0.5);
      if (p.life >= p.maxLife) {
        this.emotionParticles.splice(i, 1);
      }
    }

    // 文字特效衰减
    if (this.textEffects.duration > 0) {
      this.textEffects.elapsed += dt;
      if (this.textEffects.elapsed >= this.textEffects.duration) {
        this.textEffects = { shake: 0, scale: 1, color: null };
      }
    }
  }

  render(ctx, W, H) {
    // 情绪粒子
    for (const p of this.emotionParticles) {
      if (p.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 3;
      ctx.fill();
      ctx.restore();
    }

    // 屏幕闪光
    if (this.screenFlash.active && this.screenFlash.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.screenFlash.alpha;
      ctx.fillStyle = this.screenFlash.color;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  /** 获取文字渲染偏移（用于台词震动效果） */
  getTextOffset() {
    if (this.textEffects.shake <= 0) return { x: 0, y: 0 };
    const intensity = this.textEffects.shake * (1 - this.textEffects.elapsed / this.textEffects.duration);
    return {
      x: (Math.random() - 0.5) * intensity * 2,
      y: (Math.random() - 0.5) * intensity * 2
    };
  }

  reset() {
    this.effects = [];
    this.emotionParticles = [];
    this.screenFlash.active = false;
    this.textEffects = { shake: 0, scale: 1, color: null };
  }
}

// ============ 5. 电影感标题动画 ============
class CinematicTitle {
  constructor() {
    this.active = false;
    this.phase = 0;        // 0=黑幕, 1=光芒, 2=标题入场, 3=副标题, 4=按钮入场, 5=完成
    this.elapsed = 0;
    this.totalDuration = 4.5;
    this.lightRays = [];
    this.titleParticles = [];
    this._initialized = false;
  }

  start() {
    this.active = true;
    this.phase = 0;
    this.elapsed = 0;
    this._initialized = false;

    // 初始化光线
    this.lightRays = [];
    for (let i = 0; i < 8; i++) {
      this.lightRays.push({
        angle: -0.4 + (Math.random() - 0.5) * 0.2,
        x: 200 + Math.random() * 880,
        width: Math.random() * 40 + 15,
        alpha: Math.random() * 0.06 + 0.02,
        pulseSpeed: Math.random() * 0.8 + 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 标题粒子
    this.titleParticles = [];
    for (let i = 0; i < 30; i++) {
      this.titleParticles.push({
        x: 640 + (Math.random() - 0.5) * 400,
        y: 320 + (Math.random() - 0.5) * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 30 + 10,
        alpha: 0,
        targetAlpha: Math.random() * 0.5 + 0.3,
        color: ['#d4b8ff', '#7c5cbf', '#5c8abf', '#ffd700'][Math.floor(Math.random() * 4)]
      });
    }
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;

    // 阶段时间映射
    if (this.elapsed < 0.8) this.phase = 0;        // 黑幕
    else if (this.elapsed < 1.8) this.phase = 1;    // 光芒
    else if (this.elapsed < 2.8) this.phase = 2;    // 标题入场
    else if (this.elapsed < 3.6) this.phase = 3;    // 副标题
    else if (this.elapsed < 4.5) this.phase = 4;    // 按钮入场
    else {
      this.phase = 5;
      this.active = false;
    }

    // 粒子更新
    for (const p of this.titleParticles) {
      p.y -= p.speed * dt;
      p.alpha += (p.targetAlpha - p.alpha) * dt * 2;
      if (p.y < 200) {
        p.y = 400 + Math.random() * 100;
        p.alpha = 0;
      }
    }
  }

  render(ctx, W, H) {
    if (!this.active && this.phase < 5) return;

    const t = this.elapsed;

    // Phase 0: 纯黑幕缓缓淡出
    if (this.phase === 0) {
      const p = t / 0.8;
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - p * 0.2})`;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // Phase 1: 光芒穿透
    if (this.phase >= 1 && this.phase <= 4) {
      const p = Math.min(1, (t - 0.8) / 1.0);

      // 光线
      for (const ray of this.lightRays) {
        const pulseAlpha = ray.alpha * (0.5 + Math.sin(t * ray.pulseSpeed + ray.phase) * 0.5);
        const rayAlpha = pulseAlpha * Math.min(1, p * 2) * (this.phase >= 4 ? 0.5 : 1);
        ctx.save();
        ctx.globalAlpha = rayAlpha;
        ctx.translate(ray.x, 0);
        ctx.rotate(ray.angle);

        const gradient = ctx.createLinearGradient(0, 0, 0, H * 1.5);
        gradient.addColorStop(0, 'rgba(212, 184, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(124, 92, 191, 0.15)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-ray.width, 0);
        ctx.lineTo(ray.width, 0);
        ctx.lineTo(ray.width * 2, H * 1.5);
        ctx.lineTo(-ray.width * 2, H * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 标题粒子
    if (this.phase >= 2) {
      for (const p of this.titleParticles) {
        ctx.save();
        ctx.globalAlpha = p.alpha * (this.phase >= 4 ? 0.3 : 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /** 检查标题动画是否完成（用于控制按钮显示时机） */
  isComplete() {
    return this.phase >= 5;
  }

  /** 获取各元素入场时机 */
  getTitleAlpha() {
    if (this.phase < 2) return 0;
    if (this.phase === 2) return Math.min(1, (this.elapsed - 1.8) / 0.8);
    return 1;
  }

  getSubtitleAlpha() {
    if (this.phase < 3) return 0;
    if (this.phase === 3) return Math.min(1, (this.elapsed - 2.8) / 0.6);
    return 1;
  }

  getButtonAlpha() {
    if (this.phase < 4) return 0;
    if (this.phase === 4) return Math.min(1, (this.elapsed - 3.6) / 0.7);
    return 1;
  }
}

// ============ 6. 屏幕后处理特效 ============
class ScreenFX {
  constructor() {
    this.vignette = { enabled: true, intensity: 0.4, radius: 0.7 };
    this.filmGrain = { enabled: false, intensity: 0.03, speed: 8 };
    this.chromaticAberration = { enabled: false, intensity: 2 };
    this.bloom = { enabled: false, intensity: 0.1, threshold: 0.8 };
    this.colorGrade = { enabled: false, overlay: null, alpha: 0 }; // 色彩倾向
    this._time = 0;
    this._vignetteGradient = null;
    this._lastW = 0;
    this._lastH = 0;
  }

  /** 设置场景氛围预设 */
  setPreset(preset) {
    switch (preset) {
      case 'battle':
        this.vignette = { enabled: true, intensity: 0.5, radius: 0.65 };
        this.filmGrain = { enabled: true, intensity: 0.02, speed: 10 };
        this.chromaticAberration = { enabled: false, intensity: 0 };
        break;
      case 'story':
        this.vignette = { enabled: true, intensity: 0.35, radius: 0.75 };
        this.filmGrain = { enabled: false, intensity: 0, speed: 0 };
        this.chromaticAberration = { enabled: false, intensity: 0 };
        break;
      case 'horror':
        this.vignette = { enabled: true, intensity: 0.7, radius: 0.5 };
        this.filmGrain = { enabled: true, intensity: 0.05, speed: 12 };
        this.chromaticAberration = { enabled: true, intensity: 3 };
        break;
      case 'dream':
        this.vignette = { enabled: true, intensity: 0.3, radius: 0.8 };
        this.filmGrain = { enabled: false, intensity: 0, speed: 0 };
        this.colorGrade = { enabled: true, overlay: 'rgba(120, 80, 180, 0.08)', alpha: 0.08 };
        break;
      case 'title':
        this.vignette = { enabled: true, intensity: 0.55, radius: 0.6 };
        this.filmGrain = { enabled: true, intensity: 0.015, speed: 6 };
        break;
      case 'none':
      default:
        this.vignette = { enabled: true, intensity: 0.4, radius: 0.7 };
        this.filmGrain = { enabled: false, intensity: 0, speed: 0 };
        this.chromaticAberration = { enabled: false, intensity: 0 };
        this.colorGrade = { enabled: false, overlay: null, alpha: 0 };
    }
  }

  update(dt) {
    this._time += dt;
  }

  render(ctx, W, H) {
    // 暗角
    if (this.vignette.enabled) {
      this._renderVignette(ctx, W, H);
    }

    // 胶片颗粒
    if (this.filmGrain.enabled) {
      this._renderFilmGrain(ctx, W, H);
    }

    // 色彩叠加
    if (this.colorGrade.enabled && this.colorGrade.overlay) {
      ctx.save();
      ctx.globalAlpha = this.colorGrade.alpha;
      ctx.fillStyle = this.colorGrade.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  _renderVignette(ctx, W, H) {
    // 缓存渐变（仅在尺寸变化时重建）
    if (this._lastW !== W || this._lastH !== H || !this._vignetteGradient) {
      const cx = W / 2, cy = H / 2;
      const outerRadius = Math.sqrt(W * W + H * H) / 2;
      const innerRadius = outerRadius * this.vignette.radius;

      this._vignetteGradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
      this._vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      this._vignetteGradient.addColorStop(0.5, `rgba(0, 0, 0, ${this.vignette.intensity * 0.3})`);
      this._vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignette.intensity})`);

      this._lastW = W;
      this._lastH = H;
    }

    ctx.fillStyle = this._vignetteGradient;
    ctx.fillRect(0, 0, W, H);
  }

  _renderFilmGrain(ctx, W, H) {
    // 使用稀疏噪点模拟（性能友好）
    const density = Math.floor(W * H * this.filmGrain.intensity * 0.005);
    const time = Math.floor(this._time * this.filmGrain.speed);

    ctx.save();
    ctx.globalAlpha = this.filmGrain.intensity;
    for (let i = 0; i < density; i++) {
      // 伪随机位置（使用帧号+索引做种子）
      const seed = (i * 7919 + time * 104729) % (W * H);
      const x = seed % W;
      const y = Math.floor(seed / W) % H;
      const brightness = ((seed * 31) % 256);
      const size = 1 + ((seed * 17) % 2);

      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  reset() {
    this._vignetteGradient = null;
    this._lastW = 0;
    this._lastH = 0;
  }
}

// ============ 主控制器 ============
class SceneEffectsController {
  constructor() {
    this.parallax = new ParallaxBackground();
    this.transitions = new EnhancedTransitions();
    this.weather = new WeatherSystem();
    this.dialogueFX = new DialogueFX();
    this.cinematicTitle = new CinematicTitle();
    this.screenFX = new ScreenFX();
    this._time = 0;
  }

  update(dt) {
    this._time += dt;
    this.parallax.update(dt);
    this.transitions.update(dt);
    this.weather.update(dt);
    this.dialogueFX.update(dt);
    this.cinematicTitle.update(dt);
    this.screenFX.update(dt);
  }

  /** 渲染所有后处理效果（在主场景渲染之后调用） */
  renderPostProcess(ctx, W, H) {
    this.weather.render(ctx, W, H);
    this.screenFX.render(ctx, W, H);
    this.dialogueFX.render(ctx, W, H);
  }

  /** 渲染转场覆盖层 */
  renderTransition(ctx, W, H) {
    this.transitions.render(ctx, W, H);
  }

  /** 根据剧情背景键名自动匹配天气和氛围预设 */
  autoSetAtmosphere(bgKey) {
    if (!bgKey) return;

    // 天气映射
    const weatherMap = {
      'awakening_void': { type: 'light_rays', config: { angle: -0.2, rayColor: 'rgba(180, 160, 255, 0.4)' } },
      'dark_forest': { type: 'fog', config: { intensity: 0.8 } },
      'ancient_ruins': { type: 'light_rays', config: { angle: -0.3, rayColor: 'rgba(255, 240, 180, 0.3)' } },
      'morning_town': { type: 'light_rays', config: { angle: -0.15, rayColor: 'rgba(255, 220, 150, 0.4)' } },
      'moonlit_clearing': { type: 'light_rays', config: { angle: 0.1, rayColor: 'rgba(180, 200, 255, 0.3)' } },
      'shadow_base': { type: 'embers', config: { color: '#8844cc', intensity: 0.6 } },
      'shadow_realm': { type: 'embers', config: { color: '#aa33ff', intensity: 0.8 } },
      'shadow_confession': { type: 'fog', config: { intensity: 0.5 } },
      'light_sanctuary': { type: 'sakura', config: { color: '#ffd700', intensity: 0.5 } },
      'light_dawn': { type: 'light_rays', config: { angle: -0.25, rayColor: 'rgba(255, 200, 100, 0.5)' } },
      'crystal_cave': { type: 'light_rays', config: { angle: 0.2, rayColor: 'rgba(100, 150, 255, 0.3)' } },
      'star_abyss': { type: 'embers', config: { color: '#5588ff', intensity: 0.4 } },
      'holy_sanctuary': { type: 'sakura', config: { color: '#ffddaa', intensity: 0.6 } },
      'chaos_void': { type: 'embers', config: { color: '#ff3366', intensity: 0.7 } }
    };

    // 氛围预设映射
    const presetMap = {
      'shadow_base': 'horror',
      'shadow_realm': 'horror',
      'shadow_ruins': 'horror',
      'chaos_void': 'horror',
      'awakening_void': 'dream',
      'moonlit_clearing': 'dream',
      'light_sanctuary': 'dream',
      'arena_default': 'battle',
      'forest_dark': 'battle',
      'star_abyss': 'battle',
      'holy_sanctuary': 'battle'
    };

    // 应用天气
    const weatherConfig = weatherMap[bgKey];
    if (weatherConfig) {
      this.weather.setWeather(weatherConfig.type, weatherConfig.config);
    } else {
      this.weather.stop();
    }

    // 应用屏幕后处理预设
    const preset = presetMap[bgKey] || 'story';
    this.screenFX.setPreset(preset);
  }

  /** 重置所有效果 */
  resetAll() {
    this.parallax.reset();
    this.weather.clear();
    this.dialogueFX.reset();
    this.screenFX.reset();
    this.cinematicTitle.active = false;
  }
}

// ============ 导出 ============
window.ParallaxBackground = ParallaxBackground;
window.EnhancedTransitions = EnhancedTransitions;
window.WeatherSystem = WeatherSystem;
window.DialogueFX = DialogueFX;
window.CinematicTitle = CinematicTitle;
window.ScreenFX = ScreenFX;
window.SceneEffectsController = SceneEffectsController;
