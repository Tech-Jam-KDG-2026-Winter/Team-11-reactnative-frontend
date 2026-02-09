-- お疲れ様スタンプ「受け取った数」表示用: 自分が受け取った行を SELECT 可能にする
-- Supabase ダッシュボードの SQL Editor で実行

CREATE POLICY "Users can select log_likes where they are recipient"
  ON log_likes FOR SELECT
  USING (to_user_id = auth.uid());
