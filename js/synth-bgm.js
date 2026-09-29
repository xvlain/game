/**
 * synth-bgm.js - 合成 BGM 引擎
 * v0.20.0 - 使用 Web Audio API 程序化生成背景音乐
 *
 * 无需外部音频文件，通过振荡器、滤波器和调度器实时生成氛围音乐。
 * 支持多种情绪预设：calm / tense / epic / mysterious / sad / triumphant
 *
 * 用法：
 *   synthBGM.play('calm');      // 播放平静氛围 BGM
 *   synthBGM.play('battle');    // 播放战斗 BGM
 *   synthBGM.stop();            // 停止播放
 *   synthBGM.setVolume(0.3);    // 设置音量
 */

// ============ 音符频率表 ============
const NOTE_FREQ = {
  'C2':65.41,'D2':73.42,'E2':82.41,'F2':87.31,'G2':98.00,'A2':110.00,'B2':123.47,
  'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'B3':246.94,
  'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
  'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00,'B5':987.77,
  'C6':1046.50
};

// ============ 音阶定义（根音频率 × 音程） ============
const SCALES = {
  // 大调音阶 (Ionian): W-W-H-W-W-W-H
  major: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
  // 自然小调 (Aeolian): W-H-W-W-H-W-W
  minor: [1, 9/8, 6/5, 4/3, 3/2, 8/5, 9/5, 2],
  // 多利亚调式: W-H-W-W-W-H-W (小调但6度升高)
  dorian: [1, 9/8, 6/5, 4/3, 3/2, 5/3, 9/5, 2],
  // 混合利底亚: W-W-H-W-W-H-W (大调但7度降低)
  mixolydian: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 7/4, 2],
  // 五声音阶（大调）
  pentatonic: [1, 9/8, 5/4, 3/2, 5/3, 2],
  // 五声音阶（小调）
  pentatonicMinor: [1, 6/5, 4/3, 3/2, 8/5, 2]
};

// ============ 和弦进行 ============
const PROGRESSIONS = {
  // I-V-vi-IV（流行/史诗）
  pop:     [0, 4, 5, 3],
  // I-IV-V-I（古典）
  classic: [0, 3, 4, 0],
  // I-vi-IV-V（50年代）
  fifties: [0, 5, 3, 4],
  // i-III-VII-VI（小调史诗）
  epicMinor: [0, 2, 6, 5],
  // i-iv-VII-III（小调进行）
  darkMinor: [0, 3, 6, 2],
  // I-iii-vi-IV（柔和）
  gentle: [0, 2, 5, 3],
  // i-VI-III-VII（奇幻冒险）
  fantasy: [0, 5, 2, 6]
};

// ============ 预设配置 ============
const SYNTH_PRESETS = {
  // 标题画面 — 梦幻、空灵
  title: {
    tempo: 60,
    scale: 'pentatonic',
    rootNote: 'C3',
    progression: 'gentle',
    padWave: 'sine',
    padVolume: 0.08,
    padAttack: 2.0,
    padRelease: 3.0,
    padFilter: 800,
    bassWave: 'triangle',
    bassVolume: 0.05,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.05,
    arpPattern: 'up',
    arpSpeed: 0.4,
    melodyEnabled: true,
    melodyWave: 'sine',
    melodyVolume: 0.04,
    shimmerEnabled: true,
    shimmerVolume: 0.015,
    reverbMix: 0.6,
    filterFreq: 900,
    lfoRate: 0.15,
    lfoDepth: 200
  },

  // 主菜单 — 温暖、期待
  main_menu: {
    tempo: 72,
    scale: 'major',
    rootNote: 'D3',
    progression: 'pop',
    padWave: 'triangle',
    padVolume: 0.07,
    padAttack: 1.5,
    padRelease: 2.0,
    padFilter: 1200,
    bassWave: 'triangle',
    bassVolume: 0.04,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.04,
    arpPattern: 'updown',
    arpSpeed: 0.3,
    melodyEnabled: true,
    melodyWave: 'triangle',
    melodyVolume: 0.035,
    shimmerEnabled: false,
    reverbMix: 0.4,
    filterFreq: 1400,
    lfoRate: 0.2,
    lfoDepth: 150
  },

  // 剧情对话 — 平静、叙事
  story: {
    tempo: 58,
    scale: 'major',
    rootNote: 'C3',
    progression: 'classic',
    padWave: 'sine',
    padVolume: 0.06,
    padAttack: 2.5,
    padRelease: 3.0,
    padFilter: 700,
    bassWave: 'sine',
    bassVolume: 0.03,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.035,
    arpPattern: 'random',
    arpSpeed: 0.5,
    melodyEnabled: false,
    shimmerEnabled: false,
    reverbMix: 0.5,
    filterFreq: 600,
    lfoRate: 0.1,
    lfoDepth: 100
  },

  // 战斗 — 紧张、有力
  battle: {
    tempo: 132,
    scale: 'minor',
    rootNote: 'A2',
    progression: 'epicMinor',
    padWave: 'sawtooth',
    padVolume: 0.04,
    padAttack: 0.3,
    padRelease: 0.5,
    padFilter: 500,
    bassWave: 'square',
    bassVolume: 0.07,
    bassOctave: 0,
    arpEnabled: true,
    arpWave: 'square',
    arpVolume: 0.04,
    arpPattern: 'up',
    arpSpeed: 0.15,
    melodyEnabled: false,
    shimmerEnabled: false,
    reverbMix: 0.2,
    filterFreq: 1800,
    lfoRate: 4.0,
    lfoDepth: 100
  },

  // Boss 战 — 史诗、压迫
  battle_boss: {
    tempo: 144,
    scale: 'minor',
    rootNote: 'D2',
    progression: 'darkMinor',
    padWave: 'sawtooth',
    padVolume: 0.05,
    padAttack: 0.2,
    padRelease: 0.4,
    padFilter: 600,
    bassWave: 'sawtooth',
    bassVolume: 0.08,
    bassOctave: 0,
    arpEnabled: true,
    arpWave: 'sawtooth',
    arpVolume: 0.04,
    arpPattern: 'up',
    arpSpeed: 0.12,
    melodyEnabled: false,
    shimmerEnabled: false,
    reverbMix: 0.3,
    filterFreq: 2200,
    lfoRate: 5.0,
    lfoDepth: 150
  },

  // 抽卡 — 神秘、期待
  gacha: {
    tempo: 80,
    scale: 'pentatonic',
    rootNote: 'E3',
    progression: 'fantasy',
    padWave: 'sine',
    padVolume: 0.06,
    padAttack: 1.5,
    padRelease: 2.5,
    padFilter: 1000,
    bassWave: 'triangle',
    bassVolume: 0.03,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.05,
    arpPattern: 'updown',
    arpSpeed: 0.25,
    melodyEnabled: true,
    melodyWave: 'sine',
    melodyVolume: 0.04,
    shimmerEnabled: true,
    shimmerVolume: 0.02,
    reverbMix: 0.5,
    filterFreq: 1200,
    lfoRate: 0.3,
    lfoDepth: 200
  },

  // 养成/功能 — 轻松、愉快
  growth: {
    tempo: 90,
    scale: 'major',
    rootNote: 'F3',
    progression: 'fifties',
    padWave: 'triangle',
    padVolume: 0.05,
    padAttack: 1.0,
    padRelease: 1.5,
    padFilter: 1500,
    bassWave: 'triangle',
    bassVolume: 0.04,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.04,
    arpPattern: 'updown',
    arpSpeed: 0.35,
    melodyEnabled: true,
    melodyWave: 'sine',
    melodyVolume: 0.03,
    shimmerEnabled: false,
    reverbMix: 0.3,
    filterFreq: 1800,
    lfoRate: 0.25,
    lfoDepth: 100
  },

  // 胜利 — 明亮、辉煌
  victory: {
    tempo: 100,
    scale: 'major',
    rootNote: 'C3',
    progression: 'pop',
    padWave: 'triangle',
    padVolume: 0.07,
    padAttack: 0.8,
    padRelease: 1.5,
    padFilter: 2000,
    bassWave: 'triangle',
    bassVolume: 0.05,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.05,
    arpPattern: 'up',
    arpSpeed: 0.2,
    melodyEnabled: true,
    melodyWave: 'triangle',
    melodyVolume: 0.045,
    shimmerEnabled: true,
    shimmerVolume: 0.02,
    reverbMix: 0.4,
    filterFreq: 2500,
    lfoRate: 0.3,
    lfoDepth: 80
  },

  // 败北 — 低沉、忧伤
  defeat: {
    tempo: 50,
    scale: 'minor',
    rootNote: 'A2',
    progression: 'darkMinor',
    padWave: 'sine',
    padVolume: 0.06,
    padAttack: 3.0,
    padRelease: 4.0,
    padFilter: 400,
    bassWave: 'sine',
    bassVolume: 0.04,
    bassOctave: -1,
    arpEnabled: false,
    melodyEnabled: false,
    shimmerEnabled: false,
    reverbMix: 0.7,
    filterFreq: 350,
    lfoRate: 0.08,
    lfoDepth: 50
  },

  // 邮件/统计 — 简约、安静
  ambient: {
    tempo: 55,
    scale: 'pentatonic',
    rootNote: 'G3',
    progression: 'gentle',
    padWave: 'sine',
    padVolume: 0.04,
    padAttack: 3.0,
    padRelease: 4.0,
    padFilter: 500,
    bassWave: 'sine',
    bassVolume: 0.02,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.025,
    arpPattern: 'random',
    arpSpeed: 0.6,
    melodyEnabled: false,
    shimmerEnabled: true,
    shimmerVolume: 0.01,
    reverbMix: 0.6,
    filterFreq: 600,
    lfoRate: 0.12,
    lfoDepth: 80
  },

  // 设置/编队 — 中性、稳定
  neutral: {
    tempo: 75,
    scale: 'dorian',
    rootNote: 'D3',
    progression: 'classic',
    padWave: 'triangle',
    padVolume: 0.05,
    padAttack: 1.5,
    padRelease: 2.0,
    padFilter: 1000,
    bassWave: 'triangle',
    bassVolume: 0.035,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'triangle',
    arpVolume: 0.03,
    arpPattern: 'updown',
    arpSpeed: 0.4,
    melodyEnabled: false,
    shimmerEnabled: false,
    reverbMix: 0.3,
    filterFreq: 1200,
    lfoRate: 0.2,
    lfoDepth: 100
  },

  // 关卡选择 — 冒险、期待
  stages: {
    tempo: 95,
    scale: 'mixolydian',
    rootNote: 'G2',
    progression: 'fantasy',
    padWave: 'triangle',
    padVolume: 0.06,
    padAttack: 1.2,
    padRelease: 1.8,
    padFilter: 1100,
    bassWave: 'triangle',
    bassVolume: 0.05,
    bassOctave: -1,
    arpEnabled: true,
    arpWave: 'sine',
    arpVolume: 0.04,
    arpPattern: 'up',
    arpSpeed: 0.3,
    melodyEnabled: true,
    melodyWave: 'triangle',
    melodyVolume: 0.035,
    shimmerEnabled: false,
    reverbMix: 0.35,
    filterFreq: 1500,
    lfoRate: 0.25,
    lfoDepth: 120
  }
};

// ============ 场景 → 预设映射 ============
const SCENE_TO_PRESET = {
  'title': 'title',
  'main_menu': 'main_menu',
  'story': 'story',
  'story_ch1': 'story',
  'story_ch2': 'story',
  'story_ch3': 'story',
  'story_ch4': 'story',
  'dialogue': 'story',
  'battle': 'battle',
  'battle_boss': 'battle_boss',
  'battle_victory': 'victory',
  'battle_defeat': 'defeat',
  'gacha': 'gacha',
  'growth': 'growth',
  'party': 'neutral',
  'stages': 'stages',
  'stats': 'ambient',
  'settings': 'ambient',
  'mail': 'ambient',
  'roster': 'neutral',
  'quests': 'growth'
};

// ============ 简易混响（反馈延迟网络） ============
class SimpleReverb {
  constructor(ctx, output) {
    this._ctx = ctx;
    this._input = ctx.createGain();
    this._wet = ctx.createGain();
    this._dry = ctx.createGain();

    // 4 条不同延迟时间的反馈路径模拟混响
    this._delays = [];
    const delayTimes = [0.0297, 0.0371, 0.0411, 0.0437]; // 质数间隔避免梳状效应
    const feedbacks = [0.55, 0.50, 0.48, 0.45];

    for (let i = 0; i < 4; i++) {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = delayTimes[i];
      const fb = ctx.createGain();
      fb.gain.value = feedbacks[i];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000 + i * 500;

      this._input.connect(delay);
      delay.connect(fb);
      fb.connect(filter);
      filter.connect(delay); // 反馈环
      filter.connect(this._wet);

      this._delays.push({ delay, fb, filter });
    }

    this._input.connect(this._dry);
    this._dry.connect(output);
    this._wet.connect(output);
  }

  get input() { return this._input; }

  setMix(wetAmount) {
    // wetAmount: 0~1
    this._wet.gain.value = wetAmount;
    this._dry.gain.value = 1 - wetAmount * 0.5;
  }
}

// ============ 合成 BGM 引擎主类 ============
class SynthBGM {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._filter = null;
    this._lfo = null;
    this._reverb = null;
    this._activeNodes = [];
    this._schedulerTimer = null;
    this._isPlaying = false;
    this._currentPreset = null;
    this._currentMood = '';
    this._volume = 0.35;
    this._beatCount = 0;
    this._chordIndex = 0;
    this._melodyIndex = 0;
    this._arpNoteIndex = 0;
    this._enabled = true;
  }

  /** 确保 AudioContext 已创建 */
  _ensureCtx() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') {
        this._ctx.resume().catch(() => {});
      }
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this._ctx = new AC();

      // 主增益
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0; // 初始静音，play 时淡入

      // 主低通滤波器
      this._filter = this._ctx.createBiquadFilter();
      this._filter.type = 'lowpass';
      this._filter.frequency.value = 2000;
      this._filter.Q.value = 0.7;

      // LFO 调制滤波器截止频率
      this._lfo = this._ctx.createOscillator();
      this._lfoGain = this._ctx.createGain();
      this._lfo.type = 'sine';
      this._lfo.frequency.value = 0.2;
      this._lfoGain.gain.value = 150;
      this._lfo.connect(this._lfoGain);
      this._lfoGain.connect(this._filter.frequency);
      this._lfo.start();

      // 混响
      this._reverb = new SimpleReverb(this._ctx, this._masterGain);
      this._filter.connect(this._reverb.input);

      // 主增益 → 输出
      this._masterGain.connect(this._ctx.destination);

      return true;
    } catch (e) {
      console.warn('[SynthBGM] AudioContext 创建失败:', e);
      return false;
    }
  }

  /** 播放指定情绪 BGM */
  play(sceneOrMood) {
    if (!this._enabled) return;
    if (!this._ensureCtx()) return;

    // 解析场景名到预设
    const mood = SCENE_TO_PRESET[sceneOrMood] || sceneOrMood;
    if (this._currentMood === mood && this._isPlaying) return;

    this.stop();

    const preset = SYNTH_PRESETS[mood];
    if (!preset) {
      console.log(`[SynthBGM] 无预设: ${mood}，跳过`);
      return;
    }

    this._currentMood = mood;
    this._currentPreset = preset;
    this._isPlaying = true;
    this._beatCount = 0;
    this._chordIndex = 0;
    this._melodyIndex = 0;
    this._arpNoteIndex = 0;

    // 设置滤波器
    this._filter.frequency.value = preset.filterFreq || 1000;
    this._lfo.frequency.value = preset.lfoRate || 0.2;
    this._lfoGain.gain.value = preset.lfoDepth || 150;

    // 设置混响
    if (this._reverb) {
      this._reverb.setMix(preset.reverbMix || 0.3);
    }

    // 启动各声部
    this._startPad(preset);
    this._startBass(preset);
    if (preset.arpEnabled) this._startArpScheduler(preset);
    if (preset.melodyEnabled) this._startMelodyScheduler(preset);
    if (preset.shimmerEnabled) this._startShimmer(preset);

    // 淡入主增益
    this._fadeInMaster(1.5);

    // 启动调度定时器
    this._schedulerTimer = setInterval(() => this._schedulerTick(), 25);

    console.log(`[SynthBGM] ♪ 播放: ${mood} (tempo: ${preset.tempo}, root: ${preset.rootNote})`);
  }

  /** 停止播放 */
  stop() {
    this._isPlaying = false;
    this._currentMood = '';
    this._currentPreset = null;

    if (this._schedulerTimer) {
      clearInterval(this._schedulerTimer);
      this._schedulerTimer = null;
    }

    // 淡出后断开所有节点
    if (this._ctx && this._masterGain) {
      const now = this._ctx.currentTime;
      this._masterGain.gain.cancelScheduledValues(now);
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, now);
      this._masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
    }

    setTimeout(() => {
      for (const node of this._activeNodes) {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch (_) {}
      }
      this._activeNodes = [];
    }, 350);
  }

  /** 设置音量 (0~1) */
  setVolume(v) {
    this._volume = v;
    if (this._masterGain) {
      this._masterGain.gain.value = v;
    }
  }

  /** 开关 */
  setEnabled(enabled) {
    this._enabled = enabled;
    if (!enabled) this.stop();
  }

  /** 获取当前状态 */
  isPlaying() { return this._isPlaying; }
  getCurrentMood() { return this._currentMood; }

  // ============ 内部方法 ============

  /** 淡入主增益 */
  _fadeInMaster(duration) {
    if (!this._ctx || !this._masterGain) return;
    const now = this._ctx.currentTime;
    this._masterGain.gain.cancelScheduledValues(now);
    this._masterGain.gain.setValueAtTime(0, now);
    this._masterGain.gain.linearRampToValueAtTime(this._volume, now + duration);
  }

  /** 获取音阶频率数组 */
  _getScaleFreqs(rootNote, scaleName, octaves = 3) {
    const root = NOTE_FREQ[rootNote];
    if (!root) return [261.63];
    const scale = SCALES[scaleName] || SCALES.major;
    const freqs = [];
    for (let oct = 0; oct < octaves; oct++) {
      const mult = Math.pow(2, oct);
      for (const interval of scale) {
        freqs.push(root * interval * mult);
      }
    }
    return freqs;
  }

  /** 获取和弦根音频率 */
  _getChordRoot(preset, chordIdx) {
    const root = NOTE_FREQ[preset.rootNote];
    if (!root) return 130.81;
    const scale = SCALES[preset.scale] || SCALES.major;
    const prog = PROGRESSIONS[preset.progression] || PROGRESSIONS.pop;
    const degreeIdx = prog[chordIdx % prog.length];
    return root * (scale[degreeIdx] || 1);
  }

  /** 获取和弦内音符（三和弦） */
  _getChordTones(preset, chordIdx) {
    const scaleFreqs = this._getScaleFreqs(preset.rootNote, preset.scale, 2);
    const prog = PROGRESSIONS[preset.progression] || PROGRESSIONS.pop;
    const degreeIdx = prog[chordIdx % prog.length];
    const scale = SCALES[preset.scale] || SCALES.major;
    const len = scale.length;
    // 三和弦：根音、三度、五度
    const rootIdx = degreeIdx;
    const thirdIdx = (degreeIdx + 2) % len;
    const fifthIdx = (degreeIdx + 4) % len;
    return [
      scaleFreqs[rootIdx] || 261.63,
      scaleFreqs[thirdIdx] || 329.63,
      scaleFreqs[fifthIdx] || 392.00
    ];
  }

  /** 注册活跃节点（用于清理） */
  _track(node) {
    this._activeNodes.push(node);
    return node;
  }

  // ---- 和弦垫音 (Pad) ----
  _startPad(preset) {
    const ctx = this._ctx;
    const chordTones = this._getChordTones(preset, 0);

    const padGain = ctx.createGain();
    padGain.gain.value = preset.padVolume;
    padGain.connect(this._filter);
    this._track(padGain);

    // 为每个和弦音创建一个振荡器
    this._padOscs = [];
    for (const freq of chordTones) {
      const osc = ctx.createOscillator();
      osc.type = preset.padWave;
      osc.frequency.value = freq;
      // 微量失调增加厚度
      osc.detune.value = (Math.random() - 0.5) * 10;
      osc.connect(padGain);
      osc.start();
      this._padOscs.push(osc);
      this._track(osc);
    }

    // 第二个失调层（增厚效果）
    for (const freq of chordTones) {
      const osc = ctx.createOscillator();
      osc.type = preset.padWave;
      osc.frequency.value = freq * 1.002; // 轻微升高
      const detuneGain = ctx.createGain();
      detuneGain.gain.value = preset.padVolume * 0.4;
      osc.connect(detuneGain);
      detuneGain.connect(padGain);
      osc.start();
      this._padOscs.push(osc);
      this._track(osc);
    }

    this._padGain = padGain;
  }

  /** 更新 Pad 和弦 */
  _updatePad(preset, chordIdx) {
    if (!this._padOscs || !this._ctx) return;
    const chordTones = this._getChordTones(preset, chordIdx);
    const now = this._ctx.currentTime;
    const transition = preset.padAttack || 1.5;

    // 更新主振荡器
    for (let i = 0; i < Math.min(chordTones.length, this._padOscs.length / 2); i++) {
      const osc = this._padOscs[i];
      osc.frequency.linearRampToValueAtTime(chordTones[i], now + transition);
    }
    // 更新失调层
    for (let i = 0; i < Math.min(chordTones.length, this._padOscs.length / 2); i++) {
      const osc = this._padOscs[chordTones.length + i];
      if (osc) {
        osc.frequency.linearRampToValueAtTime(chordTones[i] * 1.002, now + transition);
      }
    }
  }

  // ---- 低音 (Bass) ----
  _startBass(preset) {
    const ctx = this._ctx;
    const rootFreq = NOTE_FREQ[preset.rootNote] || 130.81;
    const bassFreq = rootFreq * Math.pow(2, preset.bassOctave || -1);

    const bassOsc = ctx.createOscillator();
    bassOsc.type = preset.bassWave;
    bassOsc.frequency.value = bassFreq;

    const bassGain = ctx.createGain();
    bassGain.gain.value = preset.bassVolume;

    // 低音专用低通滤波
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 300;
    bassFilter.Q.value = 1.0;

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this._filter);
    bassOsc.start();

    this._bassOsc = bassOsc;
    this._bassGain = bassGain;
    this._track(bassOsc);
    this._track(bassGain);
  }

  /** 更新低音音高 */
  _updateBass(preset, chordIdx) {
    if (!this._bassOsc || !this._ctx) return;
    const rootFreq = this._getChordRoot(preset, chordIdx);
    const bassFreq = rootFreq * Math.pow(2, preset.bassOctave || -1);
    const now = this._ctx.currentTime;
    this._bassOsc.frequency.exponentialRampToValueAtTime(bassFreq, now + 0.3);
  }

  // ---- 琶音调度 ----
  _startArpScheduler(preset) {
    this._arpGain = null; // 每次调度时创建短音
  }

  _scheduleArpNote(preset, time) {
    const ctx = this._ctx;
    const chordTones = this._getChordTones(preset, this._chordIndex);
    if (chordTones.length === 0) return;

    // 选择琶音音符
    let noteIdx;
    const pattern = preset.arpPattern || 'up';
    if (pattern === 'up') {
      noteIdx = this._arpNoteIndex % chordTones.length;
      this._arpNoteIndex++;
    } else if (pattern === 'updown') {
      const cycle = chordTones.length * 2 - 2;
      const pos = this._arpNoteIndex % cycle;
      noteIdx = pos < chordTones.length ? pos : cycle - pos;
      this._arpNoteIndex++;
    } else if (pattern === 'random') {
      noteIdx = Math.floor(Math.random() * chordTones.length);
    } else {
      noteIdx = this._arpNoteIndex % chordTones.length;
      this._arpNoteIndex++;
    }

    // 提高一个八度
    const freq = chordTones[noteIdx] * 2;

    const osc = ctx.createOscillator();
    osc.type = preset.arpWave || 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const vol = preset.arpVolume || 0.04;
    const dur = (60 / preset.tempo) * (preset.arpSpeed || 0.3);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this._filter);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  // ---- 旋律调度 ----
  _startMelodyScheduler(preset) {
    this._melodyScale = this._getScaleFreqs(preset.rootNote, preset.scale, 2);
  }

  _scheduleMelodyNote(preset, time) {
    const ctx = this._ctx;
    const scale = this._melodyScale;
    if (!scale || scale.length === 0) return;

    // 旋律使用音阶中较高的音符
    const baseIdx = Math.floor(scale.length * 0.4); // 从中间偏高开始
    const range = Math.floor(scale.length * 0.4);
    const noteIdx = baseIdx + (this._melodyIndex % range);
    this._melodyIndex++;

    // 偶尔跳过（增加自然感）
    if (Math.random() < 0.3) return;

    const freq = scale[Math.min(noteIdx, scale.length - 1)];
    const osc = ctx.createOscillator();
    osc.type = preset.melodyWave || 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const vol = preset.melodyVolume || 0.04;
    const dur = (60 / preset.tempo) * 0.8; // 旋律音符较长
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this._filter);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  // ---- 微光层 (Shimmer) ----
  _startShimmer(preset) {
    // 高频微光：一个很高很轻的持续音
    const ctx = this._ctx;
    const shimmerFreq = (NOTE_FREQ[preset.rootNote] || 261.63) * 4; // 高两个八度

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = shimmerFreq;

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = preset.shimmerVolume || 0.015;

    // 缓慢 LFO 调制音量
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = preset.shimmerVolume * 0.8;
    lfo.connect(lfoGain);
    lfoGain.connect(shimmerGain.gain);

    osc.connect(shimmerGain);
    shimmerGain.connect(this._filter);
    osc.start();
    lfo.start();

    this._track(osc);
    this._track(lfo);
    this._track(shimmerGain);
  }

  // ---- 主调度循环 ----
  _schedulerTick() {
    if (!this._isPlaying || !this._ctx || !this._currentPreset) return;

    const preset = this._currentPreset;
    const beatDuration = 60 / preset.tempo;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // 和弦切换（每 8 拍）
    if (this._beatCount % 8 === 0 && this._beatCount > 0) {
      const prog = PROGRESSIONS[preset.progression] || PROGRESSIONS.pop;
      this._chordIndex = (this._chordIndex + 1) % prog.length;
      this._updatePad(preset, this._chordIndex);
      this._updateBass(preset, this._chordIndex);
    }

    // 低音节奏脉冲（每拍）
    if (this._bassGain && this._bassOsc) {
      const bassVol = preset.bassVolume || 0.05;
      // 每拍开始时低音略微增强
      this._bassGain.gain.setValueAtTime(bassVol * 1.3, now);
      this._bassGain.gain.exponentialRampToValueAtTime(bassVol, now + beatDuration * 0.5);
    }

    // 琶音调度（每 N 拍一次）
    if (preset.arpEnabled) {
      const arpInterval = Math.max(1, Math.round((preset.arpSpeed || 0.3) * 8));
      if (this._beatCount % arpInterval === 0) {
        this._scheduleArpNote(preset, now);
      }
    }

    // 旋律调度（每 2 拍一次，有概率跳过）
    if (preset.melodyEnabled && this._beatCount % 2 === 0) {
      this._scheduleMelodyNote(preset, now);
    }

    this._beatCount++;
  }
}

// ============ 全局实例 ============
const synthBGM = new SynthBGM();

window.SynthBGM = SynthBGM;
window.synthBGM = synthBGM;
window.SCENE_TO_PRESET = SCENE_TO_PRESET;
window.SYNTH_PRESETS = SYNTH_PRESETS;
