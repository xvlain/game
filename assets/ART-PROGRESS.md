# 美术制作进度追踪

> 庸人工作室 · 未定之旅 · 美术任务状态
> 最后更新：2026-09-26 01:15
> 本文件与「游戏技术开发与网站落实」任务互通

---

## 一、已交付素材

### 1. 品牌素材
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 佣人工作室 Logo（主版） | `brand/logo/佣人工作室Logo.png` | ✅ 已交付 | 2026-09-12 |
| Logo 180度旋转版 | visual_agent 目录 | ✅ 已生成 | 2026-09-12 |

### 2. 元素图标（2.5D 风格，512×512）
| 元素 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 火 | `battle/elements/fire.png` | ✅ 已交付 | 2026-09-11 |
| 水 | `battle/elements/water.png` | ✅ 已交付 | 2026-09-14 |
| 木 | `battle/elements/wood.png` | ✅ 已交付 | 2026-09-14 |
| 土 | `battle/elements/earth.png` | ✅ 已交付 | 2026-09-15 |
| 金 | `battle/elements/metal.png` | ✅ 已交付 | 2026-09-15 |
| ~~冰~~ | ~~battle/elements/ice.png~~ | ❌ 废弃（元素体系改为五行） | - |
| ~~风~~ | ~~battle/elements/wind.png~~ | ❌ 废弃（元素体系改为五行） | - |
| ~~雷~~ | ~~battle/elements/lightning.png~~ | ❌ 废弃（元素体系改为五行） | - |

### 3. 技能图标交互（CSS/Canvas）
| 项目 | 位置 | 状态 | 日期 |
|------|------|------|------|
| 三角形展开交互动画 | html-gen/技能图标交互-20260913-184450/ | ✅ 已完成 | 2026-09-13 |
| 战斗系统交互预览 | html-gen/战斗系统-20260913-220354/ | ✅ 已完成 | 2026-09-13 |

### 4. 战斗场景背景（1920×1080px）
| 素材 | 文件 | 对应关卡 | 状态 | 日期 |
|------|------|----------|------|------|
| 暗黑奇幻竞技场（默认） | `maps/battle/arena_default.png` | 通用战斗 | ✅ 已交付 | 2026-09-16 |
| 幽暗森林战场 | `maps/battle/forest_dark.png` | 通用战斗 | ✅ 已交付 | 2026-09-16 |
| 幽暗水晶矿洞 | `maps/battle/crystal_cave.png` | 微光矿脉 / 辉光洞穴 | ✅ 已交付 | 2026-09-17 |
| 五行修炼场 | `maps/battle/training_arena.png` | 修炼场（初/中/高级） | ✅ 已交付 | 2026-09-17 |
| 星空深渊 | `maps/battle/star_abyss.png` | 星辉深渊 | ✅ 已交付 | 2026-09-17 |
| 虹彩圣域 | `maps/battle/holy_sanctuary.png` | 虹彩圣域（Boss战） | ✅ 已交付 | 2026-09-17 |
| 混沌虚空战场 | `maps/battle/chaos_void.png` | 每日挑战（混沌之主） | ✅ 已交付 | 2026-09-17 |

### 5. UI 背景素材
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 五行召唤阵（抽卡背景） | `ui/backgrounds/gacha_summon.png` | ✅ 已交付 | 2026-09-16 |

### 6. 战斗特效系统（Canvas 粒子）
| 项目 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 五行元素粒子特效 | `js/battle-effects.js` | ✅ 已交付 | 2026-09-16 |
| 通用战斗特效（受击/暴击/治愈/共鸣） | `js/battle-effects.js` | ✅ 已交付 | 2026-09-16 |

### 7. 道具图标（64×64px，透明背景 PNG）
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 初级经验书 | `ui/icons/exp_book_1.png` | ✅ 已交付 | 2026-09-17 |
| 中级经验书 | `ui/icons/exp_book_2.png` | ✅ 已交付 | 2026-09-17 |
| 高级经验书 | `ui/icons/exp_book_3.png` | ✅ 已交付 | 2026-09-17 |
| 微光之石 | `ui/icons/asc_stone_1.png` | ✅ 已交付 | 2026-09-17 |
| 辉光晶石 | `ui/icons/asc_stone_2.png` | ✅ 已交付 | 2026-09-17 |
| 星辉核心 | `ui/icons/asc_stone_3.png` | ✅ 已交付 | 2026-09-17 |
| 虹彩精华 | `ui/icons/asc_stone_4.png` | ✅ 已交付 | 2026-09-17 |
| 命运之证 | `ui/icons/asc_stone_5.png` | ✅ 已交付 | 2026-09-17 |
| 金币 | `ui/icons/coins.png` | ✅ 已交付 | 2026-09-17 |
| 水晶 | `ui/icons/crystals.png` | ✅ 已交付 | 2026-09-17 |

---

### 8. UI 边框素材（暗色奇幻风格，深紫+金色描边）
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 对话框边框（1200×200px） | `ui/frames/dialog_box.png` | ✅ 已交付 | 2026-09-18 |
| 面板边框（400×500px） | `ui/frames/panel_frame.png` | ✅ 已交付 | 2026-09-18 |
| 按钮边框（240×60px） | `ui/frames/button_frame.png` | ✅ 已交付 | 2026-09-18 |
| HP 血条边框（400×40px） | `ui/frames/hp_bar_frame.png` | ✅ 已交付 | 2026-09-18 |
| 能量条边框（300×30px） | `ui/frames/energy_bar_frame.png` | ✅ 已交付 | 2026-09-18 |

### 9. UI 动画系统（Canvas/JS）
| 项目 | 文件 | 状态 | 日期 |
|------|------|------|------|
| UI 动画管理器 + 缓动函数 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 对话框入场/退场动画 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 打字机文字效果 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 按钮点击/悬停动画 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 面板展开/关闭动画 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| HP 条渲染器（平滑过渡/闪烁/颜色变化） | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 能量条渲染器（五行元素颜色/满能量脉冲） | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 伤害数字弹出动画 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |
| 屏幕震动效果 | `js/ui-animations.js` | ✅ 已交付 | 2026-09-18 |

