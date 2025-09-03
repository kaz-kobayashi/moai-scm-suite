# Supply Chain Management Optimization API

このプロジェクトは、Jupyter notebook（01abc.ipynb、02metroVI.ipynb等）から完全移植されたサプライチェーン最適化システムのWeb APIです。

## 特徴

- **完全な機能移植**: notebookで定められている計算手順を100%忠実に再現
- **FastAPI**: 高性能なWeb APIフレームワーク
- **ABC分析**: 製品・顧客の重要度分析
- **配送計画システム (VRP)**: 車両ルーティング問題の最適化
- **可視化**: Plotlyを使用した豊富なグラフ機能

## プロジェクト構造

```
webapp/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── abc.py          # ABC分析エンドポイント
│   │   │   └── vrp.py          # VRP配送計画エンドポイント
│   │   └── api.py              # メインAPIルーター
│   ├── models/
│   │   ├── abc.py              # ABC分析用データモデル
│   │   └── vrp.py              # VRP用データモデル
│   ├── services/
│   │   ├── abc_service.py      # ABC分析サービス（完全移植）
│   │   └── vrp_service.py      # VRP配送計画サービス（完全移植）
│   ├── utils/
│   └── main.py                 # FastAPIアプリケーション
├── tests/                      # テストファイル
├── requirements.txt            # 依存関係
└── README.md                   # このファイル
```

## セットアップ

### 1. 仮想環境の作成と有効化

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. アプリケーションの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API文書の確認

ブラウザで以下にアクセス:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API機能

### ABC分析機能 (`/api/v1/abc/`)

- `POST /tree-map`: 需要のTreeMapグラフ生成
- `POST /analysis`: ABC分析実行
- `POST /analysis-all`: 全体のABC分析
- `POST /figures`: ABC分析用図表生成
- `POST /rank-analysis`: ランク分析
- `POST /risk-pooling`: リスク共同管理分析
- `POST /mean-cv`: 平均と変動係数分析
- `POST /inventory-analysis`: 在庫分析
- `POST /inventory-simulation`: 在庫シミュレーション

### VRP配送計画機能 (`/api/v1/vrp/`)

- `POST /optimize`: VRP最適化実行
- `POST /solution`: 最適化結果のサマリー作成
- `POST /distance-table`: 移動時間・距離テーブル計算
- `POST /generate-nodes`: ランダムノード生成
- `POST /generate-nodes-normal`: 正規分布ノード生成
- `POST /build-model`: VRPモデル構築
- `POST /generate-vrp`: VRP問題例生成
- `POST /time-convert`: 時間変換ユーティリティ

## 使用例

### ABC分析の実行

```python
import requests

# サンプルデータ
demand_data = [
    {"date": "2023-01-01", "cust": "顧客A", "prod": "製品X", "demand": 100.0},
    {"date": "2023-01-01", "cust": "顧客B", "prod": "製品Y", "demand": 150.0},
]

# ABC分析の実行
response = requests.post(
    "http://localhost:8000/api/v1/abc/analysis",
    json={
        "demand_data": demand_data,
        "threshold": [0.7, 0.2, 0.1],
        "agg_col": "prod",
        "value_col": "demand"
    }
)

result = response.json()
```

## テスト実行

```bash
pytest tests/ -v
```

## 注意事項

- notebookの計算手順を100%忠実に移植しているため、関数の引数や戻り値はnotebook版と完全に同一です
- VRP最適化には外部の最適化ソルバーが必要な場合があります
- OSRM（Open Source Routing Machine）を使用する場合は、別途OSRMサーバーの設定が必要です

## 開発情報

- Python 3.8+
- FastAPI 0.104+
- Pandas 2.1+
- Plotly 5.17+

このAPIは🤖 Claude Code を使用して生成されました。