/**
 * characters.js - 角色图鉴与编队管理
 * v0.3.0 新增
 */

// ============ 角色图鉴场景 ============
class CharacterRosterScene {
  constructor() {
    this.sceneManager = null;
    this.characters = [];
    this.selectedChar = null;
    this.scrollY = 0;
    this.maxScroll = 0;
  }

  onEnter() {
    const state = window.game?.state;
    this.characters = state?.roster || [];
    this.selectedChar = null;
    this.scrollY = 0;

    // 计算最大滚动
    const rows = Math.ceil(this.characters.length / 4);
    this.maxScroll = Math.max(0, rows * 160 - 500);
  }

  onExit() {}

  update(dt) {}

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
    Renderer.drawText(ctx, '角色图鉴', 40, 40, { fontSize: 20, color: '#d4b8ff' });
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // 角色数量
    Renderer.drawText(ctx, `已拥有: ${this.characters.length} 名角色`, W / 2, 40, {
      fontSize: 14, color: '#8080a0', align: 'center'
    });

    if (this.characters.length === 0) {
      Renderer.drawText(ctx, '暂无角色，去召唤获取吧！', W / 2, H / 2, {
        fontSize: 20, color: '#606080', align: 'center'
      });
      return;
    }

    // 角色网格
    const cols = 4;
    const cardW = 220, cardH = 140, gap = 20;
    const startX = (W - (cols * cardW + (cols - 1) * gap)) / 2;
    const startY = 90;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 80, W, H - 100);
    ctx.clip();

    for (let i = 0; i < this.characters.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap) - this.scrollY;

      if (y + cardH < 80 || y > H) continue;

      const char = this.characters[i];
      const isSelected = this.selectedChar?.id === char.id;

      // 角色卡片
      Renderer.drawPanel(ctx, x, y, cardW, cardH, {
        bg: isSelected ? 'rgba(40, 30, 70, 0.95)' : 'rgba(25, 20, 45, 0.85)',
        border: isSelected ? '#8a5cbf' : '#4a3a8a'
      });

      // 头像
      const avatarX = x + 50;
      const avatarY = y + 55;
      Renderer.drawAvatar(ctx, avatarX, avatarY, 30, char.name, char.element || 'none', {
        isActive: isSelected
      });

      // 名称
      Renderer.drawText(ctx, char.name || char.id, x + 100, y + 30, {
        fontSize: 16, color: '#e0d0ff'
      });

      // 等级
      Renderer.drawText(ctx, `Lv.${char.level || 1}`, x + 100, y + 55, {
        fontSize: 13, color: '#88ccff'
      });

      // 元素
      const elemName = ElementSystem.names[char.element] || '无';
      const elemColor = ElementSystem.colors[char.element] || '#999';
      Renderer.drawText(ctx, elemName, x + 100, y + 78, {
        fontSize: 12, color: elemColor
      });

      // 稀有度星星
      const rarity = char.rarity || 'r';
      const starCount = { ssr: 5, sr: 4, r: 3 }[rarity] || 3;
      const stars = '★'.repeat(starCount);
      const starColor = { ssr: '#ffcc00', sr: '#cc66ff', r: '#66cc66' }[rarity] || '#999';
      Renderer.drawText(ctx, stars, x + cardW / 2, y + cardH - 15, {
        fontSize: 11, color: starColor, align: 'center'
      });

      // 存储点击区域
      this.characters[i]._rect = { x, y, w: cardW, h: cardH };
    }

    ctx.restore();

    // 角色详情面板（选中时）
    if (this.selectedChar) {
      this._renderDetail(ctx);
    }
  }

  _renderDetail(ctx) {
    const W = 1280, H = 720;
    const char = this.selectedChar;

    // 右侧详情面板
    const panelX = W - 320, panelY = 80, panelW = 300, panelH = H - 100;
    Renderer.drawPanel(ctx, panelX, panelY, panelW, panelH, {
      bg: 'rgba(15, 10, 30, 0.95)', border: '#6a4a9a'
    });

    // 大头像
    Renderer.drawAvatar(ctx, panelX + panelW / 2, panelY + 60, 45, char.name, char.element, { isActive: true });

    // 名字
    Renderer.drawText(ctx, char.name || char.id, panelX + panelW / 2, panelY + 125, {
      fontSize: 22, color: '#e0d0ff', align: 'center'
    });

    // 角色信息
    let infoY = panelY + 160;
    const lineH = 28;

    Renderer.drawText(ctx, `等级: ${char.level || 1}`, panelX + 30, infoY, { fontSize: 14, color: '#88ccff' });
    infoY += lineH;
    Renderer.drawText(ctx, `属性: ${ElementSystem.names[char.element] || '无'}`, panelX + 30, infoY, { fontSize: 14, color: ElementSystem.colors[char.element] || '#999' });
    infoY += lineH;
    Renderer.drawText(ctx, `定位: ${char.role || '未定'}`, panelX + 30, infoY, { fontSize: 14, color: '#a0a0c0' });
    infoY += lineH + 10;

    // 技能列表
    Renderer.drawText(ctx, '技能', panelX + 30, infoY, { fontSize: 16, color: '#d4b8ff' });
    infoY += 25;

    if (char.skills) {
      for (const [key, skill] of Object.entries(char.skills)) {
        if (infoY > panelY + panelH - 30) break;
        const label = { normal: '普攻', skill: '战技', resonance: '共鸣技', ultimate: '大招' }[key] || key;
        Renderer.drawText(ctx, `${label}: ${skill.name}`, panelX + 40, infoY, {
          fontSize: 12, color: '#b0b0d0'
        });
        infoY += 22;
        if (skill.desc) {
          Renderer.drawText(ctx, skill.desc, panelX + 50, infoY, {
            fontSize: 10, color: '#707090'
          });
          infoY += 18;
        }
      }
    }
  }

  handleClick(x, y) {
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this.sceneManager.switchTo('main_menu');
      return;
    }

    // 详情面板关闭
    if (this.selectedChar) {
      const W = 1280;
      if (x < W - 320) {
        this.selectedChar = null;
        return;
      }
    }

    for (const char of this.characters) {
      if (char._rect && Renderer.hitTest(x, y, char._rect)) {
        this.selectedChar = this.selectedChar?.id === char.id ? null : char;
        return;
      }
    }
  }
}

