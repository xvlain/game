/**
 * engine.js - 核心游戏引擎
 * 负责场景管理、渲染循环、输入处理、Canvas 管理
 * v0.3.0 - 新增资源加载器、触摸手势支持
 */

// ============ 场景管理器 ============
class SceneManager {
  constructor() {
    this.scenes = {};
    this.currentScene = null;
    this.currentSceneName = '';
    this.transitioning = false;
    this.transitionAlpha = 0;
    this.transitionCallback = null;
  }

  register(name, scene) {
    this.scenes[name] = scene;
    scene.sceneManager = this;
  }

  switchTo(name, data = {}) {
    if (this.transitioning) return;
    if (!this.scenes[name]) {
      console.error('[SceneManager] 场景不存在:', name);
      return;
    }
    this.transitioning = true;

    // 从特定场景离开时触发自动存档
    const saveTriggerScenes = ['growth', 'party', 'gacha', 'battle', 'story_map'];
    if (saveTriggerScenes.includes(this.currentSceneName)) {
      if (typeof autoSave === 'function') {
        autoSave().then(() => {
          console.log('[SceneManager] 场景切换存档完成');
        }).catch(e => console.warn('[SceneManager] 场景切换存档失败:', e));
      }
    }

    const fadeOut = () => {
      this.transitionAlpha += 0.05;
      if (this.transitionAlpha >= 1) {
        this.transitionAlpha = 1;
        if (this.currentScene && this.currentScene.onExit) {
          this.currentScene.onExit();
        }
        this.currentScene = this.scenes[name];
        this.currentSceneName = name;
        if (this.currentScene && this.currentScene.onEnter) {
          this.currentScene.onEnter(data);
        }
        fadeIn();
        return;
      }
      requestAnimationFrame(fadeOut);
    };

    const fadeIn = () => {
      this.transitionAlpha -= 0.05;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this.transitioning = false;
        return;
      }
      requestAnimationFrame(fadeIn);
    };

    fadeOut();
  }

  update(dt) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(dt);
    }
  }

  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }
    if (this.transitionAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
}

// ============ 输入管理器 ============
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.clickHandlers = [];
    this.keyHandlers = [];
    this.swipeHandlers = [];
    this._lastClick = 0;
    this._touchStart = null;

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this._emitClick(x, y);
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        this._touchStart = {
          x: (touch.clientX - rect.left) * (canvas.width / rect.width),
          y: (touch.clientY - rect.top) * (canvas.height / rect.height),
          time: Date.now()
        };
      }
    });

    canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

        // 检测滑动
        if (this._touchStart) {
          const dx = x - this._touchStart.x;
          const dy = y - this._touchStart.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const elapsed = Date.now() - this._touchStart.time;

          if (dist > 50 && elapsed < 500) {
            const direction = Math.abs(dx) > Math.abs(dy)
              ? (dx > 0 ? 'right' : 'left')
              : (dy > 0 ? 'down' : 'up');
            for (const handler of this.swipeHandlers) {
              handler(direction, dist);
            }
            this._touchStart = null;
            return;
          }
        }

        this._emitClick(x, y);
      }
      this._touchStart = null;
    });

    document.addEventListener('keydown', (e) => {
      for (const handler of this.keyHandlers) {
        handler(e);
      }
    });
  }

  _emitClick(x, y) {
    const now = Date.now();
    if (now - this._lastClick < 100) return;
    this._lastClick = now;
    for (const handler of this.clickHandlers) {
      handler(x, y);
    }
  }

  onClick(handler) { this.clickHandlers.push(handler); }
  onKey(handler) { this.keyHandlers.push(handler); }
  onSwipe(handler) { this.swipeHandlers.push(handler); }

  clearHandlers() {
    this.clickHandlers = [];
    this.keyHandlers = [];
    this.swipeHandlers = [];
  }
}

