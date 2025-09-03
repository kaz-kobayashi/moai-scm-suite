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

const MultiSourceLND: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxIterations, setMaxIterations] = useState<number>(1000);
  const [tolerance, setTolerance] = useState<number>(1e-6);

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
    { name: 'DC品川', latitude: 35.6284, longitude: 139.7387, capacity: 250, fixed_cost: 12000, variable_cost: 2.8 }
  ];

  const samplePlants: PlantData[] = [
    { name: '工場A', latitude: 35.6051, longitude: 139.6823, capacity: 500, production_cost: 10.0 },
    { name: '工場B', latitude: 35.7295, longitude: 139.7109, capacity: 400, production_cost: 12.0 },
    { name: '工場C', latitude: 35.5494, longitude: 139.7798, capacity: 600, production_cost: 9.5 }
  ];

  const sampleProducts: ProductData[] = [
    { prod_id: 'prod_a', name: '製品A', unit_cost: 1.0, weight: 2.0, volume: 0.5, value: 10.0 },
    { prod_id: 'prod_b', name: '製品B', unit_cost: 1.5, weight: 1.5, volume: 0.3, value: 15.0 }
  ];

  const handleMultiSourceLND = async () => {
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

      const response = await fetch('http://localhost:8000/api/v1/logistics/multi-source-lnd', {
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
      setError(err instanceof Error ? err.message : 'Multi-Source LNDに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logistics-section">
      <h2>🔀 Multi-Source物流ネットワーク設計</h2>
      
      <div style={{ backgroundColor: '#e8f5e8', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
        <strong>🏭 Multi-Source LND:</strong> 複数工場→複数DC→顧客の複雑なネットワーク最適化
      </div>

      {/* Network Structure Display */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>🏗️ ネットワーク構造</h3>
        
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
            {sampleCustomers.map((customer, idx) => (
              <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {customer.name}: 需要{customer.demand}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#f3e5f5', padding: '12px', borderRadius: '4px' }}>
            <h5>📦 製品 ({sampleProducts.length}種類)</h5>
            {sampleProducts.map((product, idx) => (
              <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {product.name}: 単価{product.unit_cost}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>⚙️ 最適化パラメータ</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              最大イテレーション:
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
          onClick={handleMultiSourceLND}
          disabled={loading}
          style={{
            padding: '16px 32px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '最適化実行中...' : '🚀 Multi-Source LND最適化実行'}
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
          <h4>📊 Multi-Source LND最適化結果</h4>
          
          <div className="logistics-metrics">
            <div className="logistics-metric" style={{ backgroundColor: '#1976d2', color: 'white' }}>
              <div className="logistics-metric-label">総費用</div>
              <div className="logistics-metric-value">¥{result.total_cost.toLocaleString()}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#388e3c', color: 'white' }}>
              <div className="logistics-metric-label">選択DC数</div>
              <div className="logistics-metric-value">{result.selected_facilities.length}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#f57c00', color: 'white' }}>
              <div className="logistics-metric-label">解法ステータス</div>
              <div className="logistics-metric-value">{result.solution_status}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#9c27b0', color: 'white' }}>
              <div className="logistics-metric-label">計算時間</div>
              <div className="logistics-metric-value">{result.solve_time.toFixed(3)}s</div>
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
              <div style={{ backgroundColor: '#fff3cd', padding: '8px', borderRadius: '4px' }}>
                <strong>変動費:</strong> ¥{result.cost_breakdown.variable.toLocaleString()}
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

          {/* Flow Assignments */}
          <div style={{ marginTop: '16px' }}>
            <h5>📦 フロー割当:</h5>
            <div style={{ fontSize: '14px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(result.flow_assignments).map(([customer, flows]) => (
                <div key={customer} style={{ marginBottom: '8px' }}>
                  <div><strong>{customer}:</strong></div>
                  <div>
                    {Object.entries(flows as any).map(([facility, amount]) => (
                      <div key={facility} style={{ marginLeft: '16px', fontSize: '12px' }}>
                        {facility} → {String(amount)} 単位
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            </div>
          </div>
        </div>
      )}

      {/* Feature Description */}
      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '4px', marginTop: '20px' }}>
        <h4>🔧 Multi-Source LND Features:</h4>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li><strong>Lagrange Relaxation:</strong> 数理最適化による高精度な解法</li>
          <li><strong>Multi-Echelon:</strong> 工場→DC→顧客の3階層ネットワーク</li>
          <li><strong>Flow Balance:</strong> 各階層での需給バランス制約</li>
          <li><strong>Capacity Constraints:</strong> 工場・DC容量制約</li>
          <li><strong>Multi-Product:</strong> 複数製品同時最適化対応</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiSourceLND;