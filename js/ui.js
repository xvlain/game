/**
 * ui.js - 游戏场景与 UI 渲染
 * 包含：标题画面、主菜单、剧情地图、战斗界面、抽卡界面、设置、统计
 * v0.10.0 - PWA 支持 + 自动战斗 + 剧情快进 + 玩家统计面板
 */

// ============ 素材管理器 ============
const GameAssets = {
  backgrounds: {},
  ui: {},
  icons: {},
  frames: {}   // UI 边框素材
};

async function preloadAssets() {
  const loader = window.game?.assets;
  if (!loader) return;

  console.log('[Assets] 预加载美术素材...');

  // 战斗背景（1920×1080，Canvas 会自动缩放至 1280×720）
  const bgMap = {
    bg_arena: 'assets/maps/battle/arena_default.png',
    bg_forest: 'assets/maps/battle/forest_dark.png',
    bg_crystal: 'assets/maps/battle/crystal_cave.png',
    bg_training: 'assets/maps/battle/training_arena.png',
    bg_star_abyss: 'assets/maps/battle/star_abyss.png',
    bg_holy: 'assets/maps/battle/holy_sanctuary.png',
    bg_chaos: 'assets/maps/battle/chaos_void.png'
  };
  const bgNameMap = {
    bg_arena: 'arena', bg_forest: 'forest', bg_crystal: 'crystal',
    bg_training: 'training', bg_star_abyss: 'star_abyss',
    bg_holy: 'holy', bg_chaos: 'chaos'
  };
  for (const [key, src] of Object.entries(bgMap)) {
    await loader.loadImage(key, src).then(img => {
      if (img) GameAssets.backgrounds[bgNameMap[key]] = img;
    });
  }

  // 抽卡背景
  await loader.loadImage('bg_gacha', 'assets/ui/backgrounds/gacha_summon.png').then(img => {
    if (img) GameAssets.ui.gachaBg = img;
  });

  // Logo
  await loader.loadImage('logo', 'assets/brand/logo/佣人工作室Logo.png').then(img => {
    if (img) GameAssets.ui.logo = img;
  });

  // 五行元素图标（小尺寸渲染用）
  const elements = ['metal', 'wood', 'water', 'fire', 'earth'];
  for (const el of elements) {
    await loader.loadImage(`elem_${el}`, `assets/battle/elements/${el}.png`).then(img => {
      if (img) GameAssets.icons[el] = img;
    });
  }

  // 道具图标（经验书、突破材料、货币）
  const itemIcons = [
    'exp_book_1', 'exp_book_2', 'exp_book_3',
    'asc_stone_1', 'asc_stone_2', 'asc_stone_3', 'asc_stone_4', 'asc_stone_5',
    'coins', 'crystals'
  ];
  for (const item of itemIcons) {
    await loader.loadImage(`item_${item}`, `assets/ui/icons/${item}.png`).then(img => {
      if (img) GameAssets.icons[item] = img;
    });
  }

  // UI 边框素材（对话框、面板、按钮、HP条、能量条）
  const frameMap = {
    frame_dialog: 'assets/ui/frames/dialog_box.png',
    frame_panel: 'assets/ui/frames/panel_frame.png',
    frame_button: 'assets/ui/frames/button_frame.png',
    frame_hp: 'assets/ui/frames/hp_bar_frame.png',
    frame_energy: 'assets/ui/frames/energy_bar_frame.png'
  };
  const frameNameMap = {
    frame_dialog: 'dialog',
    frame_panel: 'panel',
    frame_button: 'button',
    frame_hp: 'hp',
    frame_energy: 'energy'
  };
  for (const [key, src] of Object.entries(frameMap)) {
    await loader.loadImage(key, src).then(img => {
      if (img) GameAssets.frames[frameNameMap[key]] = img;
    });
  }

  // 剧情地图背景（序章 4 张）
  const storyBgs = {
    story_awakening: 'assets/maps/story/awakening_void.png',
    story_ancient_path: 'assets/maps/story/ancient_path.png',
    story_ancient_ruins: 'assets/maps/story/ancient_ruins.png',
    story_dark_forest: 'assets/maps/story/dark_forest.png'
  };
  for (const [key, src] of Object.entries(storyBgs)) {
    await loader.loadImage(key, src).then(img => {
      if (img) GameAssets.backgrounds[key.replace('story_', 'story_')] = img;
    });
  }

  const loaded = Object.keys(GameAssets.backgrounds).length +
                 Object.keys(GameAssets.ui).length +
                 Object.keys(GameAssets.icons).length +
                 Object.keys(GameAssets.frames).length;
  console.log(`[Assets] 预加载完成，共 ${loaded} 个素材`);
}

// ============ UI 边框绘制工具 ============

/**
 * 绘制九宫格边框（Nine-slice）
 * 将素材分成 9 个区域来缩放，保持边角不变形
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img - 边框素材
 * @param {number} x
 * @param {number} y
 * @param {number} w - 目标宽度
 * @param {number} h - 目标高度
 * @param {number} slice - 边角切片尺寸（源图像素）
 */
function drawNineSlice(ctx, img, x, y, w, h, slice = 40) {
  if (!img) return false;
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  const s = Math.min(slice, sw / 3, sh / 3);
  const ds = Math.min(slice, w / 3, h / 3);

  // 四角
  ctx.drawImage(img, 0, 0, s, s, x, y, ds, ds);                          // 左上
  ctx.drawImage(img, sw - s, 0, s, s, x + w - ds, y, ds, ds);            // 右上
  ctx.drawImage(img, 0, sh - s, s, s, x, y + h - ds, ds, ds);            // 左下
  ctx.drawImage(img, sw - s, sh - s, s, s, x + w - ds, y + h - ds, ds, ds); // 右下

  // 四边
  ctx.drawImage(img, s, 0, sw - 2 * s, s, x + ds, y, w - 2 * ds, ds);             // 上
  ctx.drawImage(img, s, sh - s, sw - 2 * s, s, x + ds, y + h - ds, w - 2 * ds, ds); // 下
  ctx.drawImage(img, 0, s, s, sh - 2 * s, x, y + ds, ds, h - 2 * ds);             // 左
  ctx.drawImage(img, sw - s, s, s, sh - 2 * s, x + w - ds, y + ds, ds, h - 2 * ds); // 右

  // 中心
  ctx.drawImage(img, s, s, sw - 2 * s, sh - 2 * s, x + ds, y + ds, w - 2 * ds, h - 2 * ds);

  return true;
}

/**
 * 绘制带边框素材的面板（优先使用九宫格素材，回退到 Renderer.drawPanel）
 */
function drawFramedPanel(ctx, x, y, w, h, frameKey, options = {}) {
  const img = GameAssets.frames[frameKey];
  const { slice = 40, fallbackBg = 'rgba(15, 15, 30, 0.9)', fallbackBorder = '#5c4d9a' } = options;
  if (img) {
    drawNineSlice(ctx, img, x, y, w, h, slice);
  } else {
    Renderer.drawPanel(ctx, x, y, w, h, { bg: fallbackBg, border: fallbackBorder });
  }
}

/**
 * 绘制带边框素材的按钮（优先使用素材，回退到 Renderer.drawButton）
 */
function drawFramedButton(ctx, x, y, w, h, text, options = {}) {
  const img = GameAssets.frames.button;
  const { fontSize = 18, textColor = '#e0e0e0', disabled = false, fallbackBg, fallbackBorder } = options;
  if (img && !disabled) {
    drawNineSlice(ctx, img, x, y, w, h, 15);
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.restore();
  } else {
    Renderer.drawButton(ctx, x, y, w, h, text, {
      fontSize, textColor, disabled,
      bgColor: fallbackBg || '#2a2a3e',
      borderColor: fallbackBorder || '#5c4d9a'
    });
  }
}

/**
 * 绘制道具图标（统一工具函数）
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} itemKey - 道具 ID（如 exp_book_1, coins, crystals）
 * @param {number} x - 中心 X
 * @param {number} y - 中心 Y
 * @param {number} size - 绘制尺寸
 * @param {string} [fallbackText] - 图标不存在时的回退文字
 */
function drawItemIcon(ctx, itemKey, x, y, size, fallbackText) {
  const img = GameAssets.icons[itemKey];
  if (img) {
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else if (fallbackText) {
    Renderer.drawText(ctx, fallbackText, x, y, { fontSize: size * 0.7, align: 'center' });
  }
}

// 战斗背景映射（stageId → 背景 key）
const BATTLE_BG_MAP = {
  'exp_easy': 'training',      // 修炼场初级 → 训练场
  'exp_medium': 'training',    // 修炼场中级 → 训练场
  'exp_hard': 'training',      // 修炼场高级 → 训练场
  'mat_t1': 'crystal',         // 微光矿脉 → 水晶洞穴
  'mat_t2': 'crystal',         // 辉光洞穴 → 水晶洞穴
  'mat_t3': 'star_abyss',      // 星辉深渊 → 星辉深渊
  'mat_t4': 'holy',            // 虹彩圣域 → 虹彩圣域
  'daily_boss': 'arena'        // 每日挑战 → 竞技场（混沌之主自动匹配 chaos）
};

/**
 * 获取战斗背景 key（支持每日 Boss 按元素动态匹配）
 */
function getBattleBgKey(stageId, isDaily) {
  if (isDaily) {
    const dayOfWeek = new Date().getDay();
    // 周日 = 混沌之主 → 混沌虚空背景
    if (dayOfWeek === 6) return 'chaos';
    // 其他日子用竞技场
    return 'arena';
  }
  return BATTLE_BG_MAP[stageId] || 'arena';
}

// ============ 标题画面 ============
class TitleScene {
  constructor() {
    this.sceneManager = null;
    this.particles = [];
    this.titleAlpha = 0;
    this.elapsed = 0;
    this.buttons = [];
  }

  onEnter() {
    this.titleAlpha = 0;
    this.elapsed = 0;
    this._initParticles();

    // 检测本地是否有存档，决定是否显示"继续游戏"
    const hasSave = !!localStorage.getItem('game_offline_main');
    this.hasContinue = hasSave;
  }

  onExit() {}

  _initParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: ['#7c5cbf', '#5c8abf', '#bf5c8a', '#5cbf8a'][Math.floor(Math.random() * 4)]
      });
    }
  }

  update(dt) {
    this.elapsed += dt;
    this.titleAlpha = Math.min(1, this.elapsed / 2);

    // 粒子动画
    for (const p of this.particles) {
      p.y -= p.speed;
      p.alpha = 0.3 + Math.sin(this.elapsed * 2 + p.x) * 0.2;
      if (p.y < -10) {
        p.y = 730;
        p.x = Math.random() * 1280;
      }
    }
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.5, '#1a1030');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 粒子
    Renderer.drawParticles(ctx, this.particles);

    // 标题
    ctx.save();
    ctx.globalAlpha = this.titleAlpha;

    // 工作室 Logo 文字
    Renderer.drawText(ctx, '庸人工作室', W / 2, H / 2 - 160, {
      fontSize: 16,
      color: '#7070a0',
      align: 'center'
    });

    Renderer.drawText(ctx, '未定之旅', W / 2, H / 2 - 80, {
      fontSize: 64,
      color: '#d4b8ff',
      align: 'center',
      font: '"Noto Serif SC", "SimSun", serif'
    });

    Renderer.drawText(ctx, '— 命运的齿轮，已然转动 —', W / 2, H / 2 - 20, {
      fontSize: 18,
      color: '#9090b0',
      align: 'center'
    });
    ctx.restore();

    // 按钮
    if (this.titleAlpha > 0.8) {
      const btnW = 220, btnH = 48;
      const btnX = W / 2 - btnW / 2;

      // 按钮列表（"继续游戏"仅在检测到本地存档时显示）
      this.buttons = [
        { x: btnX, y: H / 2 + 60, w: btnW, h: btnH, text: '开始游戏', action: 'start' }
      ];
      if (this.hasContinue) {
        this.buttons.push(
          { x: btnX, y: H / 2 + 130, w: btnW, h: btnH, text: '继续游戏', action: 'continue' }
        );
      }

      for (const btn of this.buttons) {
        drawFramedButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.text, {
          fontSize: 20
        });
      }
    }

    // 底部信息
    Renderer.drawText(ctx, 'v0.10.0 · 庸人工作室', W / 2, H - 30, {
      fontSize: 12,
      color: '#505070',
      align: 'center'
    });
  }

  handleClick(x, y) {
    for (const btn of this.buttons) {
      if (Renderer.hitTest(x, y, btn)) {
        if (btn.action === 'start' || btn.action === 'continue') {
          // 触发登录覆盖层
          if (window.authController) {
            window.authController.open(btn.action);
          } else {
            this.sceneManager.switchTo('main_menu');
          }
        }
      }
    }
  }
}

// ============ 主菜单 ============
class MainMenuScene {
  constructor() {
    this.sceneManager = null;
    this.menuItems = [];
    this.selectedTab = 0;
    this.elapsed = 0;
  }

  onEnter() {
    this.elapsed = 0;
    this.menuItems = [
      { text: '剧情模式', desc: '推进主线剧情', action: 'story', icon: '📖' },
      { text: '角色养成', desc: '升级/突破/技能', action: 'growth', icon: '⬆️' },
      { text: '编队', desc: '调整战斗编队', action: 'party', icon: '⚔️' },
      { text: '召唤', desc: '抽取新角色', action: 'gacha', icon: '✨' },
      { text: '角色', desc: '查看角色详情', action: 'characters', icon: '👤' },
      { text: '关卡', desc: '挑战独立关卡', action: 'stages', icon: '🏰' },
      { text: '统计', desc: '冒险统计数据', action: 'stats', icon: '📊' },
      { text: '设置', desc: '游戏设置', action: 'settings', icon: '⚙️' }
    ];
  }

  onExit() {}

  update(dt) {
    this.elapsed += dt;
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0d1f');
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 顶部栏
    drawFramedPanel(ctx, 20, 15, W - 40, 50, 'panel', {
      slice: 15,
      fallbackBg: 'rgba(15, 15, 30, 0.8)',
      fallbackBorder: '#3a3060'
    });
    Renderer.drawText(ctx, '未定之旅', 40, 40, { fontSize: 20, color: '#d4b8ff' });

    // 资源显示
    const state = window.game?.state;
    if (state) {
      // 水晶图标 + 数量
      drawItemIcon(ctx, 'crystals', W - 270, 40, 20, '💎');
      Renderer.drawText(ctx, `${state.currency?.crystals || 0}`, W - 255, 40, { fontSize: 16, color: '#88ccff' });
      // 金币图标 + 数量
      drawItemIcon(ctx, 'coins', W - 145, 40, 20, '🪙');
      Renderer.drawText(ctx, `${state.currency?.coins || 0}`, W - 130, 40, { fontSize: 16, color: '#ffcc44' });
    }

    // 菜单网格（4+4 布局）
    const cardW = 240, cardH = 140;
    const gapX = 25, gapY = 20;

    for (let i = 0; i < this.menuItems.length; i++) {
      let col, row, cols;
      if (i < 4) {
        col = i; row = 0; cols = 4;
      } else {
        col = i - 4; row = 1; cols = 4;
      }

      const totalW = cols * cardW + (cols - 1) * gapX;
      const startX = (W - totalW) / 2;
      const startY = 100;

      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const item = this.menuItems[i];

      // 卡片
      const hover = Math.sin(this.elapsed * 2 + i) * 0.02 + 1;
      drawFramedPanel(ctx, x, y, cardW, cardH, 'panel', {
        slice: 25,
        fallbackBg: 'rgba(25, 20, 45, 0.85)',
        fallbackBorder: '#4a3a8a'
      });

      // 图标
      ctx.font = '42px serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, x + cardW / 2, y + 60);

      // 标题
      Renderer.drawText(ctx, item.text, x + cardW / 2, y + 105, {
        fontSize: 20,
        color: '#e0d0ff',
        align: 'center'
      });

      // 描述
      Renderer.drawText(ctx, item.desc, x + cardW / 2, y + 132, {
        fontSize: 12,
        color: '#8080a0',
        align: 'center'
      });

      // 存储按钮区域用于点击检测
      this.menuItems[i]._rect = { x, y, w: cardW, h: cardH };
    }

    // 底部
    Renderer.drawText(ctx, 'v0.10.0 · 庸人工作室', W / 2, H - 25, {
      fontSize: 12,
      color: '#404060',
      align: 'center'
    });

    // 签到通知
    const notice = window.game?._checkInNotice;
    if (notice && notice.timer > 0) {
      const alpha = Math.min(1, notice.timer);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawFramedPanel(ctx, W / 2 - 180, 70, 360, 56, 'panel', {
        slice: 15,
        fallbackBg: 'rgba(20, 40, 20, 0.95)',
        fallbackBorder: '#4a8a4a'
      });
      // 签到图标
      if (typeof drawItemIcon === 'function') {
        drawItemIcon(ctx, 'crystals', W / 2 - 150, 90, 16);
      }
      Renderer.drawText(ctx, `签到第 ${notice.day} 天  获得: ${notice.label}`, W / 2 + 10, 90, {
        fontSize: 14, color: '#88ff88', align: 'center'
      });
      Renderer.drawText(ctx, `累计签到 ${notice.totalDays} 天`, W / 2, 112, {
        fontSize: 11, color: '#66aa66', align: 'center'
      });
      ctx.restore();
      notice.timer -= 1 / 60; // 约每帧减少
    }
  }

  handleClick(x, y) {
    for (const item of this.menuItems) {
      if (item._rect && Renderer.hitTest(x, y, item._rect)) {
        switch (item.action) {
          case 'story':
            this.sceneManager.switchTo('story_map');
            break;
          case 'gacha':
            this.sceneManager.switchTo('gacha');
            break;
          case 'characters':
            this.sceneManager.switchTo('characters');
            break;
          case 'growth':
            this.sceneManager.switchTo('growth');
            break;
          case 'party':
            this.sceneManager.switchTo('party');
            break;
          case 'stages':
            this.sceneManager.switchTo('stages');
            break;
          case 'stats':
            this.sceneManager.switchTo('stats');
            break;
          case 'settings':
            this.sceneManager.switchTo('settings');
            break;
        }
      }
    }
  }
}

// ============ 剧情地图场景 ============
class StoryMapScene {
  constructor() {
    this.sceneManager = null;
    this.storyManager = null;
    this.chapter = null;
    this.scrollX = 0;
    this.selectedNode = null;
  }

  onEnter(data) {
    if (!this.storyManager) {
      this.storyManager = new StoryManager();
      // 加载已有进度
      if (window.game?.state?.storyProgress) {
        this.storyManager.loadProgress(window.game.state.storyProgress);
      }
    }

    const chapters = this.storyManager.getChapterList();
    this.chapter = StoryData.getChapter(chapters[0]?.id || 'ch1');
    this.scrollX = 0;
    this.selectedNode = null;
  }

  onExit() {}

  update(dt) {}

