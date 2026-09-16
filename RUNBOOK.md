# 未定之旅 · 技术部署手册

> 游戏项目（庸人工作室）部署与迭代执行手册。
> 本文件与"游戏画面与人物动画制作"任务共享记忆库。

## 0. 基本信息

- 游戏名：未定之旅（网页二次元回合制 RPG）
- 工作室：庸人工作室
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
├── js/
│   ├── engine.js        # 引擎（场景管理、渲染、输入、资源加载）
│   ├── battle.js        # 回合制战斗（含共鸣/元素力）
│   ├── story.js         # 剧情/地图/关卡
│   ├── save.js          # Supabase 云端存档（SUPABASE_CONFIG 在此）
│   ├── gacha.js         # 抽卡
│   ├── growth.js        # 角色养成（升级/突破/技能升级）
│   ├── stages.js        # 材料掉落关卡 / 每日挑战 / 体力系统 / 签到
│   ├── characters.js    # 角色图鉴 & 编队
│   ├── ui.js            # 所有场景 UI 渲染
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
| 2026-09-16 | stages.js 新增材料关卡 & 签到系统   | ✅ 已完成  |
| 2026-09-15 | save.js recordGacha 参数名不匹配（p_pulls→p_pool_id） | ✅ 已修复 |
| 2026-09-14 | save.js SUPABASE_CONFIG 缺少逗号    | ✅ 已修复   |
| 2026-09-13 | 共鸣增益 energyRegen 属性名错误      | ✅ 已修复   |

## 6. 下一步（技术侧）

- [ ] 角色立绘资源加载（与美术任务联动，等角色设定）
- [ ] Q 版战斗序列帧渲染（与美术任务联动，等序列帧素材）
- [ ] 剧情内容填充（元首提供）
- [ ] 音频系统（BGM + 音效）
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
- 立绘：`assets/characters/portraits/<角色id>.png`
- Q 版序列帧：`assets/characters/chibi/<角色id>/<动作>_<帧号>.png`
- 头像：`assets/characters/icons/<角色id>.png`
- 战斗特效：`assets/battle/effects/<特效名>_<帧号>.png`

技术侧在 `ui.js / engine.js` 中按命名规则加载，美术侧只需按规范产出文件。

## 8. 团队分工

- 元首：剧情 / 地图 / 取名
- 美工：画面与人物动画（AI 生成 + CSS/Canvas）
- 技术：网站部署 / 代码实现（AI 辅助）
