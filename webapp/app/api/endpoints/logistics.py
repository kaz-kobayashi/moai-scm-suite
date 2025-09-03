from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging

from app.models.logistics import (
    CustomerData, DCData, PlantData, ProductData,
    WeiszfeldRequest, WeiszfeldResult,
    KMedianRequest, KMedianResult,
    ClusteringRequest, ClusteringResult,
    LNDRequest, LNDResult,
    NetworkVisualizationRequest, NetworkVisualizationResult,
    NetworkAnalysisRequest, NetworkAnalysisResult
)
from app.services.logistics_service import LogisticsOptimizationService

router = APIRouter()
logistics_service = LogisticsOptimizationService()

logger = logging.getLogger(__name__)

# =====================================================
# ヘルスチェック
# =====================================================

@router.get("/health")
async def health_check():
    """物流最適化サービスのヘルスチェック"""
    return {
        "status": "healthy",
        "service": "logistics_optimization",
        "version": "1.0.0",
        "available_algorithms": [
            "weiszfeld",
            "k_median", 
            "customer_clustering",
            "basic_lnd",
            "network_visualization"
        ]
    }

# =====================================================
# Weiszfeld法による施設立地最適化
# =====================================================

@router.post("/weiszfeld", response_model=WeiszfeldResult)
async def optimize_facility_locations(request: WeiszfeldRequest):
    """
    Weiszfeld法による施設立地最適化
    
    Args:
        request: Weiszfeld最適化リクエスト
    
    Returns:
        最適施設位置と総費用
    """
    try:
        logger.info(f"Weiszfeld最適化開始: 顧客数={len(request.customers)}, 施設数={request.num_facilities}")
        
        result = logistics_service.weiszfeld_multiple(
            customers=request.customers,
            num_facilities=request.num_facilities,
            max_iterations=request.max_iterations,
            tolerance=request.tolerance,
            use_great_circle=request.use_great_circle
        )
        
        logger.info(f"Weiszfeld最適化完了: 総費用={result.total_cost:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"Weiszfeld最適化エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weiszfeld最適化に失敗しました: {str(e)}"
        )

# =====================================================
# K-Median最適化
# =====================================================

@router.post("/k-median", response_model=KMedianResult)
async def solve_k_median_problem(request: KMedianRequest):
    """
    K-Median問題の最適化
    
    Args:
        request: K-Median最適化リクエスト
    
    Returns:
        選択された施設と顧客割当
    """
    try:
        logger.info(f"K-Median最適化開始: 顧客数={len(request.customers)}, DC候補数={len(request.dc_candidates)}, K={request.k}")
        
        result = logistics_service.solve_k_median(
            customers=request.customers,
            dc_candidates=request.dc_candidates,
            k=request.k,
            max_iterations=request.max_iterations,
            learning_rate=request.learning_rate,
            momentum=request.momentum,
            use_adam=getattr(request, 'use_adam', False),
            use_lr_scheduling=getattr(request, 'use_lr_scheduling', False),
            capacity_constraint=getattr(request, 'capacity_constraint', False)
        )
        
        logger.info(f"K-Median最適化完了: 総費用={result.total_cost:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"K-Median最適化エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"K-Median最適化に失敗しました: {str(e)}"
        )

# =====================================================
# Learning Rate Finder
# =====================================================

@router.post("/k-median/find-learning-rate")
async def find_k_median_learning_rate(
    customers: List[CustomerData],
    dc_candidates: List[DCData], 
    k: int,
    lr_range: List[float] = [1e-7, 10.0],
    num_iterations: int = 100
):
    """
    K-Median最適化のための学習率探索
    
    Args:
        customers: 顧客リスト
        dc_candidates: DC候補リスト
        k: 選択する施設数
        lr_range: 学習率探索範囲 [min, max]
        num_iterations: 探索イテレーション数
    
    Returns:
        学習率探索結果
    """
    try:
        logger.info(f"K-Median学習率探索開始: 顧客数={len(customers)}, DC候補数={len(dc_candidates)}, K={k}")
        
        result = logistics_service.find_learning_rate(
            customers=customers,
            dc_candidates=dc_candidates,
            k=k,
            lr_range=tuple(lr_range),
            num_iterations=num_iterations
        )
        
        logger.info(f"K-Median学習率探索完了: 推奨学習率={result['suggested_lr']:.6f}")
        return result
        
    except Exception as e:
        logger.error(f"K-Median学習率探索エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"学習率探索に失敗しました: {str(e)}"
        )

# =====================================================
# Request Models for LND endpoints
# =====================================================

class SimpleLNDRequest(BaseModel):
    customers: List[CustomerData]
    dc_candidates: List[DCData]
    plants: List[PlantData]
    products: Optional[List[ProductData]] = None
    max_iterations: int = Field(500, description="最大反復回数")
    tolerance: float = Field(1e-6, description="収束判定閾値")

# =====================================================
# Advanced Optimization Methods
# =====================================================

@router.post("/multi-source-lnd", response_model=LNDResult)
async def solve_multi_source_lnd(request: SimpleLNDRequest):
    """
    Multi-source logistics network design
    """
    try:
        logger.info(f"Multi-source LND開始: 顧客数={len(request.customers)}, DC候補数={len(request.dc_candidates)}, 工場数={len(request.plants)}")
        
        result = logistics_service.solve_multi_source_lnd(
            customers=request.customers,
            dc_candidates=request.dc_candidates,
            plants=request.plants,
            products=request.products,
            max_iterations=request.max_iterations,
            tolerance=request.tolerance
        )
        
        logger.info(f"Multi-source LND完了: 総費用={result.total_cost:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"Multi-source LNDエラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-source LNDに失敗しました: {str(e)}"
        )

@router.post("/single-source-lnd", response_model=LNDResult)
async def solve_single_source_lnd(request: SimpleLNDRequest):
    """
    Single-source logistics network design
    """
    try:
        logger.info(f"Single-source LND開始: 顧客数={len(request.customers)}, DC候補数={len(request.dc_candidates)}, 工場数={len(request.plants)}")
        
        result = logistics_service.solve_single_source_lnd(
            customers=request.customers,
            dc_candidates=request.dc_candidates,
            plants=request.plants,
            products=request.products,
            max_iterations=request.max_iterations,
            tolerance=request.tolerance
        )
        
        logger.info(f"Single-source LND完了: 総費用={result.total_cost:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"Single-source LNDエラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Single-source LNDに失敗しました: {str(e)}"
        )

class AbstractLNDPRequest(BaseModel):
    customers: List[CustomerData]
    dc_candidates: List[DCData]
    plants: List[PlantData]
    products: Optional[List[ProductData]] = None
    echelon_config: Optional[Dict[str, Any]] = None
    optimization_config: Optional[Dict[str, Any]] = None

@router.post("/abstract-lndp", response_model=LNDResult)
async def solve_abstract_lndp(request: AbstractLNDPRequest):
    """
    Abstract LNDP with multi-echelon support
    """
    try:
        logger.info(f"Abstract LNDP開始: 顧客数={len(request.customers)}, DC候補数={len(request.dc_candidates)}, 工場数={len(request.plants)}")
        
        result = logistics_service.solve_abstract_lndp(
            customers=request.customers,
            dc_candidates=request.dc_candidates,
            plants=request.plants,
            products=request.products,
            echelon_config=request.echelon_config,
            optimization_config=request.optimization_config
        )
        
        logger.info(f"Abstract LNDP完了: 総費用={result.total_cost:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"Abstract LNDPエラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Abstract LNDPに失敗しました: {str(e)}"
        )

# =====================================================
# 顧客クラスタリング
# =====================================================

@router.post("/clustering", response_model=ClusteringResult)
async def cluster_customers(request: ClusteringRequest):
    """
    顧客クラスタリング
    
    Args:
        request: クラスタリングリクエスト
    
    Returns:
        クラスター割当と集約顧客
    """
    try:
        logger.info(f"顧客クラスタリング開始: 顧客数={len(request.customers)}, 手法={request.method}, クラスター数={request.n_clusters}")
        
        result = logistics_service.cluster_customers(
            customers=request.customers,
            method=request.method,
            n_clusters=request.n_clusters,
            use_road_distance=request.use_road_distance
        )
        
        logger.info(f"顧客クラスタリング完了: シルエット係数={result.silhouette_score:.3f}")
        return result
        
    except Exception as e:
        logger.error(f"顧客クラスタリングエラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"顧客クラスタリングに失敗しました: {str(e)}"
        )

# =====================================================
# 物流ネットワーク設計（LND）
# =====================================================

@router.post("/lnd", response_model=LNDResult)
async def solve_logistics_network_design(request: LNDRequest):
    """
    物流ネットワーク設計の最適化
    
    Args:
        request: LND最適化リクエスト
    
    Returns:
        最適ネットワーク設計
    """
    try:
        logger.info(f"LND最適化開始: 顧客数={len(request.customers)}, DC候補数={len(request.dc_candidates)}")
        
        result = logistics_service.solve_basic_lnd(
            customers=request.customers,
            dc_candidates=request.dc_candidates,
            plants=request.plants,
            model_type=request.model_type,
            max_facilities=request.max_facilities
        )
        
        logger.info(f"LND最適化完了: 総費用={result.total_cost:.2f}, 選択施設数={len(result.selected_facilities)}")
        return result
        
    except Exception as e:
        logger.error(f"LND最適化エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"物流ネットワーク設計最適化に失敗しました: {str(e)}"
        )

# =====================================================
# ネットワーク可視化
# =====================================================

@router.post("/visualization", response_model=NetworkVisualizationResult)
async def create_network_visualization(request: NetworkVisualizationRequest):
    """
    ネットワーク可視化データの生成
    
    Args:
        request: 可視化リクエスト
    
    Returns:
        Plotly可視化データ
    """
    try:
        logger.info("ネットワーク可視化データ生成開始")
        
        # サンプル顧客データを作成（実際の座標）
        # TODO: 将来的にはリクエストに顧客データを含めるか、DBから取得する
        customers = [
            CustomerData(
                name="顧客A",
                latitude=35.6762,
                longitude=139.6503,
                demand=50
            ),
            CustomerData(
                name="顧客B",
                latitude=35.6894,
                longitude=139.6917,
                demand=30
            ),
            CustomerData(
                name="顧客C",
                latitude=35.6586,
                longitude=139.7454,
                demand=80
            )
        ]
        
        result = logistics_service.create_network_visualization(
            lnd_result=request.lnd_result,
            customers=customers,
            show_flows=request.show_flows
        )
        
        logger.info("ネットワーク可視化データ生成完了")
        return result
        
    except Exception as e:
        logger.error(f"ネットワーク可視化エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ネットワーク可視化に失敗しました: {str(e)}"
        )

# =====================================================
# 統合分析エンドポイント
# =====================================================

@router.post("/comprehensive-analysis")
async def comprehensive_logistics_analysis(
    customers: List[CustomerData],
    dc_candidates: List[DCData],
    plants: List[PlantData] = [],
    analysis_options: Dict[str, bool] = None
):
    """
    包括的物流分析（複数の分析を統合実行）
    
    Args:
        customers: 顧客リスト
        dc_candidates: DC候補リスト 
        plants: 工場リスト
        analysis_options: 分析オプション
    
    Returns:
        統合分析結果
    """
    try:
        if analysis_options is None:
            analysis_options = {
                "weiszfeld": True,
                "k_median": True,
                "clustering": True,
                "lnd": True,
                "visualization": True
            }
        
        results = {"analyses": {}}
        
        logger.info("包括的物流分析開始")
        
        # 1. Weiszfeld法による施設立地
        if analysis_options.get("weiszfeld", False):
            try:
                weiszfeld_result = logistics_service.weiszfeld_multiple(
                    customers=customers,
                    num_facilities=min(5, len(dc_candidates)),
                    max_iterations=500,
                    tolerance=1e-4,
                    use_great_circle=True
                )
                results["analyses"]["weiszfeld"] = weiszfeld_result.dict()
                logger.info("Weiszfeld分析完了")
            except Exception as e:
                logger.error(f"Weiszfeld分析エラー: {e}")
                results["analyses"]["weiszfeld_error"] = str(e)
        
        # 2. K-Median最適化
        if analysis_options.get("k_median", False):
            try:
                k = min(3, len(dc_candidates))
                k_median_result = logistics_service.solve_k_median(
                    customers=customers,
                    dc_candidates=dc_candidates,
                    k=k,
                    max_iterations=500,
                    learning_rate=0.01,
                    momentum=0.9
                )
                results["analyses"]["k_median"] = k_median_result.dict()
                logger.info("K-Median分析完了")
            except Exception as e:
                logger.error(f"K-Median分析エラー: {e}")
                results["analyses"]["k_median_error"] = str(e)
        
        # 3. 顧客クラスタリング
        if analysis_options.get("clustering", False):
            try:
                clustering_result = logistics_service.cluster_customers(
                    customers=customers,
                    method="kmeans",
                    n_clusters=min(5, len(customers) // 2),
                    use_road_distance=False
                )
                results["analyses"]["clustering"] = clustering_result.dict()
                logger.info("クラスタリング分析完了")
            except Exception as e:
                logger.error(f"クラスタリング分析エラー: {e}")
                results["analyses"]["clustering_error"] = str(e)
        
        # 4. 物流ネットワーク設計
        if analysis_options.get("lnd", False):
            try:
                lnd_result = logistics_service.solve_basic_lnd(
                    customers=customers,
                    dc_candidates=dc_candidates,
                    plants=plants,
                    model_type="multi_source",
                    max_facilities=min(5, len(dc_candidates))
                )
                results["analyses"]["lnd"] = lnd_result.dict()
                logger.info("LND分析完了")
            except Exception as e:
                logger.error(f"LND分析エラー: {e}")
                results["analyses"]["lnd_error"] = str(e)
        
        results["summary"] = {
            "total_customers": len(customers),
            "total_dc_candidates": len(dc_candidates),
            "total_plants": len(plants),
            "completed_analyses": len([k for k in results["analyses"].keys() if not k.endswith("_error")])
        }
        
        logger.info("包括的物流分析完了")
        return results
        
    except Exception as e:
        logger.error(f"包括的物流分析エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"包括的物流分析に失敗しました: {str(e)}"
        )

# =====================================================
# データ生成・ユーティリティエンドポイント
# =====================================================

@router.post("/generate-sample-data")
async def generate_sample_data(
    num_customers: int = 20,
    num_dc_candidates: int = 5,
    region: str = "japan"
) -> Dict[str, Any]:
    """
    サンプルデータ生成
    
    Args:
        num_customers: 生成する顧客数
        num_dc_candidates: DC候補数
        region: 地域指定
    
    Returns:
        生成されたサンプルデータ
    """
    try:
        import random
        import numpy as np
        
        # 地域別座標範囲設定
        if region == "japan":
            lat_range = (35.0, 36.5)  # 関東地域
            lon_range = (139.0, 140.5)
        else:
            lat_range = (35.0, 36.5)
            lon_range = (139.0, 140.5)
        
        # 顧客データ生成
        customers = []
        for i in range(num_customers):
            customers.append(CustomerData(
                name=f"customer_{i+1}",
                latitude=random.uniform(lat_range[0], lat_range[1]),
                longitude=random.uniform(lon_range[0], lon_range[1]),
                demand=random.uniform(10, 100)
            ))
        
        # DC候補データ生成
        dc_candidates = []
        for i in range(num_dc_candidates):
            dc_candidates.append(DCData(
                name=f"dc_candidate_{i+1}",
                latitude=random.uniform(lat_range[0], lat_range[1]),
                longitude=random.uniform(lon_range[0], lon_range[1]),
                capacity=random.uniform(500, 1500),
                fixed_cost=random.uniform(10000, 50000),
                variable_cost=random.uniform(1, 5)
            ))
        
        # 工場データ生成
        plants = []
        for i in range(2):
            plants.append(PlantData(
                name=f"plant_{i+1}",
                latitude=random.uniform(lat_range[0], lat_range[1]),
                longitude=random.uniform(lon_range[0], lon_range[1]),
                capacity=random.uniform(1000, 3000),
                production_cost=random.uniform(5, 15)
            ))
        
        return {
            "customers": [c.dict() for c in customers],
            "dc_candidates": [d.dict() for d in dc_candidates],
            "plants": [p.dict() for p in plants],
            "metadata": {
                "region": region,
                "generation_timestamp": "2024-01-01T00:00:00Z",
                "total_demand": sum(c.demand for c in customers),
                "total_capacity": sum(d.capacity for d in dc_candidates)
            }
        }
        
    except Exception as e:
        logger.error(f"サンプルデータ生成エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"サンプルデータ生成に失敗しました: {str(e)}"
        )

# =====================================================
# 最適化パフォーマンス分析
# =====================================================

@router.post("/benchmark-algorithms")
async def benchmark_optimization_algorithms(
    customers: List[CustomerData],
    dc_candidates: List[DCData],
    algorithms: List[str] = ["weiszfeld", "k_median", "basic_lnd"]
) -> Dict[str, Any]:
    """
    最適化アルゴリズムのベンチマーク
    
    Args:
        customers: 顧客リスト
        dc_candidates: DC候補リスト
        algorithms: ベンチマーク対象アルゴリズム
    
    Returns:
        各アルゴリズムの性能比較
    """
    try:
        import time
        
        benchmark_results = {}
        
        for algorithm in algorithms:
            start_time = time.time()
            
            try:
                if algorithm == "weiszfeld":
                    result = logistics_service.weiszfeld_multiple(
                        customers=customers,
                        num_facilities=3,
                        max_iterations=500
                    )
                    benchmark_results[algorithm] = {
                        "total_cost": result.total_cost,
                        "solve_time": time.time() - start_time,
                        "iterations": result.iterations,
                        "status": "optimal"
                    }
                    
                elif algorithm == "k_median":
                    result = logistics_service.solve_k_median(
                        customers=customers,
                        dc_candidates=dc_candidates,
                        k=3,
                        max_iterations=500
                    )
                    benchmark_results[algorithm] = {
                        "total_cost": result.total_cost,
                        "solve_time": time.time() - start_time,
                        "selected_facilities": len(result.selected_facilities),
                        "status": "optimal"
                    }
                    
                elif algorithm == "basic_lnd":
                    result = logistics_service.solve_basic_lnd(
                        customers=customers,
                        dc_candidates=dc_candidates,
                        plants=[],
                        max_facilities=3
                    )
                    benchmark_results[algorithm] = {
                        "total_cost": result.total_cost,
                        "solve_time": time.time() - start_time,
                        "selected_facilities": len(result.selected_facilities),
                        "status": result.solution_status
                    }
                    
            except Exception as e:
                benchmark_results[algorithm] = {
                    "error": str(e),
                    "solve_time": time.time() - start_time,
                    "status": "failed"
                }
        
        # 比較分析
        successful_results = {k: v for k, v in benchmark_results.items() 
                            if v.get("status") != "failed"}
        
        comparison = {
            "best_cost": min(r["total_cost"] for r in successful_results.values()) if successful_results else None,
            "fastest_algorithm": min(successful_results.keys(), 
                                   key=lambda k: successful_results[k]["solve_time"]) if successful_results else None,
            "algorithm_count": len(algorithms),
            "success_rate": len(successful_results) / len(algorithms) if algorithms else 0
        }
        
        return {
            "benchmark_results": benchmark_results,
            "comparison": comparison,
            "problem_size": {
                "customers": len(customers),
                "dc_candidates": len(dc_candidates)
            }
        }
        
    except Exception as e:
        logger.error(f"アルゴリズムベンチマークエラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"アルゴリズムベンチマークに失敗しました: {str(e)}"
        )