import React, { useState } from 'react';
import { EOQRequest, EOQResult } from '../../types';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

const EOQCalculator: React.FC = () => {
  const [request, setRequest] = useState<EOQRequest>({
    annual_demand: 3650,
    order_cost: 300,
    holding_cost: 10,
    unit_cost: undefined,
    backorder_cost: undefined,
  });
  
  const [result, setResult] = useState<EOQResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const calculateEOQ = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await inventoryApi.calculateEOQ(request);
      setResult(response.data);
    } catch (err: any) {
      setError('EOQ計算エラー: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = (field: keyof EOQRequest, value: any) => {
    setRequest(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">📊 経済発注量 (EOQ) 計算</h1>
        <p className="sap-page-subtitle">最適な発注量とコストバランスを計算します</p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">📋 パラメータ設定</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">年間需要量:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={request.annual_demand}
                  onChange={(e) => updateRequest('annual_demand', Number(e.target.value))}
                  placeholder="3650"
                />
                <span className="sap-hint">単位/年</span>
              </div>
            
              <div className="sap-field">
                <label className="sap-label">発注費用:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={request.order_cost}
                  onChange={(e) => updateRequest('order_cost', Number(e.target.value))}
                  placeholder="300"
                />
                <span className="sap-hint">円/回</span>
              </div>
            
              <div className="sap-field">
                <label className="sap-label">保管費用:</label>
                <input
                  type="number"
                  className="sap-input"
                  value={request.holding_cost}
                  onChange={(e) => updateRequest('holding_cost', Number(e.target.value))}
                  placeholder="10"
                />
                <span className="sap-hint">円/単位/年</span>
              </div>
            
              <div className="sap-field">
                <label className="sap-label">製品単価 (オプション):</label>
                <input
                  type="number"
                  className="sap-input"
                  value={request.unit_cost || ''}
                  onChange={(e) => updateRequest('unit_cost', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="100"
                />
                <span className="sap-hint">円/単位</span>
              </div>
            
              <div className="sap-field">
                <label className="sap-label">バックオーダー費用 (オプション):</label>
                <input
                  type="number"
                  className="sap-input"
                  value={request.backorder_cost || ''}
                  onChange={(e) => updateRequest('backorder_cost', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="40"
                />
                <span className="sap-hint">円/単位</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sap-action-bar">
          <button 
            onClick={calculateEOQ} 
            disabled={loading}
            className="sap-button sap-button-emphasized"
          >
            {loading ? '⏳ 計算中...' : '📊 EOQ計算実行'}
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
              <h3 className="sap-panel-title">📊 EOQ計算結果</h3>
            </div>
            <div className="sap-panel-content">
              
              {/* Summary Header */}
              <div className="sap-object-header">
                <div className="sap-object-header-title">
                  <span className="sap-label">最適発注量:</span>
                  <span className="sap-object-number sap-object-number-emphasized">
                    {result.eoq.toFixed(0)} 単位
                  </span>
                </div>
                <div className="sap-object-status">
                  <span className="sap-text-muted">経済発注量 (EOQ)</span>
                </div>
              </div>
              
              <div className="sap-form-grid sap-form-grid-3">
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">年間総コスト:</span>
                    <span className="sap-object-number">
                      {result.total_cost >= 1000000 ? `¥${(result.total_cost/1000000).toFixed(1)}M` : `¥${(result.total_cost/1000).toFixed(0)}K`}
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">期待総費用</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">発注頻度:</span>
                    <span className="sap-object-number">
                      {result.order_frequency.toFixed(1)} 回/年
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">年間発注回数</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">サイクルタイム:</span>
                    <span className="sap-object-number">
                      {result.cycle_time.toFixed(0)} 日
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">発注間隔</span>
                  </div>
                </div>
              </div>
              
              {result.safety_stock !== null && result.safety_stock !== undefined && (
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">安全在庫:</span>
                    <span className="sap-object-number">
                      {result.safety_stock.toFixed(0)} 単位
                    </span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">推奨安全在庫水準</span>
                  </div>
                </div>
              )}
              
              {/* Cost Breakdown Table */}
              <div className="sap-table-container" style={{marginTop: '24px'}}>
                <table className="sap-table">
                  <thead>
                    <tr>
                      <th className="sap-table-header">指標</th>
                      <th className="sap-table-header">値</th>
                      <th className="sap-table-header">単位</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="sap-table-cell">
                        <div className="sap-object-identifier">
                          <span className="sap-object-identifier-title">経済発注量 (EOQ)</span>
                        </div>
                      </td>
                      <td className="sap-table-cell">
                        <span className="sap-object-number">{result.eoq.toFixed(0)}</span>
                      </td>
                      <td className="sap-table-cell">単位</td>
                    </tr>
                    <tr>
                      <td className="sap-table-cell">
                        <div className="sap-object-identifier">
                          <span className="sap-object-identifier-title">年間総費用</span>
                        </div>
                      </td>
                      <td className="sap-table-cell">
                        <span className="sap-object-number">{result.total_cost.toFixed(2)}</span>
                      </td>
                      <td className="sap-table-cell">円/年</td>
                    </tr>
                    <tr>
                      <td className="sap-table-cell">
                        <div className="sap-object-identifier">
                          <span className="sap-object-identifier-title">発注頻度</span>
                        </div>
                      </td>
                      <td className="sap-table-cell">
                        <span className="sap-object-number">{result.order_frequency.toFixed(2)}</span>
                      </td>
                      <td className="sap-table-cell">回/年</td>
                    </tr>
                    <tr>
                      <td className="sap-table-cell">
                        <div className="sap-object-identifier">
                          <span className="sap-object-identifier-title">サイクルタイム</span>
                        </div>
                      </td>
                      <td className="sap-table-cell">
                        <span className="sap-object-number">{result.cycle_time.toFixed(1)}</span>
                      </td>
                      <td className="sap-table-cell">日</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <div className="sap-panel sap-panel-section">
          <div className="sap-panel-header">
            <h3 className="sap-panel-title">📚 EOQ計算について</h3>
          </div>
          <div className="sap-panel-content">
            <ul className="sap-list">
              <li className="sap-list-item">発注費用と保管費用のトレードオフを最適化</li>
              <li className="sap-list-item">年間総費用を最小化する発注量を計算</li>
              <li className="sap-list-item">需要が一定で確実な場合に適用</li>
              <li className="sap-list-item">在庫管理の基本的な意思決定ツール</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EOQCalculator;