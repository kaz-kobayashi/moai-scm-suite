"""
VRP（配送計画システム）用FastAPIエンドポイント - 02metroVI.ipynbの機能を薄いラッパーでAPIとして提供
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import pandas as pd
import json

from ...models.vrp import VRPRequest, VRPResult, Model
from ...services.vrp_service import (
    optimize_vrp, make_solution, compute_distance_table_for_vrp, 
    generate_node, generate_node_normal, build_model_for_vrp, generate_vrp,
    time_convert
)

router = APIRouter()

@router.post("/optimize", response_model=VRPResult)
async def optimize_vehicle_routing(request: VRPRequest):
    """VRP最適化を実行"""
    try:
        # Model オブジェクトを作成
        model = Model(**request.model_data)
        
        # 最適化実行
        input_dic, output_dic, error = optimize_vrp(
            model,
            matrix=request.matrix,
            threads=request.threads,
            explore=request.explore,
            cloud=False,
            osrm=request.osrm,
            host=request.host
        )
        
        # Handle cases where optimization failed
        if input_dic == "" or output_dic == "":
            return VRPResult(
                input_data={},
                output_data={},
                error_message=error or "Optimization failed"
            )
        
        return VRPResult(
            input_data=input_dic,
            output_data=output_dic,
            error_message=error
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/solution", response_model=Dict[str, Any])
async def create_solution_summary(output_data: Dict[str, Any]):
    """最適化結果から解の情報を作成"""
    try:
        summary_df, route_summary_df, unassigned_df, route_df_dic = make_solution(output_data)
        
        result = {
            "summary": summary_df.to_dict() if summary_df is not None else None,
            "route_summary": route_summary_df.to_dict() if route_summary_df is not None else None,
            "unassigned": unassigned_df.to_dict() if unassigned_df is not None else None,
            "routes": {}
        }
        
        # ルートデータフレームを辞書形式に変換
        for route_id, df in route_df_dic.items():
            result["routes"][str(route_id)] = df.to_dict()
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/distance-table", response_model=Dict[str, Any])
async def compute_distance_table(request: Dict[str, Any]):
    """移動時間・距離テーブルを計算"""
    try:
        node_df = pd.DataFrame(request["node_data"])
        toll = request.get("toll", True)
        host = request.get("host", "localhost")
        
        durations, distances = compute_distance_table_for_vrp(node_df, toll, host)
        
        return {
            "durations": durations,
            "distances": distances
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-nodes", response_model=Dict[str, Any])
async def generate_random_nodes(request: Dict[str, Any]):
    """ランダムなノードデータを生成"""
    try:
        n = request["n"]
        random_seed = request.get("random_seed", 1)
        prefecture = request.get("prefecture", None)
        matrix = request.get("matrix", False)
        host = request.get("host", "localhost")
        
        node_df, time_df = generate_node(n, random_seed, prefecture, matrix, host)
        
        result = {
            "node_data": node_df.to_dict(),
        }
        
        if time_df != "":
            result["time_data"] = time_df.to_dict()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-nodes-normal", response_model=Dict[str, Any])
async def generate_normal_distributed_nodes(request: Dict[str, Any]):
    """正規分布に従ったノードデータを生成"""
    try:
        n = request["n"]
        lat_center = request["lat_center"]
        lon_center = request["lon_center"]
        std = request.get("std", 0.1)
        country_code = request.get("country_code", "ja_JP")
        random_seed = request.get("random_seed", 1)
        matrix = request.get("matrix", False)
        
        node_df, time_df = generate_node_normal(
            n, lat_center, lon_center, std, country_code, random_seed, matrix
        )
        
        result = {
            "node_data": node_df.to_dict(),
        }
        
        if time_df != "":
            result["time_data"] = time_df.to_dict()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/build-model", response_model=Dict[str, Any])
async def build_vrp_model(request: Dict[str, Any]):
    """データフレームからVRPモデルを構築"""
    try:
        job_df = pd.DataFrame(request["job_data"]) if request.get("job_data") else None
        shipment_df = pd.DataFrame(request["shipment_data"]) if request.get("shipment_data") else None
        vehicle_df = pd.DataFrame(request["vehicle_data"])
        break_df = pd.DataFrame(request["break_data"]) if request.get("break_data") else None
        time_df = pd.DataFrame(request["time_data"]) if request.get("time_data") else None
        cost_per_hour = request.get("cost_per_hour", 3600)
        
        model = build_model_for_vrp(job_df, shipment_df, vehicle_df, break_df, time_df, cost_per_hour)
        
        return {"model_data": json.loads(model.model_dump_json(exclude_none=True))}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-vrp", response_model=Dict[str, Any])
async def generate_vrp_problem(request: Dict[str, Any]):
    """VRP問題例を生成"""
    try:
        node_df = pd.DataFrame(request["node_data"])
        
        num_depots = request.get("num_depots", 1)
        open_flag = request.get("open_flag", False)
        num_jobs = request.get("num_jobs", 10)
        num_shipments = request.get("num_shipments", 0)
        num_time_windows = request.get("num_time_windows", 1)
        time_window_bounds = request.get("time_window_bounds", (0, 36000))
        time_window_ratio = request.get("time_window_ratio", 0.9)
        delivery_bounds = request.get("delivery_bounds", (0, 0))
        pickup_bounds = request.get("pickup_bounds", (0, 0))
        service_bounds = request.get("service_bounds", (0, 0))
        amount_bounds = request.get("amount_bounds", (0, 0))
        priority_bounds = request.get("priority_bounds", (0, 100))
        load_factor = request.get("load_factor", 0.9)
        num_customers_per_route = request.get("num_customers_per_route", 5)
        skill_flag = request.get("skill_flag", False)
        breaks = request.get("breaks", None)
        
        job_df, shipment_df, vehicle_df = generate_vrp(
            node_df, num_depots, open_flag, num_jobs, num_shipments, 
            num_time_windows, time_window_bounds, time_window_ratio,
            delivery_bounds, pickup_bounds, service_bounds, amount_bounds,
            priority_bounds, load_factor, num_customers_per_route, skill_flag, breaks
        )
        
        return {
            "job_data": job_df.to_dict(),
            "shipment_data": shipment_df.to_dict(),
            "vehicle_data": vehicle_df.to_dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/time-convert", response_model=Dict[str, str])
async def convert_time(request: Dict[str, Any]):
    """時間変換ユーティリティ"""
    try:
        sec = request["seconds"]
        start = request["start"]
        
        result = time_convert(sec, start)
        
        return {"converted_time": result}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy"}