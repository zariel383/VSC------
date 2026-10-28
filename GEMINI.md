# Workspace Rules: VSC保存ファイル (個人Webサイト & ロシア語解析ツール)

## 1. プロジェクト概要と世界観
- **概要**: レトロPC・個人サイト風の温かみと独自の世界観を持つWebサイト群（トップページ、ブログ連携、2ストSE保管庫、写真と音のページ、ロシア語構文解析ツール等）。
- **デザイン原則**:
  - 既存の配色（黒×黄色アクセント、草原背景、レトロフォント、テーブル表現等）の世界観を100%維持する。
  - **モバイル・タブレット対応（レスポンシブ）**:
    - 画面外への横はみ出し（`documentElement.scrollWidth > clientWidth`）を発生させない（`box-sizing: border-box`、`max-width: 100%`、フォントの `clamp()` 指定）。
    - 情報量の多い大きな `<table>`（例: `2stse.html`）は無理に潰さず、`<div class="table-scroll-wrapper">`（`overflow-x: auto`）で包み、横スクロール案内バッジを添える。
    - `index.html` の3カラムはモバイル時（1024px以下）に縦並びとし、Flexbox `order` で**中央メインコンテンツを最上部**に配置する。

---

## 2. バックエンド・API・セキュリティ仕様 (PHP 8.x)
- **機密情報の分離**:
  - Gemini APIキーおよび microCMS APIキーは [config.php](file:///m:/VSC保存ファイル/config.php) に集約して管理し、絶対に他のPHPファイルやHTML/JS内にハードコードしない。
- **各PHPエンドポイントの仕様**:
  - [analyze.php](file:///m:/VSC保存ファイル/analyze.php):
    - ロシア語構文解析プロキシ（`POST` 限定、最大500文字・32KB制限）。
    - モデルは高速・高精度な `gemini-3.1-flash-lite` を使用し、**`responseSchema`（Structured Outputs）** によって `word`, `phonetic`, `analysis`, `relation` のJSON構造を100%保証する。
    - 同一文章の解析結果は `cache/` ディレクトリにハッシュ名で7日間キャッシュし、再リクエスト時は即時応答する。
  - [api.php](file:///m:/VSC保存ファイル/api.php):
    - microCMS ブログ記事取得プロキシ（`GET` 限定）。記事IDは正規表現 `/^[a-zA-Z0-9_-]{1,64}$/` で厳格に検証し、SSRF/パストラバーサルを防止。
  - [api/counter.php](file:///m:/VSC保存ファイル/api/counter.php):
    - アクセスカウンター（`GET` 限定、`flock` による排他ロック処理）。
- **アクセス制御 (`.htaccess`)**:
  - [.htaccess](file:///m:/VSC保存ファイル/.htaccess) および [api/.htaccess](file:///m:/VSC保存ファイル/api/.htaccess)、`cache/.htaccess` により、`config.php`、`count.txt`、`.git`、`.env` 等へのブラウザ直接アクセスを `403 Forbidden` で遮断する。

---

## 3. ローカル開発環境 (VS Code Live Server & PHP)
- **HTML/CSS/JS の通常プレビュー**:
  - VS Code 拡張機能「Live Server」（ポート `5500`）を使用。
  - [.vscode/settings.json](file:///m:/VSC保存ファイル/.vscode/settings.json) の `"liveServer.settings.proxy.enable"` は通常時は `false` に設定する（PHPサーバー未起動時に `true` だと `AggregateError` が発生するため）。
- **PHP連携テスト時**:
  - ローカルで `api.php` や `analyze.php` を動かす場合は、タスク `php -S 127.0.0.1:8000` を起動した上でプロキシを有効化するか、PHPビルトインサーバー経由で検証する。

---

## 4. 本番デプロイ環境 (さくらのレンタルサーバ & GitHub Actions)
- **本番サーバー**: さくらのレンタルサーバ ライトプラン（PHP 8.3 / FreeBSD / 公開ディレクトリ `./www/`）。
- **デプロイ方式**: [.github/workflows/deploy.yml](file:///m:/VSC保存ファイル/.github/workflows/deploy.yml) による **GitHub Actions 手動実行（`workflow_dispatch`）** + `SamKirkland/FTP-Deploy-Action`（FTPS ポート21、`security: loose`）。
- **アップロード除外の鉄則**:
  - `.git*`, `.github*`, `.vscode*`, `GEMINI.md`, `AGENTS.md`, `.agent*`, `README.md`, 一時ファイル（`*.bak`, `*.tmp`, `*.log`）は公開サーバーにアップロードしてはならない。

