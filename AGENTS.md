# リポジトリガイドライン

## プロジェクト構成 & モジュールの整理
- `app/`: Expo Router の画面とレイアウト（ファイルベースのルーティング）。タブは `app/(tabs)/` 配下に配置します。
- `components/`: 再利用可能な UI コンポーネント、`components/ui/` プリミティブを含みます。
- `constants/`: テーマやアプリの定数（例: `constants/theme.ts`）。
- `hooks/`: 共通フック（必要に応じてプラットフォーム別）。
- `assets/`: 画像、フォント、その他の静的アセット。
- `scripts/`: プロジェクト用スクリプト（例: `scripts/reset-project.js`）。

## ビルド・テスト・開発用コマンド
- `npm install`: 依存関係のインストール。
- `npm run start`: Expo 開発サーバーの起動。
- `npm run android`: Android エミュレーターの起動。
- `npm run ios`: iOS シミュレーターの起動。
- `npm run web`: Web ビルドの起動。
- `npm run lint`: ESLint の実行（Expo 設定）。
- `npm run reset-project`: スターターコードを `app-example/` に移動し、クリーンな `app/` を作成。

## コーディング規約 & 命名規則
- 言語: React Native + Expo Router 向け TypeScript/TSX。
- インデント: 既存のコードベースにしたがってインデントしてください。
- コンポーネント: `PascalCase` (例: `ThemedView`) でファイル名・エクスポート。
- フック: `hooks/` 配下は `useX` 命名（例: `useThemeColor`）。
- Lint: ESLint（`eslint-config-expo`、`npm run lint` で実行）。

## コミットおよびプルリクエストのガイドライン
- コミットメッセージ形式は混在（例: `docs: ...`、あるいは文章）。可能であれば短い種別プレフィックス（`docs:`、`feat:`、`fix:` など）とし、主題は簡潔に。
- PR には以下を含めること:
  - 変更内容と目的の簡単な要約
  - 該当する場合は関連 issue/ticket のリンク
  - UI 変更時はスクリーンショットや画面録画

## エージェント用の指示
- あなたが開発を効率的に進めることのできるように、スキルを用意してあります。それを活用して開発を進めて下さい。(expoのskillsです)