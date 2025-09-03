# Jupyter Notebook リファクタリング・ダッシュボード化プロンプト

## 概要

このプロンプトは、サプライチェイン最適化システム（scmopt）のJupyter Notebookファイル群を徹底的にリファクタリングし、FastAPIを使用したWebダッシュボードアプリケーションに変換するためのガイドラインです。

## 対象ファイル

### 1. 01abc.ipynb - サプライチェイン基本分析システム（SCBAS）
**機能**: ABC分析とランク分析、在庫管理分析
**主要な実装内容**:
- ABC分析による製品・顧客の分類
- ランク分析による時系列変化の追跡
- リスク共同管理分析
- 在庫最適化（安全在庫、ロットサイズ計算）
- 生産・在庫シミュレーション

**主要クラス・関数**:
- `Scbas`クラス: 基本分析機能を統合
- `demand_tree_map()`: 需要の可視化
- `abc_analysis()`: ABC分析実行
- `inventory_analysis()`: 在庫分析

### 2. 02metroVI.ipynb - 配送計画システム（METRO VI）
**機能**: 車両配送経路最適化（VRP）
**主要な実装内容**:
- 複数時間枠制約対応VRP
- 多次元容量非等質運搬車
- 配達・集荷・積み込み・積み降ろし
- 複数デポ・休憩・スキル条件
- OSRM連携による実地図データ使用
- Excel連携による簡易インターフェース

**主要クラス・関数**:
- `Job`, `Shipment`, `Vehicle`, `Model`クラス: VRPデータモデル
- `optimize_vrp()`: 最適化実行
- `generate_vrp()`: 問題例生成
- `make_fig_for_vrp()`: 地図描画

## リファクタリング方針

### 1. アーキテクチャ設計
```
webapp/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI メインアプリケーション
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # 設定管理
│   │   └── database.py         # データベース接続
│   ├── api/
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── __init__.py
│   │   │   ├── abc.py          # ABC分析API
│   │   │   ├── inventory.py    # 在庫分析API
│   │   │   ├── vrp.py          # 配送計画API
│   │   │   └── visualization.py # 可視化API
│   │   └── deps.py             # 依存関係
│   ├── models/
│   │   ├── __init__.py
│   │   ├── abc.py              # ABC分析データモデル
│   │   ├── inventory.py        # 在庫管理データモデル
│   │   └── vrp.py              # VRPデータモデル
│   ├── services/
│   │   ├── __init__.py
│   │   ├── abc_service.py      # ABC分析ビジネスロジック
│   │   ├── inventory_service.py # 在庫管理ビジネスロジック
│   │   └── vrp_service.py      # VRPビジネスロジック
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── data_processing.py  # データ前処理
│   │   └── visualization.py    # 可視化ユーティリティ
│   └── static/                 # 静的ファイル
└── frontend/                   # フロントエンド（React/Vue.js）
    ├── src/
    │   ├── components/
    │   │   ├── ABC/            # ABC分析コンポーネント
    │   │   ├── Inventory/      # 在庫管理コンポーネント
    │   │   └── VRP/            # 配送計画コンポーネント
    │   ├── pages/
    │   └── utils/
    └── public/
```

### 2. データモデル設計

#### ABC分析モデル
```python
from pydantic import BaseModel
from typing import List, Optional, Dict

class DemandData(BaseModel):
    date: str
    customer: str
    product: str
    demand: float
    sales: Optional[float] = None

class ABCAnalysisRequest(BaseModel):
    demand_data: List[DemandData]
    threshold: List[float]
    agg_col: str = "product"
    value_col: str = "demand"

class ABCAnalysisResult(BaseModel):
    category_assignments: Dict[str, str]
    summary_stats: Dict
    visualization_data: Dict
```

#### VRPモデル
```python
class Location(BaseModel):
    longitude: float
    latitude: float

class TimeWindow(BaseModel):
    start: int
    end: int

class Job(BaseModel):
    id: int
    location: Location
    service_time: int = 0
    delivery: List[int] = [0]
    pickup: List[int] = [0]
    time_windows: List[TimeWindow] = []
    skills: List[int] = [0]
    priority: int = 0

class VRPRequest(BaseModel):
    jobs: List[Job]
    vehicles: List[Vehicle]
    optimize_params: Dict
```

### 3. API エンドポイント設計

#### ABC分析API
```python
@router.post("/abc/analyze")
async def analyze_abc(request: ABCAnalysisRequest) -> ABCAnalysisResult:
    """ABC分析を実行し結果を返す"""

@router.get("/abc/visualization/{analysis_id}")
async def get_abc_visualization(analysis_id: str):
    """ABC分析の可視化データを取得"""
```

#### 在庫管理API
```python
@router.post("/inventory/optimize")
async def optimize_inventory(request: InventoryRequest) -> InventoryResult:
    """在庫最適化を実行"""

@router.post("/inventory/simulate")
async def simulate_inventory(request: SimulationRequest) -> SimulationResult:
    """在庫シミュレーションを実行"""
```

#### 配送計画API
```python
@router.post("/vrp/optimize")
async def optimize_vrp(request: VRPRequest) -> VRPResult:
    """配送経路最適化を実行"""

@router.get("/vrp/map/{solution_id}")
async def get_route_map(solution_id: str):
    """配送ルートの地図データを取得"""
```

### 4. フロントエンド設計

#### ダッシュボード構成
1. **ホームページ**: 各分析モジュールへのナビゲーション
2. **ABC分析ページ**: 
   - データアップロード
   - 分析パラメータ設定
   - 結果表示（Treemap、ランク分析チャート）
3. **在庫管理ページ**:
   - 在庫データ入力
   - 最適化パラメータ設定
   - 結果表示（在庫レベル、シミュレーション結果）
4. **配送計画ページ**:
   - ジョブ・車両データ入力
   - 地図表示
   - ルート最適化結果表示

### 5. 技術スタック

- **バックエンド**: FastAPI + SQLAlchemy + PostgreSQL
- **フロントエンド**: React.js + TypeScript + Chart.js/D3.js
- **可視化**: Plotly.js（地図表示）
- **最適化**: 既存のソルバー（METRO VI等）を統合
- **デプロイ**: Docker + Kubernetes

## リファクタリング手順

### Phase 1: コア機能抽出
1. Jupyter Notebookから関数・クラスを抽出
2. Pydanticモデルでデータ構造を定義
3. ビジネスロジックをサービス層に分離

### Phase 2: API層開発
1. FastAPIエンドポイント実装
2. リクエスト/レスポンスバリデーション
3. エラーハンドリング実装

### Phase 3: フロントエンド開発
1. Reactコンポーネント開発
2. API連携実装
3. 可視化コンポーネント実装

### Phase 4: 統合・テスト
1. バックエンド・フロントエンド統合
2. エンドツーエンドテスト
3. パフォーマンス最適化

### Phase 5: デプロイ・運用
1. Docker化
2. CI/CDパイプライン構築
3. 監視・ログ設定

## 留意事項

### 1. 既存機能の完全移植
- Notebook内のすべての分析機能を網羅
- 計算精度の維持
- 可視化品質の維持

### 2. パフォーマンス考慮
- 大規模データセット対応
- 長時間計算の非同期処理
- 結果のキャッシュ機能

### 3. ユーザビリティ
- 直感的なUI/UX設計
- データ入力の簡素化
- 結果の分かりやすい表示

### 4. 拡張性
- 新しい分析手法の追加容易性
- モジュール間の疎結合設計
- 外部システムとの連携対応

### 5. セキュリティ・信頼性
- データ入力バリデーション
- セッション管理
- エラー処理とログ記録
- データバックアップ機能

## 期待される成果物

1. **Webアプリケーション**: Jupyter NotebookのすべてのリファクタリングされたWebダッシュボード
2. **API仕様書**: OpenAPI/Swagger形式の詳細なAPI仕様
3. **ユーザーマニュアル**: 操作方法とユースケース説明
4. **開発者ドキュメント**: アーキテクチャ説明と拡張ガイド
5. **テストコード**: 単体テスト・統合テスト・E2Eテスト

このプロンプトに基づいて段階的にリファクタリングを実行し、保守性が高く拡張可能なWebアプリケーションを構築してください。