# API ドキュメント（backend 実装準拠）

このドキュメントは `backend/backend/config/urls.py` と各アプリの `urls.py` / `views.py` の実装に合わせた最新版です。

## 概要

提供機能:
- 朝夜アンケート送信
- AI ヒント・レコメンド・マスコット状態取得
- マスコット初期生成（オンボーディング）
- 当日クエスト取得・完了トグル
- Django ModelViewSet による CRUD API（questionnaires / answers / quests）

## 認証・ヘッダー

### 1. `X-User-UUID` が必須の API
- `POST /api/questionnaire/morning`
- `POST /api/questionnaire/night`
- `POST /api/questionnaires/morning`
- `POST /api/questionnaires/night`
- `POST /api/ai/recommendations/`
- `GET /api/ai/mascot-state/`
- `POST /api/ai/onboarding/complete/`
- `GET /api/quests/get`
- `POST /api/quests/{quest_id}/complete`

### 2. `X-User-UUID` 不要の API
- `POST /api/ai/hints/`
- Questionnaire/Answer の ViewSet API（後述）

### 3. 認証（DRF Permission）
- `AllowAny`: 上記のほとんどの API
- `IsAuthenticated`: `quests` ViewSet API のみ
  - `GET/POST /api/quests/quests`
  - `GET/PUT/PATCH/DELETE /api/quests/quests/{id}`

## URL プレフィックス

質問票 API は **2 つのプレフィックス**で同じ実装が公開されています。
- `/api/questionnaire/`（単数）
- `/api/questionnaires/`（複数）

## エンドポイント一覧

### Questionnaires（単数/複数プレフィックスの両方で利用可能）

- `POST /api/questionnaire/morning`
- `POST /api/questionnaire/night`
- `GET /api/questionnaire/questionnaires`
- `POST /api/questionnaire/questionnaires`
- `GET /api/questionnaire/questionnaires/{id}`
- `PUT /api/questionnaire/questionnaires/{id}`
- `PATCH /api/questionnaire/questionnaires/{id}`
- `DELETE /api/questionnaire/questionnaires/{id}`
- `GET /api/questionnaire/answers`
- `POST /api/questionnaire/answers`
- `GET /api/questionnaire/answers/{id}`
- `PUT /api/questionnaire/answers/{id}`
- `PATCH /api/questionnaire/answers/{id}`
- `DELETE /api/questionnaire/answers/{id}`

同じ API が `/api/questionnaires/...` でも利用可能です。

### AI

- `POST /api/ai/hints/`
- `POST /api/ai/recommendations/`
- `GET /api/ai/mascot-state/`
- `POST /api/ai/onboarding/complete/`

### Quests

- `GET /api/quests/get`
- `POST /api/quests/{quest_id}/complete`
- `GET /api/quests/quests`（IsAuthenticated）
- `POST /api/quests/quests`（IsAuthenticated）
- `GET /api/quests/quests/{id}`（IsAuthenticated）
- `PUT /api/quests/quests/{id}`（IsAuthenticated）
- `PATCH /api/quests/quests/{id}`（IsAuthenticated）
- `DELETE /api/quests/quests/{id}`（IsAuthenticated）

---

## 朝夜アンケート API

### POST `/api/questionnaire/morning`（`/api/questionnaires/morning` でも可）

`X-User-UUID` を元に `users_condition` を保存/更新します。

リクエスト:
```json
{
  "mood": "ふつう",
  "condition": "ふつう",
  "free_text": ""
}
```

バリデーション:
- `mood` 必須、選択肢: `絶好調 | いい感じ | ふつう | モヤモヤ | つらい`
- `condition` 必須、選択肢: `絶好調 | いい感じ | ふつう | 少しだるい | つらい`
- `free_text` 任意、最大 1000 文字

成功レスポンス: `201 Created`

主なエラー:
- `400`: `X-User-UUID` 不足
- `400`: 入力バリデーションエラー
- `500`: Supabase 保存失敗

### POST `/api/questionnaire/night`（`/api/questionnaires/night` でも可）

仕様は morning と同じ（`is_morning=False` として保存）。

---

## AI API

### POST `/api/ai/hints/`

リクエスト:
```json
{
  "prompt": "質問や相談内容"
}
```

成功レスポンス: `200 OK`
```json
{
  "hint": "..."
}
```

エラー:
- `400`: `prompt` が空（`{"detail": "prompt is required"}`）

### POST `/api/ai/recommendations/`

ヘッダー `X-User-UUID` 必須。

成功レスポンス: `200 OK`
```json
{
  "quests": [
    { "title": "...", "description": "..." }
  ],
  "mascot": {
    "status": "Okay",
    "message": "..."
  }
}
```

主なエラー:
- `400`: UUID ヘッダー不足
- `400`: レコメンド生成処理側でのエラー（例: `users_condition` なし）

### GET `/api/ai/mascot-state/`

ヘッダー `X-User-UUID` 必須。

成功レスポンス: `200 OK`
```json
{
  "status": "Good",
  "message": "今日もよく頑張ったね！",
  "image_urls": {
    "Sad": "https://...",
    "Bad": "https://...",
    "Okay": "https://...",
    "Good": "https://...",
    "Great": "https://..."
  }
}
```

主なエラー:
- `400`: UUID ヘッダー不足
- `404`: mascot が未作成

### POST `/api/ai/onboarding/complete/`

ヘッダー `X-User-UUID` 必須。

**必須フィールド（全 9 項目）**
- `personality`
- `favorite_color`
- `support_style`
- `activity_level`
- `social_energy`
- `decision_style`
- `change_preference`
- `stress_coping`
- `emotional_expression`

リクエスト例:
```json
{
  "personality": "元気いっぱい",
  "favorite_color": "赤系",
  "support_style": "元気に励ます",
  "activity_level": "アクティブ",
  "social_energy": "人と関わると元気",
  "decision_style": "直感",
  "change_preference": "変化歓迎",
  "stress_coping": "体を動かす",
  "emotional_expression": "言葉で表現する"
}
```

成功レスポンス: `201 Created`
```json
{
  "mascot_id": "550e8400-e29b-41d4-a716-446655440000",
  "image_urls": {
    "Sad": "https://...",
    "Bad": "https://...",
    "Okay": "https://...",
    "Good": "https://...",
    "Great": "https://..."
  },
  "message": "あなた専用のキャラクターが完成しました！"
}
```

主なエラー:
- `400`: UUID ヘッダー不足
- `400`: 必須項目不足（`{"error": "All fields are required"}`）
- `500`: 画像生成/保存失敗

---

## Quests API

### GET `/api/quests/get`

当日（`date.today().isoformat()`）のクエストを返します。

成功レスポンス: `200 OK`
```json
[
  {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "5分間の深呼吸",
    "description": "...",
    "completed": false,
    "day": "2026-01-29",
    "created_at": "2026-01-29T02:00:00.000Z",
    "updated_at": "2026-01-29T02:00:00.000Z"
  }
]
```

主なエラー:
- `400`: UUID ヘッダー不足
- `500`: Supabase 設定エラー / 取得失敗

### POST `/api/quests/{quest_id}/complete`

指定クエストの `completed` をトグルします。

成功レスポンス: `200 OK`
```json
{
  "id": 123,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "title": "5分間の深呼吸",
  "description": "...",
  "completed": true,
  "day": "2026-01-29",
  "created_at": "2026-01-29T02:00:00.000Z",
  "updated_at": "2026-01-29T04:00:00.000Z"
}
```

主なエラー:
- `400`: UUID ヘッダー不足
- `404`: 指定クエストなし
- `500`: Supabase 設定/更新失敗

---

## ViewSet API 詳細

### QuestionnaireViewSet

- パス: `/api/questionnaire/questionnaires`（または `/api/questionnaires/questionnaires`）
- Permission: `AllowAny`
- モデル: `Questionnaire`

レスポンス項目:
- `id`
- `title`
- `description`
- `questions`（`[{ id, text }]`）

### AnswerViewSet

- パス: `/api/questionnaire/answers`（または `/api/questionnaires/answers`）
- Permission: `AllowAny`
- モデル: `Answer`

リクエスト/レスポンス項目:
- `id`
- `questionnaire`
- `submitted_at`（read only）
- `payload`（JSON）

### QuestViewSet

- パス: `/api/quests/quests`
- Permission: `IsAuthenticated`
- モデル: `Quest`

レスポンス項目:
- `id`
- `title`
- `description`
- `owner`
- `owner_username`
- `is_active`
- `created_at`

`POST` 作成時は `owner` がログインユーザーに自動設定されます。

---

## ステータスコード

- `200 OK`: 取得/更新成功
- `201 Created`: 新規作成成功
- `400 Bad Request`: 必須ヘッダー不足、入力不正など
- `404 Not Found`: 対象データなし
- `500 Internal Server Error`: 外部サービス/設定エラー

---

## 差分修正メモ（今回反映）

- `questionnaires` / `answers` / `quests` の ViewSet API を追記
- 単数 `/api/questionnaire/` と複数 `/api/questionnaires/` の同時公開を明記
- 朝夜アンケートの選択肢を実装値へ修正
- マスコットオンボーディングの必須項目を 4 件 -> 9 件へ修正
- 「全 API で UUID 必須」という記述を実装準拠に修正
