-- v4_mascot_images.sql
-- mascotsテーブルに画像URL保存用カラムを追加するマイグレーション

ALTER TABLE public.mascots
ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.mascots.image_urls IS '表情ごとのマスコット画像URL';
