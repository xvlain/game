/**
 * stages.js - 材料掉落关卡 & 每日挑战
 * v0.6.0 新增
 *
 * 支持：
 *  - 经验书掉落关卡（初级 / 中级 / 高级）
 *  - 突破材料掉落关卡（按阶段分）
 *  - 每日挑战（轮换元素 boss）
 *  - 体力系统（每日恢复，关卡消耗）
 *  - 战斗胜利自动结算奖励到背包
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享记忆
 */

// ============ 体力系统 ============
const StaminaSystem = {
  maxStamina: 120,
  regenInterval: 300, // 秒：每 5 分钟恢复 1 点
  storageKey: 'game_stamina_v1',

  /** 读取本地体力数据 */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { current: this.maxStamina, lastTick: Date.now() };
      const data = JSON.parse(raw);
      // 离线回复
      const elapsed = Math.floor((Date.now() - data.lastTick) / 1000);
      const recovered = Math.floor(elapsed / this.regenInterval);
      data.current = Math.min(this.maxStamina, data.current + recovered);
      data.lastTick = Date.now();
      return data;
    } catch {
      return { current: this.maxStamina, lastTick: Date.now() };
    }
  },

  /** 保存体力 */
  save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  },

  /** 消耗体力，返回是否成功 */
  spend(data, amount) {
    if (data.current < amount) return false;
    data.current -= amount;
    data.lastTick = Date.now();
    this.save(data);
    return true;
  },

  /** 补充体力（签到奖励等） */
  add(data, amount) {
    data.current = Math.min(this.maxStamina, data.current + amount);
    data.lastTick = Date.now();
    this.save(data);
  }
};

