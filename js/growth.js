/**
 * growth.js - 角色养成系统
 * 升级 / 突破 / 技能升级
 * v0.5.0 新增
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享：
 *   - GrowthScene 渲染角色立绘（assets/characters/portraits/<id>.png）
 *   - 美术侧按 assets/README.md 规范产出即可，本模块自动加载
 */

// ============ 养成配置 ============
const GrowthConfig = {
  maxLevel: 80,
  maxAscension: 6,

  // 每级所需 EXP（index = 当前等级）
  expTable: (function () {
    const t = [0]; // level 0 unused
    for (let lv = 1; lv < 80; lv++) {
      t.push(Math.floor(80 + lv * lv * 2.5 + lv * 20));
    }
    return t;
  })(),

  // 突破阶段：levelCap / 所需材料（占位）/ 金币
  ascensionStages: [
    { stage: 0, levelCap: 20, coins: 0,     materials: {} },
    { stage: 1, levelCap: 30, coins: 5000,  materials: { asc_stone_1: 3 } },
    { stage: 2, levelCap: 40, coins: 12000, materials: { asc_stone_1: 6, asc_stone_2: 2 } },
    { stage: 3, levelCap: 50, coins: 25000, materials: { asc_stone_2: 4, asc_stone_3: 1 } },
    { stage: 4, levelCap: 60, coins: 40000, materials: { asc_stone_2: 6, asc_stone_3: 3 } },
    { stage: 5, levelCap: 70, coins: 60000, materials: { asc_stone_3: 5, asc_stone_4: 2 } },
    { stage: 6, levelCap: 80, coins: 100000, materials: { asc_stone_4: 4, asc_stone_5: 2 } }
  ],

  // 技能升级消耗（skillLevel → coins）
  skillUpgradeCost: (function () {
    const t = {};
    for (let lv = 1; lv <= 10; lv++) {
      t[lv] = 800 * lv * lv;
    }
    return t;
  })(),

  maxSkillLevel: 10,

  // 升级材料定义（占位，后期通过关卡掉落填充）
  expItems: {
    exp_book_1:  { name: '初级经验书', exp: 500,   rarity: 'r' },
    exp_book_2:  { name: '中级经验书', exp: 2000,  rarity: 'sr' },
    exp_book_3:  { name: '高级经验书', exp: 10000, rarity: 'ssr' }
  },

  // 突破材料名称映射
  materialNames: {
    asc_stone_1: '微光之石',
    asc_stone_2: '辉光晶石',
    asc_stone_3: '星辉核心',
    asc_stone_4: '虹彩精华',
    asc_stone_5: '命运之证'
  },

  // 计算升级消耗
  getExpToNext(level, currentExp) {
    if (level >= this.maxLevel) return Infinity;
    const needed = this.expTable[level] || 999999;
    return Math.max(0, needed - currentExp);
  },

  // 获取突破信息
  getAscensionInfo(ascension) {
    if (ascension >= this.maxAscension) return null;
    return this.ascensionStages[ascension + 1] || null;
  },

  // 技能升级费用
  getSkillCost(currentLevel) {
    if (currentLevel >= this.maxSkillLevel) return null;
    return this.skillUpgradeCost[currentLevel] || null;
  }
};

