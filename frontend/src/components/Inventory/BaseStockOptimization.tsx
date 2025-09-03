import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

interface OptimizationConstraints {
  min_base_stock?: number;
  max_base_stock?: number;
  target_service_level?: number;
  budget_constraint?: number;
}

interface DemandDistribution {
  distribution_type: 'normal' | 'gamma' | 'lognormal' | 'empirical';
  parameters: {
    mean: number;
    std?: number;
    shape?: number;
    scale?: number;
    location?: number;
    data_points?: number[];
  };
}

const BaseStockOptimization: React.FC = () => {
  const [demandDist, setDemandDist] = useState<DemandDistribution>({
    distribution_type: 'normal',
    parameters: {
      mean: 100,
      std: 20,
    },
  });

  const [leadTime, setLeadTime] = useState(7);
  const [reviewPeriod, setReviewPeriod] = useState(1);
  
  const [costs, setCosts] = useState({
    holding_cost_rate: 0.2,
    stockout_cost: 50,
    ordering_cost: 100,
    unit_cost: 25,
  });

  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    target_service_level: 0.95,
  });

  const [optimizationMethod, setOptimizationMethod] = useState<'analytical' | 'numerical' | 'simulation'>('analytical');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateDemandDistribution = (distType: DemandDistribution['distribution_type']) => {
    const defaultParams = {
      normal: { mean: 100, std: 20 },
      gamma: { mean: 100, shape: 2.5, scale: 40 },
      lognormal: { mean: 100, std: 20, location: 0 },
      empirical: { mean: 100, data_points: [80, 90, 95, 100, 105, 110, 120] },
    };

    setDemandDist({
      distribution_type: distType,
      parameters: defaultParams[distType],
    });
  };

  const updateDemandParam = (param: string, value: number | number[]) => {
    setDemandDist(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value,
      },
    }));
  };

  const updateConstraint = (constraint: keyof OptimizationConstraints, value: number | undefined) => {
    setConstraints(prev => ({
      ...prev,
      [constraint]: value,
    }));
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      // Convert to expected format
      const products = [{
        prod: 'product1',
        name: 'Sample Product',
        unit_cost: costs.unit_cost,
        holding_cost_rate: costs.holding_cost_rate,
        lead_time: leadTime,
        service_level: constraints.target_service_level || 0.95
      }];

      // Generate demand data based on distribution
      const numPeriods = 100;
      const demandData = Array.from({length: numPeriods}, (_, i) => {
        let demand;
        switch (demandDist.distribution_type) {
          case 'normal':
            demand = Math.max(0, demandDist.parameters.mean + 
              (Math.random() - 0.5) * 2 * (demandDist.parameters.std || 10));
            break;
          case 'gamma':
            demand = demandDist.parameters.mean;
            break;
          case 'lognormal':
            demand = demandDist.parameters.mean;
            break;
          case 'empirical':
            const dataPoints = demandDist.parameters.data_points || [100];
            demand = dataPoints[Math.floor(Math.random() * dataPoints.length)];
            break;
          default:
            demand = demandDist.parameters.mean;
        }
        
        return {
          date: `2024-${String(Math.floor(i/30) + 1).padStart(2, '0')}-${String((i%30) + 1).padStart(2, '0')}`,
          prod: 'product1',
          demand: Math.round(demand)
        };
      });

      const request = {
        products: products,
        demand_data: demandData,
        target_service_level: constraints.target_service_level || 0.95,
        optimization_method: 'simulation',
        stages: 1
      };
      
      const response = await inventoryApi.optimizeBaseStock(request);
      setResult(response.data);
    } catch (error) {
      console.error('Error running base stock optimization:', error);
      alert('ベースストック最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addDataPoint = () => {
    const currentPoints = demandDist.parameters.data_points || [];
    const newValue = Math.round((demandDist.parameters.mean || 100) + (Math.random() - 0.5) * 40);
    updateDemandParam('data_points', [...currentPoints, newValue]);
  };

  const removeDataPoint = (index: number) => {
    const currentPoints = demandDist.parameters.data_points || [];
    updateDemandParam('data_points', currentPoints.filter((_, i) => i !== index));
  };

  const updateDataPoint = (index: number, value: number) => {
    const currentPoints = [...(demandDist.parameters.data_points || [])];
    currentPoints[index] = value;
    updateDemandParam('data_points', currentPoints);
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">📦 ベースストック最適化</h1>
        <p className="sap-page-subtitle">
          需要分布と費用パラメータに基づく最適ベースストックレベルの決定
        </p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">📊 需要分布設定</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">分布タイプ:</label>
                <select
                  className="sap-select"
                  value={demandDist.distribution_type}
                  onChange={(e) => updateDemandDistribution(e.target.value as any)}
                >
                  <option value="normal">正規分布</option>
                  <option value="gamma">ガンマ分布</option>
                  <option value="lognormal">対数正規分布</option>
                  <option value="empirical">経験分布</option>
                </select>
              </div>

              {demandDist.distribution_type !== 'empirical' && (
                <div className="sap-field">
                  <label className="sap-label">平均需要:</label>
                  <input
                    className="sap-input"
                    type="number"
                    value={demandDist.parameters.mean}
                    onChange={(e) => updateDemandParam('mean', Number(e.target.value))}
                  />
                  <span className="sap-hint">単位/期間</span>
                </div>
              )}

              {demandDist.distribution_type === 'normal' && (
                <div className="sap-field">
                  <label className="sap-label">標準偏差:</label>
                  <input
                    className="sap-input"
                    type="number"
                    value={demandDist.parameters.std || 0}
                    onChange={(e) => updateDemandParam('std', Number(e.target.value))}
                  />
                  <span className="sap-hint">単位</span>
                </div>
              )}

              {demandDist.distribution_type === 'gamma' && (
                <>
                  <div className="sap-field">
                    <label className="sap-label">形状パラメータ:</label>
                    <input
                      className="sap-input"
                      type="number"
                      step="0.1"
                      value={demandDist.parameters.shape || 0}
                      onChange={(e) => updateDemandParam('shape', Number(e.target.value))}
                    />
                  </div>
                  <div className="sap-field">
                    <label className="sap-label">尺度パラメータ:</label>
                    <input
                      className="sap-input"
                      type="number"
                      step="0.1"
                      value={demandDist.parameters.scale || 0}
                      onChange={(e) => updateDemandParam('scale', Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              {demandDist.distribution_type === 'lognormal' && (
                <>
                  <div className="sap-field">
                    <label className="sap-label">標準偏差:</label>
                    <input
                      className="sap-input"
                      type="number"
                      step="0.1"
                      value={demandDist.parameters.std || 0}
                      onChange={(e) => updateDemandParam('std', Number(e.target.value))}
                    />
                  </div>
                  <div className="sap-field">
                    <label className="sap-label">位置パラメータ:</label>
                    <input
                      className="sap-input"
                      type="number"
                      step="0.1"
                      value={demandDist.parameters.location || 0}
                      onChange={(e) => updateDemandParam('location', Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              <div className="sap-field">
                <label className="sap-label">リードタイム:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Number(e.target.value))}
                />
                <span className="sap-hint">日</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">レビュー期間:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={reviewPeriod}
                  onChange={(e) => setReviewPeriod(Number(e.target.value))}
                />
                <span className="sap-hint">日</span>
              </div>
            </div>

            {demandDist.distribution_type === 'empirical' && (
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">履歴データ</h3>
                </div>
                <div className="sap-panel-content">
                  <div className="sap-form-actions" style={{marginBottom: '16px'}}>
                    <button className="sap-button sap-button-emphasized" onClick={addDataPoint}>
                      ➕ データ追加
                    </button>
                  </div>
                  <div className="sap-form-grid">
                    {(demandDist.parameters.data_points || []).map((point, index) => (
                      <div key={index} className="sap-field">
                        <label className="sap-label">データ {index + 1}:</label>
                        <input
                          className="sap-input"
                          type="number"
                          value={point}
                          onChange={(e) => updateDataPoint(index, Number(e.target.value))}
                        />
                        <button 
                          className="sap-button sap-button-negative"
                          onClick={() => removeDataPoint(index)}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">💰 費用パラメータ</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">保管費用率 (年率):</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.01"
                  value={costs.holding_cost_rate}
                  onChange={(e) => setCosts(prev => ({...prev, holding_cost_rate: Number(e.target.value)}))}
                />
                <span className="sap-hint">%/年</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">欠品費用 (単位あたり):</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.1"
                  value={costs.stockout_cost}
                  onChange={(e) => setCosts(prev => ({...prev, stockout_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/単位</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">発注費用:</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.1"
                  value={costs.ordering_cost}
                  onChange={(e) => setCosts(prev => ({...prev, ordering_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/回</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">単位原価:</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.1"
                  value={costs.unit_cost}
                  onChange={(e) => setCosts(prev => ({...prev, unit_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/単位</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">🎯 制約条件と最適化手法</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">目標サービスレベル:</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={constraints.target_service_level || ''}
                  onChange={(e) => updateConstraint('target_service_level', 
                    e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="未設定"
                />
                <span className="sap-hint">0-1の値</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">最小ベースストック:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={constraints.min_base_stock || ''}
                  onChange={(e) => updateConstraint('min_base_stock', 
                    e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="未設定"
                />
                <span className="sap-hint">単位</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">最大ベースストック:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={constraints.max_base_stock || ''}
                  onChange={(e) => updateConstraint('max_base_stock', 
                    e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="未設定"
                />
                <span className="sap-hint">単位</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">予算制約:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={constraints.budget_constraint || ''}
                  onChange={(e) => updateConstraint('budget_constraint', 
                    e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="未設定"
                />
                <span className="sap-hint">円</span>
              </div>
            </div>

            <div className="sap-panel">
              <div className="sap-panel-header">
                <h3 className="sap-panel-title">最適化手法</h3>
              </div>
              <div className="sap-panel-content">
                <div className="sap-form-grid">
                  <label className="sap-radio">
                    <input
                      type="radio"
                      value="analytical"
                      checked={optimizationMethod === 'analytical'}
                      onChange={(e) => setOptimizationMethod(e.target.value as any)}
                    />
                    <span className="sap-radio-text">解析的手法</span>
                    <span className="sap-hint">理論的最適解</span>
                  </label>
                  <label className="sap-radio">
                    <input
                      type="radio"
                      value="numerical"
                      checked={optimizationMethod === 'numerical'}
                      onChange={(e) => setOptimizationMethod(e.target.value as any)}
                    />
                    <span className="sap-radio-text">数値最適化</span>
                    <span className="sap-hint">数値計算による近似解</span>
                  </label>
                  <label className="sap-radio">
                    <input
                      type="radio"
                      value="simulation"
                      checked={optimizationMethod === 'simulation'}
                      onChange={(e) => setOptimizationMethod(e.target.value as any)}
                    />
                    <span className="sap-radio-text">シミュレーション</span>
                    <span className="sap-hint">モンテカルロシミュレーション</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="sap-form-actions">
              <button 
                className="sap-button sap-button-emphasized"
                onClick={runOptimization} 
                disabled={loading}
              >
                {loading ? '⏳ 最適化実行中...' : '📦 ベースストック最適化を実行'}
              </button>
            </div>
          </div>
        </div>
        
        {result && (
          <div className="sap-form-section">
            <div className="sap-form-header">🎯 最適化結果</div>
            <div className="sap-form-content">
              
              <div className="sap-form-grid">
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">最適ベースストック:</span>
                    <span className="sap-object-number sap-object-number-emphasized">
                      {result.base_stock_levels && Object.values(result.base_stock_levels)[0] 
                        ? Number(Object.values(result.base_stock_levels)[0]).toFixed(1) 
                        : 'N/A'} 単位
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">最適在庫保持レベル</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">期待総費用:</span>
                    <span className="sap-object-number sap-object-number-emphasized">
                      {result.total_cost?.toFixed(2) || 'N/A'} 円
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">年間期待費用</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">達成サービスレベル:</span>
                    <span className="sap-object-number">
                      {result.service_levels && Object.values(result.service_levels)[0] !== undefined
                        ? `${(Number(Object.values(result.service_levels)[0]) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">実際のサービスレベル</span>
                  </div>
                </div>
              </div>
              
              {result.base_stock_levels && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">📋 製品別ベースストック水準</h3>
                  </div>
                  <div className="sap-panel-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                        <thead>
                          <tr>
                            <th className="sap-table-header">製品</th>
                            <th className="sap-table-header">ベースストック</th>
                            <th className="sap-table-header">サービスレベル</th>
                            <th className="sap-table-header">費用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.base_stock_levels).map(([product, baseStock]) => (
                            <tr key={product}>
                              <td className="sap-table-cell">
                                <div className="sap-object-identifier">
                                  <span className="sap-object-identifier-title">製品 {product}</span>
                                  <span className="sap-object-identifier-text">{product}</span>
                                </div>
                              </td>
                              <td className="sap-table-cell">
                                <span className="sap-object-number">{Number(baseStock).toFixed(1)} 単位</span>
                              </td>
                              <td className="sap-table-cell">
                                {result.service_levels?.[product] !== undefined ? (
                                  <span className="sap-object-status sap-object-status-indication-3">
                                    {(result.service_levels[product] * 100).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span>N/A</span>
                                )}
                              </td>
                              <td className="sap-table-cell">
                                <span className="sap-object-number">
                                  {result.costs?.[product] !== undefined
                                    ? `${result.costs[product].toFixed(2)} 円`
                                    : 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {result.cost_breakdown && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">💰 費用内訳</h3>
                  </div>
                  <div className="sap-panel-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                        <thead>
                          <tr>
                            <th className="sap-table-header">費用項目</th>
                            <th className="sap-table-header">期待値</th>
                            <th className="sap-table-header">割合</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.cost_breakdown).map(([category, cost]: [string, any]) => (
                            <tr key={category}>
                              <td className="sap-table-cell">{category}</td>
                              <td className="sap-table-cell">
                                <span className="sap-object-number">{cost?.toFixed(2) || 'N/A'} 円</span>
                              </td>
                              <td className="sap-table-cell">
                                <div className="sap-progress-indicator">
                                  <div className="sap-progress-indicator-bar">
                                    <div 
                                      className="sap-progress-indicator-value" 
                                      style={{width: `${result.expected_total_cost 
                                        ? ((cost / result.expected_total_cost) * 100) : 0}%`}}
                                    ></div>
                                  </div>
                                  <span className="sap-progress-indicator-text">
                                    {result.expected_total_cost 
                                      ? `${((cost / result.expected_total_cost) * 100).toFixed(1)}%`
                                      : 'N/A'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {result.sensitivity_analysis && result.sensitivity_plot && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">📈 感度分析</h3>
                  </div>
                  <div className="sap-panel-content">
                    <Plot
                      data={JSON.parse(result.sensitivity_plot).data}
                      layout={{
                        ...JSON.parse(result.sensitivity_plot).layout,
                        width: undefined,
                        height: 400,
                        autosize: true,
                        title: undefined,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'white'
                      }}
                      config={{ responsive: true }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
              
              {result.distribution_analysis && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">📊 需要分布分析</h3>
                  </div>
                  <div className="sap-panel-content">
                    <div className="sap-list">
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">平均</div>
                        <div className="sap-list-item-description">{result.distribution_analysis.mean?.toFixed(2)}</div>
                      </div>
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">標準偏差</div>
                        <div className="sap-list-item-description">{result.distribution_analysis.std?.toFixed(2)}</div>
                      </div>
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">変動係数</div>
                        <div className="sap-list-item-description">{result.distribution_analysis.cv?.toFixed(3)}</div>
                      </div>
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">95%点</div>
                        <div className="sap-list-item-description">{result.distribution_analysis.percentile_95?.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="sap-panel">
          <div className="sap-panel-header">
            <h3 className="sap-panel-title">📚 ベースストック最適化について</h3>
          </div>
          <div className="sap-panel-content">
            <div className="sap-list">
              <div className="sap-list-item">
                <div className="sap-list-item-title">単一製品・単一拠点の在庫管理</div>
                <div className="sap-list-item-description">最適在庫水準の決定</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">期待費用最小化</div>
                <div className="sap-list-item-description">目標サービスレベル達成を目的とする</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">需要不確実性考慮</div>
                <div className="sap-list-item-description">ロバストな在庫政策を提供</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">柔軟な解法選択</div>
                <div className="sap-list-item-description">解析解、数値最適化、シミュレーションから選択可能</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseStockOptimization;