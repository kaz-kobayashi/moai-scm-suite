"""
在庫最適化用データモデル - 03inventory.ipynbから完全移植
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Union, Tuple, Any
import pandas as pd
from datetime import datetime

# 基本的な在庫データモデル
class ProductData(BaseModel):
    """製品基本情報"""
    prod: str = Field(..., description="製品ID")
    name: Optional[str] = Field(None, description="製品名")
    unit_cost: Optional[float] = Field(None, description="単価")
    holding_cost_rate: Optional[float] = Field(0.3, description="年間保管費率")
    lead_time: Optional[int] = Field(1, description="リードタイム（日）")
    service_level: Optional[float] = Field(0.95, description="サービスレベル")

class DemandData(BaseModel):
    """需要データ"""
    date: str = Field(..., description="日付")
    prod: str = Field(..., description="製品ID")
    demand: float = Field(..., description="需要量")
    forecast: Optional[float] = Field(None, description="予測値")

# Safety Stock Allocation (SSA) 関連モデル
class SSARequest(BaseModel):
    """安全在庫配分リクエスト"""
    products: List[ProductData]
    demand_data: List[DemandData]
    total_budget: float = Field(..., description="総予算制約")
    method: str = Field("dynamic_programming", description="最適化手法")
    iterations: Optional[int] = Field(1000, description="タブ探索時の反復回数")

class SSAResult(BaseModel):
    """安全在庫配分結果"""
    allocations: Dict[str, float] = Field(..., description="製品別安全在庫配分")
    total_cost: float = Field(..., description="総コスト")
    service_levels: Dict[str, float] = Field(..., description="製品別サービスレベル")
    objective_value: float = Field(..., description="目的関数値")

# Economic Order Quantity (EOQ) 関連モデル
class EOQRequest(BaseModel):
    """EOQ計算リクエスト"""
    annual_demand: float = Field(..., description="年間需要")
    order_cost: float = Field(..., description="発注費用")
    holding_cost: float = Field(..., description="保管費用")
    unit_cost: Optional[float] = Field(None, description="製品単価")
    backorder_cost: Optional[float] = Field(None, description="欠品費用")
    discount_breaks: Optional[List[Tuple[float, float]]] = Field(None, description="数量割引")

class EOQResult(BaseModel):
    """EOQ計算結果"""
    eoq: float = Field(..., description="経済発注量")
    total_cost: float = Field(..., description="総コスト")
    order_frequency: float = Field(..., description="発注頻度")
    cycle_time: float = Field(..., description="サイクルタイム")
    safety_stock: Optional[float] = Field(None, description="安全在庫")

# 在庫シミュレーション関連モデル
class InventoryPolicy(BaseModel):
    """在庫政策"""
    policy_type: str = Field(..., description="政策タイプ (QR, sS)")
    Q: Optional[float] = Field(None, description="発注量")
    R: Optional[float] = Field(None, description="発注点")
    s: Optional[float] = Field(None, description="下限在庫水準")
    S: Optional[float] = Field(None, description="上限在庫水準")

class SimulationRequest(BaseModel):
    """シミュレーションリクエスト"""
    products: List[ProductData]
    demand_data: List[DemandData]
    policy: InventoryPolicy
    simulation_periods: int = Field(365, description="シミュレーション期間")
    initial_inventory: Optional[float] = Field(None, description="初期在庫")
    random_seed: Optional[int] = Field(None, description="乱数シード")

class SimulationResult(BaseModel):
    """シミュレーション結果"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    average_inventory: float = Field(..., description="平均在庫")
    service_level: float = Field(..., description="サービスレベル")
    stockout_frequency: float = Field(..., description="欠品頻度")
    total_cost: float = Field(..., description="総コスト")
    holding_cost: float = Field(..., description="保管費用")
    order_cost: float = Field(..., description="発注費用")
    shortage_cost: float = Field(..., description="欠品費用")
    inventory_history: Optional[List[float]] = Field(None, description="在庫推移")
    demand_history: Optional[List[float]] = Field(None, description="需要推移")

# ベースストック最適化関連モデル
class BaseStockRequest(BaseModel):
    """ベースストック最適化リクエスト"""
    products: List[ProductData]
    demand_data: List[DemandData]
    target_service_level: float = Field(0.95, description="目標サービスレベル")
    optimization_method: str = Field("simulation", description="最適化手法")
    stages: Optional[int] = Field(1, description="段階数")

class BaseStockResult(BaseModel):
    """ベースストック最適化結果"""
    base_stock_levels: Dict[str, float] = Field(..., description="ベースストックレベル")
    service_levels: Dict[str, float] = Field(..., description="サービスレベル")
    costs: Dict[str, float] = Field(..., description="コスト")
    total_cost: float = Field(..., description="総コスト")

# 多段階在庫モデル
class SupplyChainNode(BaseModel):
    """サプライチェーンノード"""
    node_id: str = Field(..., description="ノードID")
    node_type: str = Field(..., description="ノードタイプ (supplier, warehouse, retailer)")
    products: List[str] = Field(..., description="取扱製品リスト")
    capacity: Optional[float] = Field(None, description="容量")
    lead_time: int = Field(1, description="リードタイム")
    upstream_nodes: List[str] = Field(default_factory=list, description="上流ノード")
    downstream_nodes: List[str] = Field(default_factory=list, description="下流ノード")

class MultiStageRequest(BaseModel):
    """多段階在庫最適化リクエスト"""
    nodes: List[SupplyChainNode]
    products: List[ProductData]
    demand_data: List[DemandData]
    optimization_horizon: int = Field(365, description="最適化期間")
    echelon_stock: bool = Field(False, description="エシュロン在庫使用フラグ")

class MultiStageResult(BaseModel):
    """多段階在庫最適化結果"""
    node_inventories: Dict[str, Dict[str, float]] = Field(..., description="ノード別在庫レベル")
    echelon_levels: Optional[Dict[str, Dict[str, float]]] = Field(None, description="エシュロンレベル")
    total_system_cost: float = Field(..., description="システム総コスト")
    service_levels: Dict[str, float] = Field(..., description="サービスレベル")

# 需要分布フィッティング関連モデル
class DemandDistributionRequest(BaseModel):
    """需要分布フィッティングリクエスト"""
    demand_data: List[float] = Field(..., description="需要データ")
    period_labels: Optional[List[str]] = Field(None, description="期間ラベル")
    distribution_candidates: List[str] = Field(
        default=["normal", "gamma", "lognormal", "weibull"], 
        description="検証する分布候補"
    )
    fitting_method: Optional[str] = Field("mle", description="フィッティング手法")
    significance_level: Optional[float] = Field(0.05, description="有意水準")
    include_goodness_of_fit: Optional[bool] = Field(True, description="適合度を含める")
    include_plots: Optional[bool] = Field(True, description="プロットを含める") 
    include_forecast: Optional[bool] = Field(True, description="予測を含める")

class DemandDistributionResult(BaseModel):
    """需要分布フィッティング結果"""
    best_fit: Optional[Dict[str, Any]] = Field(None, description="最適分布情報")
    best_distribution: Optional[str] = Field(None, description="最適分布名")
    parameters: Optional[Dict[str, float]] = Field(None, description="分布パラメータ")
    goodness_of_fit: Optional[float] = Field(None, description="適合度")
    all_results: Optional[Dict[str, Dict]] = Field(None, description="全分布の結果")
    fitting_plot: Optional[str] = Field(None, description="フィッティングプロット（JSON文字列）")
    forecast_plot: Optional[str] = Field(None, description="予測プロット（JSON文字列）")

# 周期的在庫最適化モデル
class PeriodicInventoryRequest(BaseModel):
    """周期的在庫最適化リクエスト"""
    products: List[ProductData]
    demand_forecast: List[List[float]]  # 製品×期間の需要予測
    review_periods: List[int] = Field(..., description="レビュー期間")
    capacity_constraints: Optional[Dict[str, float]] = Field(None, description="容量制約")

class PeriodicInventoryResult(BaseModel):
    """周期的在庫最適化結果"""
    order_schedule: Dict[str, List[float]] = Field(..., description="発注スケジュール")
    inventory_levels: Dict[str, List[float]] = Field(..., description="在庫レベル")
    total_cost: float = Field(..., description="総コスト")
    service_levels: Dict[str, float] = Field(..., description="サービスレベル")

# MESSA (MEta Safety Stock Allocation) システム関連
class MESSARequest(BaseModel):
    """MESSAシステムリクエスト"""
    excel_file_path: Optional[str] = Field(None, description="Excelファイルパス")
    demand_data: List[DemandData]
    products: List[ProductData]
    budget_constraint: float = Field(..., description="予算制約")
    target_fill_rate: float = Field(0.95, description="目標充足率")

class MESSAResult(BaseModel):
    """MESSAシステム結果"""
    safety_stock_allocation: Dict[str, float] = Field(..., description="安全在庫配分")
    expected_fill_rates: Dict[str, float] = Field(..., description="期待充足率")
    total_investment: float = Field(..., description="総投資額")
    excel_output_path: Optional[str] = Field(None, description="結果Excelパス")