### 10. 剧情地图背景（1920×1080px）
| 素材 | 文件 | 对应节点 | 状态 | 日期 |
|------|------|----------|------|------|
| 觉醒之地（虚空光柱） | `maps/story/awakening_void.png` | ch1_n1, ch1_n2 | ✅ 已交付 | 2026-09-19 |
| 旅途古道 | `maps/story/ancient_path.png` | ch1_n4, ch1_end | ✅ 已交付 | 2026-09-19 |
| 古老遗迹（神殿废墟） | `maps/story/ancient_ruins.png` | ch1_n5a | ✅ 已交付 | 2026-09-19 |
| 幽暗森林深处 | `maps/story/dark_forest.png` | ch1_n5b | ✅ 已交付 | 2026-09-19 |

### 11. 抽卡动画素材
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 五行召唤阵（抽卡动画背景） | `ui/backgrounds/gacha_animation_bg.png` | ✅ 已交付 | 2026-09-19 |

### 11b. 场景画面背景（1920×1080px）
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 标题画面背景（奇幻星空远景） | `ui/backgrounds/title_bg.png` | ✅ 已交付 | 2026-09-26 |
| 战斗胜利结算背景（金色光芒） | `ui/backgrounds/victory_splash.png` | ✅ 已交付 | 2026-09-26 |
| 战斗败北结算背景（暗红悲壮） | `ui/backgrounds/defeat_splash.png` | ✅ 已交付 | 2026-09-26 |

### 12. 战斗特效 Sprite 素材（512×512px，透明背景 PNG）
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 火元素攻击特效 | `battle/effects/fire_attack.png` | ✅ 已交付 | 2026-09-20 |
| 水元素攻击特效 | `battle/effects/water_attack.png` | ✅ 已交付 | 2026-09-20 |
| 木元素攻击特效 | `battle/effects/wood_attack.png` | ✅ 已交付 | 2026-09-20 |
| 土元素攻击特效 | `battle/effects/earth_attack.png` | ✅ 已交付 | 2026-09-20 |
| 金元素攻击特效 | `battle/effects/metal_attack.png` | ✅ 已交付 | 2026-09-20 |
| 火元素战技特效 | `battle/effects/fire_skill.png` | ✅ 已交付 | 2026-09-21 |
| 水元素战技特效 | `battle/effects/water_skill.png` | ✅ 已交付 | 2026-09-21 |
| 木元素战技特效 | `battle/effects/wood_skill.png` | ✅ 已交付 | 2026-09-21 |
| 土元素战技特效 | `battle/effects/earth_skill.png` | ✅ 已交付 | 2026-09-21 |
| 金元素战技特效 | `battle/effects/metal_skill.png` | ✅ 已交付 | 2026-09-21 |
| 火元素大招特效 | `battle/effects/fire_ultimate.png` | ✅ 已交付 | 2026-09-21 |
| 水元素大招特效 | `battle/effects/water_ultimate.png` | ✅ 已交付 | 2026-09-21 |
| 木元素大招特效 | `battle/effects/wood_ultimate.png` | ✅ 已交付 | 2026-09-21 |
| 土元素大招特效 | `battle/effects/earth_ultimate.png` | ✅ 已交付 | 2026-09-21 |
| 金元素大招特效 | `battle/effects/metal_ultimate.png` | ✅ 已交付 | 2026-09-21 |
| 暴击特效 | `battle/effects/critical.png` | ✅ 已交付 | 2026-09-21 |
| 治愈特效 | `battle/effects/heal.png` | ✅ 已交付 | 2026-09-21 |
| 共鸣触发特效 | `battle/effects/resonance.png` | ✅ 已交付 | 2026-09-21 |

### 13. 角色名标签框（300×80px，透明背景 PNG）
| 素材 | 文件 | 状态 | 日期 |
|------|------|------|------|
| 对话框角色名标签框 | `ui/frames/name_label_frame.png` | ✅ 已交付 | 2026-09-20 |

### 14. 角色立绘（800×1200px，透明背景 PNG）
| 角色 | 文件 | 元素 | 定位 | 状态 | 日期 |
|------|------|------|------|------|------|
| 织星（银发引导少女） | `characters/portraits/zhixing.png` | — | 剧情引导 NPC | ✅ 已交付 | 2026-09-22 |
| 影（神秘旅者） | `characters/portraits/ying.png` | — | 剧情角色 / 可选 | ✅ 已交付 | 2026-09-22 |
| 示例·战士（火属性） | `characters/portraits/warrior_01.png` | 火 | 输出 | ✅ 已交付 | 2026-09-22 |
| 示例·法师（水属性） | `characters/portraits/mage_01.png` | 水 | 输出 | ✅ 已交付 | 2026-09-22 |
| 示例·治疗（木属性） | `characters/portraits/healer_01.png` | 木 | 治疗 | ✅ 已交付 | 2026-09-22 |
| 示例·守护（土属性） | `characters/portraits/tank_01.png` | 土 | 坦克 | ✅ 已交付 | 2026-09-22 |

### 15. Q 版角色动画框架（JS）
| 项目 | 文件 | 状态 | 日期 |
|------|------|------|------|
| ChibiSprite 类（单角色动画控制器） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |
| ChibiManager（多角色管理器） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |
| PortraitRenderer（立绘渲染器+呼吸动画+元素光效） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |
| CharIconRenderer（头像图标渲染器） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |
| BattleFormation（战斗阵型布局） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |
| 动画状态机（idle/attack/skill/ultimate/hit/victory/defeat） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |
| 占位符渲染（素材不可用时自动降级） | `js/chibi-animator.js` | ✅ 已交付 | 2026-09-22 |

### 16. 角色头像图标（128×128px，圆形+元素色边框，透明背景 PNG）
| 角色 | 文件 | 元素色 | 状态 | 日期 |
|------|------|--------|------|------|
| 织星 | `characters/icons/zhixing.png` | #9B59B6 紫 | ✅ 已交付 | 2026-09-23 |
| 影 | `characters/icons/ying.png` | #6C3483 暗紫 | ✅ 已交付 | 2026-09-23 |
| 战士 | `characters/icons/warrior_01.png` | #E74C3C 红（火） | ✅ 已交付 | 2026-09-23 |
| 法师 | `characters/icons/mage_01.png` | #3498DB 蓝（水） | ✅ 已交付 | 2026-09-23 |
| 治疗 | `characters/icons/healer_01.png` | #27AE60 绿（木） | ✅ 已交付 | 2026-09-23 |
| 守护 | `characters/icons/tank_01.png` | #D4A017 金（土） | ✅ 已交付 | 2026-09-23 |

