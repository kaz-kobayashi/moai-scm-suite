#!/bin/bash
# Cloud Run Proxy Script

echo "🚀 Cloud Run プロキシを開始します..."
echo "ブラウザで http://localhost:8080 にアクセスしてください"
echo ""

# 認証トークンを取得
export TOKEN=$(gcloud auth print-identity-token)

# プロキシサーバーを起動
echo "プロキシサーバーを起動中..."
gcloud run services proxy moai-scm-suite --region=asia-northeast1 --port=8080