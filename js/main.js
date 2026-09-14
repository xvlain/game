/**
 * main.js - 游戏入口
 * 初始化引擎、注册场景、启动游戏循环
 * v0.5.0 - 新增角色养成场景、抽卡入图鉴、场景切换存档
 */

let game = null;
let authController = null;

async function initGame() {
  game = new GameEngine('gameCanvas');
  window.game = game;

  // 初始化管理器
  game.storyManager = new StoryManager();
  game.saveManager = new SaveManager();
  game.gachaEngine = new GachaEngine();

  // 初始化默认状态（游客/登录后会被覆盖）
  game.state = buildDefaultState();

  // 注册场景
  const scenes = {
    title: new TitleScene(),
    main_menu: new MainMenuScene(),
    story_map: new StoryMapScene(),
    dialogue: new DialogueScene(),
    battle: new BattleScene(),
    gacha: new GachaScene(),
    characters: new CharacterRosterScene(),
    growth: new GrowthScene(),
    party: new PartyScene(),
    stages: new StageScene(),
    settings: new SettingsScene()
  };

  for (const [name, scene] of Object.entries(scenes)) {
    game.sceneManager.register(name, scene);
  }

  // 统一点击事件分发
  game.input.onClick((x, y) => {
    const currentScene = game.sceneManager.currentScene;
    if (currentScene && currentScene.handleClick) {
      currentScene.handleClick(x, y);
    }
  });

  // 滑动支持（剧情地图等场景）
  game.input.onSwipe((direction, dist) => {
    const currentScene = game.sceneManager.currentScene;
    if (currentScene && currentScene.handleSwipe) {
      currentScene.handleSwipe(direction, dist);
    }
  });

  // 尝试连接 Supabase（不加载存档，等登录后按需加载）
  const connected = await game.saveManager.init();
  console.log(connected ? '[Game] 云端存档已连接' : '[Game] 使用本地存档模式');

  // 初始化登录覆盖层
  authController = new AuthController();
  window.authController = authController;

  // 启动游戏
  game.sceneManager.switchTo('title');
  game.start();

  // 自动存档（每 60 秒，仅已登录或游客模式时）
  setInterval(() => autoSave(), 60000);

  console.log('[Game] v0.4.0 初始化完成');
}

function buildDefaultState() {
  const defaultGrowth = () => CharacterGrowth.createGrowthData();

  return {
    player: { username: '旅者', level: 1 },
    party: [
      { id: 'warrior', level: 1 },
      { id: 'healer', level: 1 },
      { id: 'mage', level: 1 },
      { id: 'tank', level: 1 }
    ],
    roster: [
      { id: 'warrior', name: '示例·战士', level: 1, element: 'fire', role: '输出', rarity: 'sr',
        skills: CharacterStats.templates.warrior.skills, growth: defaultGrowth() },
      { id: 'healer', name: '示例·治疗', level: 1, element: 'wood', role: '治疗', rarity: 'sr',
        skills: CharacterStats.templates.healer.skills, growth: defaultGrowth() },
      { id: 'mage', name: '示例·法师', level: 1, element: 'water', role: '输出', rarity: 'sr',
        skills: CharacterStats.templates.mage.skills, growth: defaultGrowth() },
      { id: 'tank', name: '示例·守护', level: 1, element: 'earth', role: '坦克', rarity: 'sr',
        skills: CharacterStats.templates.tank.skills, growth: defaultGrowth() }
    ],
    storyProgress: { completedNodes: [], unlockedChapters: ['ch1'] },
    inventory: {
      exp_book_1: 5,
      exp_book_2: 2,
      exp_book_3: 0
    },
    currency: { crystals: 3200, coins: 5000 }
  };
}

