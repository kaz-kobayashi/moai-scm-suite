# GitHub Actions自動デプロイ設定ガイド

## 🚀 概要

GitHub Actionsを使用してGoogle Cloud Runへの自動デプロイを設定する完全ガイドです。コードを`main`ブランチにプッシュするだけで自動的にデプロイされます。

## 📋 前提条件

- Google Cloud アカウント（無料枠でOK）
- GitHub アカウント
- Google OAuth Client ID（認証用）

## ⚡ クイックセットアップ（推奨）

### ステップ1: Google Cloud プロジェクト作成

```bash
# プロジェクト作成
gcloud projects create moai-scm-suite-[RANDOM] # [RANDOM]は任意の文字列
gcloud config set project moai-scm-suite-[RANDOM]

# 必要なAPIを有効化
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

### ステップ2: Workload Identity Federation設定

```bash
# リポジトリをクローン（まだの場合）
git clone https://github.com/kaz-kobayashi/moai-scm-suite.git
cd moai-scm-suite

# セットアップスクリプト実行
chmod +x setup-workload-identity.sh
./setup-workload-identity.sh
```

### ステップ3: GitHub Secrets設定

GitHubリポジトリで **Settings → Secrets and variables → Actions** に移動し、以下を追加：

| Secret名 | 値 | 説明 |
|----------|----|----|
| `GCP_PROJECT_ID` | `moai-scm-suite-[RANDOM]` | Google Cloudプロジェクト ID |
| `GCP_SA_EMAIL` | `moai-github-deployer@[PROJECT_ID].iam.gserviceaccount.com` | サービスアカウントメール |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/[NUMBER]/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | Workload Identity Provider |
| `GOOGLE_CLIENT_ID` | `[YOUR_OAUTH_CLIENT_ID]` | Google OAuth Client ID |

### ステップ4: デプロイ実行

```bash
# コードをプッシュして自動デプロイ開始
git add .
git commit -m "Setup GitHub Actions deployment"
git push origin main
```

## 🔧 詳細設定手順

### 1. Google Cloudサービスアカウント作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create moai-github-deployer \
    --description="Service account for GitHub Actions deployment" \
    --display-name="MOAI GitHub Deployer"

# 必要な権限を付与
gcloud projects add-iam-policy-binding [PROJECT_ID] \
    --member="serviceAccount:moai-github-deployer@[PROJECT_ID].iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding [PROJECT_ID] \
    --member="serviceAccount:moai-github-deployer@[PROJECT_ID].iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding [PROJECT_ID] \
    --member="serviceAccount:moai-github-deployer@[PROJECT_ID].iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### 2. Workload Identity Pool作成

```bash
# Workload Identity Pool作成
gcloud iam workload-identity-pools create github-actions-pool \
    --project=[PROJECT_ID] \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Workload Identity Provider作成
gcloud iam workload-identity-pools providers create-oidc github-actions-provider \
    --project=[PROJECT_ID] \
    --location="global" \
    --workload-identity-pool=github-actions-pool \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-condition="assertion.repository=='kaz-kobayashi/moai-scm-suite'"

# サービスアカウントバインディング
gcloud iam service-accounts add-iam-policy-binding \
    moai-github-deployer@[PROJECT_ID].iam.gserviceaccount.com \
    --project=[PROJECT_ID] \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/[PROJECT_NUMBER]/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/kaz-kobayashi/moai-scm-suite"
```

### 3. Google OAuth設定

1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client IDs**
3. **Application type**: Web application
4. **Authorized JavaScript origins**:
   - `http://localhost:3000` (開発用)
5. **Authorized redirect URIs**:
   - `http://localhost:3000` (開発用)
   - `https://moai-scm-suite-[HASH].a.run.app` (本番用、デプロイ後に追加)

## 🛠️ GitHub Actions Workflow詳細

### ワークフロー構成

```yaml
name: Deploy to Google Cloud Run
on:
  push:
    branches: [ main ]      # mainブランチプッシュで実行
  workflow_dispatch:        # 手動実行可能

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
    - name: Google Auth (Workload Identity)  
    - name: Configure Docker
    - name: Build Docker image
    - name: Push to Container Registry
    - name: Deploy to Cloud Run
```

### デプロイプロセス

1. **コードチェックアウト**: GitHubからソースコードを取得
2. **Google認証**: Workload Identity Federationで認証
3. **Dockerビルド**: マルチステージビルドでイメージ作成
4. **レジストリプッシュ**: Google Container Registryにアップロード
5. **Cloud Runデプロイ**: 本番環境に自動デプロイ

## 📊 デプロイメント監視

### GitHub Actionsログ確認

1. **GitHubリポジトリ** → **Actions**タブ
2. 最新のワークフローをクリック
3. 各ステップの詳細ログを確認

### Cloud Run確認

```bash
# デプロイ状況確認
gcloud run services list --region=asia-northeast1

# サービス詳細確認
gcloud run services describe moai-scm-suite --region=asia-northeast1

# ログ確認
gcloud logging read "resource.type=cloud_run_revision" --limit=20
```

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. Workload Identity権限エラー
```bash
# 権限確認
gcloud iam service-accounts get-iam-policy moai-github-deployer@[PROJECT_ID].iam.gserviceaccount.com
```

#### 2. Docker ビルドエラー  
- GitHub Actionsは自動的にlinux/amd64環境でビルド
- ローカルのArchitecture mismatch問題は発生しない

#### 3. Cloud Run起動エラー
```bash
# ログ詳細確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=moai-scm-suite" --limit=10
```

#### 4. 環境変数設定エラー
- GitHub Secretsの設定を確認
- 特殊文字がある場合はエスケープ処理

## 🎯 デプロイ成功の確認

### 1. GitHub Actions成功
- ✅ All checks passed
- 🟢 Deployment successful

### 2. アプリケーション動作確認
```bash
# デプロイされたURL取得
gcloud run services describe moai-scm-suite \
  --region=asia-northeast1 \
  --format='value(status.url)'

# ヘルスチェック
curl [DEPLOYED_URL]/health
```

### 3. 機能テスト
- Google認証ログイン
- ABC分析実行
- VRP最適化実行
- インベントリ最適化実行

## 🚀 継続的デプロイメント

### 自動デプロイフロー

```
コード変更 → git push → GitHub Actions → Docker Build → Cloud Run Deploy → 本番稼働
```

### デプロイ戦略

- **Blue-Green Deployment**: Cloud Runが自動で実行
- **Zero Downtime**: 新バージョンへの段階的移行
- **Rollback**: 前バージョンへの即座復旧可能

## 📈 本番運用のベストプラクティス

### 1. 環境分離
```bash
# 開発環境
gcloud run deploy moai-scm-suite-dev --region=asia-northeast1

# 本番環境  
gcloud run deploy moai-scm-suite --region=asia-northeast1
```

### 2. モニタリング設定
```bash
# アラート設定
gcloud alpha monitoring policies create --config-from-file=monitoring-policy.yaml
```

### 3. セキュリティ
- 最小権限の原則
- シークレット管理
- アクセスログ監視

## 💡 追加Tips

- **デプロイ時間**: 通常5-10分
- **コスト**: 従量課金（無料枠内で運用可能）
- **スケーリング**: 自動スケーリング設定済み
- **メンテナンス**: GitHub Actionsワークフローで自動化

GitHub Actionsによる自動デプロイでMOAI SCM Suiteの継続的デリバリーが実現されます！ 🎉