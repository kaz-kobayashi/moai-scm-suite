# GitHub Actions デプロイエラー対処法

## 🚨 現在のエラー状況

GitHub Actionsのデプロイジョブが「Process completed with exit code 1」で失敗しています。

## 🔧 解決手順

### ステップ1: GitHub Secretsの確認・設定

1. **GitHubリポジトリにアクセス**: https://github.com/kaz-kobayashi/moai-scm-suite
2. **Settings → Secrets and variables → Actions** に移動
3. 以下の4つのSecretsが設定されているかチェック:

| Secret Name | 必須 | 値の例 | 説明 |
|-------------|------|--------|------|
| `GCP_PROJECT_ID` | ✅ | `moai-scm-suite` | Google Cloud プロジェクト ID |
| `GCP_SA_EMAIL` | ✅ | `moai-github-deployer@moai-scm-suite.iam.gserviceaccount.com` | サービスアカウント メール |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | ✅ | `projects/649697157117/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | Workload Identity Provider |
| `GOOGLE_CLIENT_ID` | ⚠️ | `123456789-abcd.googleusercontent.com` | Google OAuth Client ID（オプション） |

### ステップ2: 詳細エラーログの確認

1. **GitHub Actions ページ**: https://github.com/kaz-kobayashi/moai-scm-suite/actions
2. **失敗したワークフロー**をクリック
3. **deploy ジョブ**をクリック
4. **各ステップを展開**してエラー詳細を確認

## 🎯 よくあるエラーパターンと対処法

### エラー1: "Workload Identity Provider not found"
```
Error: Workload Identity Provider not found
```
**原因**: `GCP_WORKLOAD_IDENTITY_PROVIDER` の値が間違っている
**解決**: 正確な値を再設定

### エラー2: "Permission denied"
```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED
```
**原因**: サービスアカウントの権限不足
**解決**: 権限を再確認・追加

### エラー3: "Service account not found"
```
Error: Service account not found
```
**原因**: `GCP_SA_EMAIL` の値が間違っている
**解決**: 正確なメールアドレスを設定

### エラー4: "Project not found"
```
Error: Project not found
```
**原因**: `GCP_PROJECT_ID` が間違っているか、プロジェクトが存在しない
**解決**: プロジェクト ID を確認

## 🔄 手動トラブルシューティング

### Google Cloud設定の確認

```bash
# プロジェクト確認
gcloud config get-value project

# サービスアカウント確認
gcloud iam service-accounts list --filter="email:moai-github-deployer*"

# Workload Identity Pool確認
gcloud iam workload-identity-pools list --location=global

# 権限確認
gcloud projects get-iam-policy moai-scm-suite --filter="bindings.members:*moai-github-deployer*"
```

## 🛠️ 修正手順

### Option A: Secretsが未設定の場合

1. **GitHub Secrets設定**:
   - https://github.com/kaz-kobayashi/moai-scm-suite/settings/secrets/actions
   - 上記の表の値をすべて追加

2. **再デプロイ実行**:
   ```bash
   # ローカルで小さな変更
   echo "Fix GitHub Actions" >> deployment-fix.md
   git add deployment-fix.md
   git commit -m "Fix GitHub Actions deployment configuration"
   git push origin main
   ```

### Option B: Workload Identity問題の場合

```bash
# Workload Identity再設定
./setup-workload-identity.sh

# 表示される設定値をGitHub Secretsに再設定
```

### Option C: 権限問題の場合

```bash
# サービスアカウント権限再付与
gcloud projects add-iam-policy-binding moai-scm-suite \
    --member="serviceAccount:moai-github-deployer@moai-scm-suite.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding moai-scm-suite \
    --member="serviceAccount:moai-github-deployer@moai-scm-suite.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

## 📋 デバッグ用GitHub Actions修正版

もしエラーが続く場合は、デバッグ情報を追加したワークフローを使用:

```yaml
- name: Debug Information
  run: |
    echo "Project ID: ${{ env.PROJECT_ID }}"
    echo "Service Account: ${{ secrets.GCP_SA_EMAIL }}"
    echo "Region: ${{ env.REGION }}"
    gcloud config list
    gcloud auth list
```

## 🚀 成功確認方法

デプロイが成功すると:

1. ✅ GitHub Actions が緑色のチェックマーク
2. ✅ Cloud Run サービスが正常起動
3. 🌐 アクセス可能なURL生成

```bash
# 成功確認コマンド
gcloud run services describe moai-scm-suite \
  --region=asia-northeast1 \
  --format='value(status.url)'
```

## 📞 追加サポート

問題が解決しない場合:
1. GitHub Actions の詳細ログをスクリーンショット
2. Google Cloud の設定状況を確認
3. エラーメッセージの全文を記録

これらの情報があれば、より具体的な解決策を提供できます。