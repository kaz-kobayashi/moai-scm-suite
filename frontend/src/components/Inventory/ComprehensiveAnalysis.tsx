import React, { useState } from 'react';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

interface DemandRecord {
  date: string;
  cust: string;
  prod: string;
  demand: number;
}

interface ProductData {
  prod: string;
  name: string;
  unit_cost: number;
  holding_cost_rate: number;
  lead_time?: number;
  service_level?: number;
}

interface AnalysisOptions {
  calculate_eoq: boolean;
  fit_distributions: boolean;
  approximate_ss: boolean;
  simulate_policies: boolean;
  ssa_dynamic_programming: boolean;
  ssa_tabu_search: boolean;
  base_stock_optimization: boolean;
}

const ComprehensiveAnalysis: React.FC = () => {
  const [demandData, setDemandData] = useState<DemandRecord[]>([
    { date: "2023-01-01", cust: "顧客A", prod: "製品X", demand: 100 },
    { date: "2023-01-02", cust: "顧客A", prod: "製品X", demand: 95 },
    { date: "2023-01-03", cust: "顧客A", prod: "製品X", demand: 110 },
    { date: "2023-01-04", cust: "顧客B", prod: "製品Y", demand: 80 },
    { date: "2023-01-05", cust: "顧客B", prod: "製品Y", demand: 85 },
  ]);

  const [products, setProducts] = useState<ProductData[]>([
    {
      prod: "製品X",
      name: "サンプル製品X", 
      unit_cost: 50,
      holding_cost_rate: 0.2,
      lead_time: 7,
      service_level: 0.95
    },
    {
      prod: "製品Y", 
      name: "サンプル製品Y",
      unit_cost: 30,
      holding_cost_rate: 0.15,
      lead_time: 5,
      service_level: 0.90
    }
  ]);

  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    calculate_eoq: true,
    fit_distributions: true,
    approximate_ss: true,
    simulate_policies: true,
    ssa_dynamic_programming: true,
    ssa_tabu_search: true,
    base_stock_optimization: true,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateDemandData = (index: number, field: keyof DemandRecord, value: string | number) => {
    const newData = [...demandData];
    (newData[index] as any)[field] = field === 'demand' ? Number(value) : value;
    setDemandData(newData);
  };

  const addDemandRecord = () => {
    setDemandData([
      ...demandData,
      { date: "2023-01-01", cust: "顧客A", prod: "製品X", demand: 100 }
    ]);
  };

  const removeDemandRecord = (index: number) => {
    setDemandData(demandData.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductData, value: string | number | undefined) => {
    const newProducts = [...products];
    (newProducts[index] as any)[field] = typeof value === 'string' && 
      ['unit_cost', 'holding_cost_rate', 'lead_time', 'service_level'].includes(field) 
      ? Number(value) : value;
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      {
        prod: `製品${String.fromCharCode(65 + products.length)}`,
        name: `サンプル製品${String.fromCharCode(65 + products.length)}`,
        unit_cost: 40,
        holding_cost_rate: 0.18,
        lead_time: 6,
        service_level: 0.95
      }
    ]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateAnalysisOption = (option: keyof AnalysisOptions, value: boolean) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const runComprehensiveAnalysis = async () => {
    setLoading(true);
    try {
      // Run individual analyses based on selected options
      const analysisResults: any = {};

      // 1. EOQ Analysis
      if (analysisOptions.calculate_eoq) {
        try {
          const eoqResults: any = {};
          for (const product of products) {
            const productDemand = demandData.filter(d => d.prod === product.prod);
            if (productDemand.length > 0) {
              const avgDemand = productDemand.reduce((sum, d) => sum + d.demand, 0) / productDemand.length;
              const eoqRequest = {
                daily_demand: avgDemand,
                order_cost: 100,
                holding_cost: product.holding_cost_rate
              };
              const response = await inventoryApi.calculateEOQ(eoqRequest);
              eoqResults[product.prod] = response.data;
            }
          }
          analysisResults.eoq = eoqResults;
        } catch (error) {
          console.error('EOQ analysis failed:', error);
        }
      }

      // 2. Demand Distribution Fitting
      if (analysisOptions.fit_distributions) {
        try {
          const distributionResults: any = {};
          for (const product of products) {
            const productDemand = demandData.filter(d => d.prod === product.prod);
            if (productDemand.length > 0) {
              const distRequest = {
                demand_data: productDemand.map(d => d.demand)
              };
              const response = await inventoryApi.fitDemandDistribution(distRequest);
              distributionResults[product.prod] = response.data;
            }
          }
          analysisResults.demand_distributions = distributionResults;
        } catch (error) {
          console.error('Distribution fitting failed:', error);
        }
      }

      // 3. (s,S) Policy Approximation
      if (analysisOptions.approximate_ss) {
        try {
          const ssResults: any = {};
          for (const product of products) {
            const productDemand = demandData.filter(d => d.prod === product.prod);
            if (productDemand.length > 0) {
              const ssRequest = {
                mu: productDemand.reduce((sum, d) => sum + d.demand, 0) / productDemand.length,
                sigma: Math.sqrt(productDemand.reduce((sum, d) => {
                  const mean = productDemand.reduce((s, item) => s + item.demand, 0) / productDemand.length;
                  return sum + Math.pow(d.demand - mean, 2);
                }, 0) / productDemand.length),
                LT: product.lead_time || 7,
                h: product.holding_cost_rate,
                K: 100,
                alpha: 1 - (product.service_level || 0.95)
              };
              const response = await inventoryApi.approximateSSPolicy(ssRequest);
              ssResults[product.prod] = response.data;
            }
          }
          analysisResults.ss_policies = ssResults;
        } catch (error) {
          console.error('(s,S) policy analysis failed:', error);
        }
      }

      // 4. SSA Dynamic Programming
      if (analysisOptions.ssa_dynamic_programming) {
        try {
          const ssaRequest = {
            products: products,
            demand_data: demandData,
            total_budget: 10000,
            method: 'dynamic_programming'
          };
          const response = await inventoryApi.performSSADynamicProgramming(ssaRequest);
          analysisResults.ssa_dp = response.data;
        } catch (error) {
          console.error('SSA DP analysis failed:', error);
        }
      }

      // 5. SSA Tabu Search
      if (analysisOptions.ssa_tabu_search) {
        try {
          const ssaRequest = {
            products: products,
            demand_data: demandData,
            total_budget: 10000,
            method: 'tabu_search',
            iterations: 500
          };
          const response = await inventoryApi.performSSATabuSearch(ssaRequest);
          analysisResults.ssa_tabu = response.data;
        } catch (error) {
          console.error('SSA Tabu Search analysis failed:', error);
        }
      }

      // 6. Base Stock Optimization
      if (analysisOptions.base_stock_optimization) {
        try {
          const baseStockResults: any = {};
          for (const product of products) {
            const productDemand = demandData.filter(d => d.prod === product.prod);
            if (productDemand.length > 0) {
              const baseStockRequest = {
                products: [product],
                demand_data: productDemand,
                target_service_level: product.service_level || 0.95,
                optimization_method: 'simulation',
                stages: 1
              };
              const response = await inventoryApi.optimizeBaseStock(baseStockRequest);
              baseStockResults[product.prod] = response.data;
            }
          }
          analysisResults.base_stock = baseStockResults;
        } catch (error) {
          console.error('Base stock optimization failed:', error);
        }
      }

      // 7. Inventory Simulation (if enabled)
      if (analysisOptions.simulate_policies) {
        try {
          const simulationResults: any = {};
          for (const product of products) {
            const productDemand = demandData.filter(d => d.prod === product.prod);
            if (productDemand.length > 0) {
              const simRequest = {
                products: [product],
                demand_data: productDemand,
                policy: {
                  policy_type: 'QR',
                  Q: 100,
                  R: 50
                },
                simulation_periods: 30,
                initial_inventory: 100
              };
              const response = await inventoryApi.simulateInventory(simRequest);
              simulationResults[product.prod] = response.data;
            }
          }
          analysisResults.simulation = simulationResults;
        } catch (error) {
          console.error('Inventory simulation failed:', error);
        }
      }

      setResult(analysisResults);
    } catch (error) {
      console.error('Error running comprehensive analysis:', error);
      alert('包括的在庫分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">📋 包括的在庫分析</h1>
        <p className="sap-page-subtitle">複数の在庫最適化手法を統合実行し、比較分析を提供</p>
      </div>
      
      <div className="sap-main">
        {/* Demand Data Section */}
        <div className="sap-form-section">
          <div className="sap-form-header">需要データ</div>
          <div className="sap-form-content">
            <div className="sap-table-container">
              <table className="sap-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>顧客</th>
                  <th>製品</th>
                  <th>需要量</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {demandData.map((record, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="date"
                        className="sap-input sap-input-small"
                        value={record.date}
                        onChange={(e) => updateDemandData(index, 'date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={record.cust}
                        onChange={(e) => updateDemandData(index, 'cust', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={record.prod}
                        onChange={(e) => updateDemandData(index, 'prod', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="sap-input sap-input-small"
                        value={record.demand}
                        onChange={(e) => updateDemandData(index, 'demand', e.target.value)}
                      />
                    </td>
                    <td>
                      <button onClick={() => removeDemandRecord(index)} className="sap-button sap-button-text sap-button-danger">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <button onClick={addDemandRecord} className="sap-button sap-button-primary">需要データを追加</button>
          </div>
        </div>

        {/* Products Section */}
        <div className="sap-form-section">
          <div className="sap-form-header">製品情報</div>
          <div className="sap-form-content">
            <div className="sap-table-container">
              <table className="sap-table">
              <thead>
                <tr>
                  <th>製品ID</th>
                  <th>製品名</th>
                  <th>単位原価</th>
                  <th>保管費用率</th>
                  <th>リードタイム</th>
                  <th>目標サービスレベル</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={product.prod}
                        onChange={(e) => updateProduct(index, 'prod', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        className="sap-input sap-input-small"
                        value={product.unit_cost}
                        onChange={(e) => updateProduct(index, 'unit_cost', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="sap-input sap-input-small"
                        value={product.holding_cost_rate}
                        onChange={(e) => updateProduct(index, 'holding_cost_rate', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="sap-input sap-input-small"
                        value={product.lead_time || ''}
                        onChange={(e) => updateProduct(index, 'lead_time', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="sap-input sap-input-small"
                        value={product.service_level || ''}
                        onChange={(e) => updateProduct(index, 'service_level', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </td>
                    <td>
                      <button onClick={() => removeProduct(index)} className="sap-button sap-button-text sap-button-danger">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <button onClick={addProduct} className="sap-button sap-button-primary">製品を追加</button>
          </div>
        </div>

        {/* Analysis Options */}
        <div className="sap-form-section">
          <div className="sap-form-header">分析オプション</div>
          <div className="sap-form-content">
            <div className="sap-form-grid sap-form-grid-3">
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.calculate_eoq}
                    onChange={(e) => updateAnalysisOption('calculate_eoq', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">EOQ分析</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.fit_distributions}
                    onChange={(e) => updateAnalysisOption('fit_distributions', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">需要分布フィッティング</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.approximate_ss}
                    onChange={(e) => updateAnalysisOption('approximate_ss', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">(s,S)政策近似</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.ssa_dynamic_programming}
                    onChange={(e) => updateAnalysisOption('ssa_dynamic_programming', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">SSA動的プログラミング</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.ssa_tabu_search}
                    onChange={(e) => updateAnalysisOption('ssa_tabu_search', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">SSAタブサーチ</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.base_stock_optimization}
                    onChange={(e) => updateAnalysisOption('base_stock_optimization', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">ベースストック最適化</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-checkbox">
                  <input
                    type="checkbox"
                    checked={analysisOptions.simulate_policies}
                    onChange={(e) => updateAnalysisOption('simulate_policies', e.target.checked)}
                  />
                  <span className="sap-checkbox-label">在庫シミュレーション</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="sap-action-bar">
          <button 
            onClick={runComprehensiveAnalysis} 
            disabled={loading} 
            className="sap-button sap-button-emphasized"
          >
            {loading ? '分析実行中...' : '包括的在庫分析を実行'}
          </button>
        </div>

        {result && (
          <div className="sap-panel sap-panel-section">
            <div className="sap-panel-header">
              <h3 className="sap-panel-title">分析結果</h3>
            </div>
            <div className="sap-panel-content">
          
              {/* Analysis Summary */}
              <div className="sap-object-header">
                <div className="sap-object-header-title">分析サマリー</div>
                <div className="sap-object-attributes">
                  <div className="sap-object-attribute">
                    <span className="sap-object-attribute-label">実行された分析:</span>
                    <span className="sap-object-attribute-value">{Object.keys(result).length}種類</span>
                  </div>
                  <div className="sap-object-attribute">
                    <span className="sap-object-attribute-label">対象製品数:</span>
                    <span className="sap-object-attribute-value">{products.length}製品</span>
                  </div>
                  <div className="sap-object-attribute">
                    <span className="sap-object-attribute-label">需要データ数:</span>
                    <span className="sap-object-attribute-value">{demandData.length}レコード</span>
                  </div>
                </div>
              </div>

              {/* EOQ Results */}
              {result.eoq && (
                <div className="sap-form-section">
                  <div className="sap-form-header">EOQ分析結果</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                <thead>
                  <tr>
                    <th>製品</th>
                    <th>EOQ</th>
                    <th>総費用</th>
                    <th>発注頻度</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.eoq).map(([product, data]: [string, any]) => (
                    <tr key={product}>
                      <td>{product}</td>
                      <td>{data.eoq?.toFixed(1) || 'N/A'}</td>
                      <td>{data.total_cost?.toFixed(2) || 'N/A'}</td>
                      <td>{data.order_frequency?.toFixed(3) || 'N/A'}</td>
                    </tr>
                    ))}
                </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Demand Distribution Results */}
              {result.demand_distributions && (
                <div className="sap-form-section">
                  <div className="sap-form-header">需要分布フィッティング結果</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                <thead>
                  <tr>
                    <th>製品</th>
                    <th>最適分布</th>
                    <th>適合度</th>
                    <th>パラメータ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.demand_distributions).map(([product, data]: [string, any]) => (
                    <tr key={product}>
                      <td>{product}</td>
                      <td>{data.best_distribution || 'N/A'}</td>
                      <td>{data.goodness_of_fit?.toFixed(4) || 'N/A'}</td>
                      <td>{JSON.stringify(data.parameters || {})}</td>
                    </tr>
                    ))}
                </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* (s,S) Policy Results */}
              {result.ss_policies && (
                <div className="sap-form-section">
                  <div className="sap-form-header">(s,S)政策近似結果</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                <thead>
                  <tr>
                    <th>製品</th>
                    <th>s (発注点)</th>
                    <th>S (最大在庫)</th>
                    <th>期待費用</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.ss_policies).map(([product, data]: [string, any]) => (
                    <tr key={product}>
                      <td>{product}</td>
                      <td>{data.s?.toFixed(1) || 'N/A'}</td>
                      <td>{data.S?.toFixed(1) || 'N/A'}</td>
                      <td>{data.expected_cost?.toFixed(2) || 'N/A'}</td>
                    </tr>
                    ))}
                </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SSA Results Comparison */}
              {(result.ssa_dp || result.ssa_tabu) && (
                <div className="sap-form-section">
                  <div className="sap-form-header">安全在庫配分（SSA）比較</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                <thead>
                  <tr>
                    <th>手法</th>
                    <th>総安全在庫</th>
                    <th>総費用</th>
                    <th>配分詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ssa_dp && (
                    <tr>
                      <td>動的プログラミング</td>
                      <td>{Object.values(result.ssa_dp as Record<string, number>).reduce((sum: number, stock) => sum + Number(stock), 0).toFixed(1)}</td>
                      <td>
                        {Object.entries(result.ssa_dp as Record<string, number>).reduce((sum, [nodeId, safetyStock]) => {
                          const product = products.find(p => p.prod === nodeId);
                          return sum + (Number(safetyStock) * (product?.holding_cost_rate || 0));
                        }, 0).toFixed(2)}
                      </td>
                      <td>{JSON.stringify(result.ssa_dp)}</td>
                    </tr>
                  )}
                  {result.ssa_tabu && (
                    <tr>
                      <td>タブサーチ</td>
                      <td>{Object.values(result.ssa_tabu as Record<string, number>).reduce((sum: number, stock) => sum + Number(stock), 0).toFixed(1)}</td>
                      <td>
                        {Object.entries(result.ssa_tabu as Record<string, number>).reduce((sum, [nodeId, safetyStock]) => {
                          const product = products.find(p => p.prod === nodeId);
                          return sum + (Number(safetyStock) * (product?.holding_cost_rate || 0));
                        }, 0).toFixed(2)}
                      </td>
                      <td>{JSON.stringify(result.ssa_tabu)}</td>
                    </tr>
                    )}
                  </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Base Stock Results */}
              {result.base_stock && (
                <div className="sap-form-section">
                  <div className="sap-form-header">ベースストック最適化結果</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                <thead>
                  <tr>
                    <th>製品</th>
                    <th>最適ベースストック</th>
                    <th>達成サービスレベル</th>
                    <th>総費用</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.base_stock).map(([product, data]: [string, any]) => (
                    <tr key={product}>
                      <td>{product}</td>
                      <td>
                        {data.base_stock_levels && Object.values(data.base_stock_levels)[0] 
                          ? Number(Object.values(data.base_stock_levels)[0]).toFixed(1) 
                          : 'N/A'}
                      </td>
                      <td>
                        {data.service_levels && Object.values(data.service_levels)[0] !== undefined
                          ? `${(Number(Object.values(data.service_levels)[0]) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </td>
                      <td>{data.total_cost?.toFixed(2) || 'N/A'}</td>
                    </tr>
                    ))}
                </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation Results */}
              {result.simulation && (
                <div className="sap-form-section">
                  <div className="sap-form-header">在庫シミュレーション結果</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                <thead>
                  <tr>
                    <th>製品</th>
                    <th>平均在庫</th>
                    <th>サービスレベル</th>
                    <th>総費用</th>
                    <th>欠品頻度</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.simulation).map(([product, data]: [string, any]) => (
                    <tr key={product}>
                      <td>{product}</td>
                      <td>{data.average_inventory?.toFixed(1) || 'N/A'}</td>
                      <td>{((data.service_level || 0) * 100).toFixed(1)}%</td>
                      <td>{data.total_cost?.toFixed(2) || 'N/A'}</td>
                      <td>{((data.stockout_frequency || 0) * 100).toFixed(1)}%</td>
                    </tr>
                    ))}
                </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="sap-panel sap-panel-section">
          <div className="sap-panel-header">
            <h3 className="sap-panel-title">包括的在庫分析について</h3>
          </div>
          <div className="sap-panel-content">
            <ul className="sap-list">
              <li className="sap-list-item">複数の在庫最適化手法を統合的に実行し、比較分析を提供</li>
              <li className="sap-list-item">各手法の特徴と適用場面を理解した上での最適選択をサポート</li>
              <li className="sap-list-item">製品特性、需要パターン、制約条件に応じた総合的な推奨を実現</li>
              <li className="sap-list-item">単一手法では見えない全体最適解の発見を可能にする</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAnalysis;