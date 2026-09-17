/**
 * ui-animations.js - UI 动画系统
 * 包含：对话框动画、按钮反馈、面板呼吸光效、HP/能量条特效
 * v0.8.0 - 新增 UI 动画系统（配合美术素材使用）
 */

// ============ UI 动画管理器 ============
const UIAnimations = {
  // 当前活跃的动画列表
  active: [],
  
  /**
   * 注册一个动画
   * @param {object} anim - { id, update: (dt) => bool, onComplete?: () => void }
   */
  register(anim) {
    this.active.push(anim);
    return anim.id;
  },

  /**
   * 移除动画
   */
  remove(id) {
    this.active = this.active.filter(a => a.id !== id);
  },

  /**
   * 更新所有动画（每帧调用）
   */
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const done = this.active[i].update(dt);
      if (done) {
        if (this.active[i].onComplete) this.active[i].onComplete();
        this.active.splice(i, 1);
      }
    }
  }
};

// ============ 缓动函数 ============
const Easing = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutElastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  },
  bounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

// ============ 对话框动画 ============

/**
 * 对话框入场动画（从底部滑入 + 淡入）
 */
function animateDialogEnter(dialog, callback) {
  const duration = 400; // ms
  let elapsed = 0;
  const startY = dialog.targetY + 30;
  const endY = dialog.targetY;

  dialog.y = startY;
  dialog.alpha = 0;

  const id = `dialog_enter_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      const eased = Easing.easeOutBack(t);
      
      dialog.y = startY + (endY - startY) * eased;
      dialog.alpha = Easing.easeOut(t);
      
      if (t >= 1) {
        dialog.y = endY;
        dialog.alpha = 1;
        return true;
      }
      return false;
    },
    onComplete: callback
  });
  return id;
}

/**
 * 对话框退场动画（向下滑出 + 淡出）
 */
function animateDialogExit(dialog, callback) {
  const duration = 300;
  let elapsed = 0;
  const startY = dialog.y;
  const endY = dialog.y + 40;

  const id = `dialog_exit_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      
      dialog.y = startY + (endY - startY) * Easing.easeIn(t);
      dialog.alpha = 1 - Easing.easeIn(t);
      
      if (t >= 1) {
        dialog.alpha = 0;
        return true;
      }
      return false;
    },
    onComplete: callback
  });
  return id;
}

// ============ 打字机文字效果 ============

/**
 * 文字逐字显示效果
 */
function animateTypewriter(text, speed = 40) {
  let index = 0;
  let elapsed = 0;
  const result = { current: '', done: false, skip: () => { result.current = text; result.done = true; } };

  const id = `typewriter_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      if (result.done) return true;
      elapsed += dt;
      while (elapsed >= speed && index < text.length) {
        elapsed -= speed;
        index++;
        result.current = text.substring(0, index);
      }
      if (index >= text.length) {
        result.done = true;
        return true;
      }
      return false;
    }
  });
  return result;
}

// ============ 按钮动画 ============

/**
 * 按钮点击反馈（缩放弹跳）
 */
function animateButtonPress(button) {
  const duration = 200;
  let elapsed = 0;
  const originalScale = button.scale || 1;

  const id = `btn_press_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      
      if (t < 0.3) {
        // 按下缩小
        button.scale = originalScale * (1 - 0.08 * Easing.easeOut(t / 0.3));
      } else {
        // 弹回
        const bt = (t - 0.3) / 0.7;
        button.scale = originalScale * (0.92 + 0.08 * Easing.easeOutElastic(bt));
      }
      
      if (t >= 1) {
        button.scale = originalScale;
        return true;
      }
      return false;
    }
  });
  return id;
}

/**
 * 按钮悬停发光效果
 */
function animateButtonHover(button, hovering) {
  const duration = 200;
  let elapsed = 0;
  const startGlow = button.glow || 0;
  const targetGlow = hovering ? 1 : 0;

  const id = `btn_hover_${Date.now()}`;
  // 移除之前的 hover 动画
  UIAnimations.active = UIAnimations.active.filter(a => !a.id.startsWith('btn_hover_') || a.id !== id);

  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      
      button.glow = startGlow + (targetGlow - startGlow) * Easing.easeOut(t);
      
      if (t >= 1) {
        button.glow = targetGlow;
        return true;
      }
      return false;
    }
  });
  return id;
}

// ============ 面板动画 ============

/**
 * 面板展开动画（从中心缩放展开）
 */
function animatePanelOpen(panel, callback) {
  const duration = 350;
  let elapsed = 0;

  panel.scale = 0;
  panel.alpha = 0;

  const id = `panel_open_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      
      panel.scale = Easing.easeOutBack(t);
      panel.alpha = Easing.easeOut(Math.min(t * 1.5, 1));
      
      if (t >= 1) {
        panel.scale = 1;
        panel.alpha = 1;
        return true;
      }
      return false;
    },
    onComplete: callback
  });
  return id;
}

/**
 * 面板关闭动画（缩小 + 淡出）
 */
function animatePanelClose(panel, callback) {
  const duration = 250;
  let elapsed = 0;

  const id = `panel_close_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);
      
      panel.scale = 1 - Easing.easeIn(t) * 0.3;
      panel.alpha = 1 - Easing.easeIn(t);
      
      if (t >= 1) {
        panel.alpha = 0;
        return true;
      }
      return false;
    },
    onComplete: callback
  });
  return id;
}

// ============ HP/能量条渲染 ============

/**
 * HP 条渲染器（带平滑过渡和受击闪烁）
 */
class HPBarRenderer {
  constructor(x, y, width, height, color = '#4aff7c') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.currentHP = 1;
    this.targetHP = 1;
    this.displayHP = 1;
    this.flashTimer = 0;
    this.shakeX = 0;
  }

  setHP(current, max) {
    this.targetHP = current / max;
  }

  flash() {
    this.flashTimer = 300;
  }

  update(dt) {
    // 平滑过渡到目标 HP
    const speed = 0.003;
    if (Math.abs(this.displayHP - this.targetHP) > 0.001) {
      this.displayHP += (this.targetHP - this.displayHP) * speed * dt;
    } else {
      this.displayHP = this.targetHP;
    }

    // 闪烁计时器
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.shakeX = (Math.random() - 0.5) * 3;
    } else {
      this.shakeX = 0;
    }
  }

  draw(ctx) {
    const x = this.x + this.shakeX;
    const y = this.y;

    // 背景（暗色底）
    ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
    ctx.fillRect(x - 2, y - 2, this.width + 4, this.height + 4);

    // HP 条（带渐变）
    const fillWidth = this.width * this.displayHP;
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
      
      if (this.flashTimer > 0 && Math.floor(this.flashTimer / 60) % 2 === 0) {
        // 受击闪烁（白色）
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#ffcccc');
      } else if (this.displayHP < 0.25) {
        // 低血量（红色警告）
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#aa2222');
      } else if (this.displayHP < 0.5) {
        // 中等血量（黄色）
        gradient.addColorStop(0, '#ffcc44');
        gradient.addColorStop(1, '#cc8822');
      } else {
        // 正常（绿色）
        gradient.addColorStop(0, '#4aff7c');
        gradient.addColorStop(1, '#2a8f4c');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, fillWidth, this.height);

      // 高光条
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x, y, fillWidth, this.height * 0.35);
    }

    // 边框
    ctx.strokeStyle = '#7c5cbf';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, this.width + 2, this.height + 2);
  }
}

/**
 * 能量条渲染器（五行元素颜色渐变 + 满能量脉冲）
 */
class EnergyBarRenderer {
  constructor(x, y, width, height, element = 'fire') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.element = element;
    this.currentEnergy = 0;
    this.targetEnergy = 0;
    this.displayEnergy = 0;
    this.pulsePhase = 0;

