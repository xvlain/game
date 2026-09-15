/**
 * ui.js - 游戏场景与 UI 渲染
 * 包含：标题画面、主菜单、剧情地图、战斗界面、抽卡界面
 */

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
        Renderer.drawButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.text, {
          fontSize: 20,
          bgColor: '#1a1a3a',
          borderColor: '#7c5cbf'
        });
      }
    }

    // 底部信息
    Renderer.drawText(ctx, 'v0.6.0 · 庸人工作室', W / 2, H - 30, {
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
    Renderer.drawPanel(ctx, 20, 15, W - 40, 50, { bg: 'rgba(15, 15, 30, 0.8)', border: '#3a3060' });
    Renderer.drawText(ctx, '未定之旅', 40, 40, { fontSize: 20, color: '#d4b8ff' });

    // 资源显示
    const state = window.game?.state;
    if (state) {
      Renderer.drawText(ctx, `💎 ${state.currency?.crystals || 0}`, W - 250, 40, { fontSize: 16, color: '#88ccff', align: 'right' });
      Renderer.drawText(ctx, `🪙 ${state.currency?.coins || 0}`, W - 120, 40, { fontSize: 16, color: '#ffcc44', align: 'right' });
    }

    // 菜单网格（4+3 布局）
    const cardW = 240, cardH = 160;
    const gapX = 25, gapY = 25;

    for (let i = 0; i < this.menuItems.length; i++) {
      let col, row, cols;
      if (i < 4) {
        col = i; row = 0; cols = 4;
      } else {
        col = i - 4; row = 1; cols = 3;
      }

      const totalW = cols * cardW + (cols - 1) * gapX;
      const startX = (W - totalW) / 2;
      const startY = 110;

      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const item = this.menuItems[i];

      // 卡片
      const hover = Math.sin(this.elapsed * 2 + i) * 0.02 + 1;
      Renderer.drawPanel(ctx, x, y, cardW, cardH, {
        bg: 'rgba(25, 20, 45, 0.85)',
        border: '#4a3a8a'
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
    Renderer.drawText(ctx, 'v0.6.0 · 庸人工作室', W / 2, H - 25, {
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
      Renderer.drawPanel(ctx, W / 2 - 180, 70, 360, 56, {
        bg: 'rgba(20, 40, 20, 0.95)',
        border: '#4a8a4a'
      });
      Renderer.drawText(ctx, `📅 签到第 ${notice.day} 天  获得: ${notice.label}`, W / 2, 90, {
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
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // 标题
    Renderer.drawPanel(ctx, 20, 15, W - 40, 50, { bg: 'rgba(15, 15, 30, 0.9)' });
    Renderer.drawText(ctx, this.chapter?.name || '章节', 40, 40, { fontSize: 20, color: '#d4b8ff' });

    // 返回按钮
    Renderer.drawButton(ctx, W - 120, 20, 90, 38, '返回', { fontSize: 14 });
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

    this.storyManager.enterChapter(data.chapterId);
    // 跳到指定节点
    const chapter = StoryData.getChapter(data.chapterId);
    if (chapter) {
      const node = chapter.nodes.find(n => n.id === data.nodeId);
      if (node) {
        this.storyManager.currentNode = node;
        this.storyManager.dialogueIndex = 0;
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
    const charsPerSecond = 30;
    this.displayedChars = Math.min(this.text.length, Math.floor(this.displayTimer * charsPerSecond));
  }

  render(ctx) {
    const W = 1280, H = 720;

    // 背景
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    // 场景装饰（后期替换为场景图）
    Renderer.drawText(ctx, '[ 场景 ]', W / 2, H / 2 - 100, {
      fontSize: 14,
      color: '#303050',
      align: 'center'
    });

    // 对话框
    const boxY = H - 200;
    const boxH = 170;
    Renderer.drawPanel(ctx, 40, boxY, W - 80, boxH, {
      bg: 'rgba(10, 10, 25, 0.95)',
      border: '#5c4d9a'
    });

    // 说话人
    if (this.speaker) {
      Renderer.drawPanel(ctx, 50, boxY - 35, 160, 32, {
        bg: '#2a1a4a',
        border: '#7c5cbf'
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
        Renderer.drawButton(ctx, cx, startY, choiceW, choiceH, this.choices[i].text, {
          fontSize: 18,
          bgColor: '#2a1a4a',
          borderColor: '#9a7cbf'
        });
        this.choices[i]._rect = { x: cx, y: startY, w: choiceW, h: choiceH };
      }
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
    };

    this.battle.onBattleEnd = (result) => {
      this.phase = 'result';
      this.battleResult = result;
    };

    this.phase = 'idle';
    this.logDisplay = [];
    this.battle.startBattle();
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

  update(dt) {}

  render(ctx) {
    const W = 1280, H = 720;

    // 战斗背景
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.6, '#151530');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 战场分割线
    ctx.strokeStyle = '#2a2050';
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

      // 敌人占位图（后期替换为 Q版动画帧）
      ctx.save();
      Renderer.drawPanel(ctx, x - 45, y - 60, 90, 120, {
        bg: '#2a1515',
        border: enemy === this.battle.currentActor ? '#ff6666' : '#4a2020'
      });

      // 元素标识
      Renderer.drawText(ctx, ElementSystem.names[enemy.element] || '', x + 35, y - 50, {
        fontSize: 11, color: elemColor, align: 'center'
      });

      Renderer.drawText(ctx, enemy.name, x, y - 75, {
        fontSize: 14,
        color: '#ff9999',
        align: 'center'
      });

      // HP 条
      Renderer.drawBar(ctx, x - 40, y + 70, 80, 8, enemy.currentHp, enemy.maxHp, '#cc3333');

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

      Renderer.drawPanel(ctx, x - 50, y - 65, 100, 130, {
        bg: char.currentHp <= 0 ? '#1a1a1a' : (isActive ? '#1a2a3a' : '#15152a'),
        border: isActive ? '#5cb8ff' : '#303060'
      });

      // 元素标识
      Renderer.drawText(ctx, ElementSystem.names[char.element] || '', x + 38, y - 55, {
        fontSize: 11, color: elemColor, align: 'center'
      });

      // 角色名
      Renderer.drawText(ctx, char.name, x, y - 80, {
        fontSize: 14,
        color: char.currentHp <= 0 ? '#555' : '#99ccff',
        align: 'center'
      });

      // HP 条
      const hpColor = char.currentHp / char.maxHp > 0.5 ? '#33cc66' : (char.currentHp / char.maxHp > 0.2 ? '#cccc33' : '#cc3333');
      Renderer.drawBar(ctx, x - 40, y + 70, 80, 8, char.currentHp, char.maxHp, hpColor);

      // 能量条（大招）
      Renderer.drawBar(ctx, x - 40, y + 83, 80, 5, char.currentEnergy, char.maxEnergy, '#6699ff');

      // 元素力条
      const forceColor = elemColor !== '#999999' ? elemColor : '#aa88cc';
      Renderer.drawBar(ctx, x - 40, y + 92, 80, 5, char.elementalForce || 0, ElementalForceSystem.maxForce, forceColor);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText(`HP ${char.currentHp}/${char.maxHp}`, x, y + 55);
      ctx.fillText(`EN ${char.currentEnergy}  EF ${char.elementalForce || 0}`, x, y + 108);

      ctx.restore();
    });
  }

  _renderBattleUI(ctx) {
    // 共鸣信息展示（右上角）
    if (this.battle && this.battle.resonances && this.battle.resonances.length > 0) {
      const resX = 1280 - 230;
      const resY = 15;
      Renderer.drawPanel(ctx, resX, resY, 210, 20 + this.battle.resonances.length * 22, {
        bg: 'rgba(20, 10, 40, 0.8)',
        border: '#6a4a9a'
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
        Renderer.drawButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.label, {
          fontSize: 16,
          disabled: !btn.enabled,
          bgColor: btn.enabled ? '#1a2a4a' : '#1a1a2a',
          borderColor: btn.enabled ? '#5588cc' : '#333'
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
      Renderer.drawButton(ctx, 540, 630, 200, 40, '取消', { fontSize: 14 });
      this._cancelBtn = { x: 540, y: 630, w: 200, h: 40 };
    }
  }

  _renderLog(ctx) {
    const logY = 10;
    Renderer.drawPanel(ctx, 10, logY, 350, 100, { bg: 'rgba(0, 0, 0, 0.7)', border: 'transparent' });

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

    Renderer.drawButton(ctx, 540, 400, 200, 50, '继续', {
      fontSize: 20,
      bgColor: '#2a2a4a',
      borderColor: '#7c5cbf'
    });
    this._resultBtn = { x: 540, y: 400, w: 200, h: 50 };
  }

  handleClick(x, y) {
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

    // 背景
    const grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 500);
    grad.addColorStop(0, '#1a1030');
    grad.addColorStop(1, '#0a0a14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 标题
    Renderer.drawText(ctx, '命运召唤', W / 2, 60, {
      fontSize: 36,
      color: '#d4b8ff',
      align: 'center'
    });

    // 返回按钮
    Renderer.drawButton(ctx, 30, 20, 100, 40, '返回', { fontSize: 14 });
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
    Renderer.drawPanel(ctx, W / 2 - 250, 120, 500, 200, {
      bg: 'rgba(20, 15, 40, 0.9)',
      border: '#7c5cbf'
    });

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
      Renderer.drawButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.text, {
        fontSize: 18,
        disabled: !canAfford,
        bgColor: '#2a1a4a',
        borderColor: '#9a7cbf'
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
        ssr: { bg: '#3a2a0a', border: '#ffcc00', text: '#ffdd44' },
        sr: { bg: '#2a1a3a', border: '#cc66ff', text: '#dd88ff' },
        r: { bg: '#1a2a1a', border: '#66cc66', text: '#88dd88' }
      };
      const colors = rarityColors[result.rarity];

      Renderer.drawPanel(ctx, x, y, cardW, cardH, {
        bg: colors.bg,
        border: colors.border
      });

      // 角色名
      Renderer.drawText(ctx, result.name, x + cardW / 2, y + 50, {
        fontSize: 14,
        color: colors.text,
        align: 'center'
      });

      // 稀有度
      const rarityLabel = { ssr: '★★★★★', sr: '★★★★', r: '★★★' };
      Renderer.drawText(ctx, rarityLabel[result.rarity], x + cardW / 2, y + 90, {
        fontSize: 12,
        color: colors.text,
        align: 'center'
      });

      // 属性 & 角色
      Renderer.drawText(ctx, result.element || '无', x + cardW / 2, y + 120, {
        fontSize: 12,
        color: '#8080a0',
        align: 'center'
      });

      Renderer.drawText(ctx, result.role || '', x + cardW / 2, y + 145, {
        fontSize: 12,
        color: '#8080a0',
        align: 'center'
      });

      if (result.isNew) {
        Renderer.drawText(ctx, 'NEW!', x + cardW - 10, y + 15, {
          fontSize: 12,
          color: '#ff4444',
          align: 'right'
        });
      }
    });

    // 确认按钮
    Renderer.drawButton(ctx, W / 2 - 100, H - 100, 200, 50, '确认', {
      fontSize: 20,
      bgColor: '#2a2a4a',
      borderColor: '#7c5cbf'
    });
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

// 导出所有场景
window.TitleScene = TitleScene;
window.MainMenuScene = MainMenuScene;
window.StoryMapScene = StoryMapScene;
window.DialogueScene = DialogueScene;
window.BattleScene = BattleScene;
window.GachaScene = GachaScene;