### 17. Q 版 idle 待机序列帧（128×128px，透明背景 PNG）
| 角色 | 文件 | 帧数 | 状态 | 日期 |
|------|------|------|------|------|
| 织星 idle_00 | `characters/chibi/zhixing/idle_00.png` | 帧1（下沉） | ✅ 已交付 | 2026-09-23 |
| 织星 idle_01 | `characters/chibi/zhixing/idle_01.png` | 帧2（上浮） | ✅ 已交付 | 2026-09-23 |
| 影 idle_00 | `characters/chibi/ying/idle_00.png` | 帧1（下沉） | ✅ 已交付 | 2026-09-23 |
| 影 idle_01 | `characters/chibi/ying/idle_01.png` | 帧2（上浮） | ✅ 已交付 | 2026-09-23 |
| 战士 idle_00 | `characters/chibi/warrior_01/idle_00.png` | 帧1（持剑下沉） | ✅ 已交付 | 2026-09-23 |
| 战士 idle_01 | `characters/chibi/warrior_01/idle_01.png` | 帧2（上浮） | ✅ 已交付 | 2026-09-23 |
| 法师 idle_00 | `characters/chibi/mage_01/idle_00.png` | 帧1（持杖下沉） | ✅ 已交付 | 2026-09-23 |
| 法师 idle_01 | `characters/chibi/mage_01/idle_01.png` | 帧2（上浮） | ✅ 已交付 | 2026-09-23 |
| 治疗 idle_00 | `characters/chibi/healer_01/idle_00.png` | 帧1（持杖下沉） | ✅ 已交付 | 2026-09-23 |
| 治疗 idle_01 | `characters/chibi/healer_01/idle_01.png` | 帧2（上浮） | ✅ 已交付 | 2026-09-23 |
| 守护 idle_00 | `characters/chibi/tank_01/idle_00.png` | 帧1（持盾下沉） | ✅ 已交付 | 2026-09-23 |
| 守护 idle_01 | `characters/chibi/tank_01/idle_01.png` | 帧2（上浮） | ✅ 已交付 | 2026-09-23 |

### 18. Q 版 attack 攻击序列帧（128×128px，透明背景 PNG）
| 角色 | 帧数 | 状态 | 日期 |
|------|------|------|------|
| 织星 attack_00~03 | 4帧（蓄力/突进/命中/收招） | ✅ 已交付 | 2026-09-24 |
| 影 attack_00~03 | 4帧（蓄力/突进/命中/收招） | ✅ 已交付 | 2026-09-24 |
| 战士 attack_00~03 | 4帧（蓄力/下劈/命中/收招） | ✅ 已交付 | 2026-09-24 |
| 法师 attack_00~03 | 4帧（蓄力/施法/命中/收招） | ✅ 已交付 | 2026-09-24 |
| 治疗 attack_00~03 | 4帧（蓄力/施法/命中/收招） | ✅ 已交付 | 2026-09-24 |
| 守护 attack_00~03 | 4帧（蓄力/盾击/命中/收招） | ✅ 已交付 | 2026-09-24 |

### 19. Q 版 skill 战技序列帧（128×128px，透明背景 PNG）
| 角色 | 帧数 | 状态 | 日期 |
|------|------|------|------|
| 织星 skill_00~04 | 5帧（蓄力/展开/释放/命中/收招） | ✅ 已交付 | 2026-09-24 |
| 影 skill_00~04 | 5帧（蓄力/残影/背刺/连斩/收招） | ✅ 已交付 | 2026-09-24 |
| 战士 skill_00~04 | 5帧（蓄力/横扫/飞行/爆炸/收招） | ✅ 已交付 | 2026-09-24 |
| 法师 skill_00~04 | 5帧（蓄力/施法/推进/冰爆/收招） | ✅ 已交付 | 2026-09-24 |
| 治疗 skill_00~04 | 5帧（蓄力/施法/绽放/脉冲/收招） | ✅ 已交付 | 2026-09-24 |
| 守护 skill_00~04 | 5帧（蓄力/盾击/升起/爆裂/收招） | ✅ 已交付 | 2026-09-24 |

### 20. Q 版 ultimate 大招序列帧（128×128px，透明背景 PNG）
| 角色 | 帧数 | 状态 | 日期 |
|------|------|------|------|
| 织星 ultimate_00~05 | 6帧（召唤/展开/冲天/星爆/回收/收招） | ✅ 已交付 | 2026-09-24 |
| 影 ultimate_00~05 | 6帧（暗影爆发/分裂/交叉/斩击/合一/收招） | ✅ 已交付 | 2026-09-24 |
| 战士 ultimate_00~05 | 6帧（蓄力/旋涡/跃起/劈砍/爆炸/收招） | ✅ 已交付 | 2026-09-24 |
| 法师 ultimate_00~05 | 6帧（蓄力/冰龙/俯冲/冰爆/消散/收招） | ✅ 已交付 | 2026-09-24 |
| 治疗 ultimate_00~05 | 6帧（蓄力/巨树/开花/飘散/消散/收招） | ✅ 已交付 | 2026-09-24 |
| 守护 ultimate_00~05 | 6帧（蓄力/盾击/喷发/冲击波/碎片/收招） | ✅ 已交付 | 2026-09-24 |

### 22. Q 版 victory 胜利序列帧（128×128px，透明背景 PNG）
| 角色 | 帧数 | 状态 | 日期 |
|------|------|------|------|
| 织星 victory_00~02 | 3帧（捧星盘/高举跳跃/交握微笑） | ✅ 已交付 | 2026-09-25 |
| 影 victory_00~02 | 3帧（收刀/交叉冷酷/半转身回望） | ✅ 已交付 | 2026-09-25 |
| 战士 victory_00~02 | 3帧（扛剑举拳/举剑呐喊/插剑叉腰） | ✅ 已交付 | 2026-09-25 |
| 法师 victory_00~02 | 3帧（法杖点地/举杖冰晶/冰面站立） | ✅ 已交付 | 2026-09-25 |
| 治疗 victory_00~02 | 3帧（法杖举绿光/触碰花瓣/站立花瓣） | ✅ 已交付 | 2026-09-25 |
| 守护 victory_00~02 | 3帧（盾牌拄地/举盾发光/砸盾冲击） | ✅ 已交付 | 2026-09-25 |

