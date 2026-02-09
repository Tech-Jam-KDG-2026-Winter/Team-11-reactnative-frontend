-- v3_personality.sql
-- mascotsテーブルに性格関連カラムを追加するマイグレーション

-- personality_tags: プリセットの性格タグ（配列、最大5個を想定）
-- personality_note: 自由入力（最大200文字を想定）
ALTER TABLE public.mascots
ADD COLUMN IF NOT EXISTS personality_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personality_note text DEFAULT NULL;

COMMENT ON COLUMN public.mascots.personality_tags IS '性格タグ（プリセットから選択、最大5個）';
COMMENT ON COLUMN public.mascots.personality_note IS '性格に関する自由入力（最大200文字）';
