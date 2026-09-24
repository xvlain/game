# 未定之旅 · 技术部署手册

> 游戏项目（庸人工作室）部署与迭代执行手册。
> 本文件与"游戏画面与人物动画制作"任务共享记忆库。

## 0. 基本信息

- 游戏名：未定之旅（网页二次元回合制 RPG）
- 工作室：庸人工作室
- 当前版本：v0.15.0
- 仓库：https://github.com/xvlain/game（main 分支）
- Pages 地址：https://xvlain.github.io/game/
- Supabase 项目：`qvbywrfkpbiojncikdnw`（新加坡区，Free）
- Supabase URL：`https://qvbywrfkpbiojncikdnw.supabase.co`
- 本地工程目录：`/root/userdata/workspace/game-project/`
- GitHub Token 路径：`/root/userdata/workspace/.secrets/github_token`

## 1. 技术栈

- 前端：纯 HTML5 + Canvas + 原生 JavaScript（零框架）
- 后端：Supabase（PostgreSQL + RPC + anonKey 模式）
- 部署：GitHub Pages（main 分支根目录，legacy build_type）
- 美术：CSS/Canvas 占位符（后期替换为二次元立绘 + Q 版序列帧）
- 音频：暂未实现

## 2. 文件结构

```
game-project/
├── index.html           # 入口
├── manifest.json        # PWA 清单
├── sw.js                # Service Worker（v0.12.0 分类缓存策略）
├── fix_supabase_rpc.sql # Supabase RPC 修复脚本
├── js/
│   ├── engine.js        # 引擎（场景管理、渲染、输入、资源加载、过渡特效）
│   ├── character-art.js # 角色美术系统（立绘+Q版序列帧+表情）← v0.12.0
│   ├── battle.js        # 回合制战斗（含共鸣/元素力/连击链/反击）
│   ├── battle-chain.js  # 连击链/反击/元素连锁/破防系统 ← v0.13.0 NEW
│   ├── story.js         # 剧情/地图/关卡
│   ├── save.js          # Supabase 云端存档（SUPABASE_CONFIG 在此）
│   ├── gacha.js         # 抽卡
│   ├── growth.js        # 角色养成（升级/突破/技能升级）
│   ├── stages.js        # 材料掉落关卡 / 每日挑战 / 体力系统 / 签到
│   ├── quests.js        # 每日委托/周常任务/活跃度系统 ← v0.13.0 NEW
│   ├── characters.js    # 角色图鉴 & 编队
│   ├── ui.js            # 所有场景 UI 渲染
│   ├── ui-animations.js # UI 动画系统（HP条/伤害弹出/屏幕震动）
│   ├── battle-effects.js # 战斗粒子特效 + Sprite 特效
│   ├── battle-cutscene.js # 战斗演出系统（大招特写+技能演出）← v0.12.0
│   ├── achievements.js  # 成就系统（含奖励领取）← v0.13.0 增强
│   ├── toast.js         # 全局 Toast 通知系统 ← v0.14.0 NEW
│   ├── mail.js          # 邮件/收件箱系统 ← v0.14.0 NEW
│   └── main.js          # 游戏入口
├── assets/              # 美术资源（后期填充）
├── game_schema.sql      # Supabase 建表脚本（幂等，可重跑）
├── README.md            # 进度 & 更新日志
└── RUNBOOK.md           # 本文件
```

## 3. 部署流程（推送即上线）

Pages 配置为 legacy 模式：main 分支根目录。

```bash
cd /root/userdata/workspace/game-project
# 1. 配置远程（首次）
git remote set-url origin "https://xvlain:$(cat /root/userdata/workspace/.secrets/github_token)@github.com/xvlain/game.git"
# 2. 提交
git add -A
git commit -m "<type>: <简述>"
# 3. 推送（Pages 自动重建，约 1-2 分钟生效）
git push origin main
```

推送后用以下命令验证：

```bash
curl -sI https://xvlain.github.io/game/           # 应返回 200
curl -s  https://xvlain.github.io/game/js/save.js | sed -n '7,10p'  # 检查 SUPABASE_CONFIG
```

## 4. Supabase 配置

### 4.1 表结构（已存在，详见 game_schema.sql）
- `game_players` - 玩家账号（username / password_hash / nickname / level）
- `game_saves` - 存档（save_data JSONB，slot 支持多档）
- `game_roster` - 图鉴（character_id + stars/命座）
- `game_gacha_history` - 抽卡记录
- `game_stage_progress` - 关卡进度（stars/best_time）

### 4.2 RPC 函数
- `game_register(p_username, p_password)` - 注册
- `game_login(p_username, p_password)` - 登录
- `game_save(p_user_id, p_save_data)` - 存档
- `game_load(p_user_id)` - 读档
- `game_gacha_record(p_user_id, p_pool_id, p_results)` - 记录抽卡
- `game_update_stage(p_user_id, p_stage_id, p_stars, p_time)` - 更新关卡
- `game_get_roster(p_user_id)` - 查询图鉴
- `game_gacha_stats(p_user_id)` - 抽卡统计

### 4.3 RLS
所有表启用 RLS，通过 SECURITY DEFINER 的 RPC 函数由 anon 调用。
后续如需更严格策略，可改为基于 user_id 的策略。

## 5. 已知 Bug 与修复

| 时间       | 问题                                | 状态       |
|------------|-------------------------------------|------------|
| 2026-09-25 | v0.15.0: Q版序列帧接入战斗渲染 + Canvas整数坐标优化 + 动画状态机 | ✅ 已完成  |
| 2026-09-24 | v0.14.0: 邮件/收件箱系统 + Toast通知 + 邮箱场景 + 欢迎邮件 + SW缓存更新 | ✅ 已完成  |
| 2026-09-24 | chibi-animator.js 帧索引修复（1-based→0-based） | ✅ 已完成  |
| 2026-09-23 | v0.13.0: 每日委托+连击链+成就奖励+离线优化 | ✅ 已完成  |
| 2026-09-22 | 角色美术系统 + 战斗演出系统 + 场景过渡增强 + SW 缓存升级 | ✅ 已完成  |
| 2026-09-22 | Supabase RPC schema cache 修复脚本 | ✅ 已完成  |
| 2026-09-20 | PWA Service Worker + manifest.json 支持添加到主屏幕 | ✅ 已完成  |
| 2026-09-20 | Farm 关卡自动战斗系统（优先大招→战技→普攻，集火最低血量） | ✅ 已完成  |
| 2026-09-20 | 剧情对话快进（已读自动快进 + 手动切换 + 点击停止） | ✅ 已完成  |
| 2026-09-20 | 玩家统计面板（总览/角色/背包三 Tab） | ✅ 已完成  |
| 2026-09-19 | UI 边框素材已预加载 + 九宫格渲染集成 | ✅ 已完成  |
| 2026-09-19 | UI 动画系统接入场景（HP/能量条渲染器+伤害弹出+屏幕震动） | ✅ 已完成 |
| 2026-09-19 | 音频管理器升级为 Web Audio API（合成音效+BGM框架） | ✅ 已完成 |
| 2026-09-18 | 战斗背景映射缺失 holy_sanctuary/chaos_void | ✅ 已修复 |
| 2026-09-18 | 道具图标素材存在但未预加载/使用    | ✅ 已修复 |
| 2026-09-16 | stages.js 新增材料关卡 & 签到系统   | ✅ 已完成  |
| 2026-09-15 | save.js recordGacha 参数名不匹配（p_pulls→p_pool_id） | ✅ 已修复 |
| 2026-09-14 | save.js SUPABASE_CONFIG 缺少逗号    | ✅ 已修复   |
| 2026-09-13 | 共鸣增益 energyRegen 属性名错误      | ✅ 已修复   |

## 6. 下一步（技术侧）

- [x] 邮件/收件箱系统 → mail.js + ui.js MailScene (v0.14.0)
- [x] 全局 Toast 通知系统 → toast.js + engine.js 集成 (v0.14.0)
- [x] Q版序列帧接入战斗渲染（idle/attack/skill/ultimate/hit/victory/defeat 全7种动作）→ ui.js BattleScene (v0.15.0)
- [x] Q版动画状态机 + 战斗事件驱动（攻击→attack/受击→hit/胜利→victory/败北→defeat）→ ui.js (v0.15.0)
- [ ] 角色立绘资源加载（与美术任务联动，等角色设定）→ character-art.js 已就绪
- [ ] Q版 victory/defeat 序列帧素材（待美术任务产出）→ 占位符已就绪
- [x] 每日委托/周常任务系统 → quests.js (v0.13.0)
- [x] 连击链/反击/元素连锁/破防系统 → battle-chain.js (v0.13.0)
- [x] 成就奖励领取 + Supabase 持久化 → achievements.js + game_schema.sql (v0.13.0)
- [x] Service Worker 离线体验优化（离线提示页）→ sw.js (v0.13.0)
- [x] 角色美术系统框架（立绘加载+Q版序列帧+表情切换）→ character-art.js
- [x] 战斗演出系统（大招特写+技能演出+开场/胜利/失败）→ battle-cutscene.js
- [x] 场景过渡特效增强（fade/iris/slide 三种过渡类型）→ engine.js
- [x] Service Worker 分类缓存策略升级 → sw.js
- [x] Supabase RPC 修复脚本 → fix_supabase_rpc.sql
- [ ] 剧情内容填充（元首提供）
- [ ] 音频资源制作与加载（BGM/音效文件，管理器已就绪）
- [x] PWA 支持（Service Worker + manifest.json，可添加到主屏幕）
- [x] 自动战斗系统（Farm 关卡自动选择技能+目标）
- [x] 剧情对话快进（已读自动跳过 + 手动切换）
- [x] 玩家统计面板（冒险统计场景：总览/角色/背包）
- [x] UI 边框素材集成（九宫格渲染：对话框/面板/按钮/HP条/能量条）→ ui.js
- [x] UI 动画系统接入场景（HPBarRenderer/EnergyBarRenderer/伤害弹出/屏幕震动）→ ui.js + engine.js
- [x] 音频管理器（Web Audio API + 合成音效 + BGM 框架）→ engine.js
- [x] 道具图标集成（经验书/突破材料/货币图标替换 emoji）
- [x] 战斗背景映射补全（虹彩圣域 + 混沌虚空）
- [x] 抽卡结果展示优化（元素图标 + SSR 发光 + NEW 标签）
- [x] 每日 Boss 动态背景（按星期匹配不同战场）
- [x] 战斗背景图集成（竞技场 + 森林，按关卡自动匹配）
- [x] 元素图标集成（五行图标替换战斗界面文字标签）
- [x] 粒子特效集成战斗动画（攻击/暴击/治愈/元素技能）
- [x] 抽卡背景图集成
- [x] 设置场景完善（画质/帧率/存档/数据管理）
- [x] 废弃元素素材清理（冰/风/雷）
- [x] 材料掉落关卡（突破材料 + 经验书）→ stages.js
- [x] 独立关卡模式（Farm 关卡 + 每日挑战）→ stages.js
- [x] 每日签到奖励系统 → stages.js
- [x] 体力系统（5分钟恢复1点，离线回复）→ stages.js
- [x] 战斗胜利奖励结算（掉落自动入背包）→ stages.js + ui.js
- [x] 抽卡系统接入 Supabase（抽卡记录同步 + 入图鉴）
- [x] 登录/注册 UI 接入 SaveManager
- [x] 云端存档（场景切换时自动同步 + 60 秒定时）
- [x] 角色养成系统（升级/突破/技能升级）

## 7. 美术联动接口

美术任务产出文件统一放入 `assets/`，命名规范见 `assets/README.md`：
- 立绘：`assets/characters/portraits/<角色id>.png`（表情变体：`<角色id>_<表情>.png`）
- Q 版序列帧：`assets/characters/chibi/<角色id>/<动作>_<帧号>.png`（帧号两位数补零：`00`, `01`...）
- 头像：`assets/characters/icons/<角色id>.png`
- 战斗特效：`assets/battle/effects/<特效名>_<帧号>.png`

**v0.12.0 新增 `character-art.js` 统一入口：**
- `window.characterArt.drawPortrait(ctx, charId, x, y, { expression, width, height, glow, flip, shake, damageFlash })`
  - 自动按命名规则加载立绘，支持 5 种表情变体，素材不存在时显示渐变占位符
- `window.characterArt.drawChibi(ctx, charId, action, x, y, { size, flip, bounce })`
  - action 可选：idle / attack / skill / hurt / death / victory
  - 自动管理帧动画（帧率控制、循环/单次），素材不存在时显示 Q 版占位符
- `window.characterArt.drawIcon(ctx, charId, x, y, radius, { element, isActive, isDead })`
  - 绘制角色头像图标，素材不存在时回退到 Renderer.drawAvatar()

**战斗演出接口 `battle-cutscene.js`：**
- `window.cutsceneManager.play(CutsceneFactory.ultimate(actor, element, skillName))` → 2.5s 大招特写
- `window.cutsceneManager.play(CutsceneFactory.skill(element, skillName, isResonance))` → 0.8-1.2s 技能演出
- 支持队列播放、跳过（skip），返回 Promise

技术侧在 `ui.js / engine.js / main.js` 中按命名规则加载，美术侧只需按规范产出文件。

## 8. 团队分工

- 元首：剧情 / 地图 / 取名
- 美工：画面与人物动画（AI 生成 + CSS/Canvas）
- 技术：网站部署 / 代码实现（AI 辅助）
