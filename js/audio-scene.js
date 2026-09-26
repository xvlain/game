/**
 * audio-scene.js - 音频场景映射与 BGM 自动切换系统
 * v0.17.0 - 根据场景自动播放/切换 BGM + 音效预定义
 *
 * 用法：
 *   BgmDirector.enterScene('battle');       // 进入战斗，自动切换 BGM
 *   BgmDirector.enterScene('main_menu');    // 返回主菜单
 *   BgmDirector.enterScene('story', { chapterId: 'ch1' });  // 剧情场景
 *
 * 美术侧只需将音频文件放入 assets/audio/bgm/ 目录，命名与 BGM_MAP 的 key 一致即可。
 * 音效文件放入 assets/audio/sfx/ 目录。
 */

// ============ BGM 场景映射表 ============
const BGM_MAP = {
  // 主菜单 / 标题
  title:      { file: 'assets/audio/bgm/title.mp3',      label: '主题曲', fadeIn: 1.5 },
  main_menu:  { file: 'assets/audio/bgm/main_menu.mp3',  label: '主城',   fadeIn: 1.0 },

  // 剧情场景（按章节可扩展）
  story:      { file: 'assets/audio/bgm/story.mp3',      label: '剧情',   fadeIn: 1.5 },
  story_ch1:  { file: 'assets/audio/bgm/story_ch1.mp3',  label: '序章',   fadeIn: 1.5 },
  story_ch2:  { file: 'assets/audio/bgm/story_ch2.mp3',  label: '第二章', fadeIn: 1.5 },

  // 战斗场景
  battle:       { file: 'assets/audio/bgm/battle.mp3',       label: '普通战斗', fadeIn: 0.5 },
  battle_boss:  { file: 'assets/audio/bgm/battle_boss.mp3',  label: 'Boss战',   fadeIn: 0.3 },
  battle_victory: { file: 'assets/audio/bgm/victory.mp3',    label: '胜利',     fadeIn: 0.5 },
  battle_defeat:  { file: 'assets/audio/bgm/defeat.mp3',     label: '败北',     fadeIn: 0.5 },

  // 功能区
  gacha:      { file: 'assets/audio/bgm/gacha.mp3',      label: '抽卡',   fadeIn: 1.0 },
  growth:     { file: 'assets/audio/bgm/growth.mp3',     label: '养成',   fadeIn: 1.0 },
  party:      { file: 'assets/audio/bgm/party.mp3',      label: '编队',   fadeIn: 1.0 },
  stages:     { file: 'assets/audio/bgm/stages.mp3',     label: '关卡',   fadeIn: 1.0 },
  stats:      { file: 'assets/audio/bgm/stats.mp3',      label: '统计',   fadeIn: 1.0 },
  settings:   { file: 'assets/audio/bgm/settings.mp3',   label: '设置',   fadeIn: 1.0 },
  mail:       { file: 'assets/audio/bgm/mail.mp3',       label: '邮箱',   fadeIn: 1.0 },

  // 对话场景
  dialogue:   { file: 'assets/audio/bgm/dialogue.mp3',   label: '对话',   fadeIn: 1.5 },
};

// ============ 音效预定义表 ============
const SFX_MAP = {
  // UI
  click:       'assets/audio/sfx/click.mp3',
  confirm:     'assets/audio/sfx/confirm.mp3',
  cancel:      'assets/audio/sfx/cancel.mp3',
  menu_open:   'assets/audio/sfx/menu_open.mp3',
  menu_close:  'assets/audio/sfx/menu_close.mp3',
  tab_switch:  'assets/audio/sfx/tab_switch.mp3',

  // 战斗
  attack:      'assets/audio/sfx/attack.mp3',
  attack_crit: 'assets/audio/sfx/attack_crit.mp3',
  skill:       'assets/audio/sfx/skill.mp3',
  ultimate:    'assets/audio/sfx/ultimate.mp3',
  hit:         'assets/audio/sfx/hit.mp3',
  heal:        'assets/audio/sfx/heal.mp3',
  shield:      'assets/audio/sfx/shield.mp3',
  counter:     'assets/audio/sfx/counter.mp3',
  break_stun:  'assets/audio/sfx/break_stun.mp3',
  enemy_death: 'assets/audio/sfx/enemy_death.mp3',

  // 抽卡
  gacha_roll:  'assets/audio/sfx/gacha_roll.mp3',
  gacha_r:     'assets/audio/sfx/gacha_r.mp3',
  gacha_sr:    'assets/audio/sfx/gacha_sr.mp3',
  gacha_ssr:   'assets/audio/sfx/gacha_ssr.mp3',

  // 养成
  level_up:    'assets/audio/sfx/level_up.mp3',
  ascend:      'assets/audio/sfx/ascend.mp3',
  skill_up:    'assets/audio/sfx/skill_up.mp3',

  // 奖励
  coin:        'assets/audio/sfx/coin.mp3',
  crystal:     'assets/audio/sfx/crystal.mp3',
  item_get:    'assets/audio/sfx/item_get.mp3',
  chest_open:  'assets/audio/sfx/chest_open.mp3',
  mail_open:   'assets/audio/sfx/mail_open.mp3',
  quest_done:  'assets/audio/sfx/quest_done.mp3',
  achievement: 'assets/audio/sfx/achievement.mp3',

  // 剧情
  dialogue_next: 'assets/audio/sfx/dialogue_next.mp3',
  choice_appear: 'assets/audio/sfx/choice_appear.mp3',
};

// ============ BGM 导演 ============
class BgmDirector {
  constructor() {
    this._currentScene = '';
    this._audioCache = {};      // 已加载的 Audio 对象缓存
    this._enabled = true;
    this._volume = 0.5;
    this._initialized = false;
    this._preloadQueue = [];
  }

  /** 初始化（在用户首次交互后调用） */
  init() {
    if (this._initialized) return;
    this._initialized = true;
    console.log('[BgmDirector] 初始化完成');
  }

  /** 进入场景 — 自动匹配并播放 BGM */
  enterScene(sceneName, data = {}) {
    if (!this._enabled) return;
    if (!this._initialized) this.init();

    // 战斗场景可根据 data 选择 boss 曲
    let key = sceneName;
    if (sceneName === 'battle' && data.isBoss) key = 'battle_boss';
    if (sceneName === 'story' && data.chapterId) key = `story_${data.chapterId}`;
    if (sceneName === 'stage_result') key = data.victory ? 'battle_victory' : 'battle_defeat';

    const config = BGM_MAP[key] || BGM_MAP[sceneName];
    if (!config) {
      // 场景无专属 BGM，保持当前播放
      return;
    }

    // 已在播放同一曲则跳过
    if (this._currentScene === key) return;

    this._crossfadeTo(key, config);
  }

  /** 交叉淡入淡出切换 BGM */
  _crossfadeTo(key, config) {
    const game = window.game;
    if (!game || !game.audio) return;

    const url = config.file;
    const fadeIn = config.fadeIn || 1.0;

    // 通过引擎的 AudioManager 播放
    game.audio.playBgm(key, url);

    this._currentScene = key;
    console.log(`[BgmDirector] ♪ ${config.label} (${key})`);
  }

  /** 停止 BGM */
  stop() {
    const game = window.game;
    if (game && game.audio) game.audio.stopBgm();
    this._currentScene = '';
  }

  /** 设置音量 */
  setVolume(v) {
    this._volume = v;
    const game = window.game;
    if (game && game.audio) game.audio.setBgmVolume(v);
  }

  /** 开关 */
  setEnabled(enabled) {
    this._enabled = enabled;
    if (!enabled) this.stop();
  }

  /** 获取当前场景信息 */
  getCurrent() {
    return {
      key: this._currentScene,
      config: BGM_MAP[this._currentScene] || null
    };
  }

  /** 获取所有已定义的 BGM 列表（用于调试） */
  getAllScenes() {
    return Object.entries(BGM_MAP).map(([key, cfg]) => ({
      key, label: cfg.label, file: cfg.file
    }));
  }

  /** 预加载指定 BGM 文件（首屏加载时可调用） */
  preload(keys = []) {
    for (const key of keys) {
      const config = BGM_MAP[key];
      if (!config) continue;
      // 预创建 Audio 对象以便浏览器缓存
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = config.file;
      this._audioCache[key] = audio;
    }
  }
}

// ============ 音效播放器 ============
class SfxPlayer {
  constructor() {
    this._enabled = true;
    this._volume = 0.7;
    this._buffers = {};     // AudioBuffer 缓存
    this._cooldowns = {};   // 防止同一音效过快触发
  }

  /** 播放音效（优先使用预加载的 buffer，回退到合成音效） */
  play(name) {
    if (!this._enabled) return;

    // 冷却检查（同一音效 50ms 内不重复播放）
    const now = performance.now();
    if (this._cooldowns[name] && now - this._cooldowns[name] < 50) return;
    this._cooldowns[name] = now;

    const game = window.game;
    if (!game || !game.audio) return;

    // 优先使用引擎的合成音效（已有实现）
    game.audio.playSfx(name);
  }

  /** 设置音量 */
  setVolume(v) {
    this._volume = v;
    const game = window.game;
    if (game && game.audio) game.audio.setSfxVolume(v);
  }

  /** 开关 */
  setEnabled(enabled) {
    this._enabled = enabled;
  }
}

// ============ 全局实例 ============
const bgmDirector = new BgmDirector();
const sfxPlayer = new SfxPlayer();

window.BgmDirector = BgmDirector;
window.bgmDirector = bgmDirector;
window.SfxPlayer = SfxPlayer;
window.sfxPlayer = sfxPlayer;
window.BGM_MAP = BGM_MAP;
window.SFX_MAP = SFX_MAP;
