/**
 * main.js - 游戏入口
 * 初始化引擎、注册场景、启动游戏循环
 * v0.3.0 - 新增角色/编队/设置/关卡场景
 */

let game = null;

async function initGame() {
  game = new GameEngine('gameCanvas');
  window.game = game;

  // 初始化管理器
  game.storyManager = new StoryManager();
  game.saveManager = new SaveManager();
  game.gachaEngine = new GachaEngine();

  // 初始化默认状态
  game.state = {
    player: { username: '旅者', level: 1 },
    party: [
      { id: 'warrior', level: 1 },
      { id: 'healer', level: 1 },
      { id: 'mage', level: 1 },
      { id: 'tank', level: 1 }
    ],
    roster: [
      { id: 'warrior', name: '示例·战士', level: 1, element: 'fire', role: '输出', rarity: 'sr',
        skills: CharacterStats.templates.warrior.skills },
      { id: 'healer', name: '示例·治疗', level: 1, element: 'wind', role: '治疗', rarity: 'sr',
        skills: CharacterStats.templates.healer.skills },
      { id: 'mage', name: '示例·法师', level: 1, element: 'ice', role: '输出', rarity: 'sr',
        skills: CharacterStats.templates.mage.skills },
      { id: 'tank', name: '示例·守护', level: 1, element: 'earth', role: '坦克', rarity: 'sr',
        skills: CharacterStats.templates.tank.skills }
    ],
    storyProgress: {
      completedNodes: [],
      unlockedChapters: ['ch1']
    },
    inventory: {},
    currency: { crystals: 3200, coins: 5000 }
  };

  // 注册场景
  const scenes = {
    title: new TitleScene(),
    main_menu: new MainMenuScene(),
    story_map: new StoryMapScene(),
    dialogue: new DialogueScene(),
    battle: new BattleScene(),
    gacha: new GachaScene(),
    characters: new CharacterRosterScene(),
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

  // 尝试连接 Supabase
  const connected = await game.saveManager.init();
  if (connected) {
    console.log('[Game] 云端存档已连接');
    const saveResult = await game.saveManager.loadGame();
    if (saveResult.success) {
      applySaveData(game.state, saveResult.data);
      console.log('[Game] 存档已加载 (来源: ' + saveResult.source + ')');
    }
  } else {
    console.log('[Game] 使用本地存档模式');
    const localSave = new LocalSaveManager();
    const localData = localSave.load('main');
    if (localData) {
      applySaveData(game.state, localData);
    }
  }

  // 加载剧情进度
  if (game.state.storyProgress) {
    game.storyManager.loadProgress(game.state.storyProgress);
  }

  // 启动游戏
  game.sceneManager.switchTo('title');
  game.start();

  // 自动存档（每 60 秒）
  setInterval(() => autoSave(), 60000);

  console.log('[Game] v0.3.0 初始化完成');
}

function applySaveData(state, data) {
  if (data.storyProgress) state.storyProgress = data.storyProgress;
  if (data.party) state.party = data.party;
  if (data.roster) state.roster = data.roster;
  if (data.inventory) state.inventory = data.inventory;
  if (data.currency) state.currency = data.currency;
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