// ============ 编队管理场景 ============
class PartyScene {
  constructor() {
    this.sceneManager = null;
    this.party = [];
    this.roster = [];
    this.selectingSlot = -1;
    this.scrollY = 0;
  }

  onEnter() {
    const state = window.game?.state;
    this.party = state?.party || [];
    this.roster = state?.roster || [];
    this.selectingSlot = -1;
    this.scrollY = 0;
  }

  onExit() {}

  update(dt) {}

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
    Renderer.drawText(ctx, '编队管理', 40, 40, { fontSize: 20, color: '#d4b8ff' });
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // 共鸣预览
    this._renderResonancePreview(ctx);

    // 当前编队（4 个槽位）
    Renderer.drawText(ctx, '当前编队', 300, 100, { fontSize: 18, color: '#aaccff', align: 'center' });

    const slotSize = 120;
    const slotGap = 20;
    const totalW = 4 * slotSize + 3 * slotGap;
    const slotStartX = (600 - totalW) / 2 + 30;

    this._slotRects = [];

    for (let i = 0; i < 4; i++) {
      const x = slotStartX + i * (slotSize + slotGap);
      const y = 130;
      const member = this.party[i];

      this._slotRects.push({ x, y, w: slotSize, h: slotSize + 40, index: i });

      const isSelecting = this.selectingSlot === i;

      Renderer.drawPanel(ctx, x, y, slotSize, slotSize + 40, {
        bg: isSelecting ? 'rgba(50, 30, 80, 0.9)' : 'rgba(20, 15, 40, 0.85)',
        border: isSelecting ? '#aa66ff' : '#4a3a8a'
      });

      if (member) {
        const tpl = CharacterStats.templates[member.id];
        const charName = tpl?.name || member.id;
        const charElement = tpl?.element || 'none';

        Renderer.drawAvatar(ctx, x + slotSize / 2, y + 50, 35, charName, charElement, {
          isActive: isSelecting
        });

        Renderer.drawText(ctx, charName, x + slotSize / 2, y + slotSize + 15, {
          fontSize: 12, color: '#d0c0f0', align: 'center'
        });

        // 移除按钮
        Renderer.drawButton(ctx, x + slotSize - 25, y + 5, 20, 20, '×', {
          fontSize: 14, bgColor: '#4a1a1a', borderColor: '#884444', textColor: '#ff8888'
        });
      } else {
        Renderer.drawText(ctx, '+', x + slotSize / 2, y + 55, {
          fontSize: 36, color: '#404060', align: 'center'
        });
        Renderer.drawText(ctx, '空槽位', x + slotSize / 2, y + slotSize + 15, {
          fontSize: 12, color: '#505070', align: 'center'
        });
      }
    }