// ============ 登录/注册覆盖层控制器 ============
class AuthController {
  constructor() {
    this.overlay = document.getElementById('auth-overlay');
    this.title = document.getElementById('auth-title');
    this.usernameInput = document.getElementById('auth-username');
    this.passwordInput = document.getElementById('auth-password');
    this.primaryBtn = document.getElementById('auth-primary');
    this.secondaryBtn = document.getElementById('auth-secondary');
    this.guestBtn = document.getElementById('auth-guest');
    this.errorEl = document.getElementById('auth-error');
    this.mode = 'login'; // 'login' | 'register'
    this.pendingAction = null; // 'start' | 'continue'

    this.primaryBtn.addEventListener('click', () => this._onPrimary());
    this.secondaryBtn.addEventListener('click', () => this._toggleMode());
    this.guestBtn.addEventListener('click', () => this._onGuest());
    this.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._onPrimary();
    });
  }

  open(action = 'start') {
    this.pendingAction = action;
    this.mode = action === 'continue' ? 'login' : 'login';
    this._renderMode();
    this.errorEl.textContent = '';
    this.usernameInput.value = '';
    this.passwordInput.value = '';
    this.overlay.classList.remove('hidden');
    setTimeout(() => this.usernameInput.focus(), 100);
  }

  close() {
    this.overlay.classList.add('hidden');
    this.pendingAction = null;
  }

  _renderMode() {
    if (this.mode === 'login') {
      this.title.textContent = '登录';
      this.primaryBtn.textContent = '登录';
      this.secondaryBtn.textContent = '注册';
    } else {
      this.title.textContent = '注册';
      this.primaryBtn.textContent = '注册';
      this.secondaryBtn.textContent = '返回登录';
    }
  }

  _toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.errorEl.textContent = '';
    this._renderMode();
  }

  async _onPrimary() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;
    this.errorEl.textContent = '';

    if (username.length < 3 || username.length > 20) {
      this.errorEl.textContent = '用户名需要 3-20 个字符';
      return;
    }
    if (password.length < 6) {
      this.errorEl.textContent = '密码至少 6 位';
      return;
    }

    this.primaryBtn.disabled = true;
    this.primaryBtn.textContent = '请稍候...';

    try {
      const result = this.mode === 'login'
        ? await game.saveManager.login(username, password)
        : await game.saveManager.register(username, password);

      if (!result.success) {
        this.errorEl.textContent = result.error || '操作失败';
        return;
      }

      // 登录/注册成功
      game.state.player.username = result.user.nickname || result.user.username;
      game.state.player.level = result.user.level || 1;

      if (this.pendingAction === 'continue') {
        const loaded = await game.saveManager.loadGame();
        if (loaded.success) {
          applySaveData(game.state, loaded.data);
          console.log('[Auth] 云端存档已加载');
        } else {
          this.errorEl.textContent = '未找到存档，将进入新游戏';
        }
      }

      this.close();
      this._enterMainMenu();
    } catch (e) {
      this.errorEl.textContent = e.message || '网络错误';
    } finally {
      this.primaryBtn.disabled = false;
      this._renderMode();
    }
  }

  _onGuest() {
    this.close();
    console.log('[Auth] 游客模式进入');
    this._enterMainMenu();
  }

  _enterMainMenu() {
    if (game.state.storyProgress) {
      game.storyManager.loadProgress(game.state.storyProgress);
    }
    game.sceneManager.switchTo('main_menu');
  }
}

function applySaveData(state, data) {
  if (data.storyProgress) state.storyProgress = data.storyProgress;
  if (data.party) state.party = data.party;
  if (data.roster) {
    // 合并养成数据
    state.roster = data.roster.map(saved => {
      const existing = state.roster.find(r => r.id === saved.id);
      return {
        ...saved,
        skills: saved.skills || (existing?.skills) || CharacterStats.templates[saved.id]?.skills,
        growth: saved.growth || CharacterGrowth.createGrowthData(saved.id, saved.level)
      };
    });
  }
  if (data.inventory) state.inventory = data.inventory;
  if (data.currency) state.currency = data.currency;
  if (data.player) state.player = { ...state.player, ...data.player };
}

async function autoSave() {
  if (!game) return;

  game.state.storyProgress = game.storyManager.saveProgress();

  const result = await game.saveManager.saveGame(game.state);

  const localSave = new LocalSaveManager();
  localSave.save('main', {
    storyProgress: game.state.storyProgress,
    party: game.state.party,
    roster: game.state.roster,
    inventory: game.state.inventory,
    currency: game.state.currency,
    timestamp: new Date().toISOString()
  });

  if (result.cloud) {
    console.log('[Game] 自动存档完成 (云端)');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&family=Noto+Serif+SC:wght@700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  initGame();
});
