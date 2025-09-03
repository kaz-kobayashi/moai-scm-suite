from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union
from datetime import datetime

# =====================================================
# 基本データモデル
# =====================================================

class LocationData(BaseModel):
    """位置情報データ"""
    name: str = Field(..., description="拠点名")
    latitude: float = Field(..., description="緯度")
    longitude: float = Field(..., description="経度")

class CustomerData(LocationData):
    """顧客データ"""
    demand: float = Field(..., description="需要量")
    weight: Optional[float] = Field(None, description="重量")

class DCData(LocationData):
    """配送センター候補データ"""
    capacity: float = Field(..., description="容量")
    fixed_cost: float = Field(..., description="固定費用")
    variable_cost: float = Field(0.0, description="変動費用")
    opening_cost: Optional[float] = Field(None, description="開設費用")

class PlantData(LocationData):
    """工場データ"""
    capacity: float = Field(..., description="生産容量")
    production_cost: float = Field(..., description="生産費用")

class ProductData(BaseModel):
    """製品データ"""
    prod_id: str = Field(..., description="製品ID")
    name: str = Field(..., description="製品名")
    weight: float = Field(..., description="重量")
    volume: float = Field(..., description="容積")
    value: float = Field(..., description="価値")
    unit_cost: float = Field(..., description="単価")

class TransportationData(BaseModel):
    """輸送データ"""
    from_location: str = Field(..., description="出発地")
    to_location: str = Field(..., description="到着地")
    distance: float = Field(..., description="距離")
    cost_per_unit: float = Field(..., description="単位輸送費用")
    transit_time: Optional[float] = Field(None, description="輸送時間")

class DemandData(BaseModel):
    """需要データ"""
    customer: str = Field(..., description="顧客名")
    product: str = Field(..., description="製品")
    period: str = Field(..., description="期間")
    demand: float = Field(..., description="需要量")

# =====================================================
# 最適化問題のリクエスト・レスポンスモデル
# =====================================================

class WeiszfeldRequest(BaseModel):
    """Weiszfeld法リクエスト"""
    customers: List[CustomerData] = Field(..., description="顧客リスト")
    num_facilities: int = Field(1, description="施設数")
    max_iterations: int = Field(1000, description="最大反復回数")
    tolerance: float = Field(1e-6, description="収束判定閾値")
    use_great_circle: bool = Field(True, description="大円距離を使用")

class WeiszfeldResult(BaseModel):
    """Weiszfeld法結果"""
    facility_locations: List[LocationData] = Field(..., description="最適施設位置")
    total_cost: float = Field(..., description="総費用")
    iterations: int = Field(..., description="実行反復回数")
    convergence_history: List[float] = Field(..., description="収束履歴")
    customer_assignments: Dict[str, int] = Field(..., description="顧客割当")

class KMedianRequest(BaseModel):
    """K-Median最適化リクエスト"""
    customers: List[CustomerData] = Field(..., description="顧客リスト")
    dc_candidates: List[DCData] = Field(..., description="DC候補")
    k: int = Field(..., description="選択するDC数")
    max_iterations: int = Field(1000, description="最大反復回数")
    learning_rate: float = Field(0.01, description="学習率")
    momentum: float = Field(0.9, description="モメンタム")

class KMedianResult(BaseModel):
    """K-Median最適化結果"""
    selected_facilities: List[int] = Field(..., description="選択された施設インデックス")
    facility_locations: List[DCData] = Field(..., description="選択された施設")
    total_cost: float = Field(..., description="総費用")
    objective_history: List[float] = Field(..., description="目的関数履歴")
    customer_assignments: Dict[str, int] = Field(..., description="顧客割当")

class ClusteringRequest(BaseModel):
    """顧客クラスタリングリクエスト"""
    customers: List[CustomerData] = Field(..., description="顧客リスト")
    method: str = Field("kmeans", description="クラスタリング手法")
    n_clusters: int = Field(..., description="クラスター数")
    use_road_distance: bool = Field(False, description="道路距離を使用")

class ClusteringResult(BaseModel):
    """クラスタリング結果"""
    clusters: Dict[str, int] = Field(..., description="顧客のクラスター割当")
    cluster_centers: List[LocationData] = Field(..., description="クラスター中心")
    aggregated_customers: List[CustomerData] = Field(..., description="集約された顧客")
    silhouette_score: float = Field(..., description="シルエット係数")

class LNDRequest(BaseModel):
    """物流ネットワーク設計リクエスト"""
    model_config = {"protected_namespaces": ()}
    
    customers: List[CustomerData] = Field(..., description="顧客リスト")
    dc_candidates: List[DCData] = Field(..., description="DC候補リスト")
    plants: List[PlantData] = Field(..., description="工場リスト")
    products: Optional[List[ProductData]] = Field(None, description="製品リスト")
    transportation_costs: Optional[List[TransportationData]] = Field(None, description="輸送費用")
    model_type: str = Field("multi_source", description="モデルタイプ")
    optimization_objective: str = Field("minimize_cost", description="最適化目標")
    capacity_constraints: bool = Field(True, description="容量制約")
    max_facilities: Optional[int] = Field(None, description="最大施設数")
    max_iterations: int = Field(500, description="最大反復回数")
    tolerance: float = Field(1e-6, description="収束判定閾値")
    co2_constraint: Optional[float] = Field(None, description="CO2制約")

class LNDResult(BaseModel):
    """物流ネットワーク設計結果"""
    selected_facilities: List[DCData] = Field(..., description="選択された施設")
    flow_assignments: Dict[str, Dict[str, float]] = Field(..., description="フロー割当")
    total_cost: float = Field(..., description="総費用")
    cost_breakdown: Dict[str, float] = Field(..., description="費用内訳")
    facility_utilization: Dict[str, float] = Field(..., description="施設稼働率")
    network_performance: Dict[str, float] = Field(..., description="ネットワーク性能")
    solution_status: str = Field(..., description="解ステータス")
    solve_time: float = Field(..., description="求解時間")
    co2_emissions: Optional[float] = Field(None, description="CO2排出量")

class NetworkVisualizationRequest(BaseModel):
    """ネットワーク可視化リクエスト"""
    lnd_result: LNDResult = Field(..., description="LND結果")
    show_flows: bool = Field(True, description="フロー表示")
    flow_threshold: float = Field(0.0, description="フロー表示閾値")
    map_style: str = Field("open-street-map", description="地図スタイル")

class NetworkVisualizationResult(BaseModel):
    """ネットワーク可視化結果"""
    plotly_figure: Dict[str, Any] = Field(..., description="Plotly図表")
    network_stats: Dict[str, float] = Field(..., description="ネットワーク統計")
    legend_data: Dict[str, Any] = Field(..., description="凡例データ")

# =====================================================
# 分析・レポートモデル
# =====================================================

class NetworkAnalysisRequest(BaseModel):
    """ネットワーク分析リクエスト"""
    lnd_result: LNDResult = Field(..., description="LND結果")
    analysis_types: List[str] = Field(..., description="分析タイプリスト")
    comparison_baseline: Optional[LNDResult] = Field(None, description="比較ベースライン")

class NetworkAnalysisResult(BaseModel):
    """ネットワーク分析結果"""
    cost_analysis: Dict[str, Any] = Field(..., description="費用分析")
    distance_analysis: Dict[str, Any] = Field(..., description="距離分析")
    efficiency_metrics: Dict[str, float] = Field(..., description="効率性指標")
    sustainability_metrics: Dict[str, float] = Field(..., description="持続可能性指標")
    risk_assessment: Dict[str, Any] = Field(..., description="リスク評価")

class ScenarioComparison(BaseModel):
    """シナリオ比較"""
    scenarios: List[LNDResult] = Field(..., description="比較シナリオ")
    comparison_metrics: List[str] = Field(..., description="比較指標")
    sensitivity_analysis: Dict[str, Any] = Field(..., description="感度分析")

# =====================================================
# Excel統合モデル
# =====================================================

class ExcelImportRequest(BaseModel):
    """Excel取込みリクエスト"""
    file_content: str = Field(..., description="Base64エンコードされたExcelファイル")
    sheet_mapping: Dict[str, str] = Field(..., description="シートマッピング")
    data_validation: bool = Field(True, description="データ検証")

class ExcelExportRequest(BaseModel):
    """Excel出力リクエスト"""
    lnd_result: LNDResult = Field(..., description="LND結果")
    template_type: str = Field("standard", description="テンプレートタイプ")
    include_charts: bool = Field(True, description="チャート含める")
    include_maps: bool = Field(False, description="地図含める")

class ExcelExportResult(BaseModel):
    """Excel出力結果"""
    file_content: str = Field(..., description="Base64エンコードされたExcelファイル")
    filename: str = Field(..., description="ファイル名")
    file_size: int = Field(..., description="ファイルサイズ")

# =====================================================
# リアルタイム最適化モデル
# =====================================================

class OptimizationProgress(BaseModel):
    """最適化進捗"""
    task_id: str = Field(..., description="タスクID")
    status: str = Field(..., description="ステータス")
    progress: float = Field(..., description="進捗率")
    current_objective: Optional[float] = Field(None, description="現在の目的関数値")
    best_solution: Optional[LNDResult] = Field(None, description="現在の最良解")
    estimated_completion: Optional[datetime] = Field(None, description="完了予想時刻")
    messages: List[str] = Field([], description="メッセージログ")