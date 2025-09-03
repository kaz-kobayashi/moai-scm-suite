import React, { useState } from 'react';
import { CustomerData, DCData, PlantData } from '../../services/logistics';

interface ProductData {
  prod_id: string;
  name: string;
  unit_cost: number;
  weight: number;
  volume: number;
  value: number;
}

const SingleSourceLND: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxIterations, setMaxIterations] = useState<number>(500);
  const [tolerance, setTolerance] = useState<number>(1e-6);

  const sampleCustomers: CustomerData[] = [
    { name: '顧客A', latitude: 35.6762, longitude: 139.6503, demand: 50 },
    { name: '顧客B', latitude: 35.6894, longitude: 139.6917, demand: 30 },
    { name: '顧客C', latitude: 35.6586, longitude: 139.7454, demand: 80 },
    { name: '顧客D', latitude: 35.7090, longitude: 139.7319, demand: 40 },
    { name: '顧客E', latitude: 35.6284, longitude: 139.7387, demand: 60 },
    { name: '顧客F', latitude: 35.6485, longitude: 139.6503, demand: 35 }
  ];

  const sampleDCs: DCData[] = [
    { name: 'DC東京', latitude: 35.6762, longitude: 139.6503, capacity: 200, fixed_cost: 10000, variable_cost: 2.5 },
    { name: 'DC渋谷', latitude: 35.6594, longitude: 139.7005, capacity: 150, fixed_cost: 8000, variable_cost: 3.0 },
    { name: 'DC新宿', latitude: 35.6938, longitude: 139.7034, capacity: 300, fixed_cost: 15000, variable_cost: 2.0 },
    { name: 'DC品川', latitude: 35.6284, longitude: 139.7387, capacity: 250, fixed_cost: 12000, variable_cost: 2.8 },
    { name: 'DC池袋', latitude: 35.7295, longitude: 139.7109, capacity: 180, fixed_cost: 9000, variable_cost: 3.2 }
  ];

  const samplePlants: PlantData[] = [
    { name: '工場A', latitude: 35.6051, longitude: 139.6823, capacity: 500, production_cost: 10.0 },
    { name: '工場B', latitude: 35.7295, longitude: 139.7109, capacity: 400, production_cost: 12.0 }
  ];

  const sampleProducts: ProductData[] = [
    { prod_id: 'prod_a', name: '製品A', unit_cost: 1.0, weight: 2.0, volume: 0.5, value: 10.0 }
  ];

  const handleSingleSourceLND = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        customers: sampleCustomers,
        dc_candidates: sampleDCs,
        plants: samplePlants,
        products: sampleProducts,
        max_iterations: maxIterations,
        tolerance: tolerance
      };

      const response = await fetch('http://localhost:8000/api/v1/logistics/single-source-lnd', {
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
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Single-Source LNDに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logistics-section">
      <h2>🎯 Single-Source物流ネットワーク設計</h2>
      
      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
        <strong>🎯 Single-Source制約:</strong> 各顧客が単一DCからのみサービスを受ける制約付き最適化
      </div>

      {/* Constraint Explanation */}
      <div style={{ backgroundColor: '#fff3cd', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
        <h4>⚠️ Single-Source制約の特徴</h4>
        <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li><strong>各顧客は1つのDCからのみ配送:</strong> 管理の簡素化、配送ルートの明確化</li>
          <li><strong>容量制約考慮:</strong> DCの処理能力を超えない割当</li>
          <li><strong>局所最適化:</strong> グリーディ+2-opt改善による高速解法</li>
          <li><strong>複数初期解:</strong> 10通りの初期解から最良解を選択</li>
        </ul>
      </div>

      {/* Network Structure Display */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>🏗️ ネットワーク構造 (Single-Source制約付き)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '4px' }}>
            <h5>🏭 工場 ({samplePlants.length}箇所)</h5>
            {samplePlants.map((plant, idx) => (
              <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {plant.name}: 容量{plant.capacity}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '4px' }}>
            <h5>🏪 DC候補 ({sampleDCs.length}箇所)</h5>
            {sampleDCs.map((dc, idx) => (
              <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {dc.name}: 容量{dc.capacity}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fff3cd', padding: '12px', borderRadius: '4px' }}>
            <h5>👥 顧客 ({sampleCustomers.length}箇所)</h5>
            <div style={{ fontSize: '12px', color: '#e65100', fontWeight: 'bold', marginBottom: '4px' }}>
              🎯 各顧客→単一DC制約
            </div>
            {sampleCustomers.map((customer, idx) => (
              <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {customer.name}: 需要{customer.demand}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <strong>総需要:</strong> {sampleCustomers.reduce((sum, c) => sum + c.demand, 0)} 単位<br />
          <strong>総DC容量:</strong> {sampleDCs.reduce((sum, dc) => sum + dc.capacity, 0)} 単位
        </div>
      </div>

      {/* Parameters Section */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>⚙️ 最適化パラメータ</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              最大イテレーション (局所改善):
              <input 
                type="number" 
                value={maxIterations} 
                onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              収束判定閾値:
              <input 
                type="number" 
                step="1e-6"
                value={tolerance} 
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleSingleSourceLND}
          disabled={loading}
          style={{
            padding: '16px 32px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '最適化実行中...' : '🎯 Single-Source LND最適化実行'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          エラー: {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="logistics-results">
          <h4>📊 Single-Source LND最適化結果</h4>
          
          <div className="logistics-metrics">
            <div className="logistics-metric" style={{ backgroundColor: '#1976d2', color: 'white' }}>
              <div className="logistics-metric-label">総費用</div>
              <div className="logistics-metric-value">¥{result.total_cost.toLocaleString()}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#ff9800', color: 'white' }}>
              <div className="logistics-metric-label">選択DC数</div>
              <div className="logistics-metric-value">{result.selected_facilities.length}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#4caf50', color: 'white' }}>
              <div className="logistics-metric-label">Single-Source制約</div>
              <div className="logistics-metric-value">適用済み ✓</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#9c27b0', color: 'white' }}>
              <div className="logistics-metric-label">解法ステータス</div>
              <div className="logistics-metric-value">{result.solution_status}</div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{ marginTop: '20px' }}>
            <h5>💰 費用内訳:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              <div style={{ backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '4px' }}>
                <strong>輸送費:</strong> ¥{result.cost_breakdown.transportation.toLocaleString()}
              </div>
              <div style={{ backgroundColor: '#e8f5e8', padding: '8px', borderRadius: '4px' }}>
                <strong>固定費:</strong> ¥{result.cost_breakdown.fixed.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Selected Facilities */}
          <div style={{ marginTop: '20px' }}>
            <h5>🏪 選択されたDC:</h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {result.selected_facilities.map((facility: any, index: number) => (
                <div key={index} style={{ backgroundColor: '#e8f5e8', padding: '8px', borderRadius: '4px' }}>
                  <strong>{facility.name}</strong> - 容量: {facility.capacity}, 固定費: ¥{facility.fixed_cost.toLocaleString()}
                  {result.facility_utilization[facility.name] && (
                    <span style={{ marginLeft: '16px', fontSize: '12px', color: '#666' }}>
                      稼働率: {(result.facility_utilization[facility.name] * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Single-Source Assignments */}
          <div style={{ marginTop: '16px' }}>
            <h5>🎯 Single-Source割当 (各顧客→単一DC):</h5>
            <div style={{ fontSize: '14px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px' }}>
              {Object.entries(result.flow_assignments).map(([customer, flows]) => {
                const facilityName = Object.keys(flows as any)[0];
                const amount = Object.values(flows as any)[0];
                return (
                  <div key={customer} style={{ 
                    marginBottom: '4px', 
                    padding: '4px', 
                    backgroundColor: '#fff', 
                    borderRadius: '2px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div><strong>{customer}</strong></div>
                    <div>{`→ ${facilityName} (${String(amount)} 単位)`}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Network Performance */}
          <div style={{ marginTop: '16px' }}>
            <h5>📈 ネットワーク性能:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              <div style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>平均距離</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {result.network_performance.average_distance.toFixed(1)}km
                </div>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>総需要</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {result.network_performance.total_demand}
                </div>
              </div>
              <div style={{ backgroundColor: '#fff3cd', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Single-Source制約</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e65100' }}>
                  {result.network_performance.single_source_constraint ? '✓ 適用' : '✗ 未適用'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Description */}
      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '4px', marginTop: '20px' }}>
        <h4>🔧 Single-Source LND Algorithm:</h4>
        <ol style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li><strong>多重初期解生成:</strong> 10通りの異なる初期割当パターン生成</li>
          <li><strong>貪欲割当:</strong> 容量制約下で各顧客を最適DCに割当</li>
          <li><strong>局所改善:</strong> 2-opt型の近傍探索で割当を改善</li>
          <li><strong>容量調整:</strong> 制約違反時の自動調整機構</li>
          <li><strong>最適解選択:</strong> 全試行から最小費用解を選択</li>
        </ol>
        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <strong>💡 適用場面:</strong> 配送管理の簡素化、顧客サービス窓口の統一、配送ルート最適化が重要な場合
        </div>
      </div>
    </div>
  );
};

export default SingleSourceLND;