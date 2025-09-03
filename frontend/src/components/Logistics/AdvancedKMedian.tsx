import React, { useState } from 'react';
import { logisticsApi, CustomerData, DCData } from '../../services/logistics';

const AdvancedKMedian: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lrFinderResult, setLrFinderResult] = useState<any>(null);

  // Advanced parameters
  const [useAdam, setUseAdam] = useState<boolean>(true);
  const [useLrScheduling, setUseLrScheduling] = useState<boolean>(true);
  const [capacityConstraint, setCapacityConstraint] = useState<boolean>(true);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [maxIterations, setMaxIterations] = useState<number>(1000);

  const sampleCustomers: CustomerData[] = [
    { name: '顧客A', latitude: 35.6762, longitude: 139.6503, demand: 50 },
    { name: '顧客B', latitude: 35.6894, longitude: 139.6917, demand: 30 },
    { name: '顧客C', latitude: 35.6586, longitude: 139.7454, demand: 80 },
    { name: '顧客D', latitude: 35.7090, longitude: 139.7319, demand: 40 },
    { name: '顧客E', latitude: 35.6284, longitude: 139.7387, demand: 60 }
  ];

  const sampleDCs: DCData[] = [
    { name: 'DC東京', latitude: 35.6762, longitude: 139.6503, capacity: 200, fixed_cost: 10000, variable_cost: 2.5 },
    { name: 'DC渋谷', latitude: 35.6594, longitude: 139.7005, capacity: 150, fixed_cost: 8000, variable_cost: 3.0 },
    { name: 'DC新宿', latitude: 35.6938, longitude: 139.7034, capacity: 300, fixed_cost: 15000, variable_cost: 2.0 },
    { name: 'DC品川', latitude: 35.6284, longitude: 139.7387, capacity: 250, fixed_cost: 12000, variable_cost: 2.8 },
    { name: 'DC池袋', latitude: 35.7295, longitude: 139.7109, capacity: 180, fixed_cost: 9000, variable_cost: 3.2 }
  ];

  const handleAdvancedKMedian = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        customers: sampleCustomers,
        dc_candidates: sampleDCs,
        k: 3,
        max_iterations: maxIterations,
        learning_rate: learningRate,
        momentum: 0.9,
        use_adam: useAdam,
        use_lr_scheduling: useLrScheduling,
        capacity_constraint: capacityConstraint
      };

      const response = await fetch('http://localhost:8000/api/v1/logistics/k-median', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('K-Median API Response:', result);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '高度なK-Median最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLearningRateFinder = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        customers: sampleCustomers,
        dc_candidates: sampleDCs,
        k: 3,
        lr_range: [1e-7, 10.0],
        num_iterations: 100
      };

      const response = await fetch('http://localhost:8000/api/v1/logistics/k-median/find-learning-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setLrFinderResult(result);
      setLearningRate(result.suggested_lr);
    } catch (err) {
      setError(err instanceof Error ? err.message : '学習率探索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logistics-section">
      <h2>🚀 高度なK-Median最適化</h2>
      
      <div style={{ backgroundColor: '#fff3cd', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
        <strong>✨ Advanced Features:</strong> Adam optimizer、学習率スケジューリング、容量制約対応
      </div>

      {/* Parameters Section */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>⚙️ 最適化パラメータ</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              学習率:
              <input 
                type="number" 
                step="0.001"
                value={learningRate} 
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px', marginLeft: '8px' }}
              />
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              最大イテレーション:
              <input 
                type="number" 
                value={maxIterations} 
                onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                style={{ width: '100%', padding: '8px', marginLeft: '8px' }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={useAdam} 
              onChange={(e) => setUseAdam(e.target.checked)}
            />
            <strong>Adam Optimizer</strong> を使用
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={useLrScheduling} 
              onChange={(e) => setUseLrScheduling(e.target.checked)}
            />
            <strong>Learning Rate Scheduling</strong> を使用
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={capacityConstraint} 
              onChange={(e) => setCapacityConstraint(e.target.checked)}
            />
            <strong>容量制約</strong> を適用
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleLearningRateFinder}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '探索中...' : '🔍 学習率ファインダー実行'}
        </button>

        <button 
          onClick={handleAdvancedKMedian}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '最適化中...' : '🚀 高度なK-Median最適化実行'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          エラー: {error}
        </div>
      )}

      {/* Learning Rate Finder Results */}
      {lrFinderResult && (
        <div style={{ backgroundColor: '#fff3cd', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
          <h4>🔍 学習率ファインダー結果</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div><strong>推奨学習率:</strong> {lrFinderResult.suggested_lr.toFixed(6)}</div>
            <div><strong>最小Loss学習率:</strong> {lrFinderResult.min_loss_lr.toFixed(6)}</div>
            <div><strong>テスト回数:</strong> {lrFinderResult.iterations_tested}</div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="logistics-results">
          <h4>📊 最適化結果</h4>
          
          <div className="logistics-metrics">
            <div className="logistics-metric" style={{ backgroundColor: '#1976d2', color: 'white' }}>
              <div className="logistics-metric-label">総費用</div>
              <div className="logistics-metric-value">¥{result.total_cost.toLocaleString()}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#388e3c', color: 'white' }}>
              <div className="logistics-metric-label">選択施設数</div>
              <div className="logistics-metric-value">{result.selected_facilities.length}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#f57c00', color: 'white' }}>
              <div className="logistics-metric-label">最適化手法</div>
              <div className="logistics-metric-value">
                {useAdam ? 'Adam' : 'SGD'}
                {useLrScheduling ? '+LR Scheduling' : ''}
                {capacityConstraint ? '+Capacity' : ''}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h5>選択された施設:</h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {result.facility_locations.map((facility: any, index: number) => {
                // facility_locationsのインデックスに対応する元の施設インデックスを取得
                const originalFacilityIdx = result.selected_facilities[index];
                
                // この施設に割り当てられた顧客をカウント
                const assignedCustomers = Object.entries(result.customer_assignments)
                  .filter(([_, facilityIdx]) => facilityIdx === originalFacilityIdx)
                  .map(([customer, _]) => customer);
                const totalDemand = assignedCustomers.reduce((sum, customerName) => {
                  const customer = sampleCustomers.find(c => c.name === customerName);
                  return sum + (customer?.demand || 0);
                }, 0);
                
                return (
                  <div key={index} style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{facility.name}</strong>
                      <span style={{ 
                        fontSize: '12px', 
                        color: totalDemand > facility.capacity ? '#d32f2f' : '#388e3c' 
                      }}>
                        使用率: {totalDemand}/{facility.capacity} ({((totalDemand/facility.capacity)*100).toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
                      固定費: ¥{facility.fixed_cost.toLocaleString()} | 割当顧客数: {assignedCustomers.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h5>顧客割当:</h5>
            <div style={{ fontSize: '14px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px' }}>
              {/* 全顧客の割当状況を表示 */}
              {sampleCustomers.map((customer) => {
                const facilityIdx = result.customer_assignments[customer.name];
                return (
                  <div key={customer.name} style={{ 
                    color: facilityIdx !== undefined ? '#000' : '#d32f2f',
                    marginBottom: '4px'
                  }}>
                    {customer.name} → {
                      facilityIdx !== undefined 
                        ? (() => {
                            // customer_assignmentsの値は元の施設配列のインデックスを指している
                            if (sampleDCs[facilityIdx]) {
                              return sampleDCs[facilityIdx].name;
                            }
                            return `施設${facilityIdx}（未定義）`;
                          })()
                        : '未割当'
                    }
                  </div>
                );
              })}
            </div>
            
            {/* 割当状況サマリー */}
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
              <strong>割当状況:</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                • 割当済み顧客数: {Object.keys(result.customer_assignments).length} / {sampleCustomers.length}
                <br />
                • 未割当顧客数: {sampleCustomers.length - Object.keys(result.customer_assignments).length}
              </div>
              
              {/* 割当の妥当性チェック */}
              {(() => {
                const invalidAssignments = Object.entries(result.customer_assignments)
                  .filter(([_, facilityIdx]) => !result.selected_facilities.includes(facilityIdx as number));
                
                if (invalidAssignments.length > 0) {
                  return (
                    <div style={{ color: '#d32f2f', fontSize: '14px', marginTop: '8px' }}>
                      ⚠️ 警告: 一部の顧客が選択されていない施設に割り当てられています。<br/>
                      問題のある割当: {invalidAssignments.map(([customer, idx]) => 
                        `${customer} → 施設${idx}`
                      ).join(', ')}
                    </div>
                  );
                }
                
                if (Object.keys(result.customer_assignments).length < sampleCustomers.length) {
                  return (
                    <div style={{ color: '#d32f2f', fontSize: '14px', marginTop: '8px' }}>
                      ⚠️ 一部の顧客が未割当です。容量制約により割当できなかった可能性があります。
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
            
            {/* デバッグ情報 */}
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
              <strong>デバッグ情報:</strong>
              <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
                • selected_facilities: [{result.selected_facilities?.join(', ')}]<br />
                • facility_locations数: {result.facility_locations?.length}<br />
                • customer_assignments: {JSON.stringify(result.customer_assignments)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '4px', marginTop: '20px' }}>
        <strong>📝 使用方法:</strong><br />
        1. 学習率ファインダーで最適な学習率を探索<br />
        2. 最適化パラメータを調整<br />
        3. 高度なK-Median最適化を実行<br />
        4. 結果を確認して施設配置を評価
      </div>
    </div>
  );
};

export default AdvancedKMedian;