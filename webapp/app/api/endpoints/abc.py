"""
ABC分析用FastAPIエンドポイント - 01abc.ipynbの機能を薄いラッパーでAPIとして提供
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import pandas as pd
import json

from ...models.abc import (
    DemandRecord, ABCAnalysisRequest, ABCAnalysisResult, 
    TreeMapRequest, InventoryAnalysisRequest, RankAnalysisRequest,
    RiskPoolingRequest, RiskPoolingResult,
    MeanCVAnalysisRequest, MeanCVAnalysisResult
)
from ...services.abc_service import (
    demand_tree_map, abc_analysis, abc_analysis_all, rank_analysis_all_periods,
    generate_figures_for_abc_analysis, show_rank_analysis, risk_pooling_analysis,
    show_inventory_reduction, show_mean_cv, inventory_analysis, inventory_simulation,
    show_prod_inv_demand, plot_demands, 
    risk_pooling_analysis_detailed, mean_cv_analysis
)

router = APIRouter()

def convert_demand_records_to_df(demand_data: List[DemandRecord]) -> pd.DataFrame:
    """需要データのリストをDataFrameに変換"""
    data = []
    for record in demand_data:
        data.append(record.model_dump())
    return pd.DataFrame(data)

@router.post("/tree-map", response_model=Dict[str, Any])
async def create_tree_map(request: TreeMapRequest):
    """需要のTreeMapを生成"""
    try:
        demand_df = convert_demand_records_to_df(request.demand_data)
        fig = demand_tree_map(demand_df, request.parent, request.value)
        return {"figure": fig.to_json()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analysis", response_model=ABCAnalysisResult)
async def perform_abc_analysis(request: ABCAnalysisRequest):
    """ABC分析を実行"""
    try:
        demand_df = convert_demand_records_to_df(request.demand_data)
        agg_df, new_df, category = abc_analysis(
            demand_df, request.threshold, request.agg_col, 
            request.value_col, request.abc_name, request.rank_name
        )
        
        return ABCAnalysisResult(
            aggregated_data=agg_df.to_dict(),
            new_data=new_df.to_dict(),
            categories=category
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analysis-all", response_model=Dict[str, Any])
async def perform_abc_analysis_all(request: Dict[str, Any]):
    """全体のABC分析を実行"""
    try:
        demand_data = [DemandRecord(**item) for item in request["demand_data"]]
        threshold = request["threshold"]
        
        demand_df = convert_demand_records_to_df(demand_data)
        agg_df, category = abc_analysis_all(demand_df, threshold)
        
        return {
            "aggregated_data": agg_df.to_dict(),
            "categories": category
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/figures", response_model=Dict[str, Any])
async def generate_abc_figures(request: Dict[str, Any]):
    """ABC分析用の図を生成"""
    try:
        demand_data = [DemandRecord(**item) for item in request["demand_data"]]
        demand_df = convert_demand_records_to_df(demand_data)
        
        value = request.get("value", "demand")
        cumsum = request.get("cumsum", True)
        cust_thres = request.get("cust_thres", "0.7, 0.2, 0.1")
        prod_thres = request.get("prod_thres", "0.7, 0.2, 0.1")
        
        fig_prod, fig_cust, agg_df_prod, agg_df_cust, new_df, category_prod, category_cust = generate_figures_for_abc_analysis(
            demand_df, value, cumsum, cust_thres, prod_thres
        )
        
        return {
            "product_figure": fig_prod.to_json(),
            "customer_figure": fig_cust.to_json(),
            "product_aggregated_data": agg_df_prod.to_dict(),
            "customer_aggregated_data": agg_df_cust.to_dict(),
            "new_data": new_df.to_dict(),
            "product_categories": category_prod,
            "customer_categories": category_cust
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/rank-analysis", response_model=Dict[str, Any])
async def perform_rank_analysis(request: RankAnalysisRequest):
    """ランク分析を実行"""
    try:
        demand_df = convert_demand_records_to_df(request.demand_data)
        fig = show_rank_analysis(demand_df, None, request.value, "1m", request.top_rank)
        
        return {"figure": fig.to_json()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/risk-pooling", response_model=Dict[str, Any])
async def analyze_risk_pooling(request: Dict[str, Any]):
    """リスク共同管理の分析"""
    try:
        demand_data = [DemandRecord(**item) for item in request["demand_data"]]
        demand_df = convert_demand_records_to_df(demand_data)
        
        agg_period = request.get("agg_period", "1w")
        reduction_df = risk_pooling_analysis(demand_df, agg_period)
        fig = show_inventory_reduction(reduction_df)
        
        return {
            "reduction_data": reduction_df.to_dict(),
            "figure": fig.to_json()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/mean-cv", response_model=Dict[str, Any])
async def analyze_mean_cv(request: Dict[str, Any]):
    """平均と変動係数の分析"""
    try:
        demand_data = [DemandRecord(**item) for item in request["demand_data"]]
        demand_df = convert_demand_records_to_df(demand_data)
        
        prod_df = None
        if "prod_data" in request:
            prod_df = pd.DataFrame(request["prod_data"])
        
        show_name = request.get("show_name", True)
        fig = show_mean_cv(demand_df, prod_df, show_name)
        
        return {"figure": fig.to_json()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/risk-pooling-detailed", response_model=RiskPoolingResult)
async def analyze_risk_pooling_detailed(request: RiskPoolingRequest):
    """詳細なリスクプーリング分析"""
    try:
        demand_df = convert_demand_records_to_df(request.demand_data)
        
        result = risk_pooling_analysis_detailed(
            demand_df,
            request.pool_groups,
            request.product,
            request.period
        )
        
        return RiskPoolingResult(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/mean-cv-analysis", response_model=MeanCVAnalysisResult)
async def analyze_mean_cv_detailed(request: MeanCVAnalysisRequest):
    """詳細なMean-CV分析"""
    try:
        demand_df = convert_demand_records_to_df(request.demand_data)
        
        result = mean_cv_analysis(
            demand_df,
            request.segment_by,
            request.period,
            request.cv_threshold
        )
        
        return MeanCVAnalysisResult(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/inventory-analysis", response_model=Dict[str, Any])
async def perform_inventory_analysis(request: InventoryAnalysisRequest):
    """在庫分析を実行"""
    try:
        demand_df = convert_demand_records_to_df(request.demand_data)
        prod_df = pd.DataFrame(request.prod_data)
        
        # リスク共同管理分析を先に実行
        reduction_df = risk_pooling_analysis(demand_df)
        
        result_df = inventory_analysis(
            prod_df, demand_df, reduction_df, 
            request.z, request.LT, request.r, request.num_days
        )
        
        return {"analysis_result": result_df.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/inventory-simulation", response_model=Dict[str, Any])
async def perform_inventory_simulation(request: Dict[str, Any]):
    """在庫シミュレーションを実行"""
    try:
        demand_data = [DemandRecord(**item) for item in request["demand_data"]]
        demand_df = convert_demand_records_to_df(demand_data)
        prod_df = pd.DataFrame(request["prod_data"])
        
        simulation_result = inventory_simulation(prod_df, demand_df)
        
        # DataFrameをdict形式に変換
        result = {}
        for product, df in simulation_result.items():
            result[product] = df.to_dict()
        
        return {"simulation_result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/production-inventory-demand", response_model=Dict[str, Any])
async def show_production_inventory_demand(request: Dict[str, Any]):
    """生産・在庫・需要の可視化"""
    try:
        prod_name = request["product_name"]
        production_df = request["production_data"]
        scale = request.get("scale", "1d")
        
        # production_dfをdict形式から復元
        production_data = {}
        for product, data in production_df.items():
            production_data[product] = pd.DataFrame(data)
        
        fig = show_prod_inv_demand(prod_name, production_data, scale)
        
        return {"figure": fig.to_json()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/plot-demands", response_model=Dict[str, Any])
async def create_demand_plot(request: Dict[str, Any]):
    """需要の可視化"""
    try:
        demand_data = [DemandRecord(**item) for item in request["demand_data"]]
        demand_df = convert_demand_records_to_df(demand_data)
        
        prod_cust_list = request["prod_cust_list"]
        agg_period = request.get("agg_period", "1d")
        
        fig = plot_demands(prod_cust_list, demand_df, agg_period)
        
        return {"figure": fig.to_json()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))