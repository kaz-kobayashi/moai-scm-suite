"""
在庫最適化用FastAPIエンドポイント - 03inventory.ipynbの機能を完全移植
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Union
import pandas as pd
import json
import traceback

from ...models.inventory import (
    ProductData, DemandData, SSARequest, SSAResult,
    EOQRequest, EOQResult, SimulationRequest, SimulationResult,
    BaseStockRequest, BaseStockResult, InventoryPolicy,
    DemandDistributionRequest, DemandDistributionResult,
    MultiStageRequest, MultiStageResult, MESSARequest, MESSAResult,
    PeriodicInventoryRequest, PeriodicInventoryResult
)
from ...services.inventory_service import inventory_service
import networkx as nx

router = APIRouter()

# =====================================================
# EOQ (Economic Order Quantity) エンドポイント
# =====================================================

@router.post("/eoq", response_model=EOQResult)
async def calculate_eoq(request: EOQRequest):
    """
    経済発注量（EOQ）を計算
    
    Args:
        daily_demand: 日次需要量
        order_cost: 発注費用
        holding_cost: 保管費用
        unit_cost: 単位費用（オプション）
        backorder_cost: バックオーダー費用（オプション）
        discount_breaks: 数量割引設定（オプション）
    
    Returns:
        EOQ計算結果
    """
    try:
        # Convert discount_breaks format if provided
        discount_tuples = None
        if request.discount_breaks:
            discount_tuples = [(float(item[0]), float(item[1])) for item in request.discount_breaks]
        
        # Use annual demand directly for EOQ calculation
        result = inventory_service.eoq_annual(
            annual_demand=request.annual_demand,
            order_cost=request.order_cost,
            holding_cost=request.holding_cost,
            unit_cost=request.unit_cost,
            backorder_cost=request.backorder_cost,
            discount_breaks=discount_tuples
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"EOQ計算エラー: {str(e)}"
        )

# =====================================================
# Wagner-Whitin動的ロットサイジング エンドポイント
# =====================================================

@router.post("/wagner-whitin", response_model=Dict[str, Any])
async def calculate_wagner_whitin(
    demands: List[float],
    fixed_costs: Union[float, List[float]] = 100.0,
    variable_costs: Union[float, List[float]] = 0.0,
    holding_costs: Union[float, List[float]] = 5.0
):
    """
    Wagner-Whitin動的ロットサイジング最適化
    
    Args:
        demands: 各期の需要量
        fixed_costs: 発注固定費用（期間別または単一値）
        variable_costs: 変動費用（期間別または単一値）
        holding_costs: 保管費用（期間別または単一値）
    
    Returns:
        最適発注スケジュール
    """
    try:
        result = inventory_service.wagner_whitin(
            demands=demands,
            fixed_costs=fixed_costs,
            variable_costs=variable_costs,
            holding_costs=holding_costs
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wagner-Whitin計算エラー: {str(e)}"
        )

# =====================================================
# 安全在庫配分 (Safety Stock Allocation) エンドポイント
# =====================================================

@router.post("/ssa-dynamic-programming", response_model=Dict[str, float])
async def calculate_ssa_dp(request: SSARequest):
    """
    動的プログラミングによる安全在庫配分最適化
    
    Args:
        request: SSAリクエスト（製品、需要データ、予算制約等）
    
    Returns:
        最適な安全在庫配分
    """
    try:
        # NetworkXグラフを構築
        G = nx.DiGraph()
        
        # 製品をノードとして追加
        for product in request.products:
            G.add_node(product.prod)
        
        # 需要パラメータを構築
        demand_params = {}
        for product in request.products:
            # 簡単な利益・コスト計算（実際の実装では需要データから算出）
            avg_demand = sum(d.demand for d in request.demand_data if d.prod == product.prod)
            avg_demand = avg_demand / max(1, len([d for d in request.demand_data if d.prod == product.prod]))
            
            demand_params[product.prod] = {
                'profit': avg_demand * (product.unit_cost or 1.0) * 0.1,  # 10%利益マージン
                'cost': (product.unit_cost or 1.0) * product.holding_cost_rate
            }
        
        result = inventory_service.dynamic_programming_for_SSA(
            G=G,
            budget=request.total_budget,
            demand_params=demand_params
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSA動的プログラミングエラー: {str(e)}"
        )

@router.post("/ssa-tabu-search", response_model=Dict[str, float])
async def calculate_ssa_tabu(request: SSARequest):
    """
    タブ探索による安全在庫配分最適化
    
    Args:
        request: SSAリクエスト
    
    Returns:
        最適な安全在庫配分
    """
    try:
        # NetworkXグラフを構築
        G = nx.DiGraph()
        for product in request.products:
            G.add_node(product.prod)
        
        # 需要パラメータを構築
        demand_params = {}
        for product in request.products:
            avg_demand = sum(d.demand for d in request.demand_data if d.prod == product.prod)
            avg_demand = avg_demand / max(1, len([d for d in request.demand_data if d.prod == product.prod]))
            
            demand_params[product.prod] = {
                'profit': avg_demand * (product.unit_cost or 1.0) * 0.1,
                'cost': (product.unit_cost or 1.0) * product.holding_cost_rate
            }
        
        result = inventory_service.tabu_search_for_SSA(
            G=G,
            budget=request.total_budget,
            demand_params=demand_params,
            max_iterations=request.iterations or 1000
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSAタブ探索エラー: {str(e)}"
        )

# =====================================================
# 在庫シミュレーション エンドポイント
# =====================================================

@router.post("/simulate", response_model=SimulationResult)
async def simulate_inventory_policy(request: SimulationRequest):
    """
    在庫政策のシミュレーション実行
    
    Args:
        request: シミュレーションリクエスト
    
    Returns:
        シミュレーション結果
    """
    try:
        # 需要データから需要リストを抽出
        demands = [d.demand for d in request.demand_data]
        
        result = inventory_service.simulate_inventory(
            policy=request.policy,
            demands=demands,
            initial_inventory=request.initial_inventory or 0,
            lead_time=request.products[0].lead_time if request.products else 1
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"在庫シミュレーションエラー: {str(e)}"
        )

# =====================================================
# (s,S)政策近似 エンドポイント
# =====================================================

class ApproximateSSRequest(BaseModel):
    mu: float = Field(100.0, description="平均需要")
    sigma: float = Field(10.0, description="需要の標準偏差")  
    lead_time: int = Field(0, description="リードタイム")
    backorder_cost: float = Field(100.0, description="バックオーダー費用")
    holding_cost: float = Field(1.0, description="保管費用")
    fixed_cost: float = Field(10000.0, description="固定費用")

@router.post("/approximate-ss", response_model=Dict[str, float])
async def calculate_approximate_ss(request: ApproximateSSRequest):
    """
    (s,S)政策パラメータの近似計算
    
    Args:
        mu: 平均需要
        sigma: 需要の標準偏差
        lead_time: リードタイム
        backorder_cost: バックオーダー費用
        holding_cost: 保管費用
        fixed_cost: 固定費用
    
    Returns:
        最適(s,S)パラメータ
    """
    try:
        s, S = inventory_service.approximate_ss(
            mu=request.mu,
            sigma=request.sigma,
            LT=request.lead_time,
            b=request.backorder_cost,
            h=request.holding_cost,
            fc=request.fixed_cost
        )
        
        return {
            "s": float(s),
            "S": float(S),
            "order_up_to_level": float(S),
            "reorder_point": float(s)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"(s,S)政策近似計算エラー: {str(e)}"
        )

# =====================================================
# ベースストック最適化 エンドポイント
# =====================================================

@router.post("/optimize-base-stock", response_model=BaseStockResult)
async def optimize_base_stock_levels(request: BaseStockRequest):
    """
    ベースストックレベルの最適化
    
    Args:
        request: ベースストック最適化リクエスト
    
    Returns:
        最適ベースストックレベル
    """
    try:
        # 需要データから需要リストを抽出
        demands = [d.demand for d in request.demand_data]
        
        result = inventory_service.optimize_base_stock(
            demands=demands,
            target_service_level=request.target_service_level,
            holding_cost=request.products[0].holding_cost_rate if request.products else 1.0,
            shortage_cost=10.0  # デフォルト欠品コスト
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ベースストック最適化エラー: {str(e)}"
        )

# =====================================================
# 需要分布フィッティング エンドポイント
# =====================================================

@router.post("/fit-demand-distribution", response_model=DemandDistributionResult)
async def fit_demand_distribution(request: DemandDistributionRequest):
    """
    需要データに最適な確率分布をフィッティング
    
    Args:
        request: 分布フィッティングリクエスト
    
    Returns:
        最適分布とパラメータ
    """
    try:
        print(f"Received demand distribution request: {request.model_dump()}")
        
        result = inventory_service.best_distribution(
            data=request.demand_data,
            distributions=request.distribution_candidates,
            method=request.fitting_method,
            significance_level=request.significance_level
        )
        
        print(f"Distribution fitting result: {result}")
        return result
        
    except Exception as e:
        print(f"Error in fit_demand_distribution: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"需要分布フィッティングエラー: {str(e)}"
        )

# =====================================================
# 統合分析 エンドポイント
# =====================================================

@router.post("/comprehensive-analysis", response_model=Dict[str, Any])
async def comprehensive_inventory_analysis(
    products: List[ProductData],
    demand_data: List[DemandData],
    analysis_options: Dict[str, bool] = None
):
    """
    包括的在庫分析（複数の分析を一度に実行）
    
    Args:
        products: 製品データ
        demand_data: 需要データ
        analysis_options: 分析オプション
    
    Returns:
        包括的な分析結果
    """
    try:
        if analysis_options is None:
            analysis_options = {
                "calculate_eoq": True,
                "fit_distributions": True,
                "approximate_ss": True,
                "simulate_policies": False
            }
        
        results = {"analyses": {}}
        
        # 製品ごとの分析
        for product in products:
            product_demand = [d.demand for d in demand_data if d.prod == product.prod]
            if not product_demand:
                continue
                
            product_results = {}
            
            # EOQ計算
            if analysis_options.get("calculate_eoq", False):
                try:
                    avg_daily_demand = sum(product_demand) / len(product_demand)
                    eoq_result = inventory_service.eoq(
                        daily_demand=avg_daily_demand,
                        order_cost=100.0,  # デフォルト発注費用
                        holding_cost=product.holding_cost_rate
                    )
                    product_results["eoq"] = {
                        "eoq": eoq_result.eoq,
                        "total_cost": eoq_result.total_cost,
                        "order_frequency": eoq_result.order_frequency
                    }
                except Exception as e:
                    product_results["eoq_error"] = str(e)
            
            # 需要分布フィッティング
            if analysis_options.get("fit_distributions", False):
                try:
                    dist_result = inventory_service.best_distribution(product_demand)
                    product_results["demand_distribution"] = {
                        "best_distribution": dist_result.best_distribution,
                        "parameters": dist_result.parameters,
                        "goodness_of_fit": dist_result.goodness_of_fit
                    }
                except Exception as e:
                    product_results["distribution_error"] = str(e)
            
            # (s,S)政策近似
            if analysis_options.get("approximate_ss", False):
                try:
                    import numpy as np
                    mu = np.mean(product_demand)
                    sigma = np.std(product_demand)
                    s, S = inventory_service.approximate_ss(
                        mu=mu,
                        sigma=sigma,
                        LT=product.lead_time or 1,
                        h=product.holding_cost_rate
                    )
                    product_results["ss_policy"] = {"s": float(s), "S": float(S)}
                except Exception as e:
                    product_results["ss_error"] = str(e)
            
            results["analyses"][product.prod] = product_results
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"包括的分析エラー: {str(e)}\n{traceback.format_exc()}"
        )

# =====================================================
# ヘルスチェック エンドポイント
# =====================================================

@router.get("/health")
async def inventory_health_check():
    """在庫最適化APIのヘルスチェック"""
    return {
        "status": "healthy",
        "service": "Inventory Optimization API",
        "algorithms": [
            "EOQ (Economic Order Quantity)",
            "Wagner-Whitin Dynamic Lot Sizing", 
            "Safety Stock Allocation (SSA)",
            "Inventory Simulation",
            "(s,S) Policy Approximation",
            "Base Stock Optimization",
            "Demand Distribution Fitting"
        ]
    }