// ============ 角色养成数据工厂 ============
const CharacterGrowth = {
  /**
   * 为已有角色创建养成数据
   */
  createGrowthData(templateId, level = 1) {
    return {
      exp: 0,
      ascension: 0,
      skillLevels: {
        normal: 1,
        skill: 1,
        resonance: 1,
        ultimate: 1
      }
    };
  },

  /**
   * 计算角色实际属性（基于等级、突破、技能等级）
   */
  calcStats(template, level, ascension, skillLevels) {
    if (!template) return null;

    const levelMult = 1 + (level - 1) * 0.08;
    const ascMult = 1 + ascension * 0.1; // 每突破+10%基础属性

    return {
      maxHp: Math.floor(template.hp * levelMult * ascMult),
      atk: Math.floor(template.atk * levelMult * ascMult),
      def: Math.floor(template.def * levelMult * ascMult),
      spd: template.spd + Math.floor(ascension * 3),
      crit_rate: template.crit_rate,
      crit_dmg: template.crit_dmg + ascension * 0.05
    };
  },

  /**
   * 计算技能倍率（基于技能等级）
   */
  calcSkillMultiplier(baseMultiplier, skillLevel) {
    return baseMultiplier * (1 + (skillLevel - 1) * 0.1); // 每级+10%
  },

  /**
   * 尝试升级（消耗经验道具）
   * @returns {{ success, newLevel, newExp, expUsed, coinsUsed }}
   */
  tryLevelUp(charData, expAmount, coins) {
    const growth = charData.growth;
    if (!growth) return { success: false, error: '无养成数据' };

    const currentLevel = charData.level || 1;
    const ascension = growth.ascension || 0;
    const stage = GrowthConfig.ascensionStages[ascension];
    const levelCap = stage ? stage.levelCap : 20;

    if (currentLevel >= levelCap) {
      return { success: false, error: `已达突破上限 (Lv.${levelCap})，需要先突破` };
    }

    let remainingExp = expAmount;
    let lv = currentLevel;
    let exp = growth.exp || 0;
    let totalExpUsed = 0;
    let totalCoins = 0;

    while (remainingExp > 0 && lv < levelCap) {
      const needed = GrowthConfig.getExpToNext(lv, exp);
      const coinCost = Math.floor(50 * lv);

      if (coins < coinCost) {
        return { success: false, error: '金币不足' };
      }

      if (remainingExp >= needed) {
        remainingExp -= needed;
        totalExpUsed += needed;
        totalCoins += coinCost;
        coins -= coinCost;
        lv++;
        exp = 0;
      } else {
        exp += remainingExp;
        totalExpUsed += remainingExp;
        totalCoins += Math.floor(coinCost * (remainingExp / needed));
        remainingExp = 0;
      }
    }

    return {
      success: true,
      newLevel: lv,
      newExp: exp,
      expUsed: totalExpUsed,
      coinsUsed: totalCoins,
      levelGained: lv - currentLevel
    };
  },

  /**
   * 尝试突破
   */
  tryAscend(charData, coins, materials) {
    const growth = charData.growth;
    if (!growth) return { success: false, error: '无养成数据' };

    const currentAsc = growth.ascension || 0;
    const nextStage = GrowthConfig.getAscensionInfo(currentAsc);

    if (!nextStage) {
      return { success: false, error: '已达最高突破' };
    }

    // 检查等级是否到达当前上限
    const currentStage = GrowthConfig.ascensionStages[currentAsc];
    if ((charData.level || 1) < currentStage.levelCap) {
      return { success: false, error: `需要先到 Lv.${currentStage.levelCap} 才能突破` };
    }

    // 检查金币
    if (coins < nextStage.coins) {
      return { success: false, error: `金币不足 (需要 ${nextStage.coins})` };
    }

    // 检查材料（当前阶段材料系统为占位，暂不严格检查）
    // TODO: 当材料系统完善后，在此检查 materials 库存

    return {
      success: true,
      newAscension: currentAsc + 1,
      coinsUsed: nextStage.coins,
      newLevelCap: nextStage.levelCap
    };
  },

  /**
   * 尝试技能升级
   */
  trySkillUp(charData, skillKey, coins) {
    const growth = charData.growth;
    if (!growth || !growth.skillLevels) return { success: false, error: '无养成数据' };

    const currentLv = growth.skillLevels[skillKey] || 1;
    const cost = GrowthConfig.getSkillCost(currentLv);

    if (cost === null) {
      return { success: false, error: '技能已满级' };
    }

    if (coins < cost) {
      return { success: false, error: `金币不足 (需要 ${cost})` };
    }

    return {
      success: true,
      newSkillLevel: currentLv + 1,
      coinsUsed: cost
    };
  }
};

// ============ 角色养成场景 ============
class GrowthScene {
  constructor() {
    this.sceneManager = null;
    this.characters = [];
    this.selectedIndex = 0;
    this.tab = 'level'; // 'level' | 'ascend' | 'skill'
    this.scrollY = 0;
    this._charRects = [];
    this._actionBtns = [];
    this._tabBtns = [];
    this._message = null;
    this._messageTimer = 0;
    this._portraitImages = {};
  }

  onEnter() {
    const state = window.game?.state;
    this.characters = (state?.roster || []).filter(c => c);
    this.selectedIndex = 0;
    this.tab = 'level';
    this.scrollY = 0;
    this._message = null;
    this._portraitImages = {};

    // 预加载选中角色立绘
    this._loadPortrait(this.characters[this.selectedIndex]);
  }

  onExit() {}

  _loadPortrait(char) {
    if (!char) return;
    const id = char.id;
    if (this._portraitImages[id]) return;

    // 尝试加载立绘
    const img = new Image();
    img.onload = () => { this._portraitImages[id] = img; };
    img.onerror = () => { this._portraitImages[id] = null; };
    img.src = `assets/characters/portraits/${id}.png`;
  }

  update(dt) {
    if (this._messageTimer > 0) {
      this._messageTimer -= dt;
      if (this._messageTimer <= 0) this._message = null;
    }
  }

  render(ctx) {
    const W = 1280, H = 720;

    // v0.17.0 角色详情背景图（素材不可用时降级到渐变）
    if (GameAssets.ui.charDetailBg) {
      ctx.drawImage(GameAssets.ui.charDetailBg, 0, 0, W, H);
      ctx.fillStyle = 'rgba(13, 13, 31, 0.55)';
      ctx.fillRect(0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0d0d1f');
      grad.addColorStop(1, '#1a1030');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 顶部栏
    Renderer.drawPanel(ctx, 20, 15, W - 40, 50, { bg: 'rgba(15, 15, 30, 0.8)', border: '#3a3060' });
    Renderer.drawText(ctx, '角色养成', 40, 40, { fontSize: 20, color: '#d4b8ff' });
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // 资源显示
    const state = window.game?.state;
    if (state) {
      if (typeof drawItemIcon === 'function') {
        drawItemIcon(ctx, 'coins', W - 275, 40, 18);
      }
      Renderer.drawText(ctx, `${state.currency?.coins || 0}`, W - 260, 40, {
        fontSize: 14, color: '#ffcc44'
      });
    }

    if (this.characters.length === 0) {
      Renderer.drawText(ctx, '暂无角色', W / 2, H / 2, {
        fontSize: 20, color: '#606080', align: 'center'
      });
      return;
    }

    // ── 左侧角色列表 ──
    this._renderCharList(ctx);

    // ── 右侧养成面板 ──
    const selected = this.characters[this.selectedIndex];
    if (selected) {
      this._renderGrowthPanel(ctx, selected);
    }

    // 提示消息
    if (this._message) {
      const msgBg = this._message.success ? 'rgba(20, 60, 20, 0.9)' : 'rgba(60, 20, 20, 0.9)';
      const msgBorder = this._message.success ? '#4a8a4a' : '#8a4a4a';
      const msgColor = this._message.success ? '#88ff88' : '#ff8888';
      Renderer.drawPanel(ctx, W / 2 - 200, H - 50, 400, 36, { bg: msgBg, border: msgBorder });
      Renderer.drawText(ctx, this._message.text, W / 2, H - 32, {
        fontSize: 14, color: msgColor, align: 'center'
      });
    }
  }

  _renderCharList(ctx) {
    const listX = 20, listY = 80, listW = 260, listH = 620;

    Renderer.drawPanel(ctx, listX, listY, listW, listH, {
      bg: 'rgba(12, 10, 25, 0.85)', border: '#3a2a6a'
    });

    Renderer.drawText(ctx, '角色列表', listX + listW / 2, listY + 18, {
      fontSize: 14, color: '#a0a0c0', align: 'center'
    });

    this._charRects = [];
    const itemH = 72;
    const startY = listY + 40;

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, startY, listW, listH - 50);
    ctx.clip();

    for (let i = 0; i < this.characters.length; i++) {
      const char = this.characters[i];
      const y = startY + i * (itemH + 6) - this.scrollY;
      if (y + itemH < startY || y > listY + listH) continue;

      const isSelected = i === this.selectedIndex;

      Renderer.drawPanel(ctx, listX + 8, y, listW - 16, itemH, {
        bg: isSelected ? 'rgba(40, 30, 70, 0.95)' : 'rgba(20, 15, 40, 0.7)',
        border: isSelected ? '#8a5cbf' : 'transparent'
      });

      // 头像
      Renderer.drawAvatar(ctx, listX + 45, y + itemH / 2, 22, char.name, char.element || 'none', {
        isActive: isSelected
      });

      // 名称
      Renderer.drawText(ctx, char.name || char.id, listX + 80, y + 22, {
        fontSize: 14, color: isSelected ? '#e0d0ff' : '#b0b0d0'
      });

      // 等级 & 突破
      const growth = char.growth || {};
      const asc = growth.ascension || 0;
      const ascStars = '★'.repeat(asc);
      Renderer.drawText(ctx, `Lv.${char.level || 1}`, listX + 80, y + 44, {
        fontSize: 12, color: '#88ccff'
      });
      if (asc > 0) {
        Renderer.drawText(ctx, ascStars, listX + 140, y + 44, {
          fontSize: 10, color: '#ffcc44'
        });
      }

      // 稀有度
      const rarity = char.rarity || 'r';
      const starCount = { ssr: 5, sr: 4, r: 3 }[rarity] || 3;
      const starColor = { ssr: '#ffcc00', sr: '#cc66ff', r: '#66cc66' }[rarity] || '#999';
      Renderer.drawText(ctx, '★'.repeat(starCount), listX + listW / 2 + 20, y + itemH - 12, {
        fontSize: 9, color: starColor, align: 'center'
      });

      this._charRects.push({ index: i, rect: { x: listX + 8, y, w: listW - 16, h: itemH } });
    }

    ctx.restore();
  }

  _renderGrowthPanel(ctx, char) {
    const W = 1280, H = 720;
    const panelX = 300, panelY = 80, panelW = W - 320, panelH = 620;

    Renderer.drawPanel(ctx, panelX, panelY, panelW, panelH, {
      bg: 'rgba(15, 12, 30, 0.9)', border: '#4a3a8a'
    });

    // ── 角色头部信息 ──
    const headerY = panelY + 15;

    // 立绘区域（或占位头像）
    const portraitX = panelX + 100;
    const portraitY = headerY + 100;
    const portrait = this._portraitImages[char.id];

    if (portrait) {
      // 绘制立绘（缩放适配）
      const maxW = 160, maxH = 200;
      const scale = Math.min(maxW / portrait.width, maxH / portrait.height);
      const dw = portrait.width * scale;
      const dh = portrait.height * scale;
      ctx.drawImage(portrait, portraitX - dw / 2, portraitY - dh / 2, dw, dh);
    } else {
      // 大头像占位
      Renderer.drawAvatar(ctx, portraitX, portraitY, 55, char.name, char.element, { isActive: true });
    }

    // 角色名 & 属性
    const infoX = panelX + 210;
    Renderer.drawText(ctx, char.name || char.id, infoX, headerY + 15, {
      fontSize: 24, color: '#e0d0ff'
    });

    const elemName = ElementSystem.names[char.element] || '无';
    const elemColor = ElementSystem.colors[char.element] || '#999';
    Renderer.drawText(ctx, `${elemName} · ${char.role || '未定'}`, infoX, headerY + 45, {
      fontSize: 14, color: elemColor
    });

    // 等级 & 突破
    const growth = char.growth || { exp: 0, ascension: 0, skillLevels: {} };
    const asc = growth.ascension || 0;
    Renderer.drawText(ctx, `Lv.${char.level || 1}`, infoX, headerY + 75, {
      fontSize: 20, color: '#88ccff'
    });
    if (asc > 0) {
      Renderer.drawText(ctx, '★'.repeat(asc), infoX + 70, headerY + 75, {
        fontSize: 16, color: '#ffcc44'
      });
    }

    // 属性面板
    const tpl = CharacterStats.templates[char.id];
    const stats = tpl ? CharacterGrowth.calcStats(tpl, char.level || 1, asc, growth.skillLevels) : null;

    if (stats) {
      let sy = headerY + 105;
      const statItems = [
        { label: 'HP', value: stats.maxHp, color: '#66cc66' },
        { label: 'ATK', value: stats.atk, color: '#ff8866' },
        { label: 'DEF', value: stats.def, color: '#6688cc' },
        { label: 'SPD', value: stats.spd, color: '#ccaa44' },
        { label: '暴击率', value: `${(stats.crit_rate * 100).toFixed(1)}%`, color: '#ffcc44' },
        { label: '暴击伤害', value: `${(stats.crit_dmg * 100).toFixed(0)}%`, color: '#ff6644' }
      ];

      for (const si of statItems) {
        Renderer.drawText(ctx, si.label, infoX, sy, { fontSize: 12, color: '#8080a0' });
        Renderer.drawText(ctx, String(si.value), infoX + 100, sy, { fontSize: 12, color: si.color });
        sy += 22;
      }
    }

    // ── Tab 切换 ──
    const tabY = panelY + 250;
    const tabs = [
      { key: 'level', label: '升级' },
      { key: 'ascend', label: '突破' },
      { key: 'skill', label: '技能' }
    ];

    this._tabBtns = [];
    const tabW = 140, tabH = 38, tabGap = 15;
    const tabStartX = panelX + (panelW - (tabs.length * tabW + (tabs.length - 1) * tabGap)) / 2;

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

    // ── 内容区域 ──
    const contentY = tabY + 55;
    this._actionBtns = [];

    switch (this.tab) {
      case 'level':
        this._renderLevelTab(ctx, char, growth, panelX + 30, contentY, panelW - 60);
        break;
      case 'ascend':
        this._renderAscendTab(ctx, char, growth, panelX + 30, contentY, panelW - 60);
        break;
      case 'skill':
        this._renderSkillTab(ctx, char, growth, panelX + 30, contentY, panelW - 60);
        break;
    }
  }

  _renderLevelTab(ctx, char, growth, x, y, w) {
    const level = char.level || 1;
    const exp = growth.exp || 0;
    const asc = growth.ascension || 0;
    const stage = GrowthConfig.ascensionStages[asc];
    const levelCap = stage ? stage.levelCap : 20;

    // 当前等级 & EXP 条
    Renderer.drawText(ctx, `当前等级: Lv.${level}`, x, y, { fontSize: 16, color: '#c0c0e0' });

    const expNeeded = GrowthConfig.getExpToNext(level, exp);
    const expRatio = level >= levelCap ? 1 : (exp / (exp + expNeeded));

    Renderer.drawBar(ctx, x, y + 25, w - 20, 14, exp, exp + expNeeded, '#5cb8ff', '#1a1a2a');

    if (level >= levelCap) {
      Renderer.drawText(ctx, `已达上限 Lv.${levelCap} (需突破)`, x + w / 2 - 10, y + 32, {
        fontSize: 12, color: '#ffaa44', align: 'center'
      });
    } else {
      Renderer.drawText(ctx, `EXP: ${exp} / ${exp + expNeeded}`, x + w / 2 - 10, y + 32, {
        fontSize: 11, color: '#88aacc', align: 'center'
      });
    }

    // 经验道具使用
    let iy = y + 70;
    Renderer.drawText(ctx, '使用经验书', x, iy, { fontSize: 15, color: '#aaccff' });
    iy += 30;

    const state = window.game?.state;
    const inv = state?.inventory || {};

    const expItems = [
      { key: 'exp_book_1', label: '初级经验书 (+500 EXP)', amount: 500, iconKey: 'exp_book_1' },
      { key: 'exp_book_2', label: '中级经验书 (+2000 EXP)', amount: 2000, iconKey: 'exp_book_2' },
      { key: 'exp_book_3', label: '高级经验书 (+10000 EXP)', amount: 10000, iconKey: 'exp_book_3' }
    ];

    for (const item of expItems) {
      const count = inv[item.key] || 0;
      const canUse = count > 0 && level < levelCap;

      Renderer.drawPanel(ctx, x, iy, w - 20, 44, {
        bg: 'rgba(20, 15, 40, 0.8)', border: '#3a2a6a'
      });

      // 道具图标
      if (typeof drawItemIcon === 'function') {
        drawItemIcon(ctx, item.iconKey, x + 22, iy + 22, 28);
      }

      Renderer.drawText(ctx, item.label, x + 45, iy + 22, {
        fontSize: 13, color: canUse ? '#c0c0e0' : '#606080'
      });

      Renderer.drawText(ctx, `×${count}`, x + w - 160, iy + 22, {
        fontSize: 13, color: '#8080a0', align: 'right'
      });

      // 使用按钮
      const btnX = x + w - 100;
      Renderer.drawButton(ctx, btnX, iy + 6, 70, 32, '使用×1', {
        fontSize: 12,
        disabled: !canUse,
        bgColor: canUse ? '#1a2a4a' : '#1a1a2a',
        borderColor: canUse ? '#5588cc' : '#333'
      });

      this._actionBtns.push({
        action: 'use_exp',
        itemKey: item.key,
        amount: item.amount,
        rect: { x: btnX, y: iy + 6, w: 70, h: 32 },
        enabled: canUse
      });

      iy += 54;
    }

    // 提示
    iy += 10;
    Renderer.drawText(ctx, '提示：经验书可通过关卡掉落获取', x, iy, {
      fontSize: 12, color: '#606080'
    });
  }

  _renderAscendTab(ctx, char, growth, x, y, w) {
    const level = char.level || 1;
    const asc = growth.ascension || 0;

    Renderer.drawText(ctx, `当前突破: ${'★'.repeat(asc) || '无'}`, x, y, {
      fontSize: 16, color: asc > 0 ? '#ffcc44' : '#8080a0'
    });

    const currentStage = GrowthConfig.ascensionStages[asc];
    const nextStage = GrowthConfig.getAscensionInfo(asc);

    let iy = y + 35;

    // 当前阶段信息
    Renderer.drawPanel(ctx, x, iy, w - 20, 60, {
      bg: 'rgba(20, 15, 40, 0.8)', border: '#3a2a6a'
    });
    Renderer.drawText(ctx, `当前阶段: ${asc} 阶 · 等级上限 Lv.${currentStage.levelCap}`, x + 15, iy + 22, {
      fontSize: 14, color: '#c0c0e0'
    });
    Renderer.drawText(ctx, `当前等级: Lv.${level}`, x + 15, iy + 44, {
      fontSize: 13, color: '#88ccff'
    });
    iy += 80;

    if (!nextStage) {
      Renderer.drawText(ctx, '已达最高突破！', x, iy, {
        fontSize: 18, color: '#ffcc44'
      });
      return;
    }

    // 突破需求
    Renderer.drawText(ctx, `突破至 ${asc + 1} 阶`, x, iy, {
      fontSize: 16, color: '#d4b8ff'
    });
    iy += 30;

    // 等级要求
    const levelReady = level >= currentStage.levelCap;
    Renderer.drawText(ctx, `等级要求: Lv.${currentStage.levelCap}`, x + 10, iy, {
      fontSize: 13, color: levelReady ? '#66cc66' : '#ff8866'
    });
    iy += 24;

    // 金币需求
    const state = window.game?.state;
    const coins = state?.currency?.coins || 0;
    const coinsReady = coins >= nextStage.coins;
    Renderer.drawText(ctx, `金币: ${nextStage.coins}`, x + 10, iy, {
      fontSize: 13, color: coinsReady ? '#66cc66' : '#ff8866'
    });
    iy += 24;

    // 材料需求
    for (const [matKey, matCount] of Object.entries(nextStage.materials)) {
      const matName = GrowthConfig.materialNames[matKey] || matKey;
      const have = state?.inventory?.[matKey] || 0;
      const ready = have >= matCount;
      // 道具图标
      if (typeof drawItemIcon === 'function') {
        drawItemIcon(ctx, matKey, x + 22, iy, 18);
      }
      Renderer.drawText(ctx, `${matName}: ${have}/${matCount}`, x + 38, iy, {
        fontSize: 13, color: ready ? '#66cc66' : '#ff8866'
      });
      iy += 24;
    }

    iy += 15;

    // 突破效果预览
    Renderer.drawText(ctx, '突破效果:', x, iy, { fontSize: 14, color: '#aaccff' });
    iy += 22;
    Renderer.drawText(ctx, `· 等级上限提升至 Lv.${nextStage.levelCap}`, x + 10, iy, {
      fontSize: 12, color: '#8080a0'
    });
    iy += 20;
    Renderer.drawText(ctx, '· 基础属性 +10%', x + 10, iy, {
      fontSize: 12, color: '#8080a0'
    });
    iy += 20;
    Renderer.drawText(ctx, '· 暴击伤害 +5%', x + 10, iy, {
      fontSize: 12, color: '#8080a0'
    });
    iy += 20;
    Renderer.drawText(ctx, '· 速度 +3', x + 10, iy, {
      fontSize: 12, color: '#8080a0'
    });
    iy += 35;

    // 突破按钮
    const canAscend = levelReady && coinsReady; // 材料暂不严格检查
    Renderer.drawButton(ctx, x + w / 2 - 100, iy, 200, 48, '突破', {
      fontSize: 18,
      disabled: !canAscend,
      bgColor: canAscend ? '#2a1a4a' : '#1a1a2a',
      borderColor: canAscend ? '#9a7cbf' : '#333'
    });

    this._actionBtns.push({
      action: 'ascend',
      rect: { x: x + w / 2 - 100, y: iy, w: 200, h: 48 },
      enabled: canAscend
    });
  }

  _renderSkillTab(ctx, char, growth, x, y, w) {
    const tpl = CharacterStats.templates[char.id];
    if (!tpl || !tpl.skills) {
      Renderer.drawText(ctx, '无技能数据', x, y, { fontSize: 14, color: '#606080' });
      return;
    }

    const skillLevels = growth.skillLevels || {};
    const state = window.game?.state;
    const coins = state?.currency?.coins || 0;

    Renderer.drawText(ctx, '技能升级', x, y, { fontSize: 16, color: '#aaccff' });
    Renderer.drawText(ctx, '(每级技能倍率 +10%)', x + 120, y, { fontSize: 12, color: '#606080' });

    let iy = y + 35;
    const skillLabels = { normal: '普攻', skill: '战技', resonance: '共鸣技', ultimate: '大招' };

    for (const [key, skill] of Object.entries(tpl.skills)) {
      const currentLv = skillLevels[key] || 1;
      const cost = GrowthConfig.getSkillCost(currentLv);
      const canUpgrade = cost !== null && coins >= cost;

      Renderer.drawPanel(ctx, x, iy, w - 20, 65, {
        bg: 'rgba(20, 15, 40, 0.8)', border: '#3a2a6a'
      });

      // 技能名 & 等级
      const label = skillLabels[key] || key;
      Renderer.drawText(ctx, `${label}: ${skill.name}`, x + 15, iy + 18, {
        fontSize: 14, color: '#d0c0f0'
      });
      Renderer.drawText(ctx, `Lv.${currentLv}`, x + w - 80, iy + 18, {
        fontSize: 14, color: '#88ccff', align: 'right'
      });

      // 技能描述
      if (skill.desc) {
        Renderer.drawText(ctx, skill.desc, x + 25, iy + 38, {
          fontSize: 11, color: '#707090'
        });
      }

      // 当前倍率
      const currentMult = CharacterGrowth.calcSkillMultiplier(skill.multiplier || 1, currentLv);
      if (skill.multiplier && skill.multiplier > 0) {
        Renderer.drawText(ctx, `倍率: ${(currentMult * 100).toFixed(0)}%`, x + w - 170, iy + 38, {
          fontSize: 11, color: '#aacc88'
        });
      }

      // 升级按钮
      if (cost !== null) {
        const btnX = x + w - 120;
        Renderer.drawButton(ctx, btnX, iy + 42, 90, 20, `升级 (${cost}🪙)`, {
          fontSize: 10,
          disabled: !canUpgrade,
          bgColor: canUpgrade ? '#1a2a4a' : '#1a1a2a',
          borderColor: canUpgrade ? '#5588cc' : '#333'
        });

        this._actionBtns.push({
          action: 'skill_up',
          skillKey: key,
          rect: { x: btnX, y: iy + 42, w: 90, h: 20 },
          enabled: canUpgrade
        });
      } else {
        Renderer.drawText(ctx, 'MAX', x + w - 80, iy + 50, {
          fontSize: 12, color: '#ffcc44', align: 'right'
        });
      }

      iy += 78;
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

    // 角色列表选择
    for (const cr of this._charRects) {
      if (Renderer.hitTest(x, y, cr.rect)) {
        this.selectedIndex = cr.index;
        this._loadPortrait(this.characters[cr.index]);
        return;
      }
    }

    // Tab 切换
    for (const tb of this._tabBtns) {
      if (Renderer.hitTest(x, y, tb.rect)) {
        this.tab = tb.key;
        return;
      }
    }

    // 操作按钮
    const state = window.game?.state;
    const char = this.characters[this.selectedIndex];
    if (!char || !state) return;

    for (const btn of this._actionBtns) {
      if (!btn.enabled || !Renderer.hitTest(x, y, btn.rect)) continue;

      switch (btn.action) {
        case 'use_exp': {
          const inv = state.inventory || {};
          if ((inv[btn.itemKey] || 0) <= 0) break;
          inv[btn.itemKey]--;

          const result = CharacterGrowth.tryLevelUp(char, btn.amount, state.currency.coins);
          if (result.success) {
            char.level = result.newLevel;
            if (!char.growth) char.growth = CharacterGrowth.createGrowthData(char.id);
            char.growth.exp = result.newExp;
            state.currency.coins -= result.coinsUsed;
            this._showMessage(`升级成功！Lv.${char.level} (+${result.levelGained}级)`, true);
          } else {
            this._showMessage(result.error, false);
            inv[btn.itemKey]++; // 回退
          }
          break;
        }

        case 'ascend': {
          const result = CharacterGrowth.tryAscend(char, state.currency.coins, state.inventory);
          if (result.success) {
            if (!char.growth) char.growth = CharacterGrowth.createGrowthData(char.id);
            char.growth.ascension = result.newAscension;
            state.currency.coins -= result.coinsUsed;
            this._showMessage(`突破成功！${'★'.repeat(result.newAscension)} · 上限 Lv.${result.newLevelCap}`, true);
          } else {
            this._showMessage(result.error, false);
          }
          break;
        }

        case 'skill_up': {
          const result = CharacterGrowth.trySkillUp(char, btn.skillKey, state.currency.coins);
          if (result.success) {
            if (!char.growth) char.growth = CharacterGrowth.createGrowthData(char.id);
            char.growth.skillLevels[btn.skillKey] = result.newSkillLevel;
            state.currency.coins -= result.coinsUsed;
            this._showMessage(`技能升级！Lv.${result.newSkillLevel}`, true);
          } else {
            this._showMessage(result.error, false);
          }
          break;
        }
      }
    }
  }

  handleSwipe(dir, dist) {
    if (dir === 'up') this.scrollY = Math.min(this.scrollY + 80, this._maxScroll());
    if (dir === 'down') this.scrollY = Math.max(0, this.scrollY - 80);
  }

  _maxScroll() {
    const rows = this.characters.length;
    return Math.max(0, rows * 78 - 560);
  }
}

window.GrowthConfig = GrowthConfig;
window.CharacterGrowth = CharacterGrowth;
window.GrowthScene = GrowthScene;
