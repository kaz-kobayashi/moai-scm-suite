"""
pytestの設定とフィクスチャ
"""

import pytest
import pandas as pd
import numpy as np


@pytest.fixture
def sample_demand_data():
    """テスト用のサンプル需要データ"""
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    customers = ['顧客A', '顧客B', '顧客C']
    products = ['製品X', '製品Y', '製品Z']
    
    data = []
    for date in dates:
        for cust in customers:
            for prod in products:
                demand = np.random.randint(10, 100)
                data.append({
                    'date': date,
                    'cust': cust,
                    'prod': prod,
                    'demand': demand
                })
    
    return pd.DataFrame(data)


@pytest.fixture
def sample_node_data():
    """テスト用のサンプルノードデータ"""
    return pd.DataFrame({
        'name': ['地点A', '地点B', '地点C'],
        'location': ['[139.7, 35.7]', '[139.8, 35.8]', '[139.6, 35.6]']
    })