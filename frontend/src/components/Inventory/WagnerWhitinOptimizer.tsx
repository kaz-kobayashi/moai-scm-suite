import React, { useState } from 'react';
import { WagnerWhitinRequest, WagnerWhitinResult } from '../../types';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

const WagnerWhitinOptimizer: React.FC = () => {
  const [request, setRequest] = useState<WagnerWhitinRequest>({
    demands: [5, 7, 3, 6, 4],
    fixed_costs: 3,
    variable_costs: [1, 1, 3, 3, 3],
    holding_costs: 1,
  });
  
  const [result, setResult] = useState<WagnerWhitinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const calculateWagnerWhitin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await inventoryApi.calculateWagnerWhitin(request);
      setResult(response.data);
    } catch (err: any) {
      setError('Wagner-Whitin計算エラー: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateDemands = (index: number, value: string) => {
    const newDemands = [...request.demands];
    newDemands[index] = Number(value) || 0;
    setRequest(prev => ({ ...prev, demands: newDemands }));
  };

  const updateVariableCosts = (index: number, value: string) => {
    if (Array.isArray(request.variable_costs)) {
      const newCosts = [...request.variable_costs as number[]];
      newCosts[index] = Number(value) || 0;
      setRequest(prev => ({ ...prev, variable_costs: newCosts }));
    }
  };

  const addPeriod = () => {
    setRequest(prev => ({
      ...prev,
      demands: [...prev.demands, 0],
      variable_costs: Array.isArray(prev.variable_costs) 
        ? [...prev.variable_costs as number[], 0] 
        : prev.variable_costs,
    }));
  };

  const removePeriod = (index: number) => {
    if (request.demands.length > 1) {
      setRequest(prev => ({
        ...prev,
        demands: prev.demands.filter((_, i) => i !== index),
        variable_costs: Array.isArray(prev.variable_costs) 
          ? (prev.variable_costs as number[]).filter((_, i) => i !== index)
          : prev.variable_costs,
      }));
    }
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">⚙️ Wagner-Whitin 動的ロットサイジング</h1>
        <p className="sap-page-subtitle">
          動的プログラミングによる多期間発注量の最適化アルゴリズム
        </p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">📅 期間別パラメータ</div>
          <div className="sap-form-content">
            <div className="sap-form-actions" style={{marginBottom: '20px'}}>
              <button className="sap-button sap-button-emphasized" onClick={addPeriod}>
                ➕ 期間を追加
              </button>
            </div>

            <div className="sap-table-container">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th className="sap-table-header">期間</th>
                    <th className="sap-table-header">需要量</th>
                    <th className="sap-table-header">変動費用</th>
                    <th className="sap-table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {request.demands.map((demand, index) => (
                    <tr key={index}>
                      <td className="sap-table-cell">
                        <div className="sap-object-identifier">
                          <span className="sap-object-identifier-title">期間 {index + 1}</span>
                          <span className="sap-object-identifier-text">PERIOD_{index + 1}</span>
                        </div>
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="number"
                          value={demand}
                          onChange={(e) => updateDemands(index, e.target.value)}
                          min="0"
                        />
                      </td>
                      <td className="sap-table-cell">
                        {Array.isArray(request.variable_costs) ? (
                          <input
                            className="sap-input"
                            type="number"
                            value={(request.variable_costs as number[])[index] || 0}
                            onChange={(e) => updateVariableCosts(index, e.target.value)}
                            min="0"
                            step="0.1"
                          />
                        ) : (
                          <span className="sap-object-number">{request.variable_costs}</span>
                        )}
                      </td>
                      <td className="sap-table-cell">
                        <button 
                          className="sap-button sap-button-negative"
                          onClick={() => removePeriod(index)}
                          disabled={request.demands.length <= 1}
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
          <div className="sap-form-header">⚙️ 共通パラメータ</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">固定発注費用:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.fixed_costs as number}
                  onChange={(e) => setRequest(prev => ({ ...prev, fixed_costs: Number(e.target.value) }))}
                  placeholder="3"
                  min="0"
                  step="0.1"
                />
                <span className="sap-hint">円/回</span>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">保管費用:</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.holding_costs as number}
                  onChange={(e) => setRequest(prev => ({ ...prev, holding_costs: Number(e.target.value) }))}
                  placeholder="1"
                  min="0"
                  step="0.1"
                />
                <span className="sap-hint">円/単位/期間</span>
              </div>
            </div>
            
            <div className="sap-form-actions">
              <button 
                className="sap-button sap-button-emphasized"
                onClick={calculateWagnerWhitin} 
                disabled={loading}
              >
                {loading ? '⏳ 最適化実行中...' : '⚙️ Wagner-Whitin最適化'}
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="sap-message-strip sap-message-strip-error">
            <strong>エラー:</strong> {error}
          </div>
        )}
        
        {result && (
          <div className="sap-form-section">
            <div className="sap-form-header">🎯 最適化結果</div>
            <div className="sap-form-content">
              
              <div className="sap-object-header">
                <div className="sap-object-header-title">
                  <span className="sap-label">総コスト:</span>
                  <span className="sap-object-number sap-object-number-emphasized">
                    {result.total_cost.toFixed(2)} 円
                  </span>
                </div>
                <div className="sap-object-status">
                  <span className="sap-text-muted">最適化後の総費用（発注費用 + 保管費用 + 変動費用）</span>
                </div>
              </div>
              
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">📋 期間別発注計画</h3>
                </div>
                <div className="sap-panel-content">
                  <div className="sap-table-container">
                    <table className="sap-table">
                      <thead>
                        <tr>
                          <th className="sap-table-header">期間</th>
                          <th className="sap-table-header">需要量</th>
                          <th className="sap-table-header">発注量</th>
                          <th className="sap-table-header">状態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.demands.map((demand, index) => (
                          <tr key={index} className={result.orders[index] > 0 ? 'sap-table-row-selected' : ''}>
                            <td className="sap-table-cell">
                              <div className="sap-object-identifier">
                                <span className="sap-object-identifier-title">期間 {index + 1}</span>
                                <span className="sap-object-identifier-text">PERIOD_{index + 1}</span>
                              </div>
                            </td>
                            <td className="sap-table-cell">
                              <span className="sap-object-number">{demand} 単位</span>
                            </td>
                            <td className="sap-table-cell">
                              <span className="sap-object-number">{result.orders[index].toFixed(0)} 単位</span>
                            </td>
                            <td className="sap-table-cell">
                              {result.orders[index] > 0 ? (
                                <span className="sap-object-status sap-object-status-indication-3">発注期間</span>
                              ) : (
                                <span className="sap-object-status sap-object-status-indication-2">発注なし</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">📊 発注スケジュール</h3>
                </div>
                <div className="sap-panel-content">
                  <div className="sap-message-strip sap-message-strip-information">
                    <strong>発注スケジュール:</strong> 
                    {result.order_periods && result.order_periods.length > 0 
                      ? ` 期間 ${result.order_periods.map(p => p + 1).join(', ')} で発注を実行`
                      : ' 発注期間なし'
                    }
                  </div>
                </div>
              </div>
              
              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">📚 結果の解説</h3>
                </div>
                <div className="sap-panel-content">
                  <div className="sap-list">
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">Wagner-Whitin法</div>
                      <div className="sap-list-item-description">動的プログラミングによる多期間発注量最適化</div>
                    </div>
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">発注期間</div>
                      <div className="sap-list-item-description">需要に対して最適なタイミングで発注を行う</div>
                    </div>
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">総コスト最小化</div>
                      <div className="sap-list-item-description">発注費用 + 保管費用 + 変動費用の合計最小化</div>
                    </div>
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">発注量決定</div>
                      <div className="sap-list-item-description">各期間の発注量（0は発注なし）を最適化</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WagnerWhitinOptimizer;