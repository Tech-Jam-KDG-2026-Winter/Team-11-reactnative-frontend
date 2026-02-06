// 気分の選択肢
export type Mood =
  | "絶好調"
  | "いい感じ"
  | "ふつう"
  | "モヤモヤ"
  | "つらい";

// 体調の選択肢
export type Condition =
  | "絶好調"
  | "いい感じ"
  | "ふつう"
  | "少しだるい"
  | "つらい";

// マスコットの状態
export type MascotStatus = "Sad" | "Bad" | "Okay" | "Good" | "Great";

export type MascotImageUrls = Record<MascotStatus, string>;

// アンケートリクエスト
export interface QuestionnaireRequest {
  mood: Mood;
  condition: Condition;
  free_text?: string;
}

// アンケートレスポンス
export interface QuestionnaireResponse {
  uuid: string;
  morning_mood: Mood | null;
  morning_condition: Condition | null;
  morning_note: string | null;
  night_mood: Mood | null;
  night_condition: Condition | null;
  night_note: string | null;
  created_at: string;
  updated_at: string;
}

// クエスト
export interface Quest {
  id: number;
  uuid: string;
  title: string;
  description: string;
  completed: boolean;
  day: string;
  created_at: string;
  updated_at: string;
  source_user_uuid?: string | null;
  source_user_name?: string | null;
  source_quest_id?: number | null;
  source_encounter_id?: number | null;
  source_type?: string | null;
}

// AIレコメンデーションのクエスト（生成時）
export interface RecommendedQuest {
  title: string;
  description: string;
}

// マスコット状態
export interface Mascot {
  status: MascotStatus;
  message: string;
  image_urls?: MascotImageUrls;
}

export interface MascotOnboardingRequest {
  personality: string;
  favorite_color: string;
  support_style: string;
  activity_level: string;
  social_energy: string;
  decision_style: string;
  change_preference: string;
  stress_coping: string;
  emotional_expression: string;
}

export interface MascotOnboardingResponse {
  mascot_id: string;
  image_urls: MascotImageUrls;
  message: string;
}

// AIレコメンデーションレスポンス
export interface RecommendationsResponse {
  quests: RecommendedQuest[];
  mascot: Mascot;
}

// ヒントリクエスト
export interface HintRequest {
  prompt: string;
}

// ヒントレスポンス
export interface HintResponse {
  hint: string;
}

// APIエラー
export interface ApiError {
  detail?: string;
  error?: string;
  [key: string]: unknown;
}

// すれ違いセッション
export interface EncounterSession {
  id: number;
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
  seen_minutes: number;
  min_distance_m: number;
  last_distance_m: number;
}

// 完了したクエスト
export interface CompletedQuest {
  id: number;
  title: string;
  completed_at: string;
  description?: string | null;
}

// すれ違い + クエスト情報
export interface EncounterWithQuests extends EncounterSession {
  completed_quests: CompletedQuest[];
}
