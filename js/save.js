/**
 * save.js - Supabase 云端存档系统
 * 负责玩家认证、存档读写、数据同步
 */

// ============ Supabase 配置（占位，部署时替换） ============
const SUPABASE_CONFIG = {
  url: 'https://qvbywrfkpbiojncikdnw.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2Ynl3cmZrcGJpb2puY2lrZG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NzQ0MzIsImV4cCI6MjEwNDE1MDQzMn0.iv-GBbOYG3WfrdaxXaf2VZI7-groBrPjmPFrkxMHwos'
};

// ============ 存档管理器 ============
class SaveManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.connected = false;
    this.localSaveKey = 'game_save_local';
  }

  // 初始化 Supabase 连接
  async init() {
    // 检查 Supabase 是否已配置
    if (SUPABASE_CONFIG.url.includes('GAME_PROJECT_ID')) {
      console.warn('[SaveManager] Supabase 未配置，使用本地存档模式');
      this.connected = false;
      return false;
    }

    try {
      // 动态加载 Supabase SDK
      if (typeof supabase !== 'undefined') {
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.connected = true;
        console.log('[SaveManager] Supabase 已连接');
        return true;
      }
    } catch (e) {
      console.error('[SaveManager] Supabase 连接失败:', e);
    }

    this.connected = false;
    return false;
  }

  // ============ 认证 ============

  // 注册
  async register(username, password) {
    if (!this.connected) {
      return { success: false, error: '未连接服务器' };
    }

    try {
      const { data, error } = await this.supabase.rpc('game_register', {
        p_username: username,
        p_password: password
      });

      if (error) return { success: false, error: error.message };
      this.currentUser = data;
      return { success: true, user: data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 登录
  async login(username, password) {
    if (!this.connected) {
      return { success: false, error: '未连接服务器' };
    }

    try {
      const { data, error } = await this.supabase.rpc('game_login', {
        p_username: username,
        p_password: password
      });

      if (error) return { success: false, error: error.message };
      if (!data) return { success: false, error: '用户名或密码错误' };

      this.currentUser = data;
      return { success: true, user: data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ============ 存档 ============

  // 保存游戏进度
  async saveGame(gameState) {
    const saveData = {
      version: 1,
      timestamp: new Date().toISOString(),
      storyProgress: gameState.storyProgress,
      party: gameState.party,
      roster: gameState.roster?.map(c => ({
        id: c.id, level: c.level, name: c.name
      })),
      inventory: gameState.inventory,
      currency: gameState.currency
    };

    // 本地备份
    try {
      localStorage.setItem(this.localSaveKey, JSON.stringify(saveData));
    } catch (e) {
      console.warn('[SaveManager] 本地存档失败:', e);
    }

    // 云端保存
    if (!this.connected || !this.currentUser) {
      return { success: true, cloud: false, message: '已保存到本地' };
    }

    try {
      const { error } = await this.supabase.rpc('game_save', {
        p_user_id: this.currentUser.id,
        p_save_data: JSON.stringify(saveData)
      });

      if (error) return { success: true, cloud: false, error: error.message };
      return { success: true, cloud: true };
    } catch (e) {
      return { success: true, cloud: false, error: e.message };
    }
  }

  // 加载游戏进度
  async loadGame() {
    // 优先从云端加载
    if (this.connected && this.currentUser) {
      try {
        const { data, error } = await this.supabase.rpc('game_load', {
          p_user_id: this.currentUser.id
        });

        if (!error && data) {
          return { success: true, data: JSON.parse(data), source: 'cloud' };
        }
      } catch (e) {
        console.warn('[SaveManager] 云端读取失败，尝试本地:', e);
      }
    }

    // 从本地加载
    try {
      const local = localStorage.getItem(this.localSaveKey);
      if (local) {
        return { success: true, data: JSON.parse(local), source: 'local' };
      }
    } catch (e) {
      console.warn('[SaveManager] 本地读取失败:', e);
    }

    return { success: false, error: '无存档数据' };
  }

  // ============ 抽卡记录 ============

  async recordGacha(pulls, results) {
    if (!this.connected || !this.currentUser) return;

    try {
      await this.supabase.rpc('game_gacha_record', {
        p_user_id: this.currentUser.id,
        p_pool_id: 'standard',
        p_results: JSON.stringify(results)
      });
    } catch (e) {
      console.warn('[SaveManager] 抽卡记录失败:', e);
    }
  }

  // ============ 图鉴同步 ============

  async syncRoster() {
    if (!this.connected || !this.currentUser) return;

    try {
      const { data, error } = await this.supabase.rpc('game_get_roster', {
        p_user_id: this.currentUser.id
      });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('[SaveManager] 图鉴同步失败:', e);
    }
    return null;
  }
}

// ============ 本地存档模式（离线可用） ============
class LocalSaveManager {
  constructor() {
    this.prefix = 'game_offline_';
  }

  save(key, data) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  load(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  delete(key) {
    localStorage.removeItem(this.prefix + key);
  }
}

// 导出
window.SaveManager = SaveManager;
window.LocalSaveManager = LocalSaveManager;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
