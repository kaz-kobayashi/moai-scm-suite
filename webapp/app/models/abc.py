"""
ABC分析用データモデル - 01abc.ipynb から完全移植
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Union, Tuple, Set, Any, DefaultDict, Sequence
import pandas as pd
from datetime import datetime

# 01abc.ipynb cell-88 から完全移植
class Scbas(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    # cust_df: Optional[pd.DataFrame] = None 
    # prod_df: Optional[pd.DataFrame] = None
    demand_df: pd.DataFrame
    
    agg_df_prod: Optional[pd.DataFrame] = None
    agg_df_cust: Optional[pd.DataFrame] = None
    new_demand_df: Optional[pd.DataFrame] = None
    reduction_df: Optional[pd.DataFrame] = None
    new_prod_df: Optional[pd.DataFrame] = None

    category_prod: Optional[Dict[int,List[str]]] = None 
    category_cust: Optional[Dict[int,List[str]]] = None 
    nodes: Optional[List[Dict]] = None
    
    agg_period: str = "1w"

# API用のリクエスト・レスポンスモデル
class DemandRecord(BaseModel):
    date: str
    cust: str
    prod: str
    demand: float
    promo_0: Optional[float] = None
    promo_1: Optional[float] = None
    sales: Optional[float] = None

class ABCAnalysisRequest(BaseModel):
    demand_data: List[DemandRecord]
    threshold: List[float] = Field(..., description="ABC分類の閾値")
    agg_col: str = Field(default="prod", description="集約対象列")
    value_col: str = Field(default="demand", description="分析対象値列")
    abc_name: str = Field(default="abc", description="分類結果列名")
    rank_name: str = Field(default="rank", description="ランク結果列名")

class ABCAnalysisResult(BaseModel):
    aggregated_data: Dict
    new_data: Dict
    categories: Dict[int, List[str]]

class TreeMapRequest(BaseModel):
    demand_data: List[DemandRecord]
    parent: str = Field(default="cust", description="親項目")
    value: str = Field(default="demand", description="値項目")

class InventoryAnalysisRequest(BaseModel):
    prod_data: List[Dict]
    demand_data: List[DemandRecord]
    z: float = Field(default=1.65, description="安全在庫係数")
    LT: int = Field(default=1, description="リードタイム")
    r: float = Field(default=0.3, description="年間保管費率")
    num_days: int = Field(default=7, description="日数")

class RankAnalysisRequest(BaseModel):
    demand_data: List[DemandRecord]
    value: str = Field(default="demand", description="分析対象値")
    top_rank: int = Field(default=10, description="上位ランク数")

# リスクプーリング分析用モデル
class RiskPoolingRequest(BaseModel):
    demand_data: List[DemandRecord]
    pool_groups: List[List[str]] = Field(..., description="プールするグループのリスト")
    product: Optional[str] = Field(None, description="特定製品での分析")
    period: str = Field(default="1w", description="集計期間")

class RiskPoolingResult(BaseModel):
    original_stats: Dict[str, Any]  # 元の統計情報
    pooled_stats: Dict[str, Any]    # プール後の統計情報  
    safety_stock_reduction: Dict[str, float]      # 安全在庫削減率
    risk_reduction: Dict[str, float]             # リスク削減率
    pooling_efficiency: float                     # プーリング効率
    
# Mean-CV分析用モデル
class MeanCVAnalysisRequest(BaseModel):
    demand_data: List[DemandRecord]
    segment_by: str = Field(default="prod", description="セグメント化の軸")
    period: str = Field(default="1w", description="集計期間")
    cv_threshold: float = Field(default=0.5, description="高変動の閾値")

class MeanCVAnalysisResult(BaseModel):
    segments: List[Dict[str, Any]]              # セグメント情報
    mean_cv_plot: Dict[str, Any]               # Mean-CVプロットデータ
    classification: Dict[str, str]              # 分類結果
    management_strategy: Dict[str, str]         # 管理戦略提案