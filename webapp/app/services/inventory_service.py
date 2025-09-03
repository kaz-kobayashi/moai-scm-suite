"""
在庫最適化サービス - 03inventory.ipynb から完全移植
"""

import sys
import os
import numpy as np
import pandas as pd
import networkx as nx
import random
import math
from typing import List, Dict, Tuple, Optional, Any, Union
from collections import defaultdict, deque
from scipy import stats, optimize
from scipy.optimize import minimize
from scipy.stats import norm
import warnings
warnings.filterwarnings('ignore')

from ..models.inventory import (
    ProductData, DemandData, SSARequest, SSAResult,
    EOQRequest, EOQResult, SimulationRequest, SimulationResult,
    BaseStockRequest, BaseStockResult, InventoryPolicy,
    DemandDistributionRequest, DemandDistributionResult,
    MultiStageRequest, MultiStageResult
)

class InventoryOptimizationService:
    """在庫最適化サービスクラス"""
    
    def __init__(self):
        self.random_seed = 42
        random.seed(self.random_seed)
        np.random.seed(self.random_seed)

    # =====================================================
    # Safety Stock Allocation (SSA) Functions
    # =====================================================
    
    def dynamic_programming_for_SSA(self, G: nx.DiGraph, budget: float, 
                                  demand_params: Dict) -> Dict[str, float]:
        """
        動的プログラミングによる安全在庫配分最適化
        03inventory.ipynb から完全移植
        """
        # ノードの収益とコストの計算
        profits = {}  # ノードiに安全在庫1単位を追加したときの収益
        costs = {}    # ノードiに安全在庫1単位を追加するためのコスト
        
        for node in G.nodes():
            # 需要パラメータから収益とコストを計算
            if node in demand_params:
                params = demand_params[node]
                profits[node] = params.get('profit', 1.0)
                costs[node] = params.get('cost', 1.0)
            else:
                profits[node] = 1.0
                costs[node] = 1.0
        
        # 動的プログラミングテーブル
        nodes = list(G.nodes())
        n = len(nodes)
        max_budget_int = int(budget) + 1
        
        # dp[i][b] = ノード0からi-1まで使って予算bで得られる最大収益
        dp = [[0] * max_budget_int for _ in range(n + 1)]
        parent = [[-1] * max_budget_int for _ in range(n + 1)]
        
        for i in range(1, n + 1):
            node = nodes[i-1]
            node_cost = int(costs[node])
            node_profit = profits[node]
            
            for b in range(max_budget_int):
                # このノードを選ばない場合
                dp[i][b] = dp[i-1][b]
                parent[i][b] = 0
                
                # このノードを選ぶ場合（予算が足りる場合）
                if b >= node_cost:
                    new_profit = dp[i-1][b-node_cost] + node_profit
                    if new_profit > dp[i][b]:
                        dp[i][b] = new_profit
                        parent[i][b] = 1
        
        # 最適解の復元
        allocation = {node: 0.0 for node in nodes}
        b = int(budget)
        for i in range(n, 0, -1):
            if parent[i][b] == 1:
                node = nodes[i-1]
                allocation[node] = 1.0
                b -= int(costs[node])
        
        return allocation
    
    def tabu_search_for_SSA(self, G: nx.DiGraph, budget: float,
                           demand_params: Dict, max_iterations: int = 1000) -> Dict[str, float]:
        """
        タブ探索による安全在庫配分最適化
        03inventory.ipynb から完全移植
        """
        nodes = list(G.nodes())
        n = len(nodes)
        
        # 初期解を生成（予算内でランダムに配分）
        current_solution = {node: 0.0 for node in nodes}
        remaining_budget = budget
        
        for node in nodes:
            if remaining_budget <= 0:
                break
            cost = demand_params.get(node, {}).get('cost', 1.0)
            if cost <= remaining_budget:
                current_solution[node] = min(remaining_budget / cost, 10.0)  # 最大10単位
                remaining_budget -= current_solution[node] * cost
        
        best_solution = current_solution.copy()
        best_objective = self._calculate_ssa_objective(best_solution, G, demand_params)
        
        tabu_list = deque(maxlen=min(100, n))  # タブリストサイズ
        
        for iteration in range(max_iterations):
            neighbors = self._generate_ssa_neighbors(current_solution, G, budget, demand_params)
            
            best_neighbor = None
            best_neighbor_obj = float('-inf')
            
            for neighbor in neighbors:
                neighbor_key = tuple(sorted(neighbor.items()))
                if neighbor_key not in tabu_list:
                    obj = self._calculate_ssa_objective(neighbor, G, demand_params)
                    if obj > best_neighbor_obj:
                        best_neighbor = neighbor
                        best_neighbor_obj = obj
            
            if best_neighbor is None:
                break
            
            current_solution = best_neighbor
            tabu_list.append(tuple(sorted(current_solution.items())))
            
            if best_neighbor_obj > best_objective:
                best_solution = current_solution.copy()
                best_objective = best_neighbor_obj
        
        return best_solution
    
    def _calculate_ssa_objective(self, solution: Dict[str, float], 
                               G: nx.DiGraph, demand_params: Dict) -> float:
        """SSA目的関数の計算"""
        total_profit = 0.0
        for node, allocation in solution.items():
            profit = demand_params.get(node, {}).get('profit', 1.0)
            total_profit += allocation * profit
        return total_profit
    
    def _generate_ssa_neighbors(self, current_solution: Dict[str, float],
                              G: nx.DiGraph, budget: float, demand_params: Dict) -> List[Dict[str, float]]:
        """SSAの近傍解生成"""
        neighbors = []
        nodes = list(current_solution.keys())
        
        for i in range(len(nodes)):
            for j in range(len(nodes)):
                if i == j:
                    continue
                
                neighbor = current_solution.copy()
                
                # ノードiから少し減らしてノードjに移す
                decrease_amount = min(neighbor[nodes[i]], 1.0)
                if decrease_amount > 0:
                    neighbor[nodes[i]] -= decrease_amount
                    
                    cost_i = demand_params.get(nodes[i], {}).get('cost', 1.0)
                    cost_j = demand_params.get(nodes[j], {}).get('cost', 1.0)
                    
                    increase_amount = (decrease_amount * cost_i) / cost_j
                    neighbor[nodes[j]] += increase_amount
                    
                    # 予算制約チェック
                    total_cost = sum(neighbor[node] * demand_params.get(node, {}).get('cost', 1.0) 
                                   for node in neighbor)
                    if total_cost <= budget:
                        neighbors.append(neighbor)
        
        return neighbors

    # =====================================================
    # EOQ Functions
    # =====================================================
    
    def eoq(self, daily_demand: float, order_cost: float, holding_cost: float,
            unit_cost: Optional[float] = None, backorder_cost: Optional[float] = None,
            discount_breaks: Optional[List[Tuple[float, float]]] = None) -> EOQResult:
        """
        Economic Order Quantity計算
        03inventory.ipynb から完全移植
        """
        if discount_breaks:
            return self._eoq_with_discounts(daily_demand, order_cost, holding_cost, discount_breaks)
        elif backorder_cost:
            return self._eoq_with_backorders(daily_demand, order_cost, holding_cost, backorder_cost)
        else:
            return self._basic_eoq(daily_demand, order_cost, holding_cost)
    
    def eoq_annual(self, annual_demand: float, order_cost: float, holding_cost: float,
                   unit_cost: Optional[float] = None, backorder_cost: Optional[float] = None,
                   discount_breaks: Optional[List[Tuple[float, float]]] = None) -> EOQResult:
        """
        EOQ calculation using annual demand directly (matches UI formulas)
        """
        if discount_breaks:
            return self._eoq_with_discounts(annual_demand, order_cost, holding_cost, discount_breaks)
        elif backorder_cost:
            return self._eoq_annual_with_backorders(annual_demand, order_cost, holding_cost, backorder_cost)
        else:
            return self._eoq_annual_basic(annual_demand, order_cost, holding_cost)
    
    def _basic_eoq(self, daily_demand: float, order_cost: float, holding_cost: float) -> EOQResult:
        """基本EOQ計算 - 03inventory.ipynb完全移植版"""
        # 基本EOQ公式: Q* = sqrt(2*K*d/h)
        eoq = math.sqrt((2 * order_cost * daily_demand) / holding_cost)
        total_cost = math.sqrt(2 * order_cost * holding_cost * daily_demand)
        order_frequency = daily_demand / eoq
        cycle_time = eoq / daily_demand  # days
        
        return EOQResult(
            eoq=eoq,
            total_cost=total_cost,
            order_frequency=order_frequency,
            cycle_time=cycle_time
        )
    
    def _eoq_annual_basic(self, annual_demand: float, order_cost: float, holding_cost: float) -> EOQResult:
        """基本EOQ計算 (年間需要ベース) - UIの式に対応"""
        # 基本EOQ公式: Q* = sqrt(2*K*D/H) where D is annual demand
        eoq = math.sqrt((2 * order_cost * annual_demand) / holding_cost)
        
        # 年間総コスト = 発注コスト + 保管コスト
        annual_order_cost = (annual_demand / eoq) * order_cost
        annual_holding_cost = (eoq / 2) * holding_cost
        total_cost = annual_order_cost + annual_holding_cost
        
        # 発注頻度 (年間)
        order_frequency = annual_demand / eoq
        
        # 発注サイクル (営業日ベース)
        business_days = 260  # 年間営業日
        cycle_time = business_days / order_frequency  # 営業日
        
        return EOQResult(
            eoq=eoq,
            total_cost=total_cost,
            order_frequency=order_frequency,
            cycle_time=cycle_time
        )
    
    def _eoq_with_backorders(self, daily_demand: float, order_cost: float, 
                           holding_cost: float, backorder_cost: float) -> EOQResult:
        """バックオーダー付きEOQ - 03inventory.ipynb完全移植版"""
        # Critical ratio: omega = b/(b+h)
        omega = backorder_cost / (backorder_cost + holding_cost)
        
        # EOQ with backorders: Q* = sqrt(2*K*d/(h*omega))
        eoq = math.sqrt((2 * order_cost * daily_demand) / (holding_cost * omega))
        total_cost = math.sqrt(2 * order_cost * holding_cost * daily_demand * omega)
        
        # Maximum backorder level
        max_backorder = eoq * (1 - omega)
        
        return EOQResult(
            eoq=eoq,
            total_cost=total_cost,
            order_frequency=daily_demand / eoq,
            cycle_time=eoq / daily_demand,
            safety_stock=-max_backorder
        )
    
    def _eoq_annual_with_backorders(self, annual_demand: float, order_cost: float, 
                                   holding_cost: float, backorder_cost: float) -> EOQResult:
        """バックオーダー付きEOQ (年間需要ベース)"""
        # Critical ratio: omega = b/(b+h)
        omega = backorder_cost / (backorder_cost + holding_cost)
        
        # EOQ with backorders: Q* = sqrt(2*K*D/(H*omega))
        eoq = math.sqrt((2 * order_cost * annual_demand) / (holding_cost * omega))
        
        # 年間総コスト
        annual_order_cost = (annual_demand / eoq) * order_cost
        annual_holding_cost = (eoq / 2) * holding_cost * omega
        total_cost = annual_order_cost + annual_holding_cost
        
        # Maximum backorder level
        max_backorder = eoq * (1 - omega)
        
        # 発注頻度とサイクル
        order_frequency = annual_demand / eoq
        business_days = 260
        cycle_time = business_days / order_frequency
        
        return EOQResult(
            eoq=eoq,
            total_cost=total_cost,
            order_frequency=order_frequency,
            cycle_time=cycle_time,
            safety_stock=-max_backorder
        )
    
    def _eoq_with_discounts(self, annual_demand: float, order_cost: float,
                          holding_cost: float, discount_breaks: List[Tuple[float, float]]) -> EOQResult:
        """数量割引付きEOQ"""
        best_cost = float('inf')
        best_eoq = 0
        best_unit_cost = 0
        
        # 各割引階層をチェック
        for qty_break, unit_price in discount_breaks:
            h = holding_cost * unit_price  # 保管費用は単価に比例
            eoq_candidate = math.sqrt((2 * annual_demand * order_cost) / h)
            
            if eoq_candidate >= qty_break:
                # EOQが割引条件を満たす場合
                order_qty = eoq_candidate
            else:
                # 最小発注量を使用
                order_qty = qty_break
            
            # 総コスト計算
            annual_order_cost = (annual_demand / order_qty) * order_cost
            annual_holding_cost = (order_qty / 2) * h
            annual_purchase_cost = annual_demand * unit_price
            total_cost = annual_order_cost + annual_holding_cost + annual_purchase_cost
            
            if total_cost < best_cost:
                best_cost = total_cost
                best_eoq = order_qty
                best_unit_cost = unit_price
        
        return EOQResult(
            eoq=best_eoq,
            total_cost=best_cost,
            order_frequency=annual_demand / best_eoq,
            cycle_time=best_eoq / annual_demand * 365
        )
    
    def wagner_whitin(self, demands: List[float], 
                     fixed_costs: Union[float, List[float]] = 100., 
                     variable_costs: Union[float, List[float]] = 0., 
                     holding_costs: Union[float, List[float]] = 5.) -> Dict[str, Any]:
        """
        Wagner-Whitin動的ロットサイジング - 03inventory.ipynb完全移植版
        
        Args:
            demands: 各期の需要量
            fixed_costs: 発注固定費用（期間別または単一値）
            variable_costs: 変動費用（期間別または単一値）
            holding_costs: 保管費用（期間別または単一値）
        """
        T = len(demands)
        demand = np.array(demands)
        
        # Convert inputs to arrays
        if isinstance(fixed_costs, (int, float)):
            fixed = np.full(T, fixed_costs)
        elif isinstance(fixed_costs, list):
            if len(fixed_costs) == T:
                fixed = np.array(fixed_costs)
            else:
                fixed = np.full(T, fixed_costs[0])
        else:
            fixed = np.array(fixed_costs)
            
        if isinstance(variable_costs, (int, float)):
            variable = np.full(T, variable_costs)
        elif isinstance(variable_costs, list):
            if len(variable_costs) == T:
                variable = np.array(variable_costs)
            else:
                variable = np.full(T, variable_costs[0])
        else:
            variable = np.array(variable_costs)
            
        if isinstance(holding_costs, (int, float)):
            hc = np.full(T, holding_costs)
        elif isinstance(holding_costs, list):
            if len(holding_costs) == T:
                hc = np.array(holding_costs)
            else:
                hc = np.full(T, holding_costs[0])
        else:
            hc = np.array(holding_costs)
        
        # Dynamic Programming Algorithm from 03inventory.ipynb
        F = np.full(T, 99999999999.)
        prev = np.full(T, -1)
        
        for i in range(T):
            if i == 0:
                cum = fixed[i] + variable[i] * demand[i]
            else:
                cum = F[i-1] + fixed[i] + variable[i] * demand[i]
            cumh = 0
            for j in range(i, T):
                if cum < F[j]:
                    F[j] = cum
                    prev[j] = i-1
                if j == (T-1):
                    break
                cumh += hc[j]
                cum += (variable[i] + cumh) * demand[j+1]
        
        # Reconstruct solution
        setup = np.zeros(T)
        j = T-1
        while j != -1:
            i = prev[j]
            setup[i+1] = 1
            j = i
        
        # Calculate orders
        dem = 0
        order = np.zeros(T)
        for t in range(T-1, -1, -1):
            dem += demand[t]
            if setup[t] == 1:
                order[t] = dem
                dem = 0
        
        return {
            'orders': order.tolist(),
            'total_cost': float(F[T-1]),
            'order_periods': [i for i, o in enumerate(order) if o > 0]
        }

    # =====================================================
    # Inventory Simulation Functions  
    # =====================================================
    
    def simulate_inventory(self, policy: InventoryPolicy, demands: List[float],
                          initial_inventory: float = 0, lead_time: int = 1) -> SimulationResult:
        """
        在庫政策のシミュレーション
        03inventory.ipynb から完全移植
        """
        periods = len(demands)
        inventory_history = [initial_inventory]
        orders = []
        stockouts = 0
        total_holding_cost = 0
        total_order_cost = 0
        total_shortage_cost = 0
        
        inventory = initial_inventory
        pending_orders = deque()  # (arrival_period, quantity)
        
        total_demand = 0
        total_fulfilled = 0
        
        for period in range(periods):
            # 到着する注文を処理
            while pending_orders and pending_orders[0][0] <= period:
                _, order_qty = pending_orders.popleft()
                inventory += order_qty
            
            # 需要を処理
            demand = demands[period]
            total_demand += demand
            
            if inventory >= demand:
                inventory -= demand
                total_fulfilled += demand
            else:
                shortage = demand - inventory
                stockouts += 1
                total_shortage_cost += shortage * 10  # 仮の欠品コスト
                total_fulfilled += inventory  # 部分的に充足された分も考慮
                inventory = 0
            
            # 発注判断
            order_qty = 0
            if policy.policy_type == "QR":
                if inventory <= policy.R:
                    order_qty = policy.Q
            elif policy.policy_type == "sS":
                if inventory <= policy.s:
                    order_qty = policy.S - inventory
            
            if order_qty > 0:
                pending_orders.append((period + lead_time, order_qty))
                total_order_cost += 50  # 仮の発注コスト
                orders.append(order_qty)
            else:
                orders.append(0)
            
            # 保管コスト
            total_holding_cost += inventory * 1  # 仮の保管コスト率
            inventory_history.append(inventory)
        
        # 正しいサービスレベル計算：実際の需要充足率
        service_level = total_fulfilled / total_demand if total_demand > 0 else 1.0
        average_inventory = sum(inventory_history) / len(inventory_history)
        
        return SimulationResult(
            average_inventory=average_inventory,
            service_level=service_level,
            stockout_frequency=stockouts / periods if periods > 0 else 0,
            total_cost=total_holding_cost + total_order_cost + total_shortage_cost,
            holding_cost=total_holding_cost,
            order_cost=total_order_cost,
            shortage_cost=total_shortage_cost,
            inventory_history=inventory_history[:-1],  # 最後の要素を除く
            demand_history=demands
        )

    # =====================================================
    # Distribution Fitting Functions
    # =====================================================
    
    def best_distribution(self, data: List[float], distributions: List[str] = None, 
                         method: str = "mle", significance_level: float = 0.05) -> DemandDistributionResult:
        """
        最適分布のフィッティング
        03inventory.ipynb から完全移植
        """
        # フロントエンドからの分布名をscipy形式に変換
        distribution_mapping = {
            'normal': 'norm',
            'gamma': 'gamma',
            'lognormal': 'lognorm',
            'weibull': 'weibull_min',
            'exponential': 'expon',
            'uniform': 'uniform',
            'beta': 'beta',
            'poisson': 'poisson'
        }
        
        if distributions is None:
            distributions = ['normal', 'gamma', 'lognormal', 'weibull']
        
        # フロントエンド名をscipy名にマッピング
        scipy_distributions = [distribution_mapping.get(d, d) for d in distributions]
        
        data_array = np.array(data)
        results = {}
        best_dist = None
        best_p = 0
        best_params = {}
        
        # 逆マッピング用辞書
        reverse_mapping = {v: k for k, v in distribution_mapping.items()}
        
        for i, dist_name in enumerate(scipy_distributions):
            frontend_name = distributions[i]  # オリジナルのフロントエンド名
            try:
                if dist_name == 'poisson':
                    # ポアソン分布は離散分布
                    param = np.mean(data_array)
                    D, p = stats.kstest(data_array, lambda x: stats.poisson.cdf(x, param))
                    results[frontend_name] = {
                        'params': {'mu': param},
                        'p_value': p,
                        'test_statistic': D
                    }
                else:
                    # 連続分布
                    dist = getattr(stats, dist_name)
                    params = dist.fit(data_array)
                    D, p = stats.kstest(data_array, lambda x: dist.cdf(x, *params))
                    
                    param_names = ['loc', 'scale'] if len(params) == 2 else [f'param_{i}' for i in range(len(params))]
                    results[frontend_name] = {
                        'params': dict(zip(param_names, params)),
                        'p_value': p,
                        'test_statistic': D
                    }
                
                if p > best_p:
                    best_p = p
                    best_dist = frontend_name  # フロントエンド名を記録
                    best_params = results[frontend_name]['params']
                    
            except Exception as e:
                results[frontend_name] = {
                    'params': {},
                    'p_value': 0,
                    'test_statistic': float('inf'),
                    'error': str(e)
                }
        
        # フロントエンド互換の結果形式で返す
        best_fit_info = {
            'distribution': best_dist or distributions[0],
            'parameters': best_params,
            'p_value': best_p,
            'aic': -2 * best_p,  # 簡易的なAIC計算
            'bic': -2 * best_p + len(best_params) * np.log(len(data))  # 簡易的なBIC計算
        }
        
        return DemandDistributionResult(
            best_fit=best_fit_info,
            best_distribution=best_dist or distributions[0],
            parameters=best_params,
            goodness_of_fit=best_p,
            all_results=results
        )

    def approximate_ss(self, mu: float = 100., sigma: float = 10., LT: int = 0, 
                      b: float = 100., h: float = 1., fc: float = 10000.) -> Tuple[float, float]:
        """
        (s,S)政策の近似計算 - 03inventory.ipynb完全移植版
        Ehrhardt-Mosier (1984) approximation
        """
        sigmaL = sigma * np.sqrt(LT + 1) + 0.000001
        muL = mu * (LT + 1)
        Q = 1.3 * mu**0.494 * (fc/h)**0.506 * (1 + sigmaL**2/mu**2)**0.116
        z = np.sqrt(Q*h/sigmaL/b) + 0.0000001
        s = 0.973*muL + sigmaL*(0.183/z + 1.063 - 2.192*z)
        S = s + Q
        
        if Q <= mu * 1.5:
            omega = b / (b + h)
            z = norm.ppf(omega)
            S0 = muL + z * sigmaL
            s = min(s, S0)
            S = min(s + Q, S0)
        
        return s, S

    # =====================================================
    # Optimization Functions
    # =====================================================
    
    def optimize_base_stock(self, demands: List[float], target_service_level: float = 0.95,
                           holding_cost: float = 1.0, shortage_cost: float = 10.0) -> BaseStockResult:
        """
        ベースストックレベルの最適化
        03inventory.ipynb から完全移植（改良版）
        """
        def objective(base_stock_level):
            # シミュレーションによる評価
            policy = InventoryPolicy(policy_type="sS", s=0, S=base_stock_level[0])
            result = self.simulate_inventory(policy, demands)
            
            # ペナルティ法を使用してサービスレベル制約を処理
            penalty = 0
            if result.service_level < target_service_level:
                penalty = 1000 * (target_service_level - result.service_level) ** 2
            
            return result.holding_cost + result.shortage_cost + penalty
        
        # 初期値設定（より幅広い範囲を探索）
        mean_demand = np.mean(demands)
        std_demand = np.std(demands)
        
        # 複数の初期値で最適化を実行
        best_result = None
        best_cost = float('inf')
        
        # 保守的な初期値から攻撃的な初期値まで試行
        initial_guesses = [
            [mean_demand + std_demand],      # 保守的
            [mean_demand + 2 * std_demand],  # 中程度
            [mean_demand + 3 * std_demand],  # 攻撃的
            [sum(demands)]                    # 非常に攻撃的
        ]
        
        for initial_guess in initial_guesses:
            try:
                result = minimize(objective, initial_guess, method='Nelder-Mead',
                                options={'xatol': 1e-4, 'fatol': 1e-4, 'maxiter': 1000},
                                bounds=[(max(mean_demand, 1), 5 * mean_demand + 10 * std_demand)])
                
                if result.success and result.fun < best_cost:
                    best_result = result
                    best_cost = result.fun
            except Exception as e:
                continue  # 次の初期値を試す
        
        if best_result is None:
            # フォールバック: 単純な安全在庫ベースの計算
            from scipy import stats
            z_score = stats.norm.ppf(target_service_level)
            optimal_base_stock = mean_demand + z_score * std_demand
        else:
            optimal_base_stock = best_result.x[0]
        
        # 最終結果の計算
        final_policy = InventoryPolicy(policy_type="sS", s=0, S=optimal_base_stock)
        final_result = self.simulate_inventory(final_policy, demands)
        
        return BaseStockResult(
            base_stock_levels={"product": optimal_base_stock},
            service_levels={"product": final_result.service_level},
            costs={"product": final_result.total_cost},
            total_cost=final_result.total_cost
        )

# サービスインスタンス
inventory_service = InventoryOptimizationService()