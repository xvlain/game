/**
 * toast.js - 全局 Toast 通知系统
 * Canvas 渲染的非模态消息提示，自动消失
 * v0.14.0 新增
 *
 * 设计规范（参考业界最佳实践）：
 *  - 单条 Toast 显示时长 ≤ 3 秒
 *  - 最多同时显示 3 条，超出进入队列
 *  - 显示位置：画面上方居中（避免遮挡战斗区域）
 *  - 支持类型：info / success / warning / error
 *  - 入场动画：从顶部滑入 + 淡入
 *  - 退场动画：淡出 + 上移
 *  - 支持 icon（emoji 或小图标）
 *
 * ⚡ 与"游戏画面与人物动画制作"任务共享记忆库
 */

// ============ Toast 系统 ============
const ToastSystem = {
  queue: [],           // 待显示的 Toast 队列
  active: [],          // 当前显示的 Toast 列表
  maxActive: 3,        // 最多同时显示数量
  position: 'top',     // 显示位置: top / bottom
  _lastUpdate: 0,

  /**
   * 显示一条 Toast 通知
   * @param {object} options
   * @param {string} options.text - 提示文本
   * @param {string} options.type - 类型 (info/success/warning/error)
   * @param {string} options.icon - 图标（emoji，可选）
   * @param {number} options.duration - 显示时长（毫秒，默认 2500）
   */
  show(options = {}) {
    const toast = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text: options.text || '',
      type: options.type || 'info',
      icon: options.icon || null,
      duration: options.duration || 2500,
      createdAt: performance.now(),
      alpha: 0,           // 当前透明度
      targetAlpha: 1,     // 目标透明度
      slideOffset: -30,   // 滑入偏移
      targetSlideOffset: 0,
      phase: 'enter',     // enter / show / exit
      exitTimer: 0
    };

    // 设置退场计时器
    toast.exitTimer = toast.duration;

    if (this.active.length < this.maxActive) {
      this.active.push(toast);
    } else {
      this.queue.push(toast);
    }
  },

  /**
   * 每帧更新（由引擎主循环调用）
   * @param {number} dt - 毫秒间隔
   */
  update(dt) {
    // 更新活跃的 Toast
    for (let i = this.active.length - 1; i >= 0; i--) {
      const toast = this.active[i];

      if (toast.phase === 'enter') {
        // 淡入 + 滑入
        toast.alpha = Math.min(1, toast.alpha + dt * 0.006);
        toast.slideOffset += (toast.targetSlideOffset - toast.slideOffset) * 0.15;

        if (toast.alpha >= 0.95) {
          toast.alpha = 1;
          toast.slideOffset = 0;
          toast.phase = 'show';
        }
      } else if (toast.phase === 'show') {
        // 等待退场
        toast.exitTimer -= dt;
        if (toast.exitTimer <= 0) {
          toast.phase = 'exit';
        }
      } else if (toast.phase === 'exit') {
        // 淡出 + 上移
        toast.alpha = Math.max(0, toast.alpha - dt * 0.005);
        toast.slideOffset -= dt * 0.03;

        if (toast.alpha <= 0) {
          this.active.splice(i, 1);
        }
      }
    }

    // 从队列补充
    while (this.active.length < this.maxActive && this.queue.length > 0) {
      this.active.push(this.queue.shift());
    }
  },

  /**
   * 渲染所有 Toast（由引擎渲染循环调用）
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (this.active.length === 0) return;

    const toastHeight = 36;
    const toastPadding = 8;
    const toastGap = 6;
    const startY = this.position === 'top' ? 20 : canvasHeight - 20 - this.active.length * (toastHeight + toastGap);

    for (let i = 0; i < this.active.length; i++) {
      const toast = this.active[i];
      if (toast.alpha <= 0) continue;

      const y = startY + i * (toastHeight + toastGap) + toast.slideOffset;
      const centerX = canvasWidth / 2;

      // 计算文本宽度（近似）
      ctx.save();
      ctx.font = '14px "Noto Sans SC", sans-serif';
      const textWidth = ctx.measureText(toast.text).width;
      const iconWidth = toast.icon ? 22 : 0;
      const totalWidth = textWidth + iconWidth + toastPadding * 3;
      const toastWidth = Math.min(Math.max(totalWidth, 150), canvasWidth - 40);
      const x = centerX - toastWidth / 2;

      ctx.globalAlpha = toast.alpha;

      // 背景
      const bgColor = this._getBgColor(toast.type);
      const borderColor = this._getBorderColor(toast.type);

      ctx.beginPath();
      this._roundRect(ctx, x, y, toastWidth, toastHeight, 8);
      ctx.fillStyle = bgColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 图标
      let textX = x + toastPadding + 4;
      if (toast.icon) {
        ctx.font = '16px serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(toast.icon, textX, y + toastHeight / 2);
        textX += iconWidth;
      }

      // 文本
      ctx.font = '14px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e0e0e0';
      
      // 文本截断
      const maxTextWidth = toastWidth - (textX - x) - toastPadding;
      let displayText = toast.text;
      while (ctx.measureText(displayText).width > maxTextWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      if (displayText !== toast.text) {
        displayText += '…';
      }

      ctx.fillText(displayText, textX, y + toastHeight / 2);

      // 类型指示条（左侧）
      ctx.beginPath();
      ctx.rect(x, y, 3, toastHeight);
      ctx.fillStyle = borderColor;
      ctx.fill();

      ctx.restore();
    }
  },

  /**
   * 获取背景颜色
   */
  _getBgColor(type) {
    switch (type) {
      case 'success': return 'rgba(30, 60, 40, 0.92)';
      case 'warning': return 'rgba(60, 50, 20, 0.92)';
      case 'error':   return 'rgba(60, 25, 25, 0.92)';
      default:        return 'rgba(25, 25, 50, 0.92)';
    }
  },

  /**
   * 获取边框颜色
   */
  _getBorderColor(type) {
    switch (type) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error':   return '#ff5252';
      default:        return '#5c8abf';
    }
  },

  /**
   * 圆角矩形工具
   */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  /**
   * 清空所有 Toast
   */
  clear() {
    this.active = [];
    this.queue = [];
  }
};

// ============ 导出 ============
window.ToastSystem = ToastSystem;