    // 五行元素颜色映射
    this.elementColors = {
      fire: ['#ff4444', '#ff8844'],
      water: ['#4488ff', '#44ccff'],
      wood: ['#44cc44', '#88ff44'],
      earth: ['#cc8844', '#ffcc44'],
      metal: ['#cccccc', '#ffffff']
    };
  }

  setEnergy(current, max) {
    this.targetEnergy = current / max;
  }

  update(dt) {
    const speed = 0.005;
    if (Math.abs(this.displayEnergy - this.targetEnergy) > 0.001) {
      this.displayEnergy += (this.targetEnergy - this.displayEnergy) * speed * dt;
    } else {
      this.displayEnergy = this.targetEnergy;
    }

    // 满能量脉冲
    if (this.displayEnergy >= 0.99) {
      this.pulsePhase += dt * 0.005;
    }
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;

    // 背景
    ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
    ctx.fillRect(x - 2, y - 2, this.width + 4, this.height + 4);

    const fillWidth = this.width * this.displayEnergy;
    if (fillWidth > 0) {
      const colors = this.elementColors[this.element] || this.elementColors.fire;
      const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      // 满能量脉冲发光
      if (this.displayEnergy >= 0.99) {
        const pulse = 0.8 + 0.2 * Math.sin(this.pulsePhase);
        ctx.globalAlpha = pulse;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, fillWidth, this.height);

      // 光泽效果
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(x, y, fillWidth, this.height * 0.4);

      ctx.globalAlpha = 1;

      // 满能量发光
      if (this.displayEnergy >= 0.99) {
        const glowSize = 4 + 2 * Math.sin(this.pulsePhase * 2);
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = glowSize;
        ctx.strokeStyle = colors[1];
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, fillWidth, this.height);
        ctx.shadowBlur = 0;
      }
    }

    // 边框
    ctx.strokeStyle = '#5c4a8f';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, this.width + 2, this.height + 2);
  }
}

// ============ 通用特效 ============

/**
 * 数字弹出动画（伤害数字、治疗数字等）
 */
function animatePopupNumber(x, y, value, color = '#ff4444', isHeal = false) {
  const duration = 800;
  let elapsed = 0;
  const text = (isHeal ? '+' : '-') + Math.abs(value);
  const popup = { x, y, alpha: 1, scale: 0, text, color };

  const id = `popup_${Date.now()}_${Math.random()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = Math.min(elapsed / duration, 1);

      // 上浮
      popup.y = y - 40 * Easing.easeOut(t);
      
      // 缩放
      if (t < 0.2) {
        popup.scale = Easing.easeOutBack(t / 0.2);
      } else {
        popup.scale = 1;
      }
      
      // 淡出
      if (t > 0.6) {
        popup.alpha = 1 - Easing.easeIn((t - 0.6) / 0.4);
      }
      
      if (t >= 1) return true;
      return false;
    }
  });

  return popup;
}

/**
 * 屏幕震动效果
 */
function animateScreenShake(intensity = 5, duration = 300) {
  let elapsed = 0;
  const shake = { offsetX: 0, offsetY: 0 };

  const id = `shake_${Date.now()}`;
  UIAnimations.register({
    id,
    update(dt) {
      elapsed += dt;
      const t = elapsed / duration;
      
      if (t >= 1) {
        shake.offsetX = 0;
        shake.offsetY = 0;
        return true;
      }
      
      const decay = 1 - t;
      shake.offsetX = (Math.random() - 0.5) * 2 * intensity * decay;
      shake.offsetY = (Math.random() - 0.5) * 2 * intensity * decay;
      return false;
    }
  });

  return shake;
}

// 导出
if (typeof window !== 'undefined') {
  window.UIAnimations = UIAnimations;
  window.Easing = Easing;
  window.HPBarRenderer = HPBarRenderer;
  window.EnergyBarRenderer = EnergyBarRenderer;
  window.animateDialogEnter = animateDialogEnter;
  window.animateDialogExit = animateDialogExit;
  window.animateTypewriter = animateTypewriter;
  window.animateButtonPress = animateButtonPress;
  window.animateButtonHover = animateButtonHover;
  window.animatePanelOpen = animatePanelOpen;
  window.animatePanelClose = animatePanelClose;
  window.animatePopupNumber = animatePopupNumber;
  window.animateScreenShake = animateScreenShake;
}