// ============ 关卡配置 ============
const StageConfig = {
  // —— 经验书关卡 ——
  exp: [
    {
      id: 'exp_easy',
      name: '修炼场·初级',
      desc: '适合 Lv.1~20 角色',
      staminaCost: 10,
      recommendedLevel: 10,
      enemies: [
        { id: 'train_dummy_1', name: '木桩人', hp: 600, atk: 40, def: 20, spd: 70, element: 'none' },
        { id: 'train_dummy_2', name: '木桩人', hp: 500, atk: 35, def: 15, spd: 75, element: 'none' }
      ],
      drops: [
        { item: 'exp_book_1', name: '初级经验书', chance: 1.0, min: 2, max: 4 },
        { item: 'exp_book_2', name: '中级经验书', chance: 0.3, min: 1, max: 1 },
        { item: 'coins', name: '金币', chance: 1.0, min: 200, max: 500 }
      ]
    },
    {
      id: 'exp_medium',
      name: '修炼场·中级',
      desc: '适合 Lv.20~40 角色',
      staminaCost: 15,
      recommendedLevel: 25,
      enemies: [
        { id: 'iron_dummy_1', name: '铁甲傀儡', hp: 1200, atk: 80, def: 50, spd: 80, element: 'metal' },
        { id: 'iron_dummy_2', name: '铁甲傀儡', hp: 1000, atk: 70, def: 45, spd: 85, element: 'metal' },
        { id: 'train_dummy_3', name: '木桩人·改', hp: 700, atk: 55, def: 25, spd: 90, element: 'none' }
      ],
      drops: [
        { item: 'exp_book_1', name: '初级经验书', chance: 0.8, min: 2, max: 3 },
        { item: 'exp_book_2', name: '中级经验书', chance: 0.7, min: 1, max: 2 },
        { item: 'exp_book_3', name: '高级经验书', chance: 0.1, min: 1, max: 1 },
        { item: 'coins', name: '金币', chance: 1.0, min: 400, max: 800 }
      ]
    },
    {
      id: 'exp_hard',
      name: '修炼场·高级',
      desc: '适合 Lv.40+ 角色',
      staminaCost: 20,
      recommendedLevel: 40,
      enemies: [
        { id: 'elite_dummy_1', name: '精英傀儡', hp: 2500, atk: 150, def: 80, spd: 90, element: 'earth' },
        { id: 'elite_dummy_2', name: '精英傀儡', hp: 2200, atk: 130, def: 70, spd: 95, element: 'earth' },
        { id: 'support_dummy', name: '增幅器', hp: 800, atk: 60, def: 40, spd: 100, element: 'none' }
      ],
      drops: [
        { item: 'exp_book_2', name: '中级经验书', chance: 0.9, min: 2, max: 3 },
        { item: 'exp_book_3', name: '高级经验书', chance: 0.35, min: 1, max: 1 },
        { item: 'coins', name: '金币', chance: 1.0, min: 800, max: 1500 }
      ]
    }
  ],

  // —— 突破材料关卡 ——
  material: [
    {
      id: 'mat_t1',
      name: '微光矿脉',
      desc: '掉落微光之石（突破 0→1 阶）',
      staminaCost: 15,
      recommendedLevel: 15,
      enemies: [
        { id: 'crystal_golem', name: '晶石魔像', hp: 1500, atk: 90, def: 60, spd: 75, element: 'earth' },
        { id: 'crystal_bat', name: '矿洞蝙蝠', hp: 400, atk: 70, def: 20, spd: 110, element: 'none' },
        { id: 'crystal_bat2', name: '矿洞蝙蝠', hp: 400, atk: 65, def: 20, spd: 105, element: 'none' }
      ],
      drops: [
        { item: 'asc_stone_1', name: '微光之石', chance: 0.85, min: 1, max: 3 },
        { item: 'exp_book_1', name: '初级经验书', chance: 0.5, min: 1, max: 2 },
        { item: 'coins', name: '金币', chance: 1.0, min: 300, max: 600 }
      ]
    },
    {
      id: 'mat_t2',
      name: '辉光洞穴',
      desc: '掉落辉光晶石（突破 1→3 阶）',
      staminaCost: 20,
      recommendedLevel: 30,
      enemies: [
        { id: 'radiant_guard', name: '辉光守卫', hp: 2800, atk: 140, def: 90, spd: 80, element: 'metal' },
        { id: 'radiant_sprite', name: '辉光精灵', hp: 1200, atk: 110, def: 50, spd: 100, element: 'water' },
        { id: 'radiant_golem', name: '石像兵', hp: 900, atk: 80, def: 60, spd: 85, element: 'earth' }
      ],
      drops: [
        { item: 'asc_stone_2', name: '辉光晶石', chance: 0.75, min: 1, max: 2 },
        { item: 'asc_stone_1', name: '微光之石', chance: 0.5, min: 1, max: 2 },
        { item: 'exp_book_2', name: '中级经验书', chance: 0.4, min: 1, max: 1 },
        { item: 'coins', name: '金币', chance: 1.0, min: 500, max: 1000 }
      ]
    },
    {
      id: 'mat_t3',
      name: '星辉深渊',
      desc: '掉落星辉核心（突破 3→5 阶）',
      staminaCost: 25,
      recommendedLevel: 50,
      enemies: [
        { id: 'abyss_lord', name: '深渊领主', hp: 4500, atk: 200, def: 120, spd: 85, element: 'fire' },
        { id: 'abyss_mage', name: '深渊法师', hp: 1800, atk: 160, def: 60, spd: 95, element: 'water' },
        { id: 'abyss_knight', name: '深渊骑士', hp: 2500, atk: 170, def: 100, spd: 90, element: 'metal' }
      ],
      drops: [
        { item: 'asc_stone_3', name: '星辉核心', chance: 0.65, min: 1, max: 2 },
        { item: 'asc_stone_2', name: '辉光晶石', chance: 0.6, min: 1, max: 2 },
        { item: 'exp_book_2', name: '中级经验书', chance: 0.5, min: 1, max: 2 },
        { item: 'exp_book_3', name: '高级经验书', chance: 0.15, min: 1, max: 1 },
        { item: 'coins', name: '金币', chance: 1.0, min: 800, max: 1500 }
      ]
    },
    {
      id: 'mat_t4',
      name: '虹彩圣域',
      desc: '掉落虹彩精华 & 命运之证（突破 5→6 阶）',
      staminaCost: 30,
      recommendedLevel: 65,
      enemies: [
        { id: 'holy_beast', name: '圣域神兽', hp: 6000, atk: 260, def: 150, spd: 95, element: 'wood' },
        { id: 'holy_angel', name: '圣域天使', hp: 3500, atk: 220, def: 100, spd: 100, element: 'water' },
        { id: 'holy_knight', name: '圣域骑士', hp: 4000, atk: 240, def: 130, spd: 90, element: 'metal' }
      ],
      drops: [
        { item: 'asc_stone_4', name: '虹彩精华', chance: 0.5, min: 1, max: 2 },
        { item: 'asc_stone_5', name: '命运之证', chance: 0.2, min: 1, max: 1 },
        { item: 'asc_stone_3', name: '星辉核心', chance: 0.5, min: 1, max: 1 },
        { item: 'exp_book_3', name: '高级经验书', chance: 0.3, min: 1, max: 1 },
        { item: 'coins', name: '金币', chance: 1.0, min: 1200, max: 2500 }
      ]
    }
  ],

  // —— 每日挑战（轮换 boss） ——
  dailyChallenge: {
    id: 'daily_boss',
    name: '每日挑战',
    desc: '每日轮换元素 Boss，首次通关奖励丰厚',
    staminaCost: 20,
    bossRotation: [
      { day: 0, element: 'metal', name: '金刚巨像', hp: 5000, atk: 220, def: 140, spd: 80 },
      { day: 1, element: 'wood',  name: '古树之王', hp: 5500, atk: 200, def: 120, spd: 85 },
      { day: 2, element: 'water', name: '深海蛟龙', hp: 4800, atk: 250, def: 100, spd: 95 },
      { day: 3, element: 'fire',  name: '炎魔君主', hp: 4500, atk: 280, def: 90,  spd: 100 },
      { day: 4, element: 'earth', name: '大地泰坦', hp: 6000, atk: 200, def: 160, spd: 75 },
      { day: 5, element: 'metal', name: '金刚巨像·改', hp: 6500, atk: 260, def: 160, spd: 85 },
      { day: 6, element: 'none',  name: '混沌之主', hp: 7000, atk: 300, def: 150, spd: 90 }
    ],
    rewards: {
      crystals: 80,
      coins: 2000,
      bonusDrops: [
        { item: 'exp_book_3', name: '高级经验书', chance: 0.5, min: 1, max: 1 },
        { item: 'asc_stone_3', name: '星辉核心', chance: 0.3, min: 1, max: 1 }
      ]
    }
  },

  /** 根据关卡 ID 查找关卡配置 */
  findById(stageId) {
    for (const cat of ['exp', 'material']) {
      const found = this[cat].find(s => s.id === stageId);
      if (found) return found;
    }
    if (this.dailyChallenge.id === stageId) return this.dailyChallenge;
    return null;
  },

  /** 生成每日 Boss 敌人配置 */
  getDailyBossEnemies() {
    const dayOfWeek = new Date().getDay();
    const bossTemplate = this.dailyChallenge.bossRotation[dayOfWeek];
    const minions = [
      { id: 'boss_minion_1', name: `${bossTemplate.name}的仆从`, hp: 1500, atk: 120, def: 60, spd: 95, element: bossTemplate.element === 'none' ? 'fire' : bossTemplate.element },
      { id: 'boss_minion_2', name: `${bossTemplate.name}的仆从`, hp: 1200, atk: 100, def: 50, spd: 100, element: bossTemplate.element === 'none' ? 'water' : bossTemplate.element }
    ];
    return [
      { id: 'daily_boss', name: bossTemplate.name, hp: bossTemplate.hp, atk: bossTemplate.atk, def: bossTemplate.def, spd: bossTemplate.spd, element: bossTemplate.element },
      ...minions
    ];
  }
};

// ============ 奖励结算 ============
const RewardCalculator = {
  /**
   * 计算关卡掉落
   * @returns {{ items: Object, coins: number, summary: string[] }}
   */
  calculateDrops(stageConfig) {
    const items = {};
    let coins = 0;
    const summary = [];

    if (!stageConfig || !stageConfig.drops) return { items, coins, summary };

    for (const drop of stageConfig.drops) {
      if (Math.random() > drop.chance) continue;

      const amount = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      if (drop.item === 'coins') {
        coins += amount;
        summary.push(`🪙 金币 ×${amount}`);
      } else {
        items[drop.item] = (items[drop.item] || 0) + amount;
        summary.push(`${drop.name} ×${amount}`);
      }
    }

    return { items, coins, summary };
  },

  /**
   * 计算每日挑战奖励
   */
  calculateDailyRewards() {
    const cfg = StageConfig.dailyChallenge;
    const items = {};
    let coins = cfg.rewards.coins;
    let crystals = cfg.rewards.crystals;
    const summary = [`💎 水晶 ×${crystals}`, `🪙 金币 ×${coins}`];

    for (const drop of cfg.rewards.bonusDrops) {
      if (Math.random() > drop.chance) continue;
      const amount = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
      items[drop.item] = (items[drop.item] || 0) + amount;
      summary.push(`${drop.name} ×${amount}`);
    }

    return { items, coins, crystals, summary };
  },

  /**
   * 将奖励写入 game.state
   */
  applyToState(gameState, reward) {
    if (!gameState) return;
    const inv = gameState.inventory || {};
    for (const [key, amount] of Object.entries(reward.items || {})) {
      inv[key] = (inv[key] || 0) + amount;
    }
    gameState.inventory = inv;
    if (reward.coins) gameState.currency.coins = (gameState.currency?.coins || 0) + reward.coins;
    if (reward.crystals) gameState.currency.crystals = (gameState.currency?.crystals || 0) + reward.crystals;
  }
};

// ============ 关卡选择场景 ============
class FarmStageScene {
  constructor() {
    this.sceneManager = null;
    this.tab = 'exp'; // 'exp' | 'material' | 'daily'
    this.scrollY = 0;
    this._stageRects = [];
    this._tabBtns = [];
    this._backBtn = null;
    this._stamina = null;
    this._message = null;
    this._messageTimer = 0;
  }

  onEnter() {
    this._stamina = StaminaSystem.load();
    this.scrollY = 0;
    this._message = null;
    this._messageTimer = 0;
  }

  onExit() {}

  update(dt) {
    // 体力自然回复
    if (this._stamina) {
      const elapsed = Math.floor((Date.now() - this._stamina.lastTick) / 1000);
      const recovered = Math.floor(elapsed / StaminaSystem.regenInterval);
      if (recovered > 0 && this._stamina.current < StaminaSystem.maxStamina) {
        this._stamina.current = Math.min(StaminaSystem.maxStamina, this._stamina.current + recovered);
        this._stamina.lastTick = Date.now();
        StaminaSystem.save(this._stamina);
      }
    }
    if (this._messageTimer > 0) {
      this._messageTimer -= dt;
      if (this._messageTimer <= 0) this._message = null;
    }
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
    Renderer.drawPanel(ctx, 20, 15, W - 40, 50, { bg: 'rgba(15, 15, 30, 0.8)', border: '#3a3060' });
    Renderer.drawText(ctx, '挑战关卡', 40, 40, { fontSize: 20, color: '#d4b8ff' });
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // 体力显示
    if (this._stamina) {
      const stText = `⚡ ${this._stamina.current} / ${StaminaSystem.maxStamina}`;
      Renderer.drawText(ctx, stText, W / 2, 40, { fontSize: 16, color: '#66ccff', align: 'center' });
    }

    // Tab 切换
    const tabs = [
      { key: 'exp', label: '经验修炼' },
      { key: 'material', label: '材料采集' },
      { key: 'daily', label: '每日挑战' }
    ];
    this._tabBtns = [];
    const tabW = 180, tabH = 38, tabGap = 20;
    const tabStartX = (W - (tabs.length * tabW + (tabs.length - 1) * tabGap)) / 2;
    const tabY = 80;

    for (let i = 0; i < tabs.length; i++) {
      const tx = tabStartX + i * (tabW + tabGap);
      const isActive = this.tab === tabs[i].key;

      Renderer.drawPanel(ctx, tx, tabY, tabW, tabH, {
        bg: isActive ? 'rgba(50, 35, 80, 0.95)' : 'rgba(20, 15, 40, 0.8)',
        border: isActive ? '#8a5cbf' : '#3a2a6a'
      });
      Renderer.drawText(ctx, tabs[i].label, tx + tabW / 2, tabY + tabH / 2, {
        fontSize: 16, color: isActive ? '#d4b8ff' : '#8080a0', align: 'center'
      });

      this._tabBtns.push({ key: tabs[i].key, rect: { x: tx, y: tabY, w: tabW, h: tabH } });
    }

    // 关卡列表
    this._stageRects = [];
    const listY = 135;
    const listW = W - 80;
    const listX = 40;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, listY - 5, W, H - listY - 10);
    ctx.clip();

    if (this.tab === 'daily') {
      this._renderDailyChallenge(ctx, listX, listY, listW);
    } else {
      const stages = this.tab === 'exp' ? StageConfig.exp : StageConfig.material;
      this._renderStageList(ctx, stages, listX, listY, listW);
    }

    ctx.restore();

    // 消息提示
    if (this._message) {
      const msgBg = this._message.success ? 'rgba(20, 60, 20, 0.9)' : 'rgba(60, 20, 20, 0.9)';
      const msgBorder = this._message.success ? '#4a8a4a' : '#8a4a4a';
      const msgColor = this._message.success ? '#88ff88' : '#ff8888';
      Renderer.drawPanel(ctx, W / 2 - 220, H - 50, 440, 36, { bg: msgBg, border: msgBorder });
      Renderer.drawText(ctx, this._message.text, W / 2, H - 32, {
        fontSize: 14, color: msgColor, align: 'center'
      });
    }
  }

  _renderStageList(ctx, stages, x, y, w) {
    const itemH = 130;
    const gap = 15;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const sy = y + i * (itemH + gap) - this.scrollY;
      if (sy + itemH < y - 20 || sy > y + 600) continue;

      const canAfford = this._stamina && this._stamina.current >= stage.staminaCost;

      Renderer.drawPanel(ctx, x, sy, w, itemH, {
        bg: 'rgba(20, 15, 40, 0.85)',
        border: canAfford ? '#4a3a8a' : '#2a2040'
      });

      // 关卡名
      Renderer.drawText(ctx, stage.name, x + 20, sy + 25, {
        fontSize: 20, color: canAfford ? '#e0d0ff' : '#606080'
      });

      // 描述
      Renderer.drawText(ctx, stage.desc, x + 20, sy + 52, {
        fontSize: 13, color: '#8080a0'
      });

      // 推荐等级 & 体力消耗
      Renderer.drawText(ctx, `推荐 Lv.${stage.recommendedLevel}+`, x + 20, sy + 78, {
        fontSize: 12, color: '#66aacc'
      });
      Renderer.drawText(ctx, `⚡ ${stage.staminaCost}`, x + 160, sy + 78, {
        fontSize: 12, color: canAfford ? '#66ccff' : '#ff6666'
      });

      // 掉落预览
      const dropNames = stage.drops.map(d => d.name).filter((v, idx, arr) => arr.indexOf(v) === idx);
      Renderer.drawText(ctx, `掉落: ${dropNames.join(' / ')}`, x + 20, sy + 100, {
        fontSize: 11, color: '#707090'
      });

      // 挑战按钮
      const btnX = x + w - 120;
      Renderer.drawButton(ctx, btnX, sy + itemH / 2 - 22, 100, 44, '挑战', {
        fontSize: 16,
        disabled: !canAfford,
        bgColor: canAfford ? '#2a1a4a' : '#1a1a2a',
        borderColor: canAfford ? '#8a5cbf' : '#333'
      });

      this._stageRects.push({
        stage,
        btnRect: { x: btnX, y: sy + itemH / 2 - 22, w: 100, h: 44 },
        enabled: canAfford
      });
    }
  }

  _renderDailyChallenge(ctx, x, y, w) {
    const dayOfWeek = new Date().getDay();
    const bossTemplate = StageConfig.dailyChallenge.bossRotation[dayOfWeek];
    const cfg = StageConfig.dailyChallenge;
    const canAfford = this._stamina && this._stamina.current >= cfg.staminaCost;
    const itemH = 200;

    Renderer.drawPanel(ctx, x, y, w, itemH, {
      bg: 'rgba(25, 15, 40, 0.9)',
      border: canAfford ? '#9a5cbf' : '#2a2040'
    });

    // Boss 名称
    const elemName = ElementSystem.names[bossTemplate.element] || '混沌';
    const elemColor = ElementSystem.colors[bossTemplate.element] || '#999';
    Renderer.drawText(ctx, `今日 Boss: ${bossTemplate.name}`, x + 25, y + 30, {
      fontSize: 24, color: '#ffcc44'
    });
    Renderer.drawText(ctx, `${elemName}属性 · HP ${bossTemplate.hp} · ATK ${bossTemplate.atk}`, x + 25, y + 62, {
      fontSize: 14, color: elemColor
    });

    // 奖励信息
    Renderer.drawText(ctx, '首次通关奖励:', x + 25, y + 95, { fontSize: 14, color: '#aaccff' });
    Renderer.drawText(ctx, `💎 水晶 ×${cfg.rewards.crystals}   🪙 金币 ×${cfg.rewards.coins}`, x + 25, y + 118, {
      fontSize: 13, color: '#88cc88'
    });
    Renderer.drawText(ctx, '额外掉落: 高级经验书、星辉核心（概率）', x + 25, y + 140, {
      fontSize: 12, color: '#707090'
    });

    // 体力 & 按钮
    Renderer.drawText(ctx, `⚡ ${cfg.staminaCost}`, x + 25, y + 170, {
      fontSize: 14, color: canAfford ? '#66ccff' : '#ff6666'
    });

    const btnX = x + w - 140;
    Renderer.drawButton(ctx, btnX, y + itemH / 2 - 25, 120, 50, '挑战 Boss', {
      fontSize: 18,
      disabled: !canAfford,
      bgColor: canAfford ? '#3a1a5a' : '#1a1a2a',
      borderColor: canAfford ? '#aa66ff' : '#333'
    });

    this._stageRects.push({
      stage: cfg,
      btnRect: { x: btnX, y: y + itemH / 2 - 25, w: 120, h: 50 },
      enabled: canAfford,
      isDaily: true
    });

    // 一周 Boss 轮转预览
    let previewY = y + itemH + 20;
    Renderer.drawText(ctx, '本周 Boss 轮转:', x + 25, previewY, { fontSize: 14, color: '#a0a0c0' });
    previewY += 25;
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    for (let d = 0; d < 7; d++) {
      const boss = cfg.bossRotation[d];
      const isToday = d === dayOfWeek;
      const dayLabel = `周${dayNames[d]}`;
      const elName = ElementSystem.names[boss.element] || '混沌';
      const elColor = ElementSystem.colors[boss.element] || '#999';
      const dx = x + 25 + (d % 4) * 280;
      const dy = previewY + Math.floor(d / 4) * 28;

      Renderer.drawText(ctx, `${isToday ? '▶ ' : ''}${dayLabel}: ${boss.name}`, dx, dy, {
        fontSize: 12, color: isToday ? '#ffcc44' : '#8080a0'
      });
      Renderer.drawText(ctx, `[${elName}]`, dx + 220, dy, {
        fontSize: 11, color: elColor
      });
    }
  }

  _showMessage(text, success = true) {
    this._message = { text, success };
    this._messageTimer = 2.0;
  }

  handleClick(x, y) {
    // 返回
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this.sceneManager.switchTo('main_menu');
      return;
    }

    // Tab 切换
    for (const tb of this._tabBtns) {
      if (Renderer.hitTest(x, y, tb.rect)) {
        this.tab = tb.key;
        this.scrollY = 0;
        this._stageRects = [];
        return;
      }
    }

    // 关卡挑战
    for (const sr of this._stageRects) {
      if (!sr.enabled || !Renderer.hitTest(x, y, sr.btnRect)) continue;

      // 消耗体力
      if (!StaminaSystem.spend(this._stamina, sr.stage.staminaCost)) {
        this._showMessage('体力不足！', false);
        return;
      }

      // 准备敌人
      let enemies;
      if (sr.isDaily) {
        enemies = StageConfig.getDailyBossEnemies();
      } else {
        enemies = sr.stage.enemies;
      }

      // 进入战斗（携带关卡信息用于结算）
      this.sceneManager.switchTo('battle', {
        enemies,
        stageId: sr.stage.id,
        stageConfig: sr.stage,
        isDaily: sr.isDaily || false,
        isFarm: true // 标记为 Farm 关卡（非剧情）
      });
      return;
    }
  }

  handleSwipe(dir, dist) {
    if (dir === 'up') this.scrollY = Math.min(this.scrollY + 80, 400);
    if (dir === 'down') this.scrollY = Math.max(0, this.scrollY - 80);
  }
}