  render(ctx) {
    const W = 1280, H = 720;

    // 背景
    // 尝试使用第一张剧情背景作为底色
    const storyBg = GameAssets.backgrounds.story_awakening || GameAssets.backgrounds.story_ancient_path || null;
    if (storyBg) {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(storyBg, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = storyBg ? 'rgba(10, 10, 24, 0.7)' : '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // 标题
    drawFramedPanel(ctx, 20, 15, W - 40, 50, 'panel', {
      slice: 15,
      fallbackBg: 'rgba(15, 15, 30, 0.9)'
    });
    Renderer.drawText(ctx, this.chapter?.name || '章节', 40, 40, { fontSize: 20, color: '#d4b8ff' });

    // 返回按钮
    drawFramedButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    if (!this.chapter) return;

    // 绘制节点连接线
    ctx.strokeStyle = '#3a3060';
    ctx.lineWidth = 3;
    for (const node of this.chapter.nodes) {
      if (node.next) {
        const nextNode = this.chapter.nodes.find(n => n.id === node.next);
        if (nextNode) {
          ctx.beginPath();
          ctx.moveTo(node.position.x - this.scrollX, node.position.y);
          ctx.lineTo(nextNode.position.x - this.scrollX, nextNode.position.y);
          ctx.stroke();
        }
      }
    }

    // 处理分支选择节点的连接线
    for (const node of this.chapter.nodes) {
      if (node.type === 'choice' && node.choices) {
        for (const choice of node.choices) {
          const targetNode = this.chapter.nodes.find(n => n.id === choice.next);
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.position.x - this.scrollX, node.position.y);
            ctx.lineTo(targetNode.position.x - this.scrollX, targetNode.position.y);
            ctx.stroke();
          }
        }
      }
    }

    // 绘制节点
    for (const node of this.chapter.nodes) {
      const x = node.position.x - this.scrollX;
      const y = node.position.y;
      const completed = this.storyManager.completedNodes.has(node.id);
      const isCurrent = this.storyManager.currentNode?.id === node.id;

      // 节点圆圈
      const radius = 28;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (completed) {
        ctx.fillStyle = '#2a4a2a';
        ctx.strokeStyle = '#4a8a4a';
      } else if (isCurrent) {
        ctx.fillStyle = '#3a2a5a';
        ctx.strokeStyle = '#8a5cbf';
      } else {
        ctx.fillStyle = '#1a1a2a';
        ctx.strokeStyle = '#3a3060';
      }

      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();

      // 节点图标
      const icons = { dialogue: '💬', battle: '⚔️', choice: '❓' };
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[node.type] || '📍', x, y);

      // 节点标题
      Renderer.drawText(ctx, node.title, x, y + 45, {
        fontSize: 13,
        color: completed ? '#6a9a6a' : (isCurrent ? '#b090e0' : '#606080'),
        align: 'center'
      });

      // 存储区域
      node._rect = { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 };
    }
  }

  handleClick(x, y) {
    // 返回按钮
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this.sceneManager.switchTo('main_menu');
      return;
    }

    // 节点点击
    if (!this.chapter) return;
    for (const node of this.chapter.nodes) {
      if (node._rect && Renderer.hitTest(x, y, node._rect)) {
        if (this.storyManager.completedNodes.has(node.id)) continue;
        if (this.storyManager.currentNode?.id !== node.id) continue;

        // 进入节点
        if (node.type === 'dialogue') {
          this.sceneManager.switchTo('dialogue', { chapterId: this.chapter.id, nodeId: node.id });
        } else if (node.type === 'battle') {
          const battleData = this.storyManager.enterBattleNode();
          if (battleData) {
            this.sceneManager.switchTo('battle', {
              enemies: battleData.enemies,
              chapterId: this.chapter.id,
              nodeId: node.id
            });
          }
        } else if (node.type === 'choice') {
          this.sceneManager.switchTo('dialogue', { chapterId: this.chapter.id, nodeId: node.id });
        }
      }
    }
  }
}

// ============ 对话场景 ============
class DialogueScene {
  constructor() {
    this.sceneManager = null;
    this.storyManager = null;
    this.lines = [];
    this.currentIndex = 0;
    this.displayedChars = 0;
    this.displayTimer = 0;
    this.choices = null;
    this.speaker = '';
    this.text = '';
  }

  onEnter(data) {
    if (!this.storyManager) {
      this.storyManager = window.game?.storyManager || new StoryManager();
    }

    this._chapterId = data.chapterId;
    this._nodeId = data.nodeId;
    this._autoSkip = false; // 自动快进模式
    this._skipHintTimer = 0;

    this.storyManager.enterChapter(data.chapterId);
    // 跳到指定节点
    const chapter = StoryData.getChapter(data.chapterId);
    if (chapter) {
      const node = chapter.nodes.find(n => n.id === data.nodeId);
      if (node) {
        this.storyManager.currentNode = node;
        this.storyManager.dialogueIndex = 0;

        // 已读节点 → 自动开启快进
        if (this.storyManager.completedNodes.has(data.nodeId)) {
          this._autoSkip = true;
          this._skipHintTimer = 2.0; // 显示 2 秒"快进中"提示
        }
      }
    }

    // 加载剧情背景
    this._dialogueBg = null;
    const bgPath = StoryData.getNodeBackground(data.chapterId, data.nodeId);
    if (bgPath) {
      // 从预加载缓存中查找
      for (const [key, img] of Object.entries(GameAssets.backgrounds)) {
        if (key.startsWith('story_') && bgPath.includes(key.replace('story_', ''))) {
          this._dialogueBg = img;
          break;
        }
      }
      // 如果没命中预加载缓存，尝试直接查找（兜底）
      if (!this._dialogueBg) {
        const bgKey = bgPath.split('/').pop().replace('.png', '');
        const altKey = `story_${bgKey}`;
        if (GameAssets.backgrounds[altKey]) {
          this._dialogueBg = GameAssets.backgrounds[altKey];
        }
      }
    }

    const dialogue = this.storyManager.getCurrentDialogue();
    if (dialogue) {
      this.speaker = dialogue.speaker;
      this.text = dialogue.text;
    }
    this.displayedChars = 0;
    this.displayTimer = 0;
    this.choices = null;
  }

  onExit() {}

  update(dt) {
    this.displayTimer += dt;
    const charsPerSecond = this._autoSkip ? 200 : 30;
    this.displayedChars = Math.min(this.text.length, Math.floor(this.displayTimer * charsPerSecond));

    // 快进模式：自动推进对话
    if (this._autoSkip) {
      this._skipHintTimer = Math.max(0, this._skipHintTimer - dt);

      if (this.displayedChars >= this.text.length) {
        // 等一小段时间再自动推进（避免闪屏）
        if (!this._skipDelay) {
          this._skipDelay = 0.15;
        }
        this._skipDelay -= dt;
        if (this._skipDelay <= 0) {
          this._skipDelay = 0;
          // 如果是选择支 → 停止快进，等玩家选择
          if (this.storyManager.currentNode?.type === 'choice') {
            this._autoSkip = false;
            return;
          }
          const result = this.storyManager.advanceDialogue();
          if (result.type === 'none' || result.type === 'chapter_end' || result.type === 'battle') {
            this._autoSkip = false;
          }
          this._handleResult(result);
        }
      }
    }
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 背景
    if (this._dialogueBg) {
      ctx.drawImage(this._dialogueBg, 0, 0, W, H);
      // 底部暗化确保对话框可读
      const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, W, H);
      // 场景装饰（无背景时的占位）
      Renderer.drawText(ctx, '[ 场景 ]', W / 2, H / 2 - 100, {
        fontSize: 14,
        color: '#303050',
        align: 'center'
      });
    }

    // 对话框（优先使用边框素材）
    const boxY = H - 200;
    const boxH = 170;
    drawFramedPanel(ctx, 40, boxY, W - 80, boxH, 'dialog', {
      slice: 50,
      fallbackBg: 'rgba(10, 10, 25, 0.95)',
      fallbackBorder: '#5c4d9a'
    });

    // 说话人
    if (this.speaker) {
      drawFramedPanel(ctx, 50, boxY - 35, 160, 32, 'button', {
        slice: 10,
        fallbackBg: '#2a1a4a',
        fallbackBorder: '#7c5cbf'
      });
      Renderer.drawText(ctx, this.speaker, 130, boxY - 19, {
        fontSize: 16,
        color: '#d4b8ff',
        align: 'center'
      });
    }

    // 文本（逐字显示）
    const displayText = this.text.substring(0, this.displayedChars);
    this._wrapText(ctx, displayText, 70, boxY + 30, W - 140, 28, {
      fontSize: 20,
      color: '#e0e0e0'
    });

    // 点击提示
    if (this.displayedChars >= this.text.length) {
      const blink = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.globalAlpha = blink;
      Renderer.drawText(ctx, '▼', W - 80, boxY + boxH - 20, {
        fontSize: 16,
        color: '#8080a0',
        align: 'right'
      });
      ctx.globalAlpha = 1;
    }

    // 选择支
    if (this.choices) {
      const choiceW = 300, choiceH = 50;
      const startX = W / 2 - choiceW - 20;
      const startY = boxY - 100;

      for (let i = 0; i < this.choices.length; i++) {
        const cx = startX + i * (choiceW + 40);
        drawFramedButton(ctx, cx, startY, choiceW, choiceH, this.choices[i].text, {
          fontSize: 18
        });
        this.choices[i]._rect = { x: cx, y: startY, w: choiceW, h: choiceH };
      }
    }

    // 快进按钮（右上角）
    const skipBtnW = 80, skipBtnH = 32;
    const skipBtnX = W - skipBtnW - 20, skipBtnY = 20;
    this._skipBtn = { x: skipBtnX, y: skipBtnY, w: skipBtnW, h: skipBtnH };
    drawFramedButton(ctx, skipBtnX, skipBtnY, skipBtnW, skipBtnH,
      this._autoSkip ? '⏩ 快进中' : '⏩ 快进', {
        fontSize: 12,
        disabled: this._autoSkip
      });

