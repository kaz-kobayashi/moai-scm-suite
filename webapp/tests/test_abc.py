"""
ABC分析機能のテスト
"""

import pytest
import pandas as pd
import numpy as np
from app.services.abc_service import demand_tree_map, abc_analysis


class TestABCService:
    def setup_method(self):
        """テスト用のサンプルデータを準備"""
        # サンプル需要データ
        dates = pd.date_range('2023-01-01', periods=30, freq='D')
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
        
        self.demand_df = pd.DataFrame(data)

    def test_demand_tree_map(self):
        """demand_tree_map関数のテスト"""
        fig = demand_tree_map(self.demand_df, parent="cust", value="demand")
        
        # 図オブジェクトが正常に作成されることを確認
        assert fig is not None
        assert hasattr(fig, 'to_json')

    def test_abc_analysis(self):
        """abc_analysis関数のテスト"""
        threshold = [0.7, 0.2, 0.1]
        agg_df, new_df, category = abc_analysis(
            self.demand_df, threshold, "prod", "demand", "abc", "rank"
        )
        
        # 結果の基本的な検証
        assert isinstance(agg_df, pd.DataFrame)
        assert isinstance(new_df, pd.DataFrame)
        assert isinstance(category, dict)
        
        # ABC分類が正しく設定されているか
        assert "abc" in new_df.columns
        assert "rank" in new_df.columns
        
        # カテゴリ数が正しいか
        assert len(category) == len(threshold)

    def test_abc_analysis_threshold_validation(self):
        """閾値の合計が0.99以上であることの検証"""
        invalid_threshold = [0.5, 0.3, 0.1]  # 合計が0.9で0.99未満
        
        with pytest.raises(AssertionError):
            abc_analysis(
                self.demand_df, invalid_threshold, "prod", "demand", "abc", "rank"
            )