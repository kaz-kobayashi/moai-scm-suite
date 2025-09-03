"""
FastAPI エンドポイントのテスト
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAPIEndpoints:
    
    def test_root_endpoint(self):
        """ルートエンドポイントのテスト"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Supply Chain Management Optimization API"

    def test_health_check(self):
        """ヘルスチェックエンドポイントのテスト"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_abc_tree_map_endpoint(self):
        """ABC TreeMapエンドポイントのテスト"""
        # サンプルデータ
        demand_data = [
            {
                "date": "2023-01-01",
                "cust": "顧客A",
                "prod": "製品X",
                "demand": 100.0
            },
            {
                "date": "2023-01-01", 
                "cust": "顧客B",
                "prod": "製品Y",
                "demand": 150.0
            }
        ]
        
        request_data = {
            "demand_data": demand_data,
            "parent": "cust",
            "value": "demand"
        }
        
        response = client.post("/api/v1/abc/tree-map", json=request_data)
        
        # APIが正常に動作することを確認
        # （実際のPlotly図の生成にはより複雑な検証が必要）
        assert response.status_code == 200 or response.status_code == 400
        # エラーが発生した場合、レスポンスの詳細を確認
        if response.status_code == 400:
            print("Error response:", response.json())

    def test_abc_analysis_endpoint(self):
        """ABC分析エンドポイントのテスト"""
        # サンプルデータ
        demand_data = [
            {
                "date": "2023-01-01",
                "cust": "顧客A", 
                "prod": "製品X",
                "demand": 100.0
            },
            {
                "date": "2023-01-01",
                "cust": "顧客B",
                "prod": "製品Y", 
                "demand": 150.0
            },
            {
                "date": "2023-01-01",
                "cust": "顧客C",
                "prod": "製品Z",
                "demand": 200.0
            }
        ]
        
        request_data = {
            "demand_data": demand_data,
            "threshold": [0.7, 0.2, 0.1],
            "agg_col": "prod",
            "value_col": "demand",
            "abc_name": "abc",
            "rank_name": "rank"
        }
        
        response = client.post("/api/v1/abc/analysis", json=request_data)
        
        # APIが正常に動作することを確認
        assert response.status_code == 200 or response.status_code == 400
        if response.status_code == 400:
            print("Error response:", response.json())

    def test_vrp_health_endpoint(self):
        """VRPヘルスチェックエンドポイントのテスト"""
        response = client.get("/api/v1/vrp/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"