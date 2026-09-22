-- ============================================================
-- 未定之旅 - Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行（幂等，可重跑）
-- ============================================================

-- ============ 1. 玩家账号表 ============
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  total_play_time INTEGER DEFAULT 0  -- 秒
);

-- ============ 2. 游戏存档表 ============
CREATE TABLE IF NOT EXISTS game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  save_data JSONB NOT NULL DEFAULT '{}',
  slot INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slot)
);

-- ============ 3. 角色图鉴表 ============
CREATE TABLE IF NOT EXISTS game_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  character_name TEXT,
  rarity TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  stars INTEGER DEFAULT 0,  -- 重复获得 = 命座/星魂
  obtained_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- ============ 4. 抽卡记录表 ============
CREATE TABLE IF NOT EXISTS game_gacha_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  pool_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  character_name TEXT,
  rarity TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  pull_number INTEGER,
  pulled_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 5. 关卡进度表 ============
CREATE TABLE IF NOT EXISTS game_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  stars INTEGER DEFAULT 0,  -- 通关星评 0~3
  best_time INTEGER,         -- 最快通关时间（秒）
  attempts INTEGER DEFAULT 1,
  first_clear_at TIMESTAMPTZ,
  UNIQUE(user_id, stage_id)
);

-- ============ 5b. 任务进度表（v0.13.0） ============
CREATE TABLE IF NOT EXISTS game_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,        -- 'daily' | 'weekly'
  quest_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  period_start TIMESTAMPTZ,       -- 当前周期开始时间
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_type, quest_id, period_start)
);

-- ============ 5c. 成就奖励领取记录表（v0.13.0） ============
CREATE TABLE IF NOT EXISTS game_achievement_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ============ 6. 索引 ============
CREATE INDEX IF NOT EXISTS idx_game_saves_user ON game_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_game_roster_user ON game_roster(user_id);
CREATE INDEX IF NOT EXISTS idx_game_gacha_user ON game_gacha_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stage_user ON game_stage_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_players_username ON game_players(username);
CREATE INDEX IF NOT EXISTS idx_game_quest_user ON game_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_quest_period ON game_quest_progress(period_start);
CREATE INDEX IF NOT EXISTS idx_game_achievement_claims_user ON game_achievement_claims(user_id);

-- ============ 7. 启用 RLS ============
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_gacha_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_achievement_claims ENABLE ROW LEVEL SECURITY;

-- ============ 8. RPC 函数 ============

-- 注册
CREATE OR REPLACE FUNCTION game_register(p_username TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
  v_player game_players;
BEGIN
  -- 校验
  IF length(p_username) < 3 OR length(p_username) > 20 THEN
    RAISE EXCEPTION '用户名需要3-20个字符';
  END IF;
  IF length(p_password) < 6 THEN
    RAISE EXCEPTION '密码至少6个字符';
  END IF;

  -- 检查用户名是否已存在
  IF EXISTS (SELECT 1 FROM game_players WHERE username = p_username) THEN
    RAISE EXCEPTION '用户名已存在';
  END IF;

  -- 简单哈希（生产环境应使用 pgcrypto 的 crypt）
  v_hash := encode(sha256(p_password::bytea), 'hex');

  INSERT INTO game_players (username, password_hash, nickname)
  VALUES (p_username, v_hash, p_username)
  RETURNING * INTO v_player;

  RETURN jsonb_build_object(
    'id', v_player.id,
    'username', v_player.username,
    'nickname', v_player.nickname,
    'level', v_player.level
  );
END;
$$;

-- 登录
CREATE OR REPLACE FUNCTION game_login(p_username TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
  v_player game_players;
BEGIN
  v_hash := encode(sha256(p_password::bytea), 'hex');

  SELECT * INTO v_player
  FROM game_players
  WHERE username = p_username AND password_hash = v_hash;

  IF v_player IS NULL THEN
    RETURN NULL;
  END IF;

  -- 更新最后登录时间
  UPDATE game_players SET last_login = now() WHERE id = v_player.id;

  RETURN jsonb_build_object(
    'id', v_player.id,
    'username', v_player.username,
    'nickname', v_player.nickname,
    'level', v_player.level
  );
END;
$$;

-- 保存游戏
CREATE OR REPLACE FUNCTION game_save(p_user_id UUID, p_save_data TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO game_saves (user_id, save_data, updated_at)
  VALUES (p_user_id, p_save_data::jsonb, now())
  ON CONFLICT (user_id, slot) DO UPDATE
  SET save_data = p_save_data::jsonb,
      updated_at = now(),
      version = game_saves.version + 1;
END;
$$;

-- 加载游戏
CREATE OR REPLACE FUNCTION game_load(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_data TEXT;
BEGIN
  SELECT save_data::text INTO v_data
  FROM game_saves
  WHERE user_id = p_user_id AND slot = 1
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN v_data;
END;
$$;

-- 记录抽卡
CREATE OR REPLACE FUNCTION game_gacha_record(
  p_user_id UUID,
  p_pool_id TEXT,
  p_results TEXT  -- JSON array string
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  FOR v_result IN SELECT * FROM jsonb_array_elements(p_results::jsonb)
  LOOP
    INSERT INTO game_gacha_history (user_id, pool_id, character_id, character_name, rarity, is_new, pull_number)
    VALUES (
      p_user_id,
      p_pool_id,
      v_result->>'id',
      v_result->>'name',
      v_result->>'rarity',
      COALESCE((v_result->>'isNew')::boolean, false),
      COALESCE((v_result->>'pullNumber')::integer, 0)
    );

    -- 同时更新图鉴
    INSERT INTO game_roster (user_id, character_id, character_name, rarity)
    VALUES (p_user_id, v_result->>'id', v_result->>'name', v_result->>'rarity')
    ON CONFLICT (user_id, character_id) DO UPDATE
    SET stars = game_roster.stars + 1;
  END LOOP;
END;
$$;

-- 更新关卡进度
CREATE OR REPLACE FUNCTION game_update_stage(
  p_user_id UUID,
  p_stage_id TEXT,
  p_stars INTEGER,
  p_time INTEGER
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO game_stage_progress (user_id, stage_id, stars, best_time, first_clear_at)
  VALUES (p_user_id, p_stage_id, p_stars, p_time, now())
  ON CONFLICT (user_id, stage_id) DO UPDATE
  SET
    stars = GREATEST(game_stage_progress.stars, p_stars),
    best_time = LEAST(game_stage_progress.best_time, p_time),
    attempts = game_stage_progress.attempts + 1;
END;
$$;

-- 获取玩家图鉴
CREATE OR REPLACE FUNCTION game_get_roster(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'character_id', character_id,
        'character_name', character_name,
        'rarity', rarity,
        'level', level,
        'stars', stars,
        'obtained_at', obtained_at
      )
    ),
    '[]'::jsonb
  )
  FROM game_roster
  WHERE user_id = p_user_id
  ORDER BY obtained_at DESC;
END;
$$;

-- 获取抽卡统计
CREATE OR REPLACE FUNCTION game_gacha_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_ssr INTEGER;
  v_sr INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM game_gacha_history WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_ssr FROM game_gacha_history WHERE user_id = p_user_id AND rarity = 'ssr';
  SELECT COUNT(*) INTO v_sr FROM game_gacha_history WHERE user_id = p_user_id AND rarity = 'sr';

  RETURN jsonb_build_object(
    'total_pulls', v_total,
    'ssr_count', v_ssr,
    'sr_count', v_sr,
    'ssr_rate', CASE WHEN v_total > 0 THEN ROUND(v_ssr::numeric / v_total * 100, 2) ELSE 0 END
  );
END;
$$;

-- ============ 8b. 任务进度 RPC 函数（v0.13.0） ============

-- 更新任务进度
CREATE OR REPLACE FUNCTION game_update_quest(
  p_user_id UUID,
  p_quest_type TEXT,
  p_quest_id TEXT,
  p_progress INTEGER,
  p_period_start TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO game_quest_progress (user_id, quest_type, quest_id, progress, completed, period_start, updated_at)
  VALUES (p_user_id, p_quest_type, p_quest_id, p_progress, p_progress > 0, p_period_start, now())
  ON CONFLICT (user_id, quest_type, quest_id, period_start) DO UPDATE
  SET progress = GREATEST(game_quest_progress.progress, p_progress),
      completed = game_quest_progress.progress >= p_progress OR p_progress > 0,
      updated_at = now();
END;
$$;

-- 领取任务奖励
CREATE OR REPLACE FUNCTION game_claim_quest(
  p_user_id UUID,
  p_quest_type TEXT,
  p_quest_id TEXT,
  p_period_start TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE game_quest_progress
  SET claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND quest_type = p_quest_type
    AND quest_id = p_quest_id AND period_start = p_period_start;
END;
$$;

-- 领取成就奖励
CREATE OR REPLACE FUNCTION game_claim_achievement(
  p_user_id UUID,
  p_achievement_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO game_achievement_claims (user_id, achievement_id, claimed_at)
  VALUES (p_user_id, p_achievement_id, now())
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$;

-- 获取玩家任务进度
CREATE OR REPLACE FUNCTION game_get_quests(
  p_user_id UUID,
  p_quest_type TEXT,
  p_period_start TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'quest_id', quest_id,
        'progress', progress,
        'completed', completed,
        'claimed', claimed
      )
    ),
    '[]'::jsonb
  )
  FROM game_quest_progress
  WHERE user_id = p_user_id
    AND quest_type = p_quest_type
    AND period_start = p_period_start;
END;
$$;

-- ============ 9. 授权 anon 角色执行函数 ============
GRANT EXECUTE ON FUNCTION game_register TO anon;
GRANT EXECUTE ON FUNCTION game_login TO anon;
GRANT EXECUTE ON FUNCTION game_save TO anon;
GRANT EXECUTE ON FUNCTION game_load TO anon;
GRANT EXECUTE ON FUNCTION game_gacha_record TO anon;
GRANT EXECUTE ON FUNCTION game_update_stage TO anon;
GRANT EXECUTE ON FUNCTION game_get_roster TO anon;
GRANT EXECUTE ON FUNCTION game_gacha_stats TO anon;
GRANT EXECUTE ON FUNCTION game_update_quest TO anon;
GRANT EXECUTE ON FUNCTION game_claim_quest TO anon;
GRANT EXECUTE ON FUNCTION game_claim_achievement TO anon;
GRANT EXECUTE ON FUNCTION game_get_quests TO anon;

-- ============ 10. 完成提示 ============
SELECT '数据库初始化完成！未定之旅 v0.1' AS status;