### 23. Q 版 defeat 败北序列帧（128×128px，透明背景 PNG）
| 角色 | 帧数 | 状态 | 日期 |
|------|------|------|------|
| 织星 defeat_00~01 | 2帧（星盘滑落/跪地星盘碎裂） | ✅ 已交付 | 2026-09-25 |
| 影 defeat_00~01 | 2帧（刀飞斗篷散/半跪抓刀） | ✅ 已交付 | 2026-09-25 |
| 战士 defeat_00~01 | 2帧（击退剑飞/跪地剑灭冒烟） | ✅ 已交付 | 2026-09-25 |
| 法师 defeat_00~01 | 2帧（法杖断裂/跪地冰晶融化） | ✅ 已交付 | 2026-09-25 |
| 治疗 defeat_00~01 | 2帧（藤蔓枯萎/跪坐凋零花朵） | ✅ 已交付 | 2026-09-25 |
| 守护 defeat_00~01 | 2帧（盾裂后仰/跪地碎盾撑地） | ✅ 已交付 | 2026-09-25 |

### 21. Q 版 hit 受击序列帧（128×128px，透明背景 PNG）
| 角色 | 帧数 | 状态 | 日期 |
|------|------|------|------|
| 织星 hit_00~01 | 2帧（受击/恢复） | ✅ 已交付 | 2026-09-24 |
| 影 hit_00~01 | 2帧（受击/恢复） | ✅ 已交付 | 2026-09-24 |
| 战士 hit_00~01 | 2帧（受击/恢复） | ✅ 已交付 | 2026-09-24 |
| 法师 hit_00~01 | 2帧（受击/恢复） | ✅ 已交付 | 2026-09-24 |
| 治疗 hit_00~01 | 2帧（受击/恢复） | ✅ 已交付 | 2026-09-24 |
| 守护 hit_00~01 | 2帧（受击/恢复） | ✅ 已交付 | 2026-09-24 |

---

## 二、待制作素材（按优先级排序）

### P0 - 阻塞游戏体验（需角色设定后才能开始）

#### 角色立绘（800×1200px，透明背景 PNG）
- [x] ~~初始 6 角色立绘~~ → 已完成 zhixing/ying/warrior_01/mage_01/healer_01/tank_01（2026-09-22）
- [ ] 后续新角色立绘（待元首/团队提供角色设定）
- 路径规范：`characters/portraits/<角色id>.png`

#### 角色头像图标（小尺寸）
- [x] ~~每个角色一个头像图标（6个基础角色）~~ → 已完成 zhixing/ying/warrior_01/mage_01/healer_01/tank_01（2026-09-23）
- 路径规范：`characters/icons/<角色id>.png`

#### Q版战斗序列帧（128×128px 每帧）
- [x] 风格参考：《重返未来1999》战斗中略微Q版
- [x] 动画框架已就绪（`js/chibi-animator.js` v1.0.0），支持 idle/attack/skill/ultimate/hit/victory/defeat 7 种状态
- 每角色需要：
  - ~~idle（待机 2帧）~~ → 已完成 6 角色 × 2 帧（2026-09-23）
  - ~~attack（普攻 4帧）~~ → 已完成 6 角色 × 4 帧（2026-09-24）
  - ~~skill（战技 5帧）~~ → 已完成 6 角色 × 5 帧（2026-09-24）
  - ~~ultimate（大招 6帧）~~ → 已完成 6 角色 × 6 帧（2026-09-24）
  - ~~hit（受击 2帧）~~ → 已完成 6 角色 × 2 帧（2026-09-24）
  - ~~victory（胜利 3帧）~~ → 已完成 6 角色 × 3 帧（2026-09-25）
  - ~~defeat（败北 2帧）~~ → 已完成 6 角色 × 2 帧（2026-09-25）
- 路径规范：`characters/chibi/<角色id>/<动作>_<帧号>.png`
- 依赖：立绘已就绪，Q 版序列帧可独立制作

### P1 - 提升沉浸感

#### 战斗场景背景（1920×1080px）
- [x] ~~通用战斗背景（草地/森林/城镇等）~~ → 已有 arena_default + forest_dark + 5个新增关卡背景
- [ ] 特殊关卡背景（Boss 战等）→ 已有 chaos_void + holy_sanctuary，后续可按需追加

#### 剧情地图背景
- [x] ~~觉醒之地（序章开场）~~ → 已完成 awakening_void.png
- [x] ~~旅途古道（节点过渡）~~ → 已完成 ancient_path.png
- [x] ~~古老遗迹（遗迹探索路线）~~ → 已完成 ancient_ruins.png
- [x] ~~幽暗森林深处（森林路线）~~ → 已完成 dark_forest.png
- [ ] 后续章节区域背景（待元首提供新章节地图设计）
- 路径规范：`maps/story/<区域名>.png`

#### 战斗特效序列帧
- [x] ~~各元素攻击特效（火/水/木/土/金）~~ → 已完成 5 个攻击命中 sprite
- [x] ~~各元素战技特效（skill level）~~ → 已完成 5 个战技 sprite（2026-09-21）
- [x] ~~各元素大招特效（ultimate level）~~ → 已完成 5 个大招 sprite（2026-09-21）
- [x] ~~暴击特效~~ → 已完成暴击专用 sprite（2026-09-21）
- [x] ~~治愈特效~~ → 已完成治愈专用 sprite（2026-09-21）
- [x] ~~共鸣触发特效~~ → 已完成共鸣触发专用 sprite（2026-09-21）
- 路径规范：`battle/effects/<元素>_<等级>.png`

### P2 - UI 美化

#### UI 素材
- [x] ~~道具图标~~ → 已完成 10 个基础道具图标
- [x] ~~按钮/面板边框~~ → 已完成 5 个 UI 边框素材（对话框/面板/按钮/HP条/能量条）
- [x] ~~HP/能量条渲染器~~ → 已完成 Canvas 渲染器（带平滑过渡、闪烁、五行颜色）
- [x] ~~抽卡动画素材~~ → 已完成 gacha_animation_bg.png（五行召唤阵背景）
- [x] ~~对话框内角色名标签框~~ → 已完成 name_label_frame.png
- 路径规范：`ui/<类别>/<素材名>.png`

---

## 三、阻塞项

| 阻塞 | 原因 | 需要谁提供 | 预计解除时间 |
|------|------|-----------|-------------|
| 后续新角色立绘 | 缺少角色设定（名字/元素/外貌） | 元首/团队 | 待提供 |
| 剧情地图背景（后续章节） | 缺少地图设计 | 元首 | 待提供 |

> 注：初始 6 角色立绘已完成（织星、影、战士、法师、治疗、守护）。
> 角色头像图标 6 个已完成（2026-09-23）。
> Q版 idle 待机帧 6 角色 × 2 帧已完成（2026-09-23）。
> Q版 attack 攻击帧 6 角色 × 4 帧已完成（2026-09-24）。
> Q版 skill 战技帧 6 角色 × 5 帧已完成（2026-09-24）。
> Q版 ultimate 大招帧 6 角色 × 6 帧已完成（2026-09-24）。
> Q版 hit 受击帧 6 角色 × 2 帧已完成（2026-09-24）。
> Q版 victory 胜利帧 6 角色 × 3 帧已完成（2026-09-25）。
> Q版 defeat 败北帧 6 角色 × 2 帧已完成（2026-09-25）。
> 动画状态机 7 种状态全部齐备：idle/attack/skill/ultimate/hit/victory/defeat。
> 战斗场景背景已基本完成（7张），覆盖通用战斗、修炼场、矿洞、深渊、圣域、混沌虚空等主要场景。
> 剧情地图背景已完成 4 张，覆盖序章全部节点。

---

## 四、风格规范备忘

- **立绘风格**：《重返未来1999》正常二次元，精致线条+柔和色彩
- **战斗Q版**：《重返未来1999》战斗中的略微Q版形象（非大头Q版）
- **元素图标**：2.5D 立体风格，有厚度、光影、金属质感边框
- **UI 风格**：待定（建议与立绘风格统一，偏暗色调+奇幻感）
- **整体色调**：参考游戏代码中的暗紫/深蓝基调（#0d0d1f ~ #1a1030）
- **道具图标**：64×64px 透明背景，扁平风格，游戏内暗色背景下高对比度

---

## 五、与技术任务的接口约定

技术侧在 `ui.js` / `engine.js` 中按以下命名规则加载素材：

```
立绘：assets/characters/portraits/<角色id>.png  ← 已完成（6张：zhixing/ying/warrior_01/mage_01/healer_01/tank_01）
Q版：assets/characters/chibi/<角色id>/<动作>_<帧号>.png  ← 全部 7 种状态已完成（6角色×19帧=114帧 + victory 18帧 + defeat 12帧 = 144帧）
头像：assets/characters/icons/<角色id>.png       ← 已完成（6张）
特效：assets/battle/effects/<特效名>.png       ← 已完成（18张sprite + 代码粒子）
  - 攻击：assets/battle/effects/<元素>_attack.png   ← 已完成（5张）
  - 战技：assets/battle/effects/<元素>_skill.png     ← 已完成（5张）
  - 大招：assets/battle/effects/<元素>_ultimate.png  ← 已完成（5张）
  - 通用：assets/battle/effects/{critical,heal,resonance}.png ← 已完成（3张）
元素：assets/battle/elements/<元素id>.png    ← 已完成
Logo：assets/brand/logo/佣人工作室Logo.png   ← 已完成
战斗背景：assets/maps/battle/<场景名>.png     ← 已完成（7张）
剧情背景：assets/maps/story/<区域名>.png     ← 已完成（4张，覆盖序章）
道具图标：assets/ui/icons/<道具id>.png        ← 已完成（10个）
UI边框：assets/ui/frames/<素材名>.png         ← 已完成（6个，含名标签框）
UI动画：js/ui-animations.js                   ← 已完成（动画管理器+渲染器）
抽卡动画背景：assets/ui/backgrounds/gacha_animation_bg.png ← 已完成
```

美术侧只需按规范产出文件放入对应目录，技术侧自动加载替换占位符。

---

## 五、本次执行记录（2026-09-26 01:15）

### 新增素材（共 3 张场景画面背景）
1. **标题画面背景 ×1**（1920×1080px）：
   - `ui/backgrounds/title_bg.png`：暗色调奇幻世界远景，深紫色与深蓝色天空，浮空建筑与发光水晶柱，星辰和星云，金色符文粒子
   - 用于 TitleScene 标题画面底层背景，上方叠加 Logo 和按钮

2. **战斗胜利结算背景 ×1**（1920×1080px）：
   - `ui/backgrounds/victory_splash.png`：金色光芒洒落，金色粒子和星辰碎片飘浮，暖金到深紫渐变天空，中央光柱衬托胜利文字
   - 用于 BattleScene 战斗胜利结算画面

3. **战斗败北结算背景 ×1**（1920×1080px）：
   - `ui/backgrounds/defeat_splash.png`：暗红色与深灰色调，乌云和裂纹天空，破碎武器剪影，暗红光芒，灰烬粒子
   - 用于 BattleScene 战斗败北结算画面

### 代码更新（v0.16.0）
1. **ui.js 预加载增强**：新增 `title_bg.png`、`victory_splash.png`、`defeat_splash.png` 三张场景背景预加载
2. **TitleScene.render() 升级**：标题画面从纯渐变+粒子升级为背景图+粒子叠加+暗色遮罩，素材不可用时自动降级到渐变
3. **BattleScene._renderResult() 全面升级**：
   - 胜利/败北使用独立背景图（victory_splash / defeat_splash）
   - 文字入场动画（0.8s 淡入 + 轻微浮动）
   - 文字光晕效果（阴影脉冲）
   - 副标题延迟入场（"命运的齿轮继续转动" / "暂时的退却，为了更好的归来"）
   - 按钮延迟显示（1s 后淡入）
   - 素材不可用时降级到半透明黑遮罩
4. **sw.js v0.16.0**：缓存版本更新
5. **版本号更新**：v0.15.0 → v0.16.0

### 素材统计
- 本次新增：3 张场景画面背景
- 累计 UI 背景素材：5 张（gacha_summon + gacha_animation_bg + title_bg + victory_splash + defeat_splash）

### 下一步计划
- 后续新角色立绘与 Q 版帧（待元首提供设定）
- 后续章节区域背景（待元首提供新章节地图设计）
- 加载画面（Loading Screen）背景图
- 角色展示/详情页背景

---

## 六、上次执行记录（2026-09-25 01:50）

### 新增素材（共 30 张 Q 版 victory/defeat 序列帧）
1. **Q版 victory 胜利序列帧 ×18**（128×128px，透明背景 PNG，6 角色 × 3 帧）：
   - 每角色 3 帧：起手 → 庆祝高潮 → 定格胜利姿势（5fps 循环播放）
   - 织星：捧起星盘 → 高举跳跃 → 交握胸前微笑
   - 影：收刀入鞘 → 双臂交叉冷酷 → 半转身回望
   - 战士：扛剑举拳 → 举剑呐喊 → 插剑叉腰
   - 法师：法杖点地水花 → 举杖冰晶旋转 → 冰面优雅站立
   - 治疗：法杖绿光 → 触碰花瓣 → 站立巨大花瓣
   - 守护：盾牌拄地 → 举盾金光 → 砸盾冲击波

2. **Q版 defeat 败北序列帧 ×12**（128×128px，透明背景 PNG，6 角色 × 2 帧）：
   - 每角色 2 帧：受击后仰 → 倒地/跪地（4fps 单次播放）
   - 织星：星盘滑落 → 跪地星盘碎裂
   - 影：刀飞斗篷散 → 半跪伸抓短刀
   - 战士：击退剑飞裂甲 → 跪地剑灭冒烟
   - 法师：法杖断裂 → 跪地冰晶融化
   - 治疗：藤蔓枯萎断裂 → 跪坐凋零花朵
   - 守护：盾裂后仰 → 跪地碎盾撑地

### 素材统计
- 本次新增：30 张 Q 版 victory/defeat 序列帧
- 累计 Q 版帧：144 张（idle 12 + attack 24 + skill 30 + ultimate 36 + hit 12 + victory 18 + defeat 12）
- 动画状态机全部 7 种状态素材齐备（idle/attack/skill/ultimate/hit/victory/defeat）
- 全部 128×128px RGBA PNG，透明背景

### 下一步计划
- 后续新角色立绘与 Q 版帧（待元首提供设定）
- 将 Q 版 victory/defeat 帧接入 battle.js 战斗渲染流程（胜利/失败结算画面）
- 后续章节区域背景（待元首提供新章节地图设计）

---

## 六、上次执行记录（2026-09-25 01:10）

### 技术集成（v0.15.0）
1. **Q版序列帧完整接入战斗渲染**：`ui.js` BattleScene 全面升级
   - `_renderParty()` 从纯色占位面板替换为 `characterArt.drawChibi()` 实际 Sprite 渲染
   - 6 角色 × 5 种战斗动作（idle/attack/skill/ultimate/hit）= 102 帧全面接入
   - 角色死亡时自动切换 defeat 状态（半透明 + 倒下占位动画）
   - 当前行动角色蓝色光圈高亮标记
2. **Q版动画状态机**：新增 `_chibiStates` 追踪系统
   - `update(dt)` 每帧更新动画计时，动画播放完毕自动回归 idle
   - `_triggerChibiAnimForAction()` 根据战斗行动自动触发动画：
     - 攻击者播放 attack/skill/ultimate（根据技能类型自动选择）
     - 被攻击目标播放 hit
   - 战斗胜利时全体存活角色播放 victory 动画
   - 战斗败北时全体角色播放 defeat 动画
3. **Canvas 渲染优化**：坐标使用 `Math.floor()` 取整避免子像素抗锯齿开销
4. **character-art.js 更新**：`defaultAnims` 新增 `defeat: { frames: 2, fps: 4, loop: false }`
5. **预加载增强**：启动时预加载全部 6 角色头像图标 + idle 帧 + 全动作帧（attack/skill/ultimate/hit）
6. **Service Worker v0.15.0**：缓存版本更新

### 阻塞项更新
- Q版 victory/defeat 序列帧素材尚未产出（代码已就绪，使用占位符降级渲染）
- 美术任务需产出：6 角色 × victory 3帧 + defeat 2帧 = 30 张
  - 路径规范：`assets/characters/chibi/<角色id>/victory_00.png` ~ `victory_02.png`
  - 路径规范：`assets/characters/chibi/<角色id>/defeat_00.png` ~ `defeat_01.png`
  - character-art.js 的 `defaultAnims` 已定义 victory: 6帧 和 defeat: 2帧，美术可按此帧数产出或调整

---

## 六、本次执行记录（2026-09-24 01:10）

### 新增素材（共 102 张 Q 版战斗序列帧）
1. **Q版 attack 攻击序列帧 ×24**（128×128px，透明背景 PNG，6 角色 × 4 帧）：
   - 每角色 4 帧：蓄力起手 → 突进攻击 → 命中爆发 → 收招回位
   - 织星：星盘蓄力 → 星盘突推 → 星光爆发 → 星盘归身
   - 影：蹲身蓄力 → 突进斩击 → 暗影扩散 → 短刀归鞘
   - 战士：举剑蓄力 → 猛力下劈 → 火焰冲击 → 拔剑回位
   - 法师：法杖举高 → 水柱冰晶 → 水花爆裂 → 法杖归位
   - 治疗：法杖蓄力 → 藤蔓鞭击 → 能量缠绕 → 藤蔓收回
   - 守护：持盾前冲 → 盾击撞击 → 冲击波扩散 → 防御回位

2. **Q版 skill 战技序列帧 ×30**（128×128px，透明背景 PNG，6 角色 × 5 帧）：
   - 每角色 5 帧：蓄力 → 展开 → 释放 → 命中 → 收招
   - 织星：星盘蓄力 → 星图法阵 → 星光射线 → 紫色星爆 → 消散
   - 影：暗影环绕 → 残影消失 → 暗影背刺 → 连斩刀光 → 恢复实体
   - 战士：火焰旋涡 → 烈焰斩波 → 斩波飞行 → 烈焰爆炸 → 火焰熄灭
   - 法师：水球凝聚 → 冰浪释放 → 冰晶飞舞 → 寒冰爆裂 → 冰霜消散
   - 治疗：生命能量 → 治愈光环 → 花瓣飞舞 → 绿色脉冲 → 花草消散
   - 守护：岩石隆起 → 地震波扩散 → 岩柱升起 → 岩柱爆裂 → 盾牌恢复

3. **Q版 ultimate 大招序列帧 ×36**（128×128px，透明背景 PNG，6 角色 × 6 帧）：
   - 每角色 6 帧：起手 → 蓄力强化 → 释放 → 全屏爆发 → 消散 → 收招
   - 织星：召唤星盘 → 星图旋转 → 能量冲天 → 全屏星爆 → 能量回收 → 归位
   - 影：暗影爆发 → 分裂分身 → 高速交叉 → 全体斩击 → 分身合一 → 恢复
   - 战士：全身火焰 → 火柱旋涡 → 跳起空中 → 下落劈砍 → 全屏爆炸 → 拄地余烬
   - 法师：水球凝聚 → 冰龙盘旋 → 冰龙俯冲 → 全屏冰爆 → 冰晶碎裂 → 收招
   - 治疗：能量脉动 → 巨树生长 → 开花释放 → 花粉飘散 → 巨树消散 → 拔出法杖
   - 守护：金色能量 → 地裂延伸 → 岩柱喷发 → 金色冲击波 → 碎片尘埃 → 盾牌拄地

4. **Q版 hit 受击序列帧 ×12**（128×128px，透明背景 PNG，6 角色 × 2 帧）：
   - 每角色 2 帧：受击后仰 → 恢复站姿

### 代码更新
1. **`js/chibi-animator.js` bug 修复**：帧索引从 1-based 改为 0-based（`attack_01` → `attack_00`），与实际文件命名一致
2. **`js/character-art.js` 更新**：
   - `defaultChars` 列表更新为 `['zhixing', 'ying', 'warrior_01', 'mage_01', 'healer_01', 'tank_01']`
   - `defaultAnims` 帧数配置与实际素材对齐（idle:2, attack:4, skill:5, ultimate:6, hit:2）
   - 移除已废弃的 `hurt`/`death` 配置，改为 `hit`/`ultimate`

### 素材统计
- 本次新增：102 张 Q 版战斗序列帧
- 累计 Q 版帧：114 张（idle 12 + attack 24 + skill 30 + ultimate 36 + hit 12）
- 全部 128×128px RGBA PNG，透明背景

### 下一步计划
- 制作 Q版 victory 胜利序列帧（6 角色 × 3 帧）
- 制作 Q版 defeat 败北序列帧（6 角色 × 2 帧）
- 后续新角色立绘与 Q 版帧（待元首提供设定）
- 将 Q 版帧完整接入 battle.js 战斗渲染流程

---

## 六、本次执行记录（2026-09-23 01:25）

### 新增素材（共 18 张）
1. **角色头像图标 ×6**（128×128px，圆形裁剪+元素色边框，透明背景 PNG）：
   - `characters/icons/zhixing.png`：织星——紫色边框
   - `characters/icons/ying.png`：影——暗紫边框
   - `characters/icons/warrior_01.png`：战士——红色边框（火）
   - `characters/icons/mage_01.png`：法师——蓝色边框（水）
   - `characters/icons/healer_01.png`：治疗——绿色边框（木）
   - `characters/icons/tank_01.png`：守护——金色边框（土）
   - 制作方式：基于已有立绘裁剪头部区域 → 缩放至 128×128 → 圆形遮罩 + 元素色描边 + 顶部高光

2. **Q 版 idle 待机序列帧 ×12**（128×128px，透明背景 PNG，6 角色 × 2 帧）：
   - `characters/chibi/zhixing/idle_00.png` ~ `idle_01.png`：织星呼吸感待机
   - `characters/chibi/ying/idle_00.png` ~ `idle_01.png`：影呼吸感待机
   - `characters/chibi/warrior_01/idle_00.png` ~ `idle_01.png`：战士持剑呼吸感待机
   - `characters/chibi/mage_01/idle_00.png` ~ `idle_01.png`：法师持杖呼吸感待机
   - `characters/chibi/healer_01/idle_00.png` ~ `idle_01.png`：治疗持杖呼吸感待机
   - `characters/chibi/tank_01/idle_00.png` ~ `idle_01.png`：守护持盾呼吸感待机
   - 风格：像素艺术（Pixel Art），略 Q 版比例（参考《重返未来1999》战斗小人），线条清晰
   - 帧 1（idle_00）：自然站姿微微下沉（吸气前奏）
   - 帧 2（idle_01）：站姿微微上浮（呼气状态）
   - 配合 chibi-animator.js 的 idle 配置（3fps 循环播放）即可实现呼吸待机动画

### 下一步计划
- 制作 Q 版 attack 攻击序列帧（6 角色 × 4 帧）
- 制作 Q 版 skill 战技序列帧（6 角色 × 5 帧）
- 制作 Q 版 hit 受击序列帧（6 角色 × 2 帧）
- 将 Q 版 idle 帧接入 battle.js 战斗渲染（chibi-animator.js 框架已就绪）
- 后续新角色立绘（待元首提供设定）

---

## 七、本次执行记录（2026-09-22 01:17）

### 新增素材（共 6 张立绘 + 1 个动画框架）
1. **角色立绘 ×6**（800×1200px，透明背景 PNG）：
   - `characters/portraits/zhixing.png`：织星——银发星盘少女，白紫法袍，星光发饰
   - `characters/portraits/ying.png`：影——深色斗篷神秘旅者，黑紫短发，暗色短刀
   - `characters/portraits/warrior_01.png`：火属性战士——红发红甲，火焰大剑
   - `characters/portraits/mage_01.png`：水属性法师——蓝发蓝袍，水晶法杖
   - `characters/portraits/healer_01.png`：木属性治疗师——浅绿发，白绿修女袍，藤蔓法杖
   - `characters/portraits/tank_01.png`：土属性守护者——棕发重甲，巨型塔盾

### 代码更新
1. **新增 `js/chibi-animator.js` v1.0.0**：Q 版角色动画系统
   - `ChibiSprite` 类：单角色动画控制器，支持 7 种状态（idle/attack/skill/ultimate/hit/victory/defeat），帧动画播放、优先级管理、自动回退到 idle
   - `ChibiManager`：多角色管理器，统一 update/render
   - `PortraitRenderer`：立绘渲染器，支持呼吸动画、元素光效、翻转、剪影占位符
   - `CharIconRenderer`：头像图标渲染器，圆形裁剪+元素色边框，降级到 Renderer.drawAvatar
   - `BattleFormation`：战斗阵型布局数据（玩家4槽/敌方4槽位置坐标）
   - 攻击位移、受击后退+白闪+震动等战斗动画效果
   - 素材不可用时自动降级为占位符渲染，不阻断游戏运行
2. **index.html 更新**：在 battle-effects.js 后加载 chibi-animator.js

### 下一步计划
- 制作 Q 版战斗序列帧（基于已有立绘，按 chibi-animator.js 规范的帧数和尺寸生成）
- 制作角色头像图标（6个基础角色）
- 将立绘接入剧情对话场景（PortraitRenderer 替换当前剪影占位）
- 后续新角色立绘（待元首提供设定）

---

## 七、本次执行记录（2026-09-21 01:20）

### 新增素材（共 13 张）
1. **五行战技特效 Sprite ×5**：`battle/effects/<element>_skill.png`（螺旋火焰柱 / 高压水柱冲击波 / 巨型藤蔓破地 / 巨石升起撞击 / 金色利刃光束斩击）
2. **五行大招特效 Sprite ×5**：`battle/effects/<element>_ultimate.png`（毁灭火焰风暴 / 海啸巨浪冰晶 / 世界树觉醒花瓣风暴 / 大地崩裂岩浆喷发 / 万剑归宗金色剑阵法阵）
3. **通用战斗特效 Sprite ×3**：`battle/effects/critical.png`（金色爆裂冲击波）、`battle/effects/heal.png`（翠绿光柱+花瓣治愈）、`battle/effects/resonance.png`（紫蓝同心圆+五行符号能量波）

### 代码更新
1. **battle-effects.js 升级 v1.2.0**：
   - 新增 `skillSpriteMap` / `ultimateSpriteMap` / `generalSpriteMap` 三套 sprite 映射
   - `preload()` 升级为批量加载四类 sprite（attack/skill/ultimate/general），使用带前缀的 key 存储
   - `play()` 新增 `options.level` 参数（'attack' | 'skill' | 'ultimate'），自动选择对应级别的 sprite，不同级别使用不同尺寸和持续时间预设
   - 新增 `playGeneral(type, x, y)` 方法，支持暴击/治愈/共鸣三种通用特效
   - `playCritical()` 优先使用专用暴击 sprite，不可用时降级到金/火元素 attack sprite
2. 向后兼容：未传 `level` 参数时默认使用 attack 级 sprite，现有调用无需修改

### 下一步计划
- 等待角色设定完成后开始立绘制作（P0 阻塞项）
- 后续章节区域背景（待元首提供新章节地图设计）
- Q版战斗序列帧（依赖立绘完成后开始）

---

## 七、本次执行记录（2026-09-20 01:13）

### 新增素材
1. **角色名标签框 ×1**：`ui/frames/name_label_frame.png`（300×80px，暗紫+金色描边，左侧菱形装饰，用于对话框内显示角色名）
2. **五行战斗特效 Sprite ×5**：`battle/effects/<element>_attack.png`（火/水/木/土/金元素攻击命中特效，512×512px，透明背景）

### 代码更新
1. **battle-effects.js 升级 v1.1.0**：新增 `SpriteEffects` 模块，支持加载并渲染 sprite 图片素材，叠加在粒子特效之上（`screen` 混合模式），包含缩放动画、淡入淡出、暴击增强特效
2. Sprite 特效与现有粒子系统并行运行，素材不可用时自动降级为纯粒子效果

### 下一步计划
- 等待角色设定完成后开始立绘制作（P0 阻塞项）
- 制作战技/大招 sprite 特效（当前仅有普攻 attack 特效）
- 制作治愈/共鸣触发 sprite 特效
- 后续章节区域背景（待元首提供新章节地图设计）

---

## 八、本次执行记录（2026-09-19 01:15）

### 技术集成（v0.9.0）
1. **UI 边框素材集成**：5 个九宫格边框素材（dialog_box/panel_frame/button_frame/hp_bar_frame/energy_bar_frame）预加载到 `GameAssets.frames`，新增 `drawNineSlice()` 九宫格绘制、`drawFramedPanel()` / `drawFramedButton()` 通用绘制函数
2. **UI 动画系统接入场景渲染**：`UIAnimations.update(dt)` 接入引擎主循环；战斗场景使用 `HPBarRenderer`（平滑过渡+受击闪烁+低血量变色）和 `EnergyBarRenderer`（五行颜色+满能量脉冲）；伤害数字弹出动画和屏幕震动效果接入战斗行动结果
3. **音频管理器升级**：从占位空壳升级为 Web Audio API 实现，支持合成音效（click/hit/crit/heal/gacha_roll/gacha_ssr/levelup/skill/ultimate）和 BGM 框架（循环播放+淡入淡出），音频文件待后续制作
4. **场景全面升级**：标题画面、主菜单、剧情地图、对话框、战斗界面、抽卡界面的面板和按钮全部替换为九宫格边框渲染，素材不可用时自动回退到纯色面板

### 待联动项
- UI 动画系统已接入但 `ui-animations.js` 中的 `animateTypewriter` 尚未替换 `DialogueScene` 的逐字显示逻辑（当前 DialogueScene 使用自有的 displayTimer 方案，效果等价）
- 合成音效已就绪，BGM 文件待制作后可通过 `game.audio.playBgm(name, url)` 直接调用
- HP/Energy 渲染器目前仅在 BattleScene 中使用，其他场景（角色展示/养成等）可后续接入