// ============ 渲染工具 ============
const Renderer = {
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  drawButton(ctx, x, y, w, h, text, options = {}) {
    const {
      bgColor = '#2a2a3e',
      textColor = '#e0e0e0',
      borderColor = '#5c4d9a',
      fontSize = 18,
      hover = false,
      disabled = false,
      icon = null
    } = options;

    ctx.save();
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = disabled ? '#1a1a2a' : (hover ? '#3a3a5e' : bgColor);
    ctx.fill();
    ctx.strokeStyle = disabled ? '#333' : borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = disabled ? '#555' : textColor;
    ctx.font = `${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (icon) {
      ctx.font = `${fontSize + 4}px serif`;
      ctx.fillText(icon, x + 20, y + h / 2);
      ctx.font = `${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(text, x + w / 2 + 10, y + h / 2);
    } else {
      ctx.fillText(text, x + w / 2, y + h / 2);
    }

    ctx.restore();
  },

  hitTest(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w &&
           y >= rect.y && y <= rect.y + rect.h;
  },

  drawBar(ctx, x, y, w, h, value, max, color, bgColor = '#1a1a2a') {
    ctx.save();
    this.roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = bgColor;
    ctx.fill();

    const ratio = Math.max(0, Math.min(1, value / max));
    if (ratio > 0) {
      this.roundRect(ctx, x, y, w * ratio, h, h / 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
  },

  drawText(ctx, text, x, y, options = {}) {
    const {
      fontSize = 16,
      color = '#e0e0e0',
      align = 'left',
      shadow = true,
      maxWidth = null,
      font = '"Noto Sans SC", "Microsoft YaHei", sans-serif'
    } = options;

    ctx.save();
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    ctx.fillStyle = color;
    if (maxWidth) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  },

  drawPanel(ctx, x, y, w, h, options = {}) {
    const { bg = 'rgba(20, 20, 35, 0.9)', border = '#5c4d9a', radius = 12 } = options;
    ctx.save();
    this.roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = bg;
    ctx.fill();
    if (border !== 'transparent') {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  },

  drawParticles(ctx, particles) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // 绘制头像占位（元素色圆形 + 首字）
  drawAvatar(ctx, x, y, radius, name, element, options = {}) {
    const { isActive = false, isDead = false } = options;
    const elemColor = ElementSystem.colors[element] || '#999';

    ctx.save();

    // 外圈
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#5cb8ff' : (isDead ? '#333' : '#303060');
    ctx.fill();

    // 内圈（元素色渐变）
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    grad.addColorStop(0, elemColor);
    grad.addColorStop(1, isDead ? '#1a1a1a' : this._darkenColor(elemColor, 0.4));
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 首字
    ctx.fillStyle = isDead ? '#555' : '#fff';
    ctx.font = `bold ${radius}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name ? name.charAt(0) : '?', x, y + 1);

    ctx.restore();
  },

  // 颜色加深工具
  _darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  },

  // 绘制滚动列表
  drawScrollList(ctx, items, startX, startY, itemW, itemH, gap, visibleCount, scrollOffset, renderItem) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX - 5, startY - 5, itemW + 10, (itemH + gap) * visibleCount + 10);
    ctx.clip();

    for (let i = 0; i < items.length; i++) {
      const y = startY + i * (itemH + gap) - scrollOffset;
      if (y + itemH < startY - 20 || y > startY + visibleCount * (itemH + gap) + 20) continue;
      renderItem(ctx, items[i], startX, y, itemW, itemH, i);
    }

    ctx.restore();
  }
};

// ============ 动画系统 ============
class AnimationManager {
  constructor() {
    this.animations = [];
  }

  add(animation) {
    animation.elapsed = 0;
    animation.progress = 0;
    this.animations.push(animation);
    return animation;
  }

  update(dt) {
    this.animations = this.animations.filter(anim => {
      anim.elapsed += dt;
      if (anim.elapsed >= anim.duration) {
        if (anim.onComplete) anim.onComplete();
        return false;
      }
      anim.progress = anim.elapsed / anim.duration;
      if (anim.onUpdate) anim.onUpdate(anim.progress);
      return true;
    });
  }

  clear() {
    this.animations = [];
  }
}

const Easing = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

// ============ 音频管理器（Web Audio API） ============
class AudioManager {
  constructor() {
    this.enabled = true;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;
    this.masterVolume = 0.8;
    this._ctx = null;
    this._bgmGain = null;
    this._sfxGain = null;
    this._masterGain = null;
    this._currentBgm = null;
    this._bgmName = '';
    this._sfxBuffers = {};
    this._initialized = false;
  }

  /** 延迟初始化（需用户交互后才能创建 AudioContext） */
  _ensureContext() {
    if (this._initialized) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this._ctx = new AC();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this.masterVolume;
      this._masterGain.connect(this._ctx.destination);

      this._bgmGain = this._ctx.createGain();
      this._bgmGain.gain.value = this.bgmVolume;
      this._bgmGain.connect(this._masterGain);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = this.sfxVolume;
      this._sfxGain.connect(this._masterGain);

      this._initialized = true;
      return true;
    } catch (e) {
      console.warn('[Audio] 初始化失败:', e);
      return false;
    }
  }

  /** 播放 BGM（循环） */
  playBgm(name, url) {
    if (!this._ensureContext()) return;
    if (this._bgmName === name && this._currentBgm) return;
    this.stopBgm();

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0;
    const src = this._ctx.createMediaElementSource(audio);
    src.connect(this._bgmGain);
    audio.play().catch(() => {});
    // 淡入
    this._fadeIn(audio, 1.0);
    this._currentBgm = audio;
    this._bgmName = name;
  }

  /** 停止 BGM */
  stopBgm() {
    if (this._currentBgm) {
      const audio = this._currentBgm;
      this._fadeOut(audio, 0.5, () => {
        audio.pause();
        audio.src = '';
      });
      this._currentBgm = null;
      this._bgmName = '';
    }
  }

  /** 播放音效（合成，无需音频文件） */
  playSfx(type) {
    if (!this._ensureContext()) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        this._tone(800, 0.05, 'sine', 0.3);
        break;
      case 'hit':
        this._noise(0.08, 0.5);
        break;
      case 'crit':
        this._tone(200, 0.15, 'sawtooth', 0.4);
        setTimeout(() => this._tone(150, 0.1, 'sawtooth', 0.3), 50);
        break;
      case 'heal':
        this._tone(523, 0.1, 'sine', 0.25);
        setTimeout(() => this._tone(659, 0.1, 'sine', 0.25), 80);
        setTimeout(() => this._tone(784, 0.15, 'sine', 0.2), 160);
        break;
      case 'gacha_roll':
        this._tone(400, 0.08, 'triangle', 0.3);
        break;
      case 'gacha_ssr':
        for (let i = 0; i < 5; i++) {
          setTimeout(() => this._tone(500 + i * 100, 0.15, 'sine', 0.3), i * 100);
        }
        break;
      case 'levelup':
        this._tone(523, 0.12, 'sine', 0.3);
        setTimeout(() => this._tone(659, 0.12, 'sine', 0.3), 120);
        setTimeout(() => this._tone(784, 0.2, 'sine', 0.3), 240);
        break;
      case 'skill':
        this._tone(300, 0.06, 'square', 0.2);
        this._tone(600, 0.1, 'sine', 0.3);
        break;
      case 'ultimate':
        this._noise(0.2, 0.6);
        this._tone(200, 0.3, 'sawtooth', 0.4);
        setTimeout(() => this._tone(400, 0.2, 'sine', 0.5), 100);
        break;
    }
  }

  /** 合成音调 */
  _tone(freq, duration, type = 'sine', vol = 0.3) {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start();
    osc.stop(this._ctx.currentTime + duration + 0.05);
  }

  /** 合成噪声（打击音效） */
  _noise(duration, vol) {
    if (!this._ctx) return;
    const bufSize = this._ctx.sampleRate * duration;
    const buf = this._ctx.createBuffer(1, bufSize, this._ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }
    const src = this._ctx.createBufferSource();
    src.buffer = buf;
    const gain = this._ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(this._sfxGain);
    src.start();
  }

  /** 淡入 */
  _fadeIn(audio, duration) {
    let vol = 0;
    const step = 1 / (duration * 60);
    const tick = () => {
      if (!this._currentBgm || this._currentBgm !== audio) return;
      vol = Math.min(1, vol + step);
      audio.volume = vol;
      if (vol < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** 淡出 */
  _fadeOut(audio, duration, onDone) {
    let vol = audio.volume;
    const step = vol / (duration * 60);
    const tick = () => {
      vol = Math.max(0, vol - step);
      audio.volume = vol;
      if (vol > 0) {
        requestAnimationFrame(tick);
      } else if (onDone) {
        onDone();
      }
    };
    requestAnimationFrame(tick);
  }

  setBgmVolume(v) {
    this.bgmVolume = v;
    if (this._bgmGain) this._bgmGain.gain.value = v;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this._sfxGain) this._sfxGain.gain.value = v;
  }

  setMasterVolume(v) {
    this.masterVolume = v;
    if (this._masterGain) this._masterGain.gain.value = v;
  }

  // 保持向后兼容
  play(name) { this.playSfx(name); }
  stop() { this.stopBgm(); }
  setVolume(v) { this.setMasterVolume(v); }
}

// ============ 资源加载器 ============
class AssetLoader {
  constructor() {
    this.images = {};
    this.loaded = 0;
    this.total = 0;
    this.onProgress = null;
  }

  loadImage(key, src) {
    this.total++;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        this.loaded++;
        if (this.onProgress) this.onProgress(this.loaded, this.total);
        resolve(img);
      };
      img.onerror = () => {
        console.warn('[AssetLoader] 加载失败:', src);
        this.loaded++;
        if (this.onProgress) this.onProgress(this.loaded, this.total);
        resolve(null);
      };
      img.src = src;
    });
  }

  getImage(key) {
    return this.images[key] || null;
  }

  getProgress() {
    return this.total === 0 ? 1 : this.loaded / this.total;
  }
}

// ============ 游戏引擎 ============
class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.sceneManager = new SceneManager();
    this.input = new InputManager(this.canvas);
    this.animations = new AnimationManager();
    this.audio = new AudioManager();
    this.assets = new AssetLoader();
    this.lastTime = 0;
    this.running = false;

    this.state = {
      player: null,
      party: [],
      roster: [],
      storyProgress: {},
      inventory: {},
      currency: { crystals: 0, coins: 0 },
      settings: { resolution: 'auto' }
    };

    this._setupResize();
  }

  _setupResize() {
    const resize = () => {
      const container = this.canvas.parentElement;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const targetRatio = 16 / 9;
      const currentRatio = w / h;

      let canvasW, canvasH;
      if (currentRatio > targetRatio) {
        canvasH = h;
        canvasW = h * targetRatio;
      } else {
        canvasW = w;
        canvasH = w / targetRatio;
      }

      this.canvas.style.width = canvasW + 'px';
      this.canvas.style.height = canvasH + 'px';
      this.canvas.width = 1280;
      this.canvas.height = 720;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const clampedDt = Math.min(dt, 1 / 30);
    this.update(clampedDt);
    this.render();

    requestAnimationFrame(() => this._loop());
  }

  update(dt) {
    this.sceneManager.update(dt);
    this.animations.update(dt);
    // 驱动 UI 动画系统
    if (typeof UIAnimations !== 'undefined') UIAnimations.update(dt * 1000);
  }

  render() {
    const ctx = this.ctx;

    // 屏幕震动偏移
    let shakeX = 0, shakeY = 0;
    if (typeof window !== 'undefined' && window._screenShake) {
      shakeX = window._screenShake.offsetX || 0;
      shakeY = window._screenShake.offsetY || 0;
    }

    ctx.save();
    if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);
    this.sceneManager.render(ctx);

    ctx.restore();
  }
}

window.GameEngine = GameEngine;
window.Renderer = Renderer;
window.Easing = Easing;
window.AssetLoader = AssetLoader;
