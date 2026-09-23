/**
 * mail.js - 邮件/收件箱系统
 * 支持系统邮件、奖励发放、邮件过期清理
 * v0.13.0 新增
 * 
 * 邮件类型：
 *  - system: 系统通知（纯文本）
 *  - reward: 奖励邮件（含附件，可领取）
 *  - event: 活动邮件（限时活动奖励）
 * 
 * 邮件状态：
 *  - unread: 未读
 *  - read: 已读
 *  - claimed: 已领取附件
 *  - expired: 已过期
 * 
 * ⚡ 与"游戏画面与人物动画制作"任务共享记忆库
 */

// ============ 邮件管理器 ============
class MailManager {
  constructor() {
    this.storageKey = 'game_mail_v1';
    this.mails = [];
    this.maxMails = 100;  // 邮箱容量上限
    this.defaultExpireDays = 30;  // 默认过期天数
  }

  /**
   * 从本地存储加载邮件
   */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.mails = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Mail] 加载失败:', e);
      this.mails = [];
    }

    // 清理过期邮件
    this._cleanExpired();
    this._save();
  }

  /**
   * 保存到本地存储
   */
  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.mails));
    } catch (e) {
      console.warn('[Mail] 保存失败:', e);
    }
  }

  /**
   * 清理过期邮件（保留最近 100 封）
   */
  _cleanExpired() {
    const now = Date.now();
    
    // 删除已过期邮件
    this.mails = this.mails.filter(mail => {
      if (mail.expireAt && mail.expireAt < now) {
        return false;
      }
      return true;
    });

    // 超出容量时删除最早的已读邮件
    if (this.mails.length > this.maxMails) {
      this.mails.sort((a, b) => b.createdAt - a.createdAt);
      this.mails = this.mails.slice(0, this.maxMails);
    }
  }

  /**
   * 发送系统邮件
   * @param {object} mailDef
   * @param {string} mailDef.title - 邮件标题
   * @param {string} mailDef.content - 邮件正文
   * @param {string} mailDef.sender - 发件人（默认"系统"）
   * @param {object} mailDef.attachments - 附件（可选）
   * @param {number} mailDef.attachments.crystals - 水晶
   * @param {number} mailDef.attachments.coins - 金币
   * @param {object} mailDef.attachments.items - 道具 { itemId: amount }
   * @param {number} mailDef.expireDays - 过期天数（默认 30）
   * @param {string} mailDef.type - 邮件类型（system/reward/event）
   * @returns {object} 创建的邮件对象
   */
  send(mailDef) {
    const mail = {
      id: 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      title: mailDef.title || '系统通知',
      content: mailDef.content || '',
      sender: mailDef.sender || '系统',
      type: mailDef.type || 'system',
      attachments: mailDef.attachments || null,
      status: 'unread',  // unread / read / claimed
      createdAt: Date.now(),
      expireAt: Date.now() + (mailDef.expireDays || this.defaultExpireDays) * 24 * 60 * 60 * 1000,
      claimed: false
    };

    // 插入到最前面（新邮件在前）
    this.mails.unshift(mail);

    // 超出容量时删除最早的已读邮件
    if (this.mails.length > this.maxMails) {
      const readMails = this.mails.filter(m => m.status === 'read' || m.status === 'claimed');
      if (readMails.length > 0) {
        const oldest = readMails[readMails.length - 1];
        this.mails = this.mails.filter(m => m.id !== oldest.id);
      }
    }

    this._save();

    // 触发 Toast 通知
    if (typeof ToastSystem !== 'undefined') {
      ToastSystem.show({
        text: `收到新邮件：${mail.title}`,
        type: 'info',
        icon: '📧'
      });
    }

    return mail;
  }

  /**
   * 标记邮件为已读
   * @param {string} mailId
   */
  markAsRead(mailId) {
    const mail = this.mails.find(m => m.id === mailId);
    if (mail && mail.status === 'unread') {
      mail.status = 'read';
      this._save();
    }
  }

  /**
   * 领取邮件附件
   * @param {string} mailId
   * @param {object} gameState - 游戏状态（用于写入奖励）
   * @returns {{ success: boolean, rewards?: object, error?: string }}
   */
  claimAttachment(mailId, gameState) {
    const mail = this.mails.find(m => m.id === mailId);
    
    if (!mail) {
      return { success: false, error: '邮件不存在' };
    }

    if (mail.status === 'claimed') {
      return { success: false, error: '已领取' };
    }

    if (!mail.attachments) {
      return { success: false, error: '无附件' };
    }

    // 发放奖励
    const rewards = {};
    
    if (mail.attachments.crystals) {
      gameState.currency.crystals = (gameState.currency.crystals || 0) + mail.attachments.crystals;
      rewards.crystals = mail.attachments.crystals;
    }

    if (mail.attachments.coins) {
      gameState.currency.coins = (gameState.currency.coins || 0) + mail.attachments.coins;
      rewards.coins = mail.attachments.coins;
    }

    if (mail.attachments.items) {
      for (const [itemId, amount] of Object.entries(mail.attachments.items)) {
        gameState.inventory[itemId] = (gameState.inventory[itemId] || 0) + amount;
        rewards[itemId] = amount;
      }
    }

    mail.status = 'claimed';
    mail.claimed = true;
    this._save();

    // 触发 Toast 通知
    if (typeof ToastSystem !== 'undefined') {
      const rewardText = [];
      if (rewards.crystals) rewardText.push(`水晶 ×${rewards.crystals}`);
      if (rewards.coins) rewardText.push(`金币 ×${rewards.coins}`);
      for (const [itemId, amount] of Object.entries(rewards)) {
        if (itemId !== 'crystals' && itemId !== 'coins') {
          rewardText.push(`${itemId} ×${amount}`);
        }
      }
      ToastSystem.show({
        text: `已领取：${rewardText.join(', ')}`,
        type: 'success',
        icon: '🎁'
      });
    }

    return { success: true, rewards };
  }

  /**
   * 一键领取所有附件
   * @param {object} gameState
   * @returns {{ success: boolean, count: number, totalRewards: object }}
   */
  claimAll(gameState) {
    const claimable = this.mails.filter(m => 
      m.status !== 'claimed' && m.attachments
    );

    if (claimable.length === 0) {
      return { success: false, count: 0, error: '无可领取邮件' };
    }

    const totalRewards = { crystals: 0, coins: 0, items: {} };
    let count = 0;

    for (const mail of claimable) {
      const result = this.claimAttachment(mail.id, gameState);
      if (result.success) {
        count++;
        if (result.rewards.crystals) totalRewards.crystals += result.rewards.crystals;
        if (result.rewards.coins) totalRewards.coins += result.rewards.coins;
        for (const [itemId, amount] of Object.entries(result.rewards)) {
          if (itemId !== 'crystals' && itemId !== 'coins') {
            totalRewards.items[itemId] = (totalRewards.items[itemId] || 0) + amount;
          }
        }
      }
    }

    // 汇总 Toast
    if (typeof ToastSystem !== 'undefined' && count > 0) {
      const rewardText = [];
      if (totalRewards.crystals) rewardText.push(`水晶 ×${totalRewards.crystals}`);
      if (totalRewards.coins) rewardText.push(`金币 ×${totalRewards.coins}`);
      for (const [itemId, amount] of Object.entries(totalRewards.items)) {
        rewardText.push(`${itemId} ×${amount}`);
      }
      ToastSystem.show({
        text: `已领取 ${count} 封邮件：${rewardText.join(', ')}`,
        type: 'success',
        icon: '📬'
      });
    }

    return { success: true, count, totalRewards };
  }

  /**
   * 删除邮件
   * @param {string} mailId
   */
  delete(mailId) {
    this.mails = this.mails.filter(m => m.id !== mailId);
    this._save();
  }

  /**
   * 删除所有已读/已领取邮件
   */
  deleteAllRead() {
    this.mails = this.mails.filter(m => m.status === 'unread');
    this._save();
  }

  /**
   * 获取未读邮件数量
   */
  getUnreadCount() {
    return this.mails.filter(m => m.status === 'unread').length;
  }

  /**
   * 获取可领取附件的邮件数量
   */
  getClaimableCount() {
    return this.mails.filter(m => m.status !== 'claimed' && m.attachments).length;
  }

  /**
   * 获取所有邮件（按时间倒序）
   */
  getAll() {
    return [...this.mails].sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 导出邮件数据（用于存档）
   */
  exportData() {
    return {
      mails: this.mails,
      version: 1
    };
  }

  /**
   * 导入邮件数据（从存档恢复）
   */
  importData(data) {
    if (data && data.mails) {
      this.mails = data.mails;
      this._cleanExpired();
      this._save();
    }
  }
}

// ============ 邮件工厂（预设模板） ============
const MailTemplates = {
  /**
   * 欢迎邮件
   */
  welcome(username) {
    return {
      title: '欢迎来到未定之旅',
      content: `亲爱的${username}，欢迎加入庸人工作室的冒险旅程！\n\n这是一份新手礼包，祝你旅途愉快！`,
      sender: '庸人工作室',
      type: 'reward',
      attachments: {
        crystals: 500,
        coins: 2000,
        items: {
          exp_book_1: 5,
          exp_book_2: 2
        }
      },
      expireDays: 7
    };
  },

  /**
   * 维护补偿
   */
  maintenanceCompensation(reason) {
    return {
      title: '维护补偿',
      content: `亲爱的冒险者，因${reason || '系统维护'}给您带来不便，特发放补偿。`,
      sender: '庸人工作室',
      type: 'reward',
      attachments: {
        crystals: 100,
        coins: 500
      },
      expireDays: 14
    };
  },

  /**
   * 成就奖励
   */
  achievementReward(achievementName, rewards) {
    return {
      title: `成就达成：${achievementName}`,
      content: `恭喜你完成了成就「${achievementName}」！\n\n奖励已发放，请查收。`,
      sender: '成就系统',
      type: 'reward',
      attachments: rewards,
      expireDays: 30
    };
  },

  /**
   * 活动奖励
   */
  eventReward(eventName, rewards, expireDays = 7) {
    return {
      title: `活动奖励：${eventName}`,
      content: `感谢你参与「${eventName}」活动！\n\n这是你的专属奖励，请在有效期内领取。`,
      sender: '活动系统',
      type: 'event',
      attachments: rewards,
      expireDays
    };
  },

  /**
   * 系统通知
   */
  systemNotice(title, content) {
    return {
      title,
      content,
      sender: '系统',
      type: 'system',
      expireDays: 30
    };
  }
};

// ============ 导出 ============
window.MailManager = MailManager;
window.MailTemplates = MailTemplates;
