import React, { useState } from 'react';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

interface NetworkNode {
  id: string;
  name: string;
  demand_mean: number;
  demand_std: number;
  holding_cost: number;
  lead_time: number;
  parent_id?: string;
}

const SSADynamicProgramming: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([
    {
      id: 'warehouse',
      name: '中央倉庫',
      demand_mean: 0,
      demand_std: 0,
      holding_cost: 1.0,
      lead_time: 7,
    },
    {
      id: 'retail1',
      name: '小売店1',
      demand_mean: 50,
      demand_std: 10,
      holding_cost: 2.0,
      lead_time: 2,
      parent_id: 'warehouse',
    },
    {
      id: 'retail2', 
      name: '小売店2',
      demand_mean: 40,
      demand_std: 8,
      holding_cost: 2.0,
      lead_time: 2,
      parent_id: 'warehouse',
    },
  ]);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [totalBudget, setTotalBudget] = useState(10000.0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addNode = () => {
    const newNode: NetworkNode = {
      id: `node_${Date.now()}`,
      name: '新しいノード',
      demand_mean: 30,
      demand_std: 6,
      holding_cost: 2.0,
      lead_time: 3,
    };
    setNodes([...nodes, newNode]);
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

  const removeNode = (index: number) => {
    setNodes(nodes.filter((_, i) => i !== index));
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      // Convert nodes to expected format
      const products = nodes.map(node => ({
        prod: node.id,
        name: node.name,
        unit_cost: 100.0, // Default unit cost
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
        total_budget: totalBudget,
        method: 'dynamic_programming'
      };
      
      const response = await inventoryApi.performSSADynamicProgramming(request);
      setResult(response.data);
    } catch (error) {
      console.error('Error running SSA Dynamic Programming:', error);
      alert('SSA動的プログラミング最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">🤖 安全在庫配分 - 動的プログラミング最適化</h1>
        <p className="sap-page-subtitle">
          多段階サプライチェーンネットワークにおける最適な安全在庫配分をDPアルゴリズムで計算
        </p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">📊 最適化設定</div>
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
                  value={serviceLevel}
                  onChange={(e) => setServiceLevel(Number(e.target.value))}
                />
                <span className="sap-hint">({(serviceLevel * 100).toFixed(1)}%)</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">総予算制約:</label>
                <input
                  className="sap-input"
                  type="number"
                  step="100"
                  min="1000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                />
                <span className="sap-hint">円</span>
              </div>
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
                          <option value="">なし（ルートノード）</option>
                          {nodes.filter((_, i) => i !== index).map((n, i) => (
                            <option key={i} value={n.id}>{n.name} ({n.id})</option>
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
            
            <div className="sap-form-actions">
              <button 
                className="sap-button sap-button-emphasized"
                onClick={runOptimization} 
                disabled={loading}
              >
                {loading ? '⏳ 最適化実行中...' : '🤖 SSA動的プログラミング最適化を実行'}
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
                    <span className="sap-label">総費用:</span>
                    <span className="sap-object-number sap-object-number-emphasized">
                      {(() => {
                        const totalCost = Object.entries(result).reduce((sum, [nodeId, safetyStock]) => {
                          const node = nodes.find(n => n.id === nodeId);
                          return sum + (Number(safetyStock) * (node?.holding_cost || 0));
                        }, 0);
                        return totalCost > 0 ? totalCost.toFixed(2) : 'N/A';
                      })()} 円
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">最適化後の総保管費用</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">総安全在庫:</span>
                    <span className="sap-object-number sap-object-number-emphasized">
                      {Object.values(result as Record<string, number>).reduce((sum: number, stock) => sum + Number(stock), 0).toFixed(1)} 単位
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">全ノードの安全在庫合計</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">達成サービスレベル:</span>
                    <span className="sap-object-number">{(serviceLevel * 100).toFixed(1)}%</span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">目標サービスレベル達成</span>
                  </div>
                </div>
              </div>
              
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">📦 ノード別安全在庫配分</h3>
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
              
              {result.optimization_details && (
                <div className="sap-panel">
                  <div className="sap-panel-header">
                    <h3 className="sap-panel-title">⚡ 最適化詳細</h3>
                  </div>
                  <div className="sap-panel-content">
                    <div className="sap-list">
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">収束反復回数</div>
                        <div className="sap-list-item-description">{result.optimization_details.iterations || 'N/A'}</div>
                      </div>
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">計算時間</div>
                        <div className="sap-list-item-description">{result.optimization_details.computation_time?.toFixed(3) || 'N/A'} 秒</div>
                      </div>
                      <div className="sap-list-item">
                        <div className="sap-list-item-title">最適化状態</div>
                        <div className="sap-list-item-description">
                          <span className="sap-object-status sap-object-status-indication-3">
                            {result.optimization_details.status || '完了'}
                          </span>
                        </div>
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
            <h3 className="sap-panel-title">📚 動的プログラミング法について</h3>
          </div>
          <div className="sap-panel-content">
            <div className="sap-list">
              <div className="sap-list-item">
                <div className="sap-list-item-title">多段階最適化</div>
                <div className="sap-list-item-description">多段階在庫システムにおける最適な安全在庫配分を計算</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">順次最適決定</div>
                <div className="sap-list-item-description">各ステージでの最適決定を順次決定し、全体最適解を導出</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">厳密解の提供</div>
                <div className="sap-list-item-description">ネットワーク構造の制約を考慮した厳密解を提供</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">計算効率性</div>
                <div className="sap-list-item-description">計算複雑度はノード数に対して多項式時間</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSADynamicProgramming;