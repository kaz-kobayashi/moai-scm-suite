import React, { useState } from 'react';
import { SSPolicyRequest, SSPolicyResult } from '../../types';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

const SSPolicyCalculator: React.FC = () => {
  const [request, setRequest] = useState<SSPolicyRequest>({
    mu: 100,
    sigma: 10,
    lead_time: 3,
    backorder_cost: 100,
    holding_cost: 10,
    fixed_cost: 10000,
  });
  
  const [result, setResult] = useState<SSPolicyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const calculateSSPolicy = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await inventoryApi.approximateSSPolicy(request);
      setResult(response.data);
    } catch (err: any) {
      setError('(s,S)政策計算エラー: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = (field: keyof SSPolicyRequest, value: number) => {
    setRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateServiceLevel = () => {
    // Critical ratio calculation: ω = b/(b+h)
    return (request.backorder_cost / (request.backorder_cost + request.holding_cost) * 100).toFixed(1);
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">🎯 (s,S)政策パラメータ近似計算</h1>
        <p className="sap-page-subtitle">
          Ehrhardt-Mosier (1984) の近似式を使用して、最適な(s,S)政策パラメータを計算します
        </p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">パラメータ設定</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">平均需要 (μ):</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.mu}
                  onChange={(e) => updateRequest('mu', Number(e.target.value))}
                  placeholder="100"
                  min="0"
                  step="1"
                />
                <span className="sap-hint">単位/期間</span>
              </div>
          
              <div className="sap-field">
                <label className="sap-label">需要の標準偏差 (σ):</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.sigma}
                  onChange={(e) => updateRequest('sigma', Number(e.target.value))}
                  placeholder="10"
                  min="0"
                  step="0.1"
                />
                <span className="sap-hint">単位</span>
              </div>
          
              <div className="sap-field">
                <label className="sap-label">リードタイム (LT):</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.lead_time}
                  onChange={(e) => updateRequest('lead_time', Number(e.target.value))}
                  placeholder="3"
                  min="0"
                  step="1"
                />
                <span className="sap-hint">期間</span>
              </div>
          
              <div className="sap-field">
                <label className="sap-label">バックオーダー費用 (b):</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.backorder_cost}
                  onChange={(e) => updateRequest('backorder_cost', Number(e.target.value))}
                  placeholder="100"
                  min="0"
                  step="1"
                />
                <span className="sap-hint">円/単位</span>
              </div>
          
              <div className="sap-field">
                <label className="sap-label">保管費用 (h):</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.holding_cost}
                  onChange={(e) => updateRequest('holding_cost', Number(e.target.value))}
                  placeholder="10"
                  min="0"
                  step="0.1"
                />
                <span className="sap-hint">円/単位/期間</span>
              </div>
          
              <div className="sap-field">
                <label className="sap-label">固定発注費用 (fc):</label>
                <input
                  className="sap-input"
                  type="number"
                  value={request.fixed_cost}
                  onChange={(e) => updateRequest('fixed_cost', Number(e.target.value))}
                  placeholder="10000"
                  min="0"
                  step="100"
                />
                <span className="sap-hint">円/回</span>
              </div>
            </div>
        
            <div className="sap-object-status sap-object-status-indication-3">
              <div className="sap-object-status-text">
                <strong>計算される目標サービスレベル: {calculateServiceLevel()}%</strong>
                <span className="sap-text-muted">(ω = b/(b+h) から算出)</span>
              </div>
            </div>
        
            <div className="sap-form-actions">
              <button 
                className="sap-button sap-button-emphasized"
                onClick={calculateSSPolicy} 
                disabled={loading}
              >
                {loading ? '計算中...' : '🎯 (s,S)政策計算'}
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
            <div className="sap-form-header">🎯 計算結果</div>
            <div className="sap-form-content">
              
              <div className="sap-form-grid">
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">再発注点 (s):</span>
                    <span className="sap-object-number sap-object-number-emphasized">{result.s.toFixed(2)} 単位</span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">在庫がこのレベル以下になったら発注</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">発注上限 (S):</span>
                    <span className="sap-object-number sap-object-number-emphasized">{result.S.toFixed(2)} 単位</span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">このレベルまで在庫を補充</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">発注量 (S-s):</span>
                    <span className="sap-object-number">{(result.S - result.s).toFixed(2)} 単位</span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">発注時の注文量</span>
                  </div>
                </div>
                
                <div className="sap-object-header">
                  <div className="sap-object-header-title">
                    <span className="sap-label">平均在庫レベル:</span>
                    <span className="sap-object-number">{((result.S + result.s) / 2).toFixed(2)} 単位</span>
                  </div>
                  <div className="sap-object-status">
                    <span className="sap-text-muted">理論的平均在庫</span>
                  </div>
                </div>
              </div>

              <div className="sap-panel">
                <div className="sap-panel-header">
                  <h3 className="sap-panel-title">📊 (s,S)政策の運用フロー</h3>
                </div>
                <div className="sap-panel-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Step 1: 在庫監視 */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      border: '2px solid #dee2e6',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>1</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#28a745', fontSize: '16px' }}>
                            📦 在庫レベルの監視
                          </h4>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            現在の在庫レベルを常時監視し、再発注点 <strong>s = {result.s.toFixed(0)}単位</strong> と比較します
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ textAlign: 'center', color: '#6c757d' }}>
                      ⬇️ 在庫レベル ≤ {result.s.toFixed(0)}単位 になった時
                    </div>

                    {/* Step 2: 発注トリガー */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      border: '2px solid #ffc107',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          background: '#ffc107',
                          color: 'white',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>2</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#dc6c00', fontSize: '16px' }}>
                            ⚠️ 再発注トリガー発動
                          </h4>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            在庫が再発注点以下になると自動的に発注処理を開始します
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ textAlign: 'center', color: '#6c757d' }}>
                      ⬇️ 発注量 = S - 現在在庫 を計算
                    </div>

                    {/* Step 3: 発注実行 */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      border: '2px solid #28a745',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>3</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#155724', fontSize: '16px' }}>
                            📋 在庫補充実行
                          </h4>
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                            在庫レベルが <strong>S = {result.S.toFixed(0)}単位</strong> まで回復するよう発注
                          </p>
                          <div style={{ 
                            background: '#155724', 
                            color: 'white', 
                            padding: '8px 12px', 
                            borderRadius: '6px', 
                            fontSize: '13px',
                            display: 'inline-block'
                          }}>
                            💡 最大発注量: {(result.S - result.s).toFixed(0)}単位
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual Comparison */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #dee2e6'
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#495057' }}>
                        在庫レベルの視覚的表現
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'end' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '60px',
                            height: `${Math.max((result.s / result.S) * 120, 20)}px`,
                            background: 'linear-gradient(to top, #dc3545, #fd7e14)',
                            borderRadius: '6px 6px 0 0',
                            margin: '0 auto 8px',
                            border: '2px solid #dc3545'
                          }}></div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc3545' }}>
                            再発注点<br/>s = {result.s.toFixed(0)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            🚨 発注開始
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '60px',
                            height: '120px',
                            background: 'linear-gradient(to top, #28a745, #20c997)',
                            borderRadius: '6px 6px 0 0',
                            margin: '0 auto 8px',
                            border: '2px solid #28a745'
                          }}></div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                            発注上限<br/>S = {result.S.toFixed(0)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            ✅ 目標レベル
                          </div>
                        </div>
                      </div>
                    </div>
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
                      <div className="sap-list-item-title">(s,S)政策</div>
                      <div className="sap-list-item-description">在庫レベルがs以下になったら、Sまで補充する政策</div>
                    </div>
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">再発注点 (s)</div>
                      <div className="sap-list-item-description">需要の不確実性とリードタイムを考慮した最低在庫レベル</div>
                    </div>
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">発注上限 (S)</div>
                      <div className="sap-list-item-description">発注費用と保管費用のバランスを考慮した目標在庫レベル</div>
                    </div>
                    <div className="sap-list-item">
                      <div className="sap-list-item-title">Ehrhardt-Mosier近似</div>
                      <div className="sap-list-item-description">複雑な(s,S)政策を効率的に計算する近似手法</div>
                    </div>
                  </div>
                  
                  <div className="sap-panel" style={{marginTop: '20px'}}>
                    <div className="sap-panel-header">
                      <h4 className="sap-panel-title">⚙️ 政策の運用ルール</h4>
                    </div>
                    <div className="sap-panel-content">
                      <div className="sap-list sap-list-ordered">
                        <div className="sap-list-item">
                          <div className="sap-list-item-counter">1</div>
                          <div className="sap-list-item-content">在庫レベルを常時監視</div>
                        </div>
                        <div className="sap-list-item">
                          <div className="sap-list-item-counter">2</div>
                          <div className="sap-list-item-content">在庫が{result.s.toFixed(0)}単位以下になったら発注開始</div>
                        </div>
                        <div className="sap-list-item">
                          <div className="sap-list-item-counter">3</div>
                          <div className="sap-list-item-content">発注量は{result.S.toFixed(0)} - 現在庫レベル</div>
                        </div>
                        <div className="sap-list-item">
                          <div className="sap-list-item-counter">4</div>
                          <div className="sap-list-item-content">発注後の在庫レベルは{result.S.toFixed(0)}単位になる</div>
                        </div>
                      </div>
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

export default SSPolicyCalculator;