    // 可选角色列表
    Renderer.drawText(ctx, '可选角色', W / 2 + 150, 100, { fontSize: 18, color: '#aaccff', align: 'center' });

    const listX = W / 2 + 20;
    const listY = 130;
    const listW = W / 2 - 50;
    const itemH = 70;

    // 筛选出未在编队中的角色
    const partyIds = new Set(this.party.map(p => p.id));
    const available = this.roster.filter(c => !partyIds.has(c.id));

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX, listY - 5, listW, H - listY - 20);
    ctx.clip();

    if (available.length === 0) {
      Renderer.drawText(ctx, '没有更多可用角色', listX + listW / 2, listY + 80, {
        fontSize: 14, color: '#606080', align: 'center'
      });
    }

    for (let i = 0; i < available.length; i++) {
      const char = available[i];
      const y = listY + i * (itemH + 10) - this.scrollY;

      if (y + itemH < listY - 20 || y > H) continue;

      Renderer.drawPanel(ctx, listX, y, listW, itemH, {
        bg: 'rgba(25, 20, 45, 0.85)', border: '#3a2a6a'
      });

      Renderer.drawAvatar(ctx, listX + 40, y + itemH / 2, 22, char.name, char.element || 'none');

      Renderer.drawText(ctx, char.name || char.id, listX + 80, y + 25, {
        fontSize: 14, color: '#d0c0f0'
      });
      Renderer.drawText(ctx, `Lv.${char.level || 1} · ${ElementSystem.names[char.element] || '无'}`, listX + 80, y + 50, {
        fontSize: 11, color: '#8080a0'
      });

      char._rect = { x: listX, y, w: listW, h: itemH };
    }

    ctx.restore();

    // 提示
    if (this.selectingSlot >= 0) {
      Renderer.drawText(ctx, '点击右侧角色加入编队，或点击空处取消', W / 2, H - 25, {
        fontSize: 13, color: '#8888aa', align: 'center'
      });
    }
  }

  _renderResonancePreview(ctx) {
    // 根据当前编队预览共鸣效果
    const mockParty = this.party.map(p => {
      const tpl = CharacterStats.templates[p.id];
      return {
        element: tpl?.element || 'none',
        currentHp: 1
      };
    });

    const resonances = ResonanceSystem.calculate(mockParty);
    if (resonances.length === 0) return;

    const panelX = 20, panelY = 90;
    const panelW = 250;
    const panelH = 30 + resonances.length * 25;

    Renderer.drawPanel(ctx, panelX, panelY, panelW, panelH, {
      bg: 'rgba(20, 10, 40, 0.8)', border: '#6a4a9a'
    });

    Renderer.drawText(ctx, '共鸣预览', panelX + 10, panelY + 14, {
      fontSize: 12, color: '#b090e0'
    });

    resonances.forEach((res, i) => {
      const color = ElementSystem.colors[res.element] || '#999';
      Renderer.drawText(ctx, `✦ ${res.name}`, panelX + 15, panelY + 35 + i * 25, {
        fontSize: 11, color
      });
    });
  }

  handleClick(x, y) {
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      // 保存编队
      if (window.game) {
        window.game.state.party = this.party;
      }
      this.sceneManager.switchTo('main_menu');
      return;
    }

    // 编队槽位点击
    for (const slot of this._slotRects || []) {
      if (Renderer.hitTest(x, y, slot)) {
        // 检查是否点击移除按钮
        if (this.party[slot.index]) {
          const removeBtn = { x: slot.x + slot.w - 25, y: slot.y + 5, w: 20, h: 20 };
          if (Renderer.hitTest(x, y, removeBtn)) {
            this.party.splice(slot.index, 1);
            // 补空位保持 4 个
            while (this.party.length < 4) this.party.push(null);
            return;
          }
        }
        this.selectingSlot = slot.index;
        return;
      }
    }

    // 选择角色加入编队
    if (this.selectingSlot >= 0) {
      const partyIds = new Set(this.party.map(p => p?.id).filter(Boolean));
      const available = this.roster.filter(c => !partyIds.has(c.id));

      for (const char of available) {
        if (char._rect && Renderer.hitTest(x, y, char._rect)) {
          this.party[this.selectingSlot] = { id: char.id, level: char.level || 1 };
          this.selectingSlot = -1;
          return;
        }
      }

      // 点击空白取消选择
      this.selectingSlot = -1;
    }
  }
}