// ============ 战斗结果结算场景 ============
class StageResultScene {
  constructor() {
    this.sceneManager = null;
    this.rewards = null;
    this.isVictory = false;
    this.stageName = '';
    this._confirmBtn = null;
  }

  onEnter(data) {
    this.isVictory = data.victory;
    this.rewards = data.rewards;
    this.stageName = data.stageName || '关卡';
  }

  onExit() {}
  update(dt) {}

  render(ctx) {
    const W = 1280, H = 720;

    // 背景
    ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
    ctx.fillRect(0, 0, W, H);

    const centerY = H / 2 - 60;

    if (this.isVictory) {
      Renderer.drawText(ctx, '战斗胜利！', W / 2, centerY - 60, {
        fontSize: 42, color: '#ffcc44', align: 'center'
      });

      Renderer.drawText(ctx, `${this.stageName} 通关`, W / 2, centerY - 15, {
        fontSize: 18, color: '#aaccff', align: 'center'
      });

      // 奖励展示
      if (this.rewards && this.rewards.summary && this.rewards.summary.length > 0) {
        Renderer.drawPanel(ctx, W / 2 - 200, centerY + 20, 400, 30 + this.rewards.summary.length * 28, {
          bg: 'rgba(20, 30, 20, 0.9)',
          border: '#4a8a4a'
        });

        Renderer.drawText(ctx, '获得奖励', W / 2, centerY + 40, {
          fontSize: 16, color: '#88ff88', align: 'center'
        });

        this.rewards.summary.forEach((line, i) => {
          // 尝试匹配道具图标
          let iconKey = null;
          if (line.includes('金币')) iconKey = 'coins';
          else if (line.includes('水晶')) iconKey = 'crystals';
          else if (line.includes('初级经验书')) iconKey = 'exp_book_1';
          else if (line.includes('中级经验书')) iconKey = 'exp_book_2';
          else if (line.includes('高级经验书')) iconKey = 'exp_book_3';
          else if (line.includes('微光之石')) iconKey = 'asc_stone_1';
          else if (line.includes('辉光晶石')) iconKey = 'asc_stone_2';
          else if (line.includes('星辉核心')) iconKey = 'asc_stone_3';
          else if (line.includes('虹彩精华')) iconKey = 'asc_stone_4';
          else if (line.includes('命运之证')) iconKey = 'asc_stone_5';

          const lineY = centerY + 68 + i * 28;
          if (iconKey && typeof drawItemIcon === 'function') {
            drawItemIcon(ctx, iconKey, W / 2 - 80, lineY, 20);
            Renderer.drawText(ctx, line, W / 2 + 10, lineY, {
              fontSize: 15, color: '#ccffcc', align: 'center'
            });
          } else {
            Renderer.drawText(ctx, line, W / 2, lineY, {
              fontSize: 15, color: '#ccffcc', align: 'center'
            });
          }
        });
      }
    } else {
      Renderer.drawText(ctx, '战斗失败', W / 2, centerY - 40, {
        fontSize: 42, color: '#cc4444', align: 'center'
      });
      Renderer.drawText(ctx, '提升角色等级和装备后再来挑战吧', W / 2, centerY + 20, {
        fontSize: 16, color: '#8080a0', align: 'center'
      });
    }

    // 确认按钮
    const btnY = centerY + 180;
    Renderer.drawButton(ctx, W / 2 - 100, btnY, 200, 50, '返回', {
      fontSize: 20, bgColor: '#2a2a4a', borderColor: '#7c5cbf'
    });
    this._confirmBtn = { x: W / 2 - 100, y: btnY, w: 200, h: 50 };
  }

  handleClick(x, y) {
    if (this._confirmBtn && Renderer.hitTest(x, y, this._confirmBtn)) {
      this.sceneManager.switchTo('stages');
    }
  }
}

// ============ 每日签到系统 ============
const DailyCheckIn = {
  storageKey: 'game_checkin_v1',
  rewards: [
    { day: 1, type: 'crystals', amount: 100, label: '💎 水晶 ×100' },
    { day: 2, type: 'coins', amount: 1000, label: '🪙 金币 ×1000' },
    { day: 3, type: 'item', item: 'exp_book_1', amount: 3, label: '初级经验书 ×3' },
    { day: 4, type: 'crystals', amount: 150, label: '💎 水晶 ×150' },
    { day: 5, type: 'item', item: 'exp_book_2', amount: 2, label: '中级经验书 ×2' },
    { day: 6, type: 'coins', amount: 2000, label: '🪙 金币 ×2000' },
    { day: 7, type: 'crystals', amount: 300, label: '💎 水晶 ×300' }
  ],

  /** 检查今天是否已签到 */
  isCheckedIn() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const today = new Date().toDateString();
      return data.lastDate === today;
    } catch {
      return false;
    }
  },

  /** 执行签到，返回奖励信息（null 表示已签到） */
  checkIn(gameState) {
    if (this.isCheckedIn()) return null;

    let data;
    try {
      data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    } catch {
      data = {};
    }

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // 连续签到判定
    if (data.lastDate === yesterday) {
      data.streak = (data.streak || 0) + 1;
    } else if (data.lastDate !== today) {
      data.streak = 1;
    }
    data.lastDate = today;
    data.totalDays = (data.totalDays || 0) + 1;

    localStorage.setItem(this.storageKey, JSON.stringify(data));

    // 计算奖励（7天循环）
    const rewardIndex = ((data.streak - 1) % 7);
    const reward = this.rewards[rewardIndex];

    // 发放奖励
    if (reward.type === 'crystals') {
      gameState.currency.crystals = (gameState.currency?.crystals || 0) + reward.amount;
    } else if (reward.type === 'coins') {
      gameState.currency.coins = (gameState.currency?.coins || 0) + reward.amount;
    } else if (reward.type === 'item') {
      gameState.inventory[reward.item] = (gameState.inventory[reward.item] || 0) + reward.amount;
    }

    return {
      day: data.streak,
      reward,
      totalDays: data.totalDays
    };
  },

  /** 获取签到状态 */
  getStatus() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { streak: 0, totalDays: 0, lastDate: null };
      return JSON.parse(raw);
    } catch {
      return { streak: 0, totalDays: 0, lastDate: null };
    }
  }
};

// 导出
window.StaminaSystem = StaminaSystem;
window.StageConfig = StageConfig;
window.RewardCalculator = RewardCalculator;
window.FarmStageScene = FarmStageScene;
window.StageResultScene = StageResultScene;
window.DailyCheckIn = DailyCheckIn;
