# デプロイメントガイド

本ドキュメントでは、SCMOpt Webアプリケーションの本番環境へのデプロイ方法を説明します。

## デプロイメント方式

### 1. Docker を使用した デプロイ（推奨）

#### Dockerfile for Backend
```dockerfile
# webapp/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# システム依存関係
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコード
COPY app/ ./app/
COPY metroVI-linux-intel ./metroVI-linux-intel
RUN chmod +x ./metroVI-linux-intel

# コアモジュール
COPY ../nbs/core.py ./

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./webapp
    ports:
      - "8000:8000"
    environment:
      - OSRM_HOST=test-osrm-intel.aq-cloud.com
    depends_on:
      - redis  # キャッシュ用（オプション）

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  redis:  # オプション：パフォーマンス向上のため
    image: redis:alpine
    ports:
      - "6379:6379"
```

### 2. クラウドプラットフォームでのデプロイ

#### AWS での デプロイ
- **EC2**: 上記Dockerイメージを使用
- **ECS/Fargate**: コンテナベースデプロイ
- **Lambda**: サーバーレス（API Gateway + Lambda）
- **S3 + CloudFront**: フロントエンド静的ホスティング

#### Google Cloud での デプロイ
- **Cloud Run**: コンテナベースデプロイ
- **App Engine**: フルマネージドデプロイ
- **Cloud Storage + CDN**: フロントエンド静的ホスティング

#### Azure での デプロイ
- **Container Instances**: コンテナベースデプロイ
- **App Service**: フルマネージドデプロイ
- **Static Web Apps**: フロントエンド専用

### 3. 従来型サーバーでのデプロイ

#### バックエンド（Ubuntu/CentOS）
```bash
# Python 3.8+ のインストール
sudo apt update
sudo apt install python3 python3-pip python3-venv

# アプリケーションのデプロイ
cd /opt/scmopt
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# systemd サービス作成
sudo cp scmopt-backend.service /etc/systemd/system/
sudo systemctl enable scmopt-backend
sudo systemctl start scmopt-backend
```

#### フロントエンド（Nginx）
```bash
# Node.js のインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ビルドとデプロイ
cd frontend
npm install
npm run build

# Nginxにデプロイ
sudo cp -r build/* /var/www/html/
sudo systemctl restart nginx
```

## 環境変数

### バックエンド
```bash
# .env
OSRM_HOST=test-osrm-intel.aq-cloud.com
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWlraW9rdWJvIiwiYSI6ImNqYXQ3dHBqdzR5ZGwyd3BkeG5rOTl0b2UifQ.1utsXNi2V-WdzfWlvCMj_A
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### フロントエンド
```bash
# .env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoibWlraW9rdWJvIiwiYSI6ImNqYXQ3dHBqdzR5ZGwyd3BkeG5rOTl0b2UifQ.1utsXNi2V-WdzfWlvCMj_A
```

## セキュリティ考慮事項

1. **CORS設定**: 本番環境では適切なオリジンのみ許可
2. **API認証**: 必要に応じてJWT認証を実装
3. **HTTPS**: SSL/TLS証明書の設定
4. **環境変数**: 機密情報をコードに含めない

## モニタリング

### ヘルスチェック
- バックエンド: `GET /health`
- フロントエンド: アプリケーションの応答確認

### ログ
- バックエンド: uvicornのアクセスログ
- フロントエンド: ブラウザコンソールログ

## スケーリング

### 水平スケーリング
- 複数のバックエンドインスタンス
- ロードバランサー（Nginx/HAProxy）
- データベース分離（必要に応じて）

### 垂直スケーリング
- CPUとメモリの増強
- 最適化アルゴリズムの並列化

## バックアップとリストア

### データバックアップ
- ユーザーアップロードファイル
- 最適化結果データ
- アプリケーション設定

### リストア手順
1. バックアップファイルの復元
2. 依存関係の再インストール
3. サービスの再起動

## 更新とメンテナンス

### アプリケーション更新
1. 新しいコードをpull
2. 依存関係の更新
3. テストの実行
4. サービスの再起動

### セキュリティ更新
- 定期的な依存関係の更新
- セキュリティパッチの適用
- 脆弱性スキャンの実行