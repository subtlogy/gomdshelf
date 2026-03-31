# gomdshelf

Go 製の軽量セルフホスト型ドキュメントサーバー。単一バイナリ、Markdown ベース、リアルタイムプレビュー、ダークモード、エディタ内蔵 — データベース不要。

## 特徴

- **単一バイナリ** — ビルド時に全アセットを埋め込み、どこでもデプロイ可能
- **Markdown** — GFM、シンタックスハイライト(Chroma)、タスクリスト、脚注、KaTeX 数式、Mermaid 図、Admonition
- **エディタ内蔵** — ページ全体 / セクション単位の編集、ライブプレビュー、画像ドラッグ＆ドロップ、自動下書き保存
- **ナビゲーション** — ドラッグ＆ドロップでサイドバー並べ替え、ディレクトリ折りたたみ、パンくずリスト
- **検索** — 全ページ横断のインスタント全文検索
- **履歴** — ページ単位のバージョン履歴、差分ビューア、ワンクリック復元
- **テーマ** — 4 色テーマ(青・緑・赤・黄) + ダークモード
- **i18n** — 英語・日本語 UI、ブラウザ言語から自動判定
- **ライブリロード** — WebSocket ベース、ファイル変更時に自動更新
- **セキュリティ** — パストラバーサル防止、画像マジックバイト検証、Basic 認証対応

## クイックスタート

### Docker(推奨)

```yaml
# compose.yaml
services:
  gomdshelf:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./docs:/docs/src
      - ./backups:/backups
    environment:
      - SITE_NAME=My Docs
```

```bash
docker compose up -d
```

### バイナリ

```bash
# ビルド
go build -ldflags="-s -w" -o gomdshelf .

# 実行
DOCS_DIR=./docs BACKUP_DIR=./backups SITE_NAME="My Docs" ./gomdshelf
```

http://localhost:8000 を開く

## 設定

| 環境変数 | デフォルト | 説明 |
|---|---|---|
| `DOCS_DIR` | `/docs/src` | Markdown ファイルのディレクトリ |
| `BACKUP_DIR` | `/backups` | バージョン履歴の保存先 |
| `SITE_NAME` | `My Docs` | ヘッダーとサイドバーに表示するサイト名 |
| `LISTEN_ADDR` | `:8000` | リッスンアドレス |
| `GOMDSHELF_AUTH` | *(なし)* | Basic 認証の資格情報(`user:password`) |
| `GOMDSHELF_LANG` | *(自動)* | デフォルト UI 言語(`en` または `ja`) |
