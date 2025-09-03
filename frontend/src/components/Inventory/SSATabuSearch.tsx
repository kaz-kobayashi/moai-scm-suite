import React, { useState } from 'react';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

interface TabuSearchParams {
  max_iterations: number;
  tabu_tenure: number;
  neighborhood_size: number;
  aspiration_threshold: number;
  diversification_frequency: number;
}

interface NetworkNode {
  id: string;
  name: string;
  demand_mean: number;
  demand_std: number;
  holding_cost: number;
  lead_time: number;
  parent_id?: string;
}

const SSATabuSearch: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([
    {
      id: 'supplier',
      name: 'サプライヤー',
      demand_mean: 0,
      demand_std: 0,
      holding_cost: 0.5,
      lead_time: 14,
    },
    {
      id: 'warehouse',
      name: '中央倉庫',
      demand_mean: 0,
      demand_std: 0,
      holding_cost: 1.0,
      lead_time: 7,
      parent_id: 'supplier',
    },
    {
      id: 'retail1',
      name: '小売店1',
      demand_mean: 60,
      demand_std: 15,
      holding_cost: 3.0,
      lead_time: 2,
      parent_id: 'warehouse',
    },
    {
      id: 'retail2',
      name: '小売店2',
      demand_mean: 45,
      demand_std: 12,
      holding_cost: 3.0,
      lead_time: 2,
      parent_id: 'warehouse',
    },
  ]);

  const [tabuParams, setTabuParams] = useState<TabuSearchParams>({
    max_iterations: 1000,
    tabu_tenure: 20,
    neighborhood_size: 50,
    aspiration_threshold: 0.95,
    diversification_frequency: 100,
  });

  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [initialSolution, setInitialSolution] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateTabuParam = (param: keyof TabuSearchParams, value: number) => {
    setTabuParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const updateNode = (index: number, field: keyof NetworkNode, value: string | number | undefined) => {
    const newNodes = [...nodes];
    if (field === 'parent_id') {
      (newNodes[index] as any)[field] = value === '' ? undefined : value;
    } else {
      (newNodes[index] as any)[field] = typeof value === 'string' && 
        ['demand_mean', 'demand_std', 'holding_cost', 'lead_time'].includes(field) 
        ? Number(value) : value;
    }
    setNodes(newNodes);
  };

  const addNode = () => {
    const newNode: NetworkNode = {
      id: `node_${Date.now()}`,
      name: '新しいノード',
      demand_mean: 35,
      demand_std: 8,
      holding_cost: 2.5,
      lead_time: 3,
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (index: number) => {
    setNodes(nodes.filter((_, i) => i !== index));
  };

  const generateInitialSolution = () => {
    const initial: Record<string, number> = {};
    nodes.forEach(node => {
      // Simple heuristic: higher safety stock for higher variability
      const cv = node.demand_std / Math.max(node.demand_mean, 1);
      initial[node.id] = Math.max(10, node.demand_mean * cv * 0.5);
    });
    setInitialSolution(initial);
  };

  const runTabuSearch = async () => {
    setLoading(true);
    try {
      // Convert nodes to expected format
      const products = nodes.map(node => ({
        prod: node.id,
        name: node.name,
        unit_cost: 100.0,
        holding_cost_rate: node.holding_cost,
        lead_time: node.lead_time,
        service_level: serviceLevel
      }));

      const demandData = nodes
        .filter(node => node.demand_mean > 0)
        .map(node => ({
          date: '2024-01-01',
          prod: node.id,
          demand: node.demand_mean
        }));

      const request = {
        products: products,
        demand_data: demandData,
        total_budget: 15000.0,
        method: 'tabu_search',
        iterations: tabuParams.max_iterations
      };
      
      const response = await inventoryApi.performSSATabuSearch(request);
      setResult(response.data);
    } catch (error) {
      console.error('Error running SSA Tabu Search:', error);
      alert('SSAタブサーチ最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">🔍 安全在庫配分 - タブサーチ最適化</h1>
        <p className="sap-page-subtitle">
          大規模・複雑なサプライチェーンネットワークに対応するメタヒューリスティック最適化
        </p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">📊 最適化設定</div>
          <div className="sap-form-content">
            <div className="sap-field">
              <label className="sap-label">目標サービスレベル:</label>
              <input
                className="sap-input"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={serviceLevel}
                onChange={(e) => setServiceLevel(Number(e.target.value))}
              />
              <span className="sap-hint">({(serviceLevel * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">🏗️ ネットワーク構成</div>
          <div className="sap-form-content">
            <div className="sap-form-actions" style={{marginBottom: '20px'}}>
              <button className="sap-button sap-button-emphasized" onClick={addNode}>
                ➕ ノードを追加
              </button>
            </div>

            <div className="sap-table-container">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th className="sap-table-header">ノードID</th>
                    <th className="sap-table-header">名前</th>
                    <th className="sap-table-header">需要平均</th>
                    <th className="sap-table-header">需要標準偏差</th>
                    <th className="sap-table-header">保管費用</th>
                    <th className="sap-table-header">リードタイム</th>
                    <th className="sap-table-header">親ノード</th>
                    <th className="sap-table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node, index) => (
                    <tr key={index}>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="text"
                          value={node.id}
                          onChange={(e) => updateNode(index, 'id', e.target.value)}
                        />
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="text"
                          value={node.name}
                          onChange={(e) => updateNode(index, 'name', e.target.value)}
                        />
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="number"
                          value={node.demand_mean}
                          onChange={(e) => updateNode(index, 'demand_mean', e.target.value)}
                        />
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="number"
                          value={node.demand_std}
                          onChange={(e) => updateNode(index, 'demand_std', e.target.value)}
                        />
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="number"
                          step="0.1"
                          value={node.holding_cost}
                          onChange={(e) => updateNode(index, 'holding_cost', e.target.value)}
                        />
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="number"
                          value={node.lead_time}
                          onChange={(e) => updateNode(index, 'lead_time', e.target.value)}
                        />
                      </td>
                      <td className="sap-table-cell">
                        <select
                          className="sap-select"
                          value={node.parent_id || ''}
                          onChange={(e) => updateNode(index, 'parent_id', e.target.value || undefined)}
                        >
                          <option value="">なし</option>
                          {nodes.filter((_, i) => i !== index).map((n, i) => (
                            <option key={i} value={n.id}>{n.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="sap-table-cell">
                        <button 
                          className="sap-button sap-button-negative"
                          onClick={() => removeNode(index)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">⚙️ タブサーチパラメータ</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">最大反復回数:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={tabuParams.max_iterations}
                  onChange={(e) => updateTabuParam('max_iterations', Number(e.target.value))}
                />
                <span className="sap-hint">回</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">タブテニュア:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={tabuParams.tabu_tenure}
                  onChange={(e) => updateTabuParam('tabu_tenure', Number(e.target.value))}
                />
                <span className="sap-hint">期間</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">近傍サイズ:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={tabuParams.neighborhood_size}
                  onChange={(e) => updateTabuParam('neighborhood_size', Number(e.target.value))}
                />
                <span className="sap-hint">個</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">アスピレーション閾値:</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.01"
                  value={tabuParams.aspiration_threshold}
                  onChange={(e) => updateTabuParam('aspiration_threshold', Number(e.target.value))}
                />
                <span className="sap-hint">比率</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">多様化頻度:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={tabuParams.diversification_frequency}
                  onChange={(e) => updateTabuParam('diversification_frequency', Number(e.target.value))}
                />
                <span className="sap-hint">回</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sap-form-section">
          <div className="sap-form-header">🎯 初期解設定</div>
          <div className="sap-form-content">
            <div className="sap-form-actions" style={{marginBottom: '20px'}}>
              <button className="sap-button sap-button-emphasized" onClick={generateInitialSolution}>
                ⚡ 初期解を自動生成
              </button>
            </div>
            
            {Object.keys(initialSolution).length > 0 && (
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">現在の初期解</h3>
                </div>
                <div className="sap-panel-content">
                  <div className="sap-form-grid">
                    {Object.entries(initialSolution).map(([nodeId, stock]) => {
                      const node = nodes.find(n => n.id === nodeId);
                      return (
                        <div key={nodeId} className="sap-field">
                          <label className="sap-label">{node?.name || nodeId}:</label>
                          <input
                            className="sap-input"
                            type="number"
                            value={stock}
                            onChange={(e) => setInitialSolution(prev => ({
                              ...prev,
                              [nodeId]: Number(e.target.value)
                            }))}
                          />
                          <span className="sap-hint">単位</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <div className="sap-form-actions">
              <button 
                className="sap-button sap-button-emphasized"
                onClick={runTabuSearch} 
                disabled={loading}
              >
                {loading ? '⏳ タブサーチ実行中...' : '🔍 SSAタブサーチ最適化を実行'}
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
                    <span className="sap-label">最終費用:</span>
                    <span className="sap-object-number sap-object-number-emphasized">
                      {(() => {
                        const totalCost = Object.entries(result as Record<string, number>).reduce((sum, [nodeId, safetyStock]) => {
                          const node = nodes.find(n => n.id === nodeId);
                          return sum + (Number(safetyStock) * (node?.holding_cost || 0));
                        }, 0);
                        return totalCost > 0 ? totalCost.toFixed(2) : 'N/A';
                      })()} 円
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">タブサーチ最適化後の総費用</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">実行反復回数:</span>
                    <span className="sap-object-number">{tabuParams.max_iterations} 回</span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">タブサーチアルゴリズムの反復回数</span>
                  </div>
                </div>
              </div>
              
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">🏆 最適解</h3>
                </div>
                <div className="sap-panel-content">
                  <div className="sap-table-container">
                    <table className="sap-table">
                      <thead>
                        <tr>
                          <th className="sap-table-header">ノード</th>
                          <th className="sap-table-header">安全在庫</th>
                          <th className="sap-table-header">保管費用</th>
                          <th className="sap-table-header">割合</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result as Record<string, number>).map(([nodeId, safetyStock]) => {
                          const node = nodes.find(n => n.id === nodeId);
                          const totalStock = Object.values(result as Record<string, number>).reduce((sum: number, stock) => sum + Number(stock), 0);
                          return (
                            <tr key={nodeId}>
                              <td className="sap-table-cell">
                                <div className="sap-object-identifier">
                                  <span className="sap-object-identifier-title">{node?.name || nodeId}</span>
                                  <span className="sap-object-identifier-text">{nodeId}</span>
                                </div>
                              </td>
                              <td className="sap-table-cell">
                                <span className="sap-object-number">{Number(safetyStock).toFixed(2)} 単位</span>
                              </td>
                              <td className="sap-table-cell">
                                <span className="sap-object-number">{(Number(safetyStock) * (node?.holding_cost || 0)).toFixed(2)} 円</span>
                              </td>
                              <td className="sap-table-cell">
                                <div className="sap-progress-indicator">
                                  <div className="sap-progress-indicator-bar">
                                    <div 
                                      className="sap-progress-indicator-value" 
                                      style={{width: `${totalStock > 0 ? ((Number(safetyStock) / totalStock) * 100) : 0}%`}}
                                    ></div>
                                  </div>
                                  <span className="sap-progress-indicator-text">
                                    {totalStock > 0 ? ((Number(safetyStock) / totalStock) * 100).toFixed(1) : '0.0'}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {result.convergence_history && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">📈 収束履歴</h3>
                  </div>
                  <div className="sap-panel-content">
                    <div className="sap-list">
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">最良解発見反復</div>
                        <div className="sap-list-item-description">{result.best_iteration || 'N/A'}</div>
                      </div>
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">計算時間</div>
                        <div className="sap-list-item-description">{result.computation_time?.toFixed(3) || 'N/A'} 秒</div>
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
            <h3 className="sap-panel-title">📚 タブサーチ法について</h3>
          </div>
          <div className="sap-panel-content">
            <div className="sap-list">
              <div className="sap-list-item">
                <div className="sap-list-item-title">局所最適解からの脱出</div>
                <div className="sap-list-item-description">局所最適解からの脱出を可能にするメタヒューリスティック手法</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">循環防止機能</div>
                <div className="sap-list-item-description">タブリストによる循環防止と多様化戦略を併用</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">大規模問題対応</div>
                <div className="sap-list-item-description">大規模問題に対して実用的な近似最適解を効率的に発見</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">複雑ネットワーク対応</div>
                <div className="sap-list-item-description">動的プログラミングでは困難な複雑なネットワーク構造にも対応</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSATabuSearch;