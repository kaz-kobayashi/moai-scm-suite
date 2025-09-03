import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

interface SimulationParameters {
  simulation_periods: number;
  num_simulations: number;
  random_seed?: number;
  warm_up_periods: number;
}

interface InventoryPolicy {
  policy_type: 'QR' | 'sS' | 'baseStock';
  parameters: {
    Q?: number;  // Order quantity for (Q,R)
    R?: number;  // Reorder point for (Q,R)
    s?: number;  // Lower bound for (s,S)
    S?: number;  // Upper bound for (s,S)
    base_stock?: number;  // Base stock level
  };
}

interface DemandProfile {
  distribution: 'normal' | 'poisson' | 'exponential';
  parameters: {
    mean: number;
    std?: number;
    lambda?: number;
    rate?: number;
  };
}

const InventorySimulation: React.FC = () => {
  const [simParams, setSimParams] = useState<SimulationParameters>({
    simulation_periods: 365,
    num_simulations: 100,
    warm_up_periods: 30,
  });

  const [demandProfile, setDemandProfile] = useState<DemandProfile>({
    distribution: 'normal',
    parameters: {
      mean: 50,
      std: 10,
    },
  });

  const [policies, setPolicies] = useState<InventoryPolicy[]>([
    {
      policy_type: 'QR',
      parameters: {
        Q: 100,
        R: 75,
      },
    },
    {
      policy_type: 'sS',
      parameters: {
        s: 50,
        S: 150,
      },
    },
  ]);

  const [costs, setCosts] = useState({
    holding_cost: 2.0,
    ordering_cost: 50.0,
    stockout_cost: 20.0,
    unit_cost: 10.0,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const updateSimParam = (param: keyof SimulationParameters, value: number | undefined) => {
    setSimParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const updateDemandParam = (param: string, value: number) => {
    setDemandProfile(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value
      }
    }));
  };

  const updateDemandDistribution = (distribution: 'normal' | 'poisson' | 'exponential') => {
    const defaultParams = {
      normal: { mean: 50, std: 10 },
      poisson: { mean: 50, lambda: 50 },
      exponential: { mean: 50, rate: 0.02 },
    };
    
    setDemandProfile({
      distribution,
      parameters: defaultParams[distribution],
    });
  };

  const addPolicy = () => {
    const newPolicy: InventoryPolicy = {
      policy_type: 'QR',
      parameters: {
        Q: 80,
        R: 60,
      },
    };
    setPolicies([...policies, newPolicy]);
  };

  const updatePolicy = (index: number, field: string, value: any) => {
    const newPolicies = [...policies];
    if (field === 'policy_type') {
      newPolicies[index].policy_type = value;
      // Reset parameters based on policy type
      const defaultParams = {
        QR: { Q: 100, R: 75 },
        sS: { s: 50, S: 150 },
        baseStock: { base_stock: 120 },
      };
      newPolicies[index].parameters = defaultParams[value as keyof typeof defaultParams];
    } else {
      newPolicies[index].parameters = {
        ...newPolicies[index].parameters,
        [field]: Number(value),
      };
    }
    setPolicies(newPolicies);
  };

  const removePolicy = (index: number) => {
    setPolicies(policies.filter((_, i) => i !== index));
  };

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert to expected format
      const products = [{
        prod: 'product1',
        name: 'Sample Product',
        unit_cost: costs.unit_cost,
        holding_cost_rate: costs.holding_cost,
        lead_time: 3,
        service_level: 0.95
      }];

      const demandData = Array.from({length: simParams.simulation_periods}, (_, i) => ({
        date: `2024-${String(Math.floor(i/30) + 1).padStart(2, '0')}-${String((i%30) + 1).padStart(2, '0')}`,
        prod: 'product1',
        demand: demandProfile.distribution === 'normal' 
          ? Math.max(0, demandProfile.parameters.mean + (Math.random() - 0.5) * 2 * (demandProfile.parameters.std || 10))
          : demandProfile.parameters.mean
      }));

      // Use first policy for simulation
      const mainPolicy = policies[0];

      const request = {
        products: products,
        demand_data: demandData,
        policy: {
          policy_type: mainPolicy.policy_type,
          Q: mainPolicy.parameters.Q,
          R: mainPolicy.parameters.R,
          s: mainPolicy.parameters.s,
          S: mainPolicy.parameters.S
        },
        simulation_periods: simParams.simulation_periods,
        initial_inventory: 100,
        random_seed: simParams.random_seed
      };
      
      const response = await inventoryApi.simulateInventory(request);
      setResult(response.data);
    } catch (err: any) {
      console.error('Error running inventory simulation:', err);
      setError('在庫シミュレーションエラー: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderPolicyInputs = (policy: InventoryPolicy, index: number) => {
    switch (policy.policy_type) {
      case 'QR':
        return (
          <>
            <input
              type="number"
              className="sap-input"
              placeholder="Q (発注量)"
              value={policy.parameters.Q || 0}
              onChange={(e) => updatePolicy(index, 'Q', e.target.value)}
              style={{ width: '150px' }}
            />
            <input
              type="number"
              className="sap-input"
              placeholder="R (発注点)"
              value={policy.parameters.R || 0}
              onChange={(e) => updatePolicy(index, 'R', e.target.value)}
              style={{ width: '150px' }}
            />
          </>
        );
      case 'sS':
        return (
          <>
            <input
              type="number"
              className="sap-input"
              placeholder="s (下限)"
              value={policy.parameters.s || 0}
              onChange={(e) => updatePolicy(index, 's', e.target.value)}
              style={{ width: '150px' }}
            />
            <input
              type="number"
              className="sap-input"
              placeholder="S (上限)"
              value={policy.parameters.S || 0}
              onChange={(e) => updatePolicy(index, 'S', e.target.value)}
              style={{ width: '150px' }}
            />
          </>
        );
      case 'baseStock':
        return (
          <input
            type="number"
            className="sap-input"
            placeholder="ベースストック"
            value={policy.parameters.base_stock || 0}
            onChange={(e) => updatePolicy(index, 'base_stock', e.target.value)}
            style={{ width: '320px' }}
          />
        );
    }
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">🎲 在庫シミュレーション</h1>
        <p className="sap-page-subtitle">モンテカルロシミュレーションによる在庫政策の性能評価</p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">⚙️ シミュレーション設定</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">シミュレーション期間:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={simParams.simulation_periods}
                  onChange={(e) => updateSimParam('simulation_periods', Number(e.target.value))}
                />
                <span className="sap-hint">日数</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">シミュレーション回数:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={simParams.num_simulations}
                  onChange={(e) => updateSimParam('num_simulations', Number(e.target.value))}
                />
                <span className="sap-hint">回</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">ウォームアップ期間:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={simParams.warm_up_periods}
                  onChange={(e) => updateSimParam('warm_up_periods', Number(e.target.value))}
                />
                <span className="sap-hint">日数</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">乱数シード (オプション):</label>
                <input
                  type="number"
                  className="sap-input"
                  value={simParams.random_seed || ''}
                  onChange={(e) => updateSimParam('random_seed', Number(e.target.value) || undefined)}
                  placeholder="未設定"
                />
                <span className="sap-hint">再現性のための乱数シード</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">📈 需要プロファイル</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">分布タイプ:</label>
                <select
                  className="sap-select"
                  value={demandProfile.distribution}
                  onChange={(e) => updateDemandDistribution(e.target.value as any)}
                >
                  <option value="normal">正規分布</option>
                  <option value="poisson">ポワソン分布</option>
                  <option value="exponential">指数分布</option>
                </select>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">平均需要:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={demandProfile.parameters.mean}
                  onChange={(e) => updateDemandParam('mean', Number(e.target.value))}
                />
                <span className="sap-hint">単位/日</span>
              </div>
              
              {demandProfile.distribution === 'normal' && (
                <div className="sap-field">
                  <label className="sap-label">標準偏差:</label>
                  <input
                    type="number"
                    className="sap-input"
                    value={demandProfile.parameters.std || 0}
                    onChange={(e) => updateDemandParam('std', Number(e.target.value))}
                  />
                  <span className="sap-hint">単位</span>
                </div>
              )}
              
              {demandProfile.distribution === 'poisson' && (
                <div className="sap-field">
                  <label className="sap-label">ラムダ:</label>
                  <input
                    type="number"
                    className="sap-input"
                    value={demandProfile.parameters.lambda || 0}
                    onChange={(e) => updateDemandParam('lambda', Number(e.target.value))}
                  />
                  <span className="sap-hint">λパラメータ</span>
                </div>
              )}
              
              {demandProfile.distribution === 'exponential' && (
                <div className="sap-field">
                  <label className="sap-label">レート:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="sap-input"
                    value={demandProfile.parameters.rate || 0}
                    onChange={(e) => updateDemandParam('rate', Number(e.target.value))}
                  />
                  <span className="sap-hint">1/平均</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">💰 コストパラメータ</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">保管費用:</label>
                <input
                  type="number"
                  step="0.1"
                  className="sap-input"
                  value={costs.holding_cost}
                  onChange={(e) => setCosts(prev => ({...prev, holding_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/単位/日</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">発注費用:</label>
                <input
                  type="number"
                  step="0.1"
                  className="sap-input"
                  value={costs.ordering_cost}
                  onChange={(e) => setCosts(prev => ({...prev, ordering_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/回</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">欠品費用:</label>
                <input
                  type="number"
                  step="0.1"
                  className="sap-input"
                  value={costs.stockout_cost}
                  onChange={(e) => setCosts(prev => ({...prev, stockout_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/単位</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">単位原価:</label>
                <input
                  type="number"
                  step="0.1"
                  className="sap-input"
                  value={costs.unit_cost}
                  onChange={(e) => setCosts(prev => ({...prev, unit_cost: Number(e.target.value)}))}
                />
                <span className="sap-hint">円/単位</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">📋 在庫政策</div>
          <div className="sap-form-content">
            <div className="sap-table-container">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th className="sap-table-header">政策タイプ</th>
                    <th className="sap-table-header">パラメータ</th>
                    <th className="sap-table-header" style={{ width: '100px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy, index) => (
                    <tr key={index}>
                      <td className="sap-table-cell">
                        <select
                          className="sap-select"
                          value={policy.policy_type}
                          onChange={(e) => updatePolicy(index, 'policy_type', e.target.value)}
                        >
                          <option value="QR">(Q,R)政策</option>
                          <option value="sS">(s,S)政策</option>
                          <option value="baseStock">ベースストック</option>
                        </select>
                      </td>
                      <td className="sap-table-cell">
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {renderPolicyInputs(policy, index)}
                        </div>
                      </td>
                      <td className="sap-table-cell">
                        <button onClick={() => removePolicy(index)} className="sap-button sap-button-text sap-button-danger">
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '12px' }}>
                <button onClick={addPolicy} className="sap-button sap-button-primary">政策を追加</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sap-action-bar">
          <button 
            onClick={runSimulation} 
            disabled={loading} 
            className="sap-button sap-button-emphasized"
          >
            {loading ? '⏳ シミュレーション実行中...' : '🎲 在庫シミュレーションを実行'}
          </button>
        </div>
        
        {error && (
          <div className="sap-panel sap-panel-section" style={{ marginTop: '16px' }}>
            <div className="sap-panel-content">
              <div className="sap-object-status sap-object-status-error">
                <strong>エラー:</strong> {error}
              </div>
            </div>
          </div>
        )}
      
        {result && (
          <div className="sap-panel sap-panel-section">
            <div className="sap-panel-header">
              <h3 className="sap-panel-title">📊 シミュレーション結果</h3>
            </div>
            <div className="sap-panel-content">
              
              {/* Summary Header */}
              <div className="sap-object-header">
                <div className="sap-object-header-title">
                  <span className="sap-label">シミュレーション結果サマリー</span>
                </div>
                <div className="sap-object-attributes">
                  <div className="sap-object-attribute">
                    <span className="sap-object-attribute-label">シミュレーション期間:</span>
                    <span className="sap-object-attribute-value">{simParams.simulation_periods}日</span>
                  </div>
                  <div className="sap-object-attribute">
                    <span className="sap-object-attribute-label">実行回数:</span>
                    <span className="sap-object-attribute-value">{simParams.num_simulations}回</span>
                  </div>
                </div>
              </div>
              
              <div className="sap-form-grid sap-form-grid-3">
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">平均総費用:</span>
                    <span className="sap-object-number sap-object-number-emphasized">
                      {result.total_cost >= 1000000 
                        ? `¥${(result.total_cost/1000000).toFixed(1)}M` 
                        : `¥${(result.total_cost/1000).toFixed(0)}K`}
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">期待総費用</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">サービスレベル:</span>
                    <span className="sap-object-number">
                      {((result.service_level || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">達成サービスレベル</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">平均在庫量:</span>
                    <span className="sap-object-number">
                      {result.average_inventory?.toFixed(0) || 'N/A'} 単位
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">平均在庫水準</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">欠品頻度:</span>
                    <span className="sap-object-number">
                      {((result.stockout_frequency || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">欠品発生率</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">保管費用:</span>
                    <span className="sap-object-number">
                      {result.holding_cost >= 1000 
                        ? `¥${(result.holding_cost/1000).toFixed(0)}K` 
                        : `¥${result.holding_cost?.toFixed(0) || 'N/A'}`}
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">期間保管費用</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">発注費用:</span>
                    <span className="sap-object-number">
                      {result.order_cost >= 1000 
                        ? `¥${(result.order_cost/1000).toFixed(0)}K` 
                        : `¥${result.order_cost?.toFixed(0) || 'N/A'}`}
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">期間発注費用</span>
                  </div>
                </div>
              </div>
          
              {result.time_series_plot && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">📈 在庫レベルの時系列変化</h3>
                  </div>
                  <div className="sap-panel-content">
                    <Plot
                      data={JSON.parse(result.time_series_plot).data}
                      layout={{
                        ...JSON.parse(result.time_series_plot).layout,
                        width: undefined,
                        height: 400,
                        autosize: true,
                        title: undefined,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'white',
                        margin: { l: 50, r: 50, t: 20, b: 50 }
                      }}
                      config={{ responsive: true }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            
              {result.performance_statistics && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">📉 性能統計</h3>
                  </div>
                  <div className="sap-panel-content">
                    <div className="sap-list">
                      {Object.entries(result.performance_statistics).map(([metric, value]: [string, any]) => (
                        <div key={metric} className="sap-list-item">
                          <div className="sap-list-item-title">{metric}</div>
                          <div className="sap-list-item-description">
                            <span className="sap-object-number">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="sap-panel sap-panel-section">
          <div className="sap-panel-header">
            <h3 className="sap-panel-title">📚 在庫シミュレーションについて</h3>
          </div>
          <div className="sap-panel-content">
            <ul className="sap-list">
              <li className="sap-list-item">複数の在庫政策を同一条件下で比較評価</li>
              <li className="sap-list-item">不確実な需要に対する各政策の頑健性を評価</li>
              <li className="sap-list-item">長期的な費用構造とサービスレベルの分析</li>
              <li className="sap-list-item">統計的有意性を考慮した政策推奨</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySimulation;