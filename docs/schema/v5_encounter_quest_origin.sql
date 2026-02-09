-- v5_encounter_quest_origin.sql
-- questsテーブルにすれ違いクエストの出所情報を追加するマイグレーション

ALTER TABLE public.quests
ADD COLUMN IF NOT EXISTS source_user_uuid uuid,
ADD COLUMN IF NOT EXISTS source_user_name text,
ADD COLUMN IF NOT EXISTS source_quest_id bigint,
ADD COLUMN IF NOT EXISTS source_encounter_id bigint,
ADD COLUMN IF NOT EXISTS source_type text;

COMMENT ON COLUMN public.quests.source_user_uuid IS 'すれ違い元ユーザーUUID';
COMMENT ON COLUMN public.quests.source_user_name IS 'すれ違い元ユーザー名';
COMMENT ON COLUMN public.quests.source_quest_id IS 'すれ違い元クエストID';
COMMENT ON COLUMN public.quests.source_encounter_id IS 'すれ違いセッションID';
COMMENT ON COLUMN public.quests.source_type IS 'すれ違い由来などの種別';
