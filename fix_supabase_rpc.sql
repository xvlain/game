-- ============================================================
-- 未定之旅 - Supabase RPC 函数修复脚本
-- 在 Supabase SQL Editor 中执行（幂等，可重跑）
-- 修复：PostgREST schema cache 未刷新导致 RPC 函数找不到
-- ============================================================

-- 1. 强制刷新 PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 2. 验证表是否存在
SELECT 
  table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)
    THEN '✅ 存在'
    ELSE '❌ 缺失'
  END AS status
FROM (VALUES 
  ('game_players'), ('game_saves'), ('game_roster'),
  ('game_gacha_history'), ('game_stage_progress')
) AS t(table_name);

-- 3. 验证 RPC 函数是否存在
SELECT 
  routine_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = r.routine_name)
    THEN '✅ 存在'
    ELSE '❌ 缺失 - 请执行完整 game_schema.sql'
  END AS status
FROM (VALUES 
  ('game_register'), ('game_login'), ('game_save'), ('game_load'),
  ('game_gacha_record'), ('game_update_stage'), ('game_get_roster'), ('game_gacha_stats')
) AS r(routine_name);

-- 4. 确保 RLS 已启用
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'game_players', 'game_saves', 'game_roster',
    'game_gacha_history', 'game_stage_progress'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- 5. 确保 anon 角色有执行权限
GRANT EXECUTE ON FUNCTION game_register TO anon;
GRANT EXECUTE ON FUNCTION game_login TO anon;
GRANT EXECUTE ON FUNCTION game_save TO anon;
GRANT EXECUTE ON FUNCTION game_load TO anon;
GRANT EXECUTE ON FUNCTION game_gacha_record TO anon;
GRANT EXECUTE ON FUNCTION game_update_stage TO anon;
GRANT EXECUTE ON FUNCTION game_get_roster TO anon;
GRANT EXECUTE ON FUNCTION game_gacha_stats TO anon;

-- 6. 再次刷新 schema cache（双重保险）
NOTIFY pgrst, 'reload schema';

SELECT '修复完成！如果函数状态仍显示"缺失"，请执行完整 game_schema.sql 后再跑一次本脚本。' AS result;
