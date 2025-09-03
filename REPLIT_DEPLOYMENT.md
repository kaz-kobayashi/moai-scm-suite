# Replit デプロイメントガイド

## 重要な制約事項

Replitでは以下の制約があります：

1. **OSRMサーバー不可**: Replitでは外部OSRMサーバー（test-osrm-intel.aq-cloud.com）への接続が制限される可能性があります
2. **バイナリファイル**: metroVIバイナリは動作しない可能性があります
3. **メモリ制限**: 無料プランでは制限があります

## デプロイ手順

### 1. Replitアカウント作成
https://replit.com でアカウントを作成

### 2. 新しいReplを作成

1. "Create Repl"をクリック
2. "Import from GitHub"を選択（GitHubリポジトリが必要）
3. または"Blank Repl"で"Python"を選択

### 3. ファイルアップロード

以下のファイル/フォルダをアップロード：
- `webapp/` （バックエンド）
- `frontend/` （フロントエンド）
- `nbs/core.py` （共有モジュール）
- `.replit`
- `replit.nix`
- `start_replit.sh`

### 4. 環境変数設定

Replitの"Secrets"タブで設定：
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_API_URL=/api/v1
```

### 5. ビルドとデプロイ

Shellで実行：
```bash
chmod +x start_replit.sh
./start_replit.sh
```

## 代替デプロイメント方法

### 簡易版（バックエンドのみ）

1. **webapp**フォルダのみアップロード
2. `.replit`を以下に変更：

```
run = "pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

3. APIのみ使用（フロントエンドは別途Vercelなどでホスト）

## より良い代替案

### 1. **Railway.app**
- Dockerサポート
- 環境変数管理
- 自動デプロイ
- 無料枠あり

### 2. **Render.com**
- 静的サイトホスティング無料
- Webサービス無料枠
- 自動ビルド・デプロイ

### 3. **Vercel + Heroku**
- Vercel: フロントエンド（無料）
- Heroku: バックエンド（無料枠）

### 4. **Google Cloud Run**
- コンテナベース
- 自動スケーリング
- 従量課金

## Replit用の調整

### フロントエンドの調整

`frontend/package.json`に追加：
```json
{
  "proxy": "http://localhost:8000",
  "homepage": "/"
}
```

### APIエンドポイントの調整

`frontend/src/services/api.ts`を修正：
```typescript
const API_URL = process.env.REACT_APP_API_URL || '/api/v1';
```

### 機能制限

以下の機能はReplitで動作しない可能性があります：
- VRP（OSRMサーバー依存）
- 一部の最適化アルゴリズム（メモリ制限）

## トラブルシューティング

### ビルドエラー
```bash
# メモリ不足の場合
export NODE_OPTIONS="--max-old-space-size=512"
```

### ポート問題
Replitは自動的にポートを割り当てます。

### パフォーマンス
無料プランでは遅い可能性があります。

## 推奨事項

**本番環境では以下を推奨**：
1. **Vercel** (フロントエンド) + **Railway** (バックエンド)
2. **Render.com** (フルスタック)
3. **Google Cloud Platform** (エンタープライズ)

Replitは開発・デモ用途には適していますが、本番環境では制約が多いです。