    // 快进提示
    if (this._skipHintTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this._skipHintTimer);
      Renderer.drawText(ctx, '已读对话 · 自动快进中（点击停止）', W / 2, 60, {
        fontSize: 13, color: '#ffcc88', align: 'center'
      });
      ctx.restore();
    }
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, options) {
    const words = text.split('');
    let line = '';
    let currentY = y;

    ctx.font = `${options.fontSize}px "Noto Sans SC", sans-serif`;

    for (const char of words) {
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        Renderer.drawText(ctx, line, x, currentY, options);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      Renderer.drawText(ctx, line, x, currentY, options);
    }
  }

  handleClick(x, y) {
    // 快进按钮（右上角）
    if (this._skipBtn && Renderer.hitTest(x, y, this._skipBtn)) {
      this._autoSkip = !this._autoSkip;
      if (this._autoSkip) this._skipHintTimer = 2.0;
      return;
    }

    // 选择支点击
    if (this.choices) {
      for (let i = 0; i < this.choices.length; i++) {
        if (this.choices[i]._rect && Renderer.hitTest(x, y, this.choices[i]._rect)) {
          const result = this.storyManager.makeChoice(i);
          this._handleResult(result);
          return;
        }
      }
      return;
    }

    // 快进模式下点击 → 停止快进
    if (this._autoSkip) {
      this._autoSkip = false;
      return;
    }

    // 文字显示中 → 快速显示全部
    if (this.displayedChars < this.text.length) {
      this.displayedChars = this.text.length;
      return;
    }

    // 推进对话
    const result = this.storyManager.advanceDialogue();
    this._handleResult(result);
  }

  _handleResult(result) {
    if (!result) return;

    switch (result.type) {
      case 'dialogue':
        this.speaker = result.line.speaker;
        this.text = result.line.text;
        this.displayedChars = 0;
        this.displayTimer = 0;
        break;

      case 'choice':
        this.choices = result.choices;
        break;

      case 'battle':
        this.sceneManager.switchTo('battle', {
          enemies: result.config,
          chapterId: this.storyManager.currentChapter?.id,
          nodeId: this.storyManager.currentNode?.id
        });
        break;

      case 'chapter_end':
        // 回到主菜单
        this.sceneManager.switchTo('main_menu');
        break;

      case 'none':
        // 节点完成，自动推进
        this.speaker = '';
        this.text = '（点击继续）';
        this.displayedChars = this.text.length;
        break;
    }
  }
}

// ============ 战斗场景 ============
class BattleScene {
  constructor() {
    this.sceneManager = null;
    this.battle = null;
    this.selectedSkill = null;
    this.selectedTarget = null;
    this.phase = 'idle'; // idle, select_skill, select_target, animating, result
    this.skills = [];
    this.skillButtons = [];
    this.targetButtons = [];
    this.logDisplay = [];
    this.chapterId = null;
    this.nodeId = null;
  }

  onEnter(data) {
    this.chapterId = data.chapterId;
    this.nodeId = data.nodeId;
    this.isFarm = data.isFarm || false;
    this.farmStageConfig = data.stageConfig || null;
    this.isDailyChallenge = data.isDaily || false;
    this.stageId = data.stageId || null;
    this._autoBattle = false;   // 自动战斗开关（仅 Farm 关卡可用）
    this._autoTimer = 0;        // 自动行动延迟计时器

    // 选择战斗背景
    const bgKey = getBattleBgKey(this.stageId, this.isDailyChallenge);
    this.battleBg = GameAssets.backgrounds[bgKey] || GameAssets.backgrounds.arena || null;

    // 清除粒子特效
    if (typeof ElementEffects !== 'undefined') ElementEffects.clear();
    if (typeof BattleEffects !== 'undefined') BattleEffects.clear();

    // 初始化战斗
    this.battle = new BattleEngine();

    // 获取玩家编队
    const partyTemplates = window.game?.state?.party || [
      { id: 'warrior', level: 1 },
      { id: 'healer', level: 1 },
      { id: 'mage', level: 1 },
      { id: 'tank', level: 1 }
    ];

    this.battle.init(partyTemplates, data.enemies);

    // 初始化 HP/能量条渲染器
    this._partyHpBars = [];
    this._partyEnergyBars = [];
    this._partyForceBars = [];
    this._enemyHpBars = [];
    this._damagePopups = [];

    const partySpacing = 200;
    const partyStartX = 640 - (this.battle.party.length * partySpacing) / 2 + partySpacing / 2;
    this.battle.party.forEach((char, i) => {
      const cx = partyStartX + i * partySpacing;
      const cy = 480;
      this._partyHpBars.push(new HPBarRenderer(cx - 40, cy + 70, 80, 8));
      this._partyEnergyBars.push(new EnergyBarRenderer(cx - 40, cy + 83, 80, 5, char.element));
      this._partyForceBars.push(new EnergyBarRenderer(cx - 40, cy + 92, 80, 5, char.element));
    });

    const enemyAlive = this.battle.enemies.filter(e => e.currentHp > 0);
    const enemySpacing = 200;
    const enemyStartX = 640 - (enemyAlive.length * enemySpacing) / 2 + enemySpacing / 2;
    enemyAlive.forEach((enemy, i) => {
      const cx = enemyStartX + i * enemySpacing;
      this._enemyHpBars.push(new HPBarRenderer(cx - 40, 180 + 70, 80, 8, '#cc3333'));
    });

    // 设置回调
    this.battle.onStateChange = (state, actor) => {
      if (state === 'player_turn') {
        this.phase = 'select_skill';
        this.selectedSkill = null;
        this.selectedTarget = null;
        this._buildSkillButtons(actor);
      } else if (state === 'enemy_turn') {
        this.phase = 'enemy_action';
      }
    };

    this.battle.onActionComplete = (actor, skill, results) => {
      this.logDisplay = this.battle.battleLog.slice(-5);
      // 触发粒子特效 + 伤害弹出 + 音效
      this._triggerActionEffects(actor, skill, results);
    };

    this.battle.onBattleEnd = (result) => {
      this.phase = 'result';
      this.battleResult = result;
      // 战斗结束音效
      if (window.game?.audio) {
        window.game.audio.playSfx(result === 'victory' ? 'levelup' : 'hit');
      }
    };

    this.phase = 'idle';
    this.logDisplay = [];
    this.battle.startBattle();
  }

  /** 根据战斗行动结果触发对应粒子特效 + 伤害弹出 + 屏幕震动 */
  _triggerActionEffects(actor, skill, results) {
    const hasEffects = typeof BattleEffects !== 'undefined' && typeof ElementEffects !== 'undefined';
    const audio = window.game?.audio;

    for (const r of results) {
      if (r.damage !== undefined) {
        // 攻击伤害 → 受击特效 + 元素特效 + 伤害弹出
        const targetIdx = this.battle.enemies.findIndex(e => e.name === r.target);
        const partyIdx = this.battle.party.findIndex(c => c.name === r.target);
        const isEnemy = targetIdx >= 0;
        const idx = isEnemy ? targetIdx : partyIdx;
        const count = isEnemy ? this.battle.enemies.filter(e => e.currentHp > 0).length : this.battle.party.length;
        const spacing = 200;
        const startX = 640 - (count * spacing) / 2 + spacing / 2;
        const tx = startX + idx * spacing;
        const ty = isEnemy ? 180 : 480;

        if (hasEffects) BattleEffects.hit(tx, ty);

        // HP 条闪烁
        if (isEnemy && this._enemyHpBars[idx]) {
          this._enemyHpBars[idx].flash();
        } else if (!isEnemy && this._partyHpBars[idx]) {
          this._partyHpBars[idx].flash();
        }

        // 伤害弹出数字
        const dmgPopup = animatePopupNumber(tx, ty - 50, r.damage, r.crit ? '#ffcc00' : '#ff4444');
        this._damagePopups.push(dmgPopup);

        if (r.crit) {
          if (hasEffects) setTimeout(() => BattleEffects.critical(tx, ty), 100);
          // 暴击 → 屏幕震动
          window._screenShake = animateScreenShake(6, 300);
          if (audio) audio.playSfx('crit');
        } else {
          if (audio) audio.playSfx('hit');
        }

        // 元素特效
        const element = actor.element;
        if (element && element !== 'none' && typeof ElementEffects !== 'undefined' && ElementEffects[element]) {
          const type = skill === actor.skills.ultimate ? 'ultimate' : (skill === actor.skills.skill ? 'skill' : 'attack');
          ElementEffects.play(element, tx, ty, type);
          if (audio) audio.playSfx(type === 'ultimate' ? 'ultimate' : 'skill');
        }
      }
      if (r.heal !== undefined) {
        const partyIdx = this.battle.party.findIndex(c => c.name === r.target);
        if (partyIdx >= 0) {
          const spacing = 200;
          const startX = 640 - (this.battle.party.length * spacing) / 2 + spacing / 2;
          const hx = startX + partyIdx * spacing;
          if (hasEffects) BattleEffects.heal(hx, 480);
          // 治疗弹出
          const healPopup = animatePopupNumber(hx, 480 - 50, r.heal, '#44ff88', true);
          this._damagePopups.push(healPopup);
          if (window.game?.audio) window.game.audio.playSfx('heal');
        }
      }
    }
  }

  onExit() {}

  _buildSkillButtons(actor) {
    this.skillButtons = [];
    // 检查共鸣状态以决定是否显示共鸣技
    const resTier = this.battle ? ResonanceSystem.getResonanceTier(actor, this.battle.resonances || []) : 0;
    const resCost = resTier === 2 ? ElementalForceSystem.resonanceSkillCostT2 : ElementalForceSystem.resonanceSkillCostT1;
    const hasResonanceSkill = resTier > 0 && actor.skills.resonance;

    const skills = [
      { key: 'normal', label: actor.skills.normal?.name || '普攻', enabled: true },
      { key: 'skill', label: actor.skills.skill?.name || '战技', enabled: actor.currentEnergy >= (actor.skills.skill?.energyCost || 0) },
    ];

    if (hasResonanceSkill) {
      const resLabel = resTier === 2 ? (actor.skills.resonance?.name || '共鸣技·强') + ' ✦' : (actor.skills.resonance?.name || '共鸣技');
      skills.push({ key: 'resonance', label: resLabel, enabled: ElementalForceSystem.canUse(actor, resCost) });
    }

    skills.push({ key: 'ultimate', label: actor.skills.ultimate?.name || '大招', enabled: actor.currentEnergy >= 100 });

    const btnW = 160, btnH = 50;
    const startX = 1280 / 2 - (skills.length * btnW + (skills.length - 1) * 20) / 2;

    skills.forEach((s, i) => {
      this.skillButtons.push({
        ...s,
        x: startX + i * (btnW + 20),
        y: 620,
        w: btnW,
        h: btnH
      });
    });
  }

  update(dt) {
    // 驱动粒子特效系统
    if (typeof ElementEffects !== 'undefined') ElementEffects.update(dt);
    if (typeof BattleEffects !== 'undefined') BattleEffects.update(dt);

    // 更新 HP/能量条平滑过渡
    const dtMs = dt * 1000;
    if (this._partyHpBars && this.battle) {
      this.battle.party.forEach((char, i) => {
        if (this._partyHpBars[i]) {
          this._partyHpBars[i].setHP(char.currentHp, char.maxHp);
          this._partyHpBars[i].update(dtMs);
        }
        if (this._partyEnergyBars[i]) {
          this._partyEnergyBars[i].setEnergy(char.currentEnergy, char.maxEnergy || 100);
          this._partyEnergyBars[i].update(dtMs);
        }
        if (this._partyForceBars[i]) {
          this._partyForceBars[i].setEnergy(char.elementalForce || 0, typeof ElementalForceSystem !== 'undefined' ? ElementalForceSystem.maxForce : 100);
          this._partyForceBars[i].update(dtMs);
        }
      });
    }
    if (this._enemyHpBars && this.battle) {
      const alive = this.battle.enemies.filter(e => e.currentHp > 0);
      alive.forEach((enemy, i) => {
        if (this._enemyHpBars[i]) {
          this._enemyHpBars[i].setHP(enemy.currentHp, enemy.maxHp);
          this._enemyHpBars[i].update(dtMs);
        }
      });
    }

    // 清理已完成的伤害弹出
    this._damagePopups = (this._damagePopups || []).filter(p => p.alpha > 0);

    // 自动战斗逻辑（仅 Farm 关卡）
    if (this._autoBattle && this.battle && this.phase !== 'result') {
      this._autoTimer += dt;

      if (this.phase === 'select_skill' && this._autoTimer >= 0.5) {
        this._autoTimer = 0;
        // 自动选择技能：优先大招 > 元素技 > 普攻
        const actor = this.battle.currentActor;
        if (actor) {
          let chosenKey = 'normal';
          // 大招可用时使用大招
          if (actor.currentEnergy >= 100) {
            chosenKey = 'ultimate';
          }
          // 元素力足够且战技可用时使用战技
          else if (typeof ElementalForceSystem !== 'undefined' &&
                   ElementalForceSystem.canUse(actor, actor.skills.skill?.forceCost || 25)) {
            chosenKey = 'skill';
          }
          this.selectedSkill = chosenKey;
          this.phase = 'select_target';
        }
      }

      if (this.phase === 'select_target' && this._autoTimer >= 0.3) {
        this._autoTimer = 0;
        // 自动选择血量最低的敌人
        const alive = this.battle.enemies.filter(e => e.currentHp > 0);
        if (alive.length > 0) {
          const target = alive.reduce((min, e) => e.currentHp < min.currentHp ? e : min, alive[0]);
          const targetIdx = this.battle.enemies.indexOf(target);
          this.battle.playerAction(this.selectedSkill, targetIdx);
          this.phase = 'animating';
        }
      }
    }
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 战斗背景（优先使用美术素材）
    if (this.battleBg) {
      ctx.drawImage(this.battleBg, 0, 0, W, H);
      // 半透明遮罩确保 UI 可读
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, W, H);
    } else {
      // 回退到渐变背景
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0a1a');
      grad.addColorStop(0.6, '#151530');
      grad.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 战场分割线
    ctx.strokeStyle = 'rgba(42, 32, 80, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // 敌方（上半部分）
    if (this.battle) {
      this._renderEnemies(ctx);
      this._renderParty(ctx);
      this._renderBattleUI(ctx);
      this._renderLog(ctx);

      // 粒子特效层（覆盖在角色上方）
      if (typeof ElementEffects !== 'undefined') ElementEffects.render(ctx);
      if (typeof BattleEffects !== 'undefined') BattleEffects.render(ctx);
    }

    // 战斗结果
    if (this.phase === 'result') {
      this._renderResult(ctx);
    }
  }

  _renderEnemies(ctx) {
    const enemies = this.battle.enemies.filter(e => e.currentHp > 0);
    const spacing = 200;
    const startX = 640 - (enemies.length * spacing) / 2 + spacing / 2;

    this.targetButtons = [];

    enemies.forEach((enemy, i) => {
      const x = startX + i * spacing;
      const y = 180;
      const elemColor = ElementSystem.colors[enemy.element] || '#999';

      // 敌人卡片（后期替换为 Q版动画帧）
      ctx.save();
      drawFramedPanel(ctx, x - 45, y - 60, 90, 120, 'panel', {
        slice: 20,
        fallbackBg: 'rgba(42, 21, 21, 0.85)',
        fallbackBorder: enemy === this.battle.currentActor ? '#ff6666' : '#4a2020'
      });

      // 元素图标（优先使用素材图，回退到文字）
      const elemIcon = GameAssets.icons[enemy.element];
      if (elemIcon) {
        ctx.drawImage(elemIcon, x + 22, y - 62, 22, 22);
      } else {
        Renderer.drawText(ctx, ElementSystem.names[enemy.element] || '', x + 35, y - 50, {
          fontSize: 11, color: elemColor, align: 'center'
        });
      }

      Renderer.drawText(ctx, enemy.name, x, y - 75, {
        fontSize: 14,
        color: '#ff9999',
        align: 'center'
      });

      // HP 条（使用渲染器）
      if (this._enemyHpBars && this._enemyHpBars[i]) {
        this._enemyHpBars[i].x = x - 40;
        this._enemyHpBars[i].y = y + 70;
        this._enemyHpBars[i].draw(ctx);
      } else {
        Renderer.drawBar(ctx, x - 40, y + 70, 80, 8, enemy.currentHp, enemy.maxHp, '#cc3333');
      }

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.fillText(`${enemy.currentHp}/${enemy.maxHp}`, x, y + 95);
      ctx.restore();

      // 目标选择区域
      if (this.phase === 'select_target') {
        this.targetButtons.push({
          target: enemy,
          index: this.battle.enemies.indexOf(enemy),
          rect: { x: x - 50, y: y - 65, w: 100, h: 140 }
        });
      }
    });
  }

  _renderParty(ctx) {
    const party = this.battle.party;
    const spacing = 200;
    const startX = 640 - (party.length * spacing) / 2 + spacing / 2;

    party.forEach((char, i) => {
      const x = startX + i * spacing;
      const y = 480;
      const elemColor = ElementSystem.colors[char.element] || '#999';

      ctx.save();
      const isActive = char === this.battle.currentActor;

      drawFramedPanel(ctx, x - 50, y - 65, 100, 130, 'panel', {
        slice: 20,
        fallbackBg: char.currentHp <= 0 ? 'rgba(26, 26, 26, 0.85)' : (isActive ? 'rgba(26, 42, 58, 0.85)' : 'rgba(21, 21, 42, 0.85)'),
        fallbackBorder: isActive ? '#5cb8ff' : '#303060'
      });

      // 元素图标（优先使用素材图，回退到文字）
      const elemIcon = GameAssets.icons[char.element];
      if (elemIcon) {
        ctx.drawImage(elemIcon, x + 26, y - 68, 22, 22);
      } else {
        Renderer.drawText(ctx, ElementSystem.names[char.element] || '', x + 38, y - 55, {
          fontSize: 11, color: elemColor, align: 'center'
        });
      }

      // 角色名
      Renderer.drawText(ctx, char.name, x, y - 80, {
        fontSize: 14,
        color: char.currentHp <= 0 ? '#555' : '#99ccff',
        align: 'center'
      });

      // HP 条（使用渲染器）
      if (this._partyHpBars && this._partyHpBars[i]) {
        this._partyHpBars[i].x = x - 40;
        this._partyHpBars[i].y = y + 70;
        this._partyHpBars[i].draw(ctx);
      } else {
        const hpColor = char.currentHp / char.maxHp > 0.5 ? '#33cc66' : (char.currentHp / char.maxHp > 0.2 ? '#cccc33' : '#cc3333');
        Renderer.drawBar(ctx, x - 40, y + 70, 80, 8, char.currentHp, char.maxHp, hpColor);
      }

      // 能量条（大招）- 使用渲染器
      if (this._partyEnergyBars && this._partyEnergyBars[i]) {
        this._partyEnergyBars[i].x = x - 40;
        this._partyEnergyBars[i].y = y + 83;
        this._partyEnergyBars[i].draw(ctx);
      } else {
        Renderer.drawBar(ctx, x - 40, y + 83, 80, 5, char.currentEnergy, char.maxEnergy, '#6699ff');
      }

      // 元素力条 - 使用渲染器
      if (this._partyForceBars && this._partyForceBars[i]) {
        this._partyForceBars[i].x = x - 40;
        this._partyForceBars[i].y = y + 92;
        this._partyForceBars[i].draw(ctx);
      } else {
        const forceColor = elemColor !== '#999999' ? elemColor : '#aa88cc';
        Renderer.drawBar(ctx, x - 40, y + 92, 80, 5, char.elementalForce || 0, ElementalForceSystem.maxForce, forceColor);
      }

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText(`HP ${char.currentHp}/${char.maxHp}`, x, y + 55);
      ctx.fillText(`EN ${char.currentEnergy}  EF ${char.elementalForce || 0}`, x, y + 108);

      ctx.restore();
    });

    // 渲染伤害弹出数字
    if (this._damagePopups) {
      for (const popup of this._damagePopups) {
        if (popup.alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = popup.alpha;
        ctx.font = `bold ${Math.round(22 * (popup.scale || 1))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 描边
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(popup.text, popup.x, popup.y);
        ctx.fillStyle = popup.color;
        ctx.fillText(popup.text, popup.x, popup.y);
        ctx.restore();
      }
    }
  }

  _renderBattleUI(ctx) {
    // 共鸣信息展示（右上角）
    if (this.battle && this.battle.resonances && this.battle.resonances.length > 0) {
      const resX = 1280 - 230;
      const resY = 15;
      drawFramedPanel(ctx, resX, resY, 210, 20 + this.battle.resonances.length * 22, 'panel', {
        slice: 15,
        fallbackBg: 'rgba(20, 10, 40, 0.8)',
        fallbackBorder: '#6a4a9a'
      });

      Renderer.drawText(ctx, '共鸣', resX + 10, resY + 14, {
        fontSize: 12, color: '#b090e0'
      });

      this.battle.resonances.forEach((res, i) => {
        const color = ElementSystem.colors[res.element] || '#999';
        Renderer.drawText(ctx, `✦ ${res.name}`, resX + 15, resY + 32 + i * 22, {
          fontSize: 11, color
        });
      });
    }

    // 技能按钮（玩家回合）
    if (this.phase === 'select_skill') {
      Renderer.drawText(ctx, '选择技能', 640, 590, {
        fontSize: 16,
        color: '#aaccff',
        align: 'center'
      });

      for (const btn of this.skillButtons) {
        drawFramedButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.label, {
          fontSize: 16,
          disabled: !btn.enabled,
          fallbackBg: btn.enabled ? '#1a2a4a' : '#1a1a2a',
          fallbackBorder: btn.enabled ? '#5588cc' : '#333'
        });
      }
    }

    // 目标选择提示
    if (this.phase === 'select_target') {
      Renderer.drawText(ctx, '选择目标', 640, 590, {
        fontSize: 16,
        color: '#ffaa88',
        align: 'center'
      });

      // 取消按钮
      drawFramedButton(ctx, 540, 630, 200, 40, '取消', { fontSize: 14 });
      this._cancelBtn = { x: 540, y: 630, w: 200, h: 40 };
    }

    // 自动战斗按钮（仅 Farm 关卡显示）
    if (this.isFarm && this.phase !== 'result') {
      const autoBtnW = 90, autoBtnH = 34;
      const autoBtnX = W - autoBtnW - 20, autoBtnY = H - autoBtnH - 20;
      this._autoBattleBtn = { x: autoBtnX, y: autoBtnY, w: autoBtnW, h: autoBtnH };
      drawFramedButton(ctx, autoBtnX, autoBtnY, autoBtnW, autoBtnH,
        this._autoBattle ? '⚡ 自动' : '自动战斗', {
          fontSize: 12,
          fallbackBg: this._autoBattle ? '#2a4a2a' : '#2a2a3e',
          fallbackBorder: this._autoBattle ? '#4a8a4a' : '#5c4d9a'
        });
    }
  }

  _renderLog(ctx) {
    const logY = 10;
    drawFramedPanel(ctx, 10, logY, 350, 100, 'panel', {
      slice: 15,
      fallbackBg: 'rgba(0, 0, 0, 0.7)',
      fallbackBorder: 'transparent'
    });

    const recentLogs = this.battle.battleLog.slice(-4);
    recentLogs.forEach((log, i) => {
      Renderer.drawText(ctx, log, 20, logY + 20 + i * 22, {
        fontSize: 12,
        color: '#aaa',
        shadow: false
      });
    });
  }

  _renderResult(ctx) {
    // 结果遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 1280, 720);

    const isVictory = this.battleResult === 'victory';
    Renderer.drawText(ctx, isVictory ? '战斗胜利！' : '战斗失败', 640, 300, {
      fontSize: 48,
      color: isVictory ? '#ffcc44' : '#cc4444',
      align: 'center'
    });

    drawFramedButton(ctx, 540, 400, 200, 50, '继续', { fontSize: 20 });
    this._resultBtn = { x: 540, y: 400, w: 200, h: 50 };
  }

  handleClick(x, y) {
    // 自动战斗切换按钮
    if (this._autoBattleBtn && Renderer.hitTest(x, y, this._autoBattleBtn)) {
      this._autoBattle = !this._autoBattle;
      this._autoTimer = 0;
      if (this._autoBattle) {
        console.log('[Battle] 自动战斗已开启');
      } else {
        console.log('[Battle] 自动战斗已关闭');
      }
      return;
    }

    // 自动战斗中 → 点击屏幕关闭自动
    if (this._autoBattle && this.phase !== 'result') {
      this._autoBattle = false;
      return;
    }

    // 技能选择
    if (this.phase === 'select_skill') {
      for (const btn of this.skillButtons) {
        if (btn.enabled && Renderer.hitTest(x, y, btn)) {
          this.selectedSkill = btn.key;
          this.phase = 'select_target';
          return;
        }
      }
    }

    // 目标选择
    if (this.phase === 'select_target') {
      // 取消
      if (this._cancelBtn && Renderer.hitTest(x, y, this._cancelBtn)) {
        this.phase = 'select_skill';
        this.selectedSkill = null;
        return;
      }

      for (const t of this.targetButtons) {
        if (Renderer.hitTest(x, y, t.rect)) {
          this.battle.playerAction(this.selectedSkill, t.index);
          this.phase = 'animating';
          return;
        }
      }
    }

    // 结果画面
    if (this.phase === 'result' && this._resultBtn) {
      if (Renderer.hitTest(x, y, this._resultBtn)) {
        if (this.battleResult === 'victory') {
          if (this.isFarm) {
            // Farm 关卡奖励结算
            let rewards;
            if (this.isDailyChallenge) {
              rewards = RewardCalculator.calculateDailyRewards();
            } else {
              rewards = RewardCalculator.calculateDrops(this.farmStageConfig);
            }
            RewardCalculator.applyToState(window.game?.state, rewards);

            this.sceneManager.switchTo('stage_result', {
              victory: true,
              rewards,
              stageName: this.farmStageConfig?.name || '每日挑战'
            });
          } else {
            // 剧情战斗
            if (this.chapterId && this.nodeId) {
              const sm = window.game?.storyManager;
              if (sm) {
                sm.completeBattleNode();
              }
            }
            this.sceneManager.switchTo('story_map');
          }
        } else {
          if (this.isFarm) {
            this.sceneManager.switchTo('stage_result', {
              victory: false,
              rewards: null,
              stageName: this.farmStageConfig?.name || '关卡'
            });
          } else {
            this.sceneManager.switchTo('main_menu');
          }
        }
      }
    }
  }
}

// ============ 抽卡场景 ============
class GachaScene {
  constructor() {
    this.sceneManager = null;
    this.gacha = null;
    this.results = [];
    this.phase = 'select'; // select, animating, results
    this.currentPool = 'standard';
    this.elapsed = 0;
  }

  onEnter() {
    if (!this.gacha) {
      this.gacha = new GachaEngine();
    }
    this.results = [];
    this.phase = 'select';
    this.elapsed = 0;
  }

  onExit() {}

  update(dt) {
    this.elapsed += dt;
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 抽卡背景（优先使用美术素材）
    if (GameAssets.ui.gachaBg) {
      ctx.drawImage(GameAssets.ui.gachaBg, 0, 0, W, H);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, W, H);
    } else {
      // 回退到渐变
      const grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 500);
      grad.addColorStop(0, '#1a1030');
      grad.addColorStop(1, '#0a0a14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 标题
    Renderer.drawText(ctx, '命运召唤', W / 2, 60, {
      fontSize: 36,
      color: '#d4b8ff',
      align: 'center'
    });

    // 返回按钮
    drawFramedButton(ctx, 30, 20, 100, 40, '返回', { fontSize: 14 });
    this._backBtn = { x: 30, y: 20, w: 100, h: 40 };

    if (this.phase === 'select') {
      this._renderPoolSelect(ctx);
    } else if (this.phase === 'results') {
      this._renderResults(ctx);
    }
  }

  _renderPoolSelect(ctx) {
    const W = 1280, H = 720;
    const pool = GachaConfig.pools[this.currentPool];

    // 卡池信息
    drawFramedPanel(ctx, W / 2 - 250, 120, 500, 200, 'panel', { slice: 30 });

    Renderer.drawText(ctx, pool.name, W / 2, 160, {
      fontSize: 28,
      color: '#e0d0ff',
      align: 'center'
    });

    Renderer.drawText(ctx, pool.description, W / 2, 200, {
      fontSize: 16,
      color: '#8080a0',
      align: 'center'
    });

    // 保底信息
    const pity = this.gacha.getPityInfo(this.currentPool);
    Renderer.drawText(ctx, `距离五星保底: ${pity.ssrPity}/${pity.ssrMax} 抽`, W / 2, 250, {
      fontSize: 14,
      color: '#ffcc44',
      align: 'center'
    });

    // 水晶显示
    const crystals = window.game?.state?.currency?.crystals || 0;
    Renderer.drawText(ctx, `💎 水晶: ${crystals}`, W / 2, 290, {
      fontSize: 16,
      color: '#88ccff',
      align: 'center'
    });

    // 按钮
    const btnW = 200, btnH = 55;
    this._pullButtons = [
      { x: W / 2 - btnW - 20, y: 380, w: btnW, h: btnH, text: `单抽 (${pool.cost.single}💎)`, count: 1 },
      { x: W / 2 + 20, y: 380, w: btnW, h: btnH, text: `十连 (${pool.cost.ten}💎)`, count: 10 }
    ];

    for (const btn of this._pullButtons) {
      const canAfford = this.gacha.canAfford(window.game?.state?.currency || { crystals: 0 }, this.currentPool, btn.count);
      drawFramedButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.text, {
        fontSize: 18,
        disabled: !canAfford
      });
    }
  }

  _renderResults(ctx) {
    const W = 1280, H = 720;

    // 结果展示
    const cols = Math.min(this.results.length, 5);
    const cardW = 140, cardH = 200;
    const startX = W / 2 - (cols * cardW + (cols - 1) * 15) / 2;

    this.results.forEach((result, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = startX + col * (cardW + 15);
      const y = 120 + row * (cardH + 20);

      const rarityColors = {
        ssr: { bg: '#3a2a0a', border: '#ffcc00', text: '#ffdd44', glow: 'rgba(255, 204, 0, 0.15)' },
        sr: { bg: '#2a1a3a', border: '#cc66ff', text: '#dd88ff', glow: 'rgba(204, 102, 255, 0.1)' },
        r: { bg: '#1a2a1a', border: '#66cc66', text: '#88dd88', glow: 'rgba(102, 204, 102, 0.08)' }
      };
      const colors = rarityColors[result.rarity];

      // 卡片发光效果（SSR 特殊）
      if (result.rarity === 'ssr') {
        ctx.save();
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 15;
        Renderer.drawPanel(ctx, x, y, cardW, cardH, { bg: colors.bg, border: colors.border });
        ctx.restore();
      } else {
        Renderer.drawPanel(ctx, x, y, cardW, cardH, { bg: colors.bg, border: colors.border });
      }

      // 元素图标（居中偏上）
      const elemIcon = GameAssets.icons[result.element];
      if (elemIcon) {
        ctx.drawImage(elemIcon, x + cardW / 2 - 18, y + 18, 36, 36);
      } else {
        const elemName = ElementSystem.names[result.element] || '无';
        const elemColor = ElementSystem.colors[result.element] || '#999';
        Renderer.drawText(ctx, elemName, x + cardW / 2, y + 40, {
          fontSize: 24, color: elemColor, align: 'center'
        });
      }

      // 角色名
      Renderer.drawText(ctx, result.name, x + cardW / 2, y + 70, {
        fontSize: 13,
        color: colors.text,
        align: 'center'
      });

      // 稀有度
      const rarityLabel = { ssr: '★★★★★', sr: '★★★★', r: '★★★' };
      Renderer.drawText(ctx, rarityLabel[result.rarity], x + cardW / 2, y + 95, {
        fontSize: 12,
        color: colors.text,
        align: 'center'
      });

      // 定位
      Renderer.drawText(ctx, result.role || '', x + cardW / 2, y + 120, {
        fontSize: 12,
        color: '#8080a0',
        align: 'center'
      });

      // NEW 标记
      if (result.isNew) {
        Renderer.drawPanel(ctx, x + cardW - 38, y + 4, 34, 18, {
          bg: 'rgba(200, 30, 30, 0.9)', border: '#ff4444', radius: 4
        });
        Renderer.drawText(ctx, 'NEW', x + cardW - 21, y + 13, {
          fontSize: 10,
          color: '#fff',
          align: 'center'
        });
      }
    });

    // 确认按钮
    drawFramedButton(ctx, W / 2 - 100, H - 100, 200, 50, '确认', { fontSize: 20 });
    this._confirmBtn = { x: W / 2 - 100, y: H - 100, w: 200, h: 50 };
  }

  handleClick(x, y) {
    // 返回
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this.sceneManager.switchTo('main_menu');
      return;
    }

    if (this.phase === 'select') {
      // 抽卡按钮
      for (const btn of this._pullButtons || []) {
        if (Renderer.hitTest(x, y, btn)) {
          const currency = window.game?.state?.currency;
          if (currency && this.gacha.canAfford(currency, this.currentPool, btn.count)) {
            this.gacha.deductCost(currency, this.currentPool, btn.count);
            this.results = this.gacha.pull(this.currentPool, btn.count);
            this.phase = 'results';
          }
          return;
        }
      }
    }

    if (this.phase === 'results') {
      if (this._confirmBtn && Renderer.hitTest(x, y, this._confirmBtn)) {
        // 将抽卡结果注册到图鉴
        this._registerResultsToRoster();
        this.phase = 'select';
        this.results = [];
      }
    }
  }

  // 将抽到的角色注册到 game.state.roster（已有则加命座）
  _registerResultsToRoster() {
    const state = window.game?.state;
    if (!state || !state.roster) return;

    for (const result of this.results) {
      const existing = state.roster.find(c => c.id === result.id);
      if (existing) {
        // 重复获得 → 命座 +1
        existing.stars = (existing.stars || 0) + 1;
      } else {
        // 新角色 → 加入图鉴
        const tpl = CharacterStats.templates[result.id];
        state.roster.push({
          id: result.id,
          name: result.name,
          level: 1,
          element: result.element || 'none',
          role: result.role || '输出',
          rarity: result.rarity,
          stars: 0,
          skills: tpl?.skills || {
            normal: { name: '攻击', type: 'single', multiplier: 1.0, desc: '普通攻击' },
            skill: { name: '技能', type: 'single', multiplier: 1.2, energyCost: 25, desc: '元素技能' },
            resonance: { name: '共鸣技', type: 'single', multiplier: 1.5, desc: '共鸣技' },
            ultimate: { name: '大招', type: 'single', multiplier: 2.5, energyCost: 100, desc: '终结技' }
          },
          growth: CharacterGrowth.createGrowthData(result.id, 1)
        });
      }
    }

    // 同步抽卡记录到云端
    if (window.game?.saveManager?.connected && window.game?.saveManager?.currentUser) {
      window.game.saveManager.recordGacha(this.results.length, this.results);
    }
  }
}

// ============ 玩家统计场景 ============
class StatsScene {
  constructor() {
    this.sceneManager = null;
    this.tab = 0; // 0=总览, 1=角色, 2=关卡
    this.scrollOffset = 0;
  }

  onEnter() {
    this.tab = 0;
    this.scrollOffset = 0;
    this._collectStats();
  }

  onExit() {}

  update(dt) {}

  _collectStats() {
    const state = window.game?.state;
    const storyManager = window.game?.storyManager;

    this.stats = {
      // 基础信息
      playerName: state?.player?.username || '旅者',
      playerLevel: state?.player?.level || 1,

      // 角色统计
      rosterCount: state?.roster?.length || 0,
      ssrCount: (state?.roster || []).filter(c => c.rarity === 'ssr').length,
      srCount: (state?.roster || []).filter(c => c.rarity === 'sr').length,
      rCount: (state?.roster || []).filter(c => c.rarity === 'r').length,

      // 资源
      crystals: state?.currency?.crystals || 0,
      coins: state?.currency?.coins || 0,

      // 编队
      partySize: state?.party?.length || 0,

      // 剧情进度
      storyNodes: storyManager?.completedNodes?.size || 0,
      unlockedChapters: storyManager?.unlockedChapters?.size || 1,

      // 背包
      inventory: state?.inventory || {},

      // 角色详情
      roster: state?.roster || [],

      // 关卡进度（从本地存档读取）
      stageProgress: this._loadStageProgress()
    };
  }

  _loadStageProgress() {
    const local = new LocalSaveManager();
    const saves = local.load('main');
    return saves?.stageProgress || null;
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0d1f');
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 顶部标题栏
    drawFramedPanel(ctx, 20, 15, W - 40, 50, 'panel', { slice: 15 });
    Renderer.drawText(ctx, '冒险统计', 40, 40, { fontSize: 20, color: '#d4b8ff' });

    // 返回按钮
    drawFramedButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // Tab 切换
    const tabs = ['总览', '角色', '背包'];
    this._tabBtns = [];
    const tabW = 120, tabH = 36;
    const tabStartX = 40;
    const tabY = 80;

    tabs.forEach((label, i) => {
      const tx = tabStartX + i * (tabW + 10);
      const isActive = this.tab === i;
      drawFramedButton(ctx, tx, tabY, tabW, tabH, label, {
        fontSize: 15,
        fallbackBg: isActive ? '#3a2a5a' : '#1a1a2a',
        fallbackBorder: isActive ? '#8a5cbf' : '#3a3060'
      });
      this._tabBtns.push({ x: tx, y: tabY, w: tabW, h: tabH, index: i });
    });

    // 内容区域
    const contentY = 130;
    const contentH = H - contentY - 30;

    if (this.tab === 0) {
      this._renderOverview(ctx, 40, contentY, W - 80, contentH);
    } else if (this.tab === 1) {
      this._renderRoster(ctx, 40, contentY, W - 80, contentH);
    } else if (this.tab === 2) {
      this._renderInventory(ctx, 40, contentY, W - 80, contentH);
    }
  }

  _renderOverview(ctx, x, y, w, h) {
    const s = this.stats;
    drawFramedPanel(ctx, x, y, w, h, 'panel', { slice: 25 });

    const col1X = x + 30;
    const col2X = x + w / 2 + 20;
    let rowY = y + 30;
    const lineH = 36;

    // 左列 - 基础信息
    Renderer.drawText(ctx, '冒险者信息', col1X, rowY, { fontSize: 18, color: '#d4b8ff' });
    rowY += lineH;
    Renderer.drawText(ctx, `名称: ${s.playerName}`, col1X, rowY, { fontSize: 15, color: '#c0c0d0' });
    rowY += lineH - 8;
    Renderer.drawText(ctx, `等级: Lv.${s.playerLevel}`, col1X, rowY, { fontSize: 15, color: '#c0c0d0' });
    rowY += lineH - 8;
    Renderer.drawText(ctx, `编队: ${s.partySize} 人`, col1X, rowY, { fontSize: 15, color: '#c0c0d0' });
    rowY += lineH - 8;
    Renderer.drawText(ctx, `已解锁章节: ${s.unlockedChapters}`, col1X, rowY, { fontSize: 15, color: '#c0c0d0' });
    rowY += lineH - 8;
    Renderer.drawText(ctx, `已完成节点: ${s.storyNodes}`, col1X, rowY, { fontSize: 15, color: '#c0c0d0' });

    // 右列 - 资源 & 抽卡
    rowY = y + 30;
    Renderer.drawText(ctx, '资源与收集', col2X, rowY, { fontSize: 18, color: '#d4b8ff' });
    rowY += lineH;

    // 水晶
    drawItemIcon(ctx, 'crystals', col2X + 10, rowY, 18, '💎');
    Renderer.drawText(ctx, `水晶: ${s.crystals}`, col2X + 28, rowY, { fontSize: 15, color: '#88ccff' });
    rowY += lineH - 8;

    // 金币
    drawItemIcon(ctx, 'coins', col2X + 10, rowY, 18, '🪙');
    Renderer.drawText(ctx, `金币: ${s.coins}`, col2X + 28, rowY, { fontSize: 15, color: '#ffcc44' });
    rowY += lineH;

    // 角色统计
    Renderer.drawText(ctx, '角色收集', col2X, rowY, { fontSize: 18, color: '#d4b8ff' });
    rowY += lineH;
    Renderer.drawText(ctx, `总计: ${s.rosterCount} 名角色`, col2X, rowY, { fontSize: 15, color: '#c0c0d0' });
    rowY += lineH - 8;
    Renderer.drawText(ctx, `SSR: ${s.ssrCount}  ·  SR: ${s.srCount}  ·  R: ${s.rCount}`, col2X, rowY, { fontSize: 15, color: '#c0c0d0' });
    rowY += lineH;

    // SSR 率
    const totalPulls = s.ssrCount + s.srCount + s.rCount;
    if (totalPulls > 0) {
      const ssrRate = ((s.ssrCount / totalPulls) * 100).toFixed(1);
      Renderer.drawText(ctx, `SSR 出率: ${ssrRate}%`, col2X, rowY, { fontSize: 15, color: '#ffcc44' });
    }
  }

  _renderRoster(ctx, x, y, w, h) {
    const roster = this.stats.roster;

    if (roster.length === 0) {
      drawFramedPanel(ctx, x, y, w, h, 'panel', { slice: 25 });
      Renderer.drawText(ctx, '暂无角色，去召唤吧！', x + w / 2, y + h / 2, {
        fontSize: 18, color: '#8080a0', align: 'center'
      });
      return;
    }

    // 按稀有度排序
    const sorted = [...roster].sort((a, b) => {
      const order = { ssr: 0, sr: 1, r: 2 };
      return (order[a.rarity] || 3) - (order[b.rarity] || 3);
    });

    const cardW = 200, cardH = 100, gap = 12;
    const cols = Math.floor((w - gap) / (cardW + gap));

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    sorted.forEach((char, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = x + col * (cardW + gap) + gap / 2;
      const cy = y + row * (cardH + gap) - this.scrollOffset;

      if (cy + cardH < y || cy > y + h) return;

      const rarityColors = {
        ssr: { bg: 'rgba(60, 40, 10, 0.85)', border: '#ffcc00' },
        sr: { bg: 'rgba(40, 20, 60, 0.85)', border: '#cc66ff' },
        r: { bg: 'rgba(20, 40, 20, 0.85)', border: '#66cc66' }
      };
      const colors = rarityColors[char.rarity] || rarityColors.r;

      drawFramedPanel(ctx, cx, cy, cardW, cardH, 'panel', {
        slice: 15,
        fallbackBg: colors.bg,
        fallbackBorder: colors.border
      });

      // 元素图标
      const elemIcon = GameAssets.icons[char.element];
      if (elemIcon) {
        ctx.drawImage(elemIcon, cx + 8, cy + 8, 24, 24);
      }

      // 角色名
      Renderer.drawText(ctx, char.name || char.id, cx + 40, cy + 20, {
        fontSize: 14, color: '#e0d0ff'
      });

      // 稀有度
      const stars = { ssr: '★★★★★', sr: '★★★★', r: '★★★' };
      Renderer.drawText(ctx, stars[char.rarity] || '', cx + 10, cy + 42, {
        fontSize: 11, color: colors.border
      });

      // 等级
      Renderer.drawText(ctx, `Lv.${char.level || 1}`, cx + 10, cy + 62, {
        fontSize: 13, color: '#a0a0b0'
      });

      // 命座
      if (char.stars && char.stars > 0) {
        Renderer.drawText(ctx, `命座 ×${char.stars}`, cx + 80, cy + 62, {
          fontSize: 12, color: '#ffaa44'
        });
      }

      // 定位
      if (char.role) {
        Renderer.drawText(ctx, char.role, cx + 10, cy + 82, {
          fontSize: 11, color: '#8080a0'
        });
      }
    });

    ctx.restore();

    // 滚动指示
    if (sorted.length > cols * 3) {
      const maxScroll = Math.max(0, Math.ceil(sorted.length / cols) * (cardH + gap) - h);
      if (maxScroll > 0) {
        const barH = Math.max(30, (h / (maxScroll + h)) * h);
        const barY = y + (this.scrollOffset / maxScroll) * (h - barH);
        ctx.fillStyle = 'rgba(128, 128, 160, 0.3)';
        Renderer.roundRect(ctx, x + w - 6, barY, 4, barH, 2);
        ctx.fill();
      }
    }
  }

  _renderInventory(ctx, x, y, w, h) {
    const inv = this.stats.inventory;
    drawFramedPanel(ctx, x, y, w, h, 'panel', { slice: 25 });

    const items = [
      { key: 'exp_book_1', name: '初级经验书', count: inv.exp_book_1 || 0 },
      { key: 'exp_book_2', name: '中级经验书', count: inv.exp_book_2 || 0 },
      { key: 'exp_book_3', name: '高级经验书', count: inv.exp_book_3 || 0 },
      { key: 'asc_stone_1', name: '微光之石', count: inv.asc_stone_1 || 0 },
      { key: 'asc_stone_2', name: '辉光晶石', count: inv.asc_stone_2 || 0 },
      { key: 'asc_stone_3', name: '星辉核心', count: inv.asc_stone_3 || 0 },
      { key: 'asc_stone_4', name: '虹彩精华', count: inv.asc_stone_4 || 0 },
      { key: 'asc_stone_5', name: '命运之证', count: inv.asc_stone_5 || 0 }
    ];

    const itemH = 44;
    const startY = y + 30;

    Renderer.drawText(ctx, '背包道具', x + 30, startY, { fontSize: 18, color: '#d4b8ff' });

    items.forEach((item, i) => {
      const iy = startY + 30 + i * itemH;
      if (iy + itemH > y + h) return;

      // 图标
      drawItemIcon(ctx, item.key, x + 50, iy + itemH / 2, 28);

      // 名称
      Renderer.drawText(ctx, item.name, x + 80, iy + itemH / 2, {
        fontSize: 15, color: '#c0c0d0'
      });

      // 数量
      Renderer.drawText(ctx, `×${item.count}`, x + w - 60, iy + itemH / 2, {
        fontSize: 15, color: item.count > 0 ? '#88cc88' : '#606080', align: 'right'
      });

      // 分隔线
      if (i < items.length - 1) {
        ctx.strokeStyle = 'rgba(60, 50, 90, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 30, iy + itemH);
        ctx.lineTo(x + w - 30, iy + itemH);
        ctx.stroke();
      }
    });
  }

  handleClick(x, y) {
    // 返回
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this.sceneManager.switchTo('main_menu');
      return;
    }

    // Tab 切换
    for (const btn of this._tabBtns || []) {
      if (Renderer.hitTest(x, y, btn)) {
        this.tab = btn.index;
        this.scrollOffset = 0;
        return;
      }
    }
  }

  handleSwipe(direction, dist) {
    // 角色列表支持滑动
    if (this.tab === 1) {
      if (direction === 'up') this.scrollOffset += 80;
      if (direction === 'down') this.scrollOffset = Math.max(0, this.scrollOffset - 80);
    }
  }
}

// 导出所有场景
window.TitleScene = TitleScene;
window.MainMenuScene = MainMenuScene;
window.StoryMapScene = StoryMapScene;
window.DialogueScene = DialogueScene;
window.BattleScene = BattleScene;
window.GachaScene = GachaScene;
window.StatsScene = StatsScene;
