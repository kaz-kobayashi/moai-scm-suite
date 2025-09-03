"""
メインAPIルーター
"""

from fastapi import APIRouter
from .endpoints import abc, vrp, inventory, logistics

api_router = APIRouter()
api_router.include_router(abc.router, prefix="/abc", tags=["ABC分析"])
api_router.include_router(vrp.router, prefix="/vrp", tags=["配送計画システム"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["在庫最適化"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["物流ネットワーク設計"])