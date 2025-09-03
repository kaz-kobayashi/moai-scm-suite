# Google Cloud Run デプロイメントガイド

## 概要

Google Cloud Runは、コンテナ化されたアプリケーションを簡単にデプロイできるフルマネージドサービスです。SCMOptアプリケーションを本番環境にデプロイする手順を説明します。

## 前提条件

1. **Google Cloud アカウント**
   - 有効な請求先アカウント
   - プロジェクトの作成

2. **ローカル環境**
   - Docker Desktop インストール済み
   - Google Cloud SDK (gcloud) インストール済み

3. **必要な権限**
   - Cloud Run 管理者
   - Storage 管理者
   - Cloud Build エディタ

## セットアップ手順

### 1. Google Cloud SDK のインストール

```bash
# macOS
brew install google-cloud-sdk

# または公式インストーラー
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. gcloud の初期設定

```bash
# ログイン
gcloud auth login

# プロジェクトの作成または選択
gcloud projects create scmopt-production --name="SCMOpt Production"
gcloud config set project scmopt-production

# 請求先アカウントをリンク（GCPコンソールで実行）
```

### 3. 必要なAPIの有効化

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## デプロイ方法

### 方法1: 自動デプロイスクリプト

```bash
# deploy-to-cloud-run.sh を編集
nano deploy-to-cloud-run.sh

# PROJECT_ID を設定
PROJECT_ID="your-actual-project-id"

# スクリプト実行
./deploy-to-cloud-run.sh
```

### 方法2: 手動デプロイ

#### 1. Docker イメージのビルド

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-project-id"

# イメージをビルド
docker build -t gcr.io/${PROJECT_ID}/scmopt:latest .
```

#### 2. Google Container Registry へプッシュ

```bash
# Docker認証設定
gcloud auth configure-docker

# イメージをプッシュ
docker push gcr.io/${PROJECT_ID}/scmopt:latest
```

#### 3. Cloud Run へデプロイ

```bash
gcloud run deploy scmopt \
  --image gcr.io/${PROJECT_ID}/scmopt:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "OSRM_HOST=test-osrm-intel.aq-cloud.com"
```

### 方法3: Cloud Build による自動化

```bash
# GitHubリポジトリとの連携設定後
gcloud builds submit --config cloudbuild.yaml
```

## 環境変数とシークレット管理

### 1. Google OAuth設定

```bash
# Secret Manager でシークレット作成
echo -n "your-google-client-id" | gcloud secrets create google-oauth-client-id --data-file=-

# Cloud Run で使用
gcloud run services update scmopt \
  --update-env-vars REACT_APP_GOOGLE_CLIENT_ID=$(gcloud secrets versions access latest --secret="google-oauth-client-id")
```

### 2. その他の環境変数

```bash
gcloud run services update scmopt \
  --set-env-vars "OSRM_HOST=test-osrm-intel.aq-cloud.com" \
  --set-env-vars "MAPBOX_ACCESS_TOKEN=your-mapbox-token"
```

## カスタムドメインの設定

### 1. ドメインマッピング

```bash
# ドメインの確認
gcloud domains verify your-domain.com

# マッピング作成
gcloud run domain-mappings create \
  --service scmopt \
  --domain scmopt.your-domain.com \
  --region asia-northeast1
```

### 2. DNS設定

Cloud Runが提供するCNAMEレコードをDNSプロバイダーに設定：
```
scmopt.your-domain.com. CNAME ghs.googlehosted.com.
```

## 認証とセキュリティ

### 1. Google認証の更新

Google Cloud Console で OAuth 2.0 クライアントIDの設定を更新：

```
承認済みのJavaScript生成元:
- https://scmopt-xxxxx-an.a.run.app
- https://scmopt.your-domain.com

承認済みのリダイレクトURI:
- https://scmopt-xxxxx-an.a.run.app
- https://scmopt.your-domain.com
```

### 2. IAMポリシー（認証が必要な場合）

```bash
# 特定のユーザーにアクセスを許可
gcloud run services add-iam-policy-binding scmopt \
  --member="user:user@example.com" \
  --role="roles/run.invoker" \
  --region asia-northeast1
```

## モニタリングと運用

### 1. ログの確認

```bash
# リアルタイムログ
gcloud logs tail --service-name=scmopt

# エラーログのフィルタリング
gcloud logs read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 50
```

### 2. メトリクスの監視

Google Cloud Console > Cloud Run > サービス詳細 で確認：
- リクエスト数
- レイテンシ
- CPU/メモリ使用率
- エラー率

### 3. アラートの設定

```bash
# CPU使用率アラート
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High CPU Usage" \
  --condition-display-name="CPU > 80%" \
  --condition-expression='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/container/cpu/utilizations" AND metric.value > 0.8'
```

## コスト最適化

### 1. 最小インスタンス数の設定

```bash
# コールドスタート回避（コスト増）
gcloud run services update scmopt --min-instances=1

# コスト削減（レスポンス遅延あり）
gcloud run services update scmopt --min-instances=0
```

### 2. 同時実行数の調整

```bash
gcloud run services update scmopt --concurrency=100
```

## トラブルシューティング

### よくある問題

1. **メモリ不足エラー**
   ```bash
   gcloud run services update scmopt --memory 4Gi
   ```

2. **タイムアウトエラー**
   ```bash
   gcloud run services update scmopt --timeout 900
   ```

3. **コンテナ起動失敗**
   - Dockerfileの確認
   - ローカルでのテスト: `docker run -p 8080:8080 gcr.io/PROJECT_ID/scmopt`

4. **OSRM接続エラー**
   - VPCコネクタの設定が必要な場合があります

## CI/CDパイプライン

### GitHub Actions 統合

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - uses: google-github-actions/auth@v0
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}
    
    - uses: google-github-actions/setup-gcloud@v0
    
    - name: Build and Deploy
      run: |
        gcloud builds submit --config cloudbuild.yaml
```

## 推定コスト

### 無料枠（月額）
- 200万リクエスト
- 360,000 GB-秒のメモリ
- 180,000 vCPU-秒のCPU

### 有料利用の場合（東京リージョン）
- リクエスト: $0.40 / 100万リクエスト
- メモリ: $0.0000025 / GB-秒
- CPU: $0.000024 / vCPU-秒

### 月額推定（中規模利用）
- 1日1万リクエスト × 30日 = 約$1.20
- メモリ（2GB常時）= 約$5.40
- CPU = 約$3.60
- **合計: 約$10-15/月**

## ベストプラクティス

1. **ヘルスチェック実装**
2. **適切なリソース設定**
3. **環境変数の外部化**
4. **ログとモニタリング**
5. **自動スケーリング設定**
6. **セキュリティスキャン**

## 参考リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [料金計算ツール](https://cloud.google.com/products/calculator)
- [ベストプラクティス](https://cloud.google.com/run/docs/best-practices)