// ============ 设置场景 ============
class SettingsScene {
  constructor() {
    this.sceneManager = null;
    this._backBtn = null;
    this._buttons = [];
    this._message = null;
    this._messageTimer = 0;
    this._settings = this._loadSettings();
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem('game_settings_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      quality: 'auto',    // auto, low, medium, high
      autoSave: true,
      showFps: false,
      confirmBeforeGacha: true
    };
  }

  _saveSettings() {
    try {
      localStorage.setItem('game_settings_v1', JSON.stringify(this._settings));
    } catch {}
  }

  _showMessage(text, success = true) {
    this._message = { text, success };
    this._messageTimer = 2.5;
  }

  onEnter() {
    this._settings = this._loadSettings();
    this._message = null;
    this._messageTimer = 0;
  }

  onExit() {
    this._saveSettings();
  }

  update(dt) {
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
    Renderer.drawText(ctx, '设置', 40, 40, { fontSize: 20, color: '#d4b8ff' });
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // 主面板
    const panelX = W / 2 - 320;
    const panelW = 640;
    const panelY = 85;
    const panelH = 540;

    Renderer.drawPanel(ctx, panelX, panelY, panelW, panelH, {
      bg: 'rgba(20, 15, 40, 0.9)', border: '#4a3a8a'
    });

    this._buttons = [];
    const centerX = W / 2;
    let y = panelY + 30;

    // —— 画面设置 ——
    Renderer.drawText(ctx, '画面', panelX + 30, y, { fontSize: 16, color: '#b090e0' });
    y += 30;

    // 画质
    const qualityLabels = { auto: '自动', low: '低', medium: '中', high: '高' };
    this._renderSettingRow(ctx, panelX, y, panelW,
      '画质', qualityLabels[this._settings.quality],
      '根据设备性能自动调整画面效果',
      () => {
        const keys = ['auto', 'low', 'medium', 'high'];
        const idx = keys.indexOf(this._settings.quality);
        this._settings.quality = keys[(idx + 1) % keys.length];
        this._saveSettings();
        this._showMessage(`画质已切换为: ${qualityLabels[this._settings.quality]}`);
      }
    );
    y += 58;

    // 帧率显示
    this._renderSettingRow(ctx, panelX, y, panelW,
      '显示帧率', this._settings.showFps ? '开启' : '关闭',
      '在画面角落显示实时帧率',
      () => {
        this._settings.showFps = !this._settings.showFps;
        this._saveSettings();
      }
    );
    y += 58;

    // —— 游戏设置 ——
    Renderer.drawText(ctx, '游戏', panelX + 30, y, { fontSize: 16, color: '#b090e0' });
    y += 30;

    // 自动存档
    this._renderSettingRow(ctx, panelX, y, panelW,
      '自动存档', this._settings.autoSave ? '开启（每60秒）' : '关闭',
      '定时自动保存游戏进度到本地和云端',
      () => {
        this._settings.autoSave = !this._settings.autoSave;
        this._saveSettings();
        this._showMessage(this._settings.autoSave ? '自动存档已开启' : '自动存档已关闭');
      }
    );
    y += 58;

    // 抽卡确认
    this._renderSettingRow(ctx, panelX, y, panelW,
      '抽卡前确认', this._settings.confirmBeforeGacha ? '开启' : '关闭',
      '抽卡前弹出二次确认对话框',
      () => {
        this._settings.confirmBeforeGacha = !this._settings.confirmBeforeGacha;
        this._saveSettings();
      }
    );
    y += 58;

    // —— 音频（占位） ——
    Renderer.drawText(ctx, '音频', panelX + 30, y, { fontSize: 16, color: '#b090e0' });
    y += 30;

    this._renderSettingRow(ctx, panelX, y, panelW,
      'BGM', '关闭',
      '音频系统开发中，暂未实装',
      null, true
    );
    y += 58;

    this._renderSettingRow(ctx, panelX, y, panelW,
      '音效', '关闭',
      '音频系统开发中，暂未实装',
      null, true
    );
    y += 58;

    // —— 数据管理 ——
    Renderer.drawText(ctx, '数据', panelX + 30, y, { fontSize: 16, color: '#b090e0' });
    y += 30;

    // 清除本地数据
    Renderer.drawButton(ctx, centerX - 130, y, 260, 42, '清除本地存档', {
      fontSize: 15,
      bgColor: '#2a1515',
      borderColor: '#8a3a3a',
      textColor: '#ff8888'
    });
    this._buttons.push({
      rect: { x: centerX - 130, y, w: 260, h: 42 },
      action: 'clear_data'
    });
    y += 55;

    // —— 版本 & Logo ——
    if (GameAssets.ui.logo) {
      ctx.drawImage(GameAssets.ui.logo, centerX - 25, panelY + panelH - 75, 50, 50);
    }
    Renderer.drawText(ctx, 'v0.8.0 · 庸人工作室', centerX, panelY + panelH - 15, {
      fontSize: 12, color: '#505070', align: 'center'
    });

    // 消息提示
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

  _renderSettingRow(ctx, panelX, y, panelW, label, value, note, onClick, disabled = false) {
    const centerX = panelX + panelW / 2;

    // 标签
    Renderer.drawText(ctx, label, panelX + 40, y + 5, {
      fontSize: 15, color: disabled ? '#606080' : '#c0c0e0'
    });

    // 值（可点击切换）
    const valueColor = disabled ? '#505070' : '#88ccff';
    Renderer.drawText(ctx, value, panelX + panelW - 40, y + 5, {
      fontSize: 15, color: valueColor, align: 'right'
    });

    // 说明
    Renderer.drawText(ctx, note, centerX, y + 28, {
      fontSize: 11, color: '#606080', align: 'center'
    });

    // 可点击区域
    if (onClick) {
      this._buttons.push({
        rect: { x: panelX + 20, y: y - 8, w: panelW - 40, h: 44 },
        action: onClick
      });
    }
  }

  handleClick(x, y) {
    // 返回
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this._saveSettings();
      this.sceneManager.switchTo('main_menu');
      return;
    }

    // 功能按钮
    for (const btn of this._buttons) {
      if (!Renderer.hitTest(x, y, btn.rect)) continue;

      if (btn.action === 'clear_data') {
        // 二次确认（简单实现：点击两次清除）
        if (this._pendingClear) {
          // 第二次点击确认清除
          try {
            localStorage.removeItem('game_offline_main');
            localStorage.removeItem('game_save_local');
            localStorage.removeItem('game_stamina_v1');
            localStorage.removeItem('game_checkin_v1');
            localStorage.removeItem('game_settings_v1');
            this._showMessage('本地数据已清除', true);
            this._pendingClear = false;
          } catch (e) {
            this._showMessage('清除失败: ' + e.message, false);
          }
        } else {
          this._pendingClear = true;
          this._showMessage('再次点击确认清除本地存档', false);
          // 3秒后取消
          setTimeout(() => { this._pendingClear = false; }, 3000);
        }
        return;
      }

      if (typeof btn.action === 'function') {
        btn.action();
        return;
      }
    }
  }
}

// ============ 关卡选择场景 ============
class StageScene {
  constructor() {
    this.sceneManager = null;
  }

  onEnter() {}
  onExit() {}
  update(dt) {}

  render(ctx) {
    const W = 1280, H = 720;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0d1f');
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    Renderer.drawPanel(ctx, 20, 15, W - 40, 50, { bg: 'rgba(15, 15, 30, 0.8)', border: '#3a3060' });
    Renderer.drawText(ctx, '挑战关卡', 40, 40, { fontSize: 20, color: '#d4b8ff' });
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
    this._backBtn = { x: W - 120, y: 20, w: 90, h: 38 };

    // 占位内容
    Renderer.drawPanel(ctx, W / 2 - 200, H / 2 - 80, 400, 160, {
      bg: 'rgba(20, 15, 40, 0.9)', border: '#4a3a8a'
    });

    Renderer.drawText(ctx, '独立关卡模式', W / 2, H / 2 - 40, {
      fontSize: 24, color: '#d4b8ff', align: 'center'
    });

    Renderer.drawText(ctx, '关卡内容设计完成后开放', W / 2, H / 2 + 10, {
      fontSize: 16, color: '#8080a0', align: 'center'
    });

    Renderer.drawText(ctx, '当前可体验剧情模式中的战斗关卡', W / 2, H / 2 + 40, {
      fontSize: 13, color: '#606080', align: 'center'
    });
  }

  handleClick(x, y) {
    if (this._backBtn && Renderer.hitTest(x, y, this._backBtn)) {
      this.sceneManager.switchTo('main_menu');
    }
  }
}

window.CharacterRosterScene = CharacterRosterScene;
window.PartyScene = PartyScene;
window.SettingsScene = SettingsScene;
window.StageScene = StageScene;
