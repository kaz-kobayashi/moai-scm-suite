"""
メインAPIルーター
"""

from fastapi import APIRouter
from .endpoints import abc, vrp, inventory, logistics, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["認証"])
api_router.include_router(abc.router, prefix="/abc", tags=["ABC分析"])
api_router.include_router(vrp.router, prefix="/vrp", tags=["配送計画システム"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["在庫最適化"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["物流ネットワーク設計"])

# パブリックアクセス用APIルーター（認証バイパス）
public_api_router = APIRouter()
public_api_router.include_router(auth.router, prefix="/auth", tags=["認証（公開）"])
public_api_router.include_router(abc.router, prefix="/abc", tags=["ABC分析（公開）"])
public_api_router.include_router(vrp.router, prefix="/vrp", tags=["配送計画システム（公開）"])
public_api_router.include_router(inventory.router, prefix="/inventory", tags=["在庫最適化（公開）"])
public_api_router.include_router(logistics.router, prefix="/logistics", tags=["物流ネットワーク設計（公開）"])