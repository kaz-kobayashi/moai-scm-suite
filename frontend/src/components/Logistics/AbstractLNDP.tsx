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

interface EchelonConfig {
  levels: string[];
  consolidation_rules: string;
  inventory_policy: string;
}

interface OptimizationConfig {
  method: string;
  max_iterations: number;
  tolerance: number;
  use_heuristics: boolean;
  metaheuristic: string;
}

const AbstractLNDP: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration state
  const [optimizationMethod, setOptimizationMethod] = useState<string>('lagrange_relaxation');
  const [maxIterations, setMaxIterations] = useState<number>(1000);
  const [tolerance, setTolerance] = useState<number>(1e-6);
  const [useHeuristics, setUseHeuristics] = useState<boolean>(true);

  const sampleCustomers: CustomerData[] = [
    { name: '顧客A', latitude: 35.6762, longitude: 139.6503, demand: 50 },
    { name: '顧客B', latitude: 35.6894, longitude: 139.6917, demand: 30 },
    { name: '顧客C', latitude: 35.6586, longitude: 139.7454, demand: 80 },
    { name: '顧客D', latitude: 35.7090, longitude: 139.7319, demand: 40 },
    { name: '顧客E', latitude: 35.6284, longitude: 139.7387, demand: 60 },
    { name: '顧客F', latitude: 35.6485, longitude: 139.6503, demand: 35 }
  ];

  // Regional DCs (high capacity)
  const regionalDCs: DCData[] = [
    { name: '地域DC東京', latitude: 35.6762, longitude: 139.6503, capacity: 1500, fixed_cost: 50000, variable_cost: 2.0 },
    { name: '地域DC横浜', latitude: 35.4437, longitude: 139.6380, capacity: 1200, fixed_cost: 45000, variable_cost: 2.2 }
  ];

  // Local DCs (lower capacity)
  const localDCs: DCData[] = [
    { name: 'ローカルDC渋谷', latitude: 35.6594, longitude: 139.7005, capacity: 800, fixed_cost: 25000, variable_cost: 3.0 },
    { name: 'ローカルDC新宿', latitude: 35.6938, longitude: 139.7034, capacity: 600, fixed_cost: 20000, variable_cost: 3.2 },
    { name: 'ローカルDC品川', latitude: 35.6284, longitude: 139.7387, capacity: 700, fixed_cost: 22000, variable_cost: 2.8 },
    { name: 'ローカルDC池袋', latitude: 35.7295, longitude: 139.7109, capacity: 500, fixed_cost: 18000, variable_cost: 3.5 }
  ];

  const samplePlants: PlantData[] = [
    { name: '中央工場A', latitude: 35.6051, longitude: 139.6823, capacity: 2000, production_cost: 8.0 },
    { name: '中央工場B', latitude: 35.7295, longitude: 139.7109, capacity: 1800, production_cost: 9.0 },
    { name: '衛星工場C', latitude: 35.5494, longitude: 139.7798, capacity: 1000, production_cost: 10.5 }
  ];

  const sampleProducts: ProductData[] = [
    { prod_id: 'prod_a', name: '製品A', unit_cost: 1.0, weight: 2.0, volume: 0.5, value: 10.0 },
    { prod_id: 'prod_b', name: '製品B', unit_cost: 1.5, weight: 1.5, volume: 0.3, value: 15.0 },
    { prod_id: 'prod_c', name: '製品C', unit_cost: 2.0, weight: 1.0, volume: 0.2, value: 20.0 }
  ];

  // Combine all DCs for the request
  const allDCs = [...regionalDCs, ...localDCs];

  const handleAbstractLNDP = async () => {
    setLoading(true);
    setError(null);

    try {
      const echelonConfig: EchelonConfig = {
        levels: ['plant', 'regional_dc', 'local_dc', 'customer'],
        consolidation_rules: 'demand_based',
        inventory_policy: 'periodic_review'
      };

      const optimizationConfig: OptimizationConfig = {
        method: optimizationMethod,
        max_iterations: maxIterations,
        tolerance: tolerance,
        use_heuristics: useHeuristics,
        metaheuristic: 'tabu_search'
      };

      const request = {
        customers: sampleCustomers,
        dc_candidates: allDCs,
        plants: samplePlants,
        products: sampleProducts,
        echelon_config: echelonConfig,
        optimization_config: optimizationConfig
      };

      const response = await fetch('http://localhost:8000/api/v1/logistics/abstract-lndp', {
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
      setError(err instanceof Error ? err.message : 'Abstract LNDPに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logistics-section">
      <h2>🌐 Abstract LNDP (多階層ネットワーク)</h2>
      
      <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
        <strong>🌐 Abstract LNDP:</strong> 多階層サプライチェーンの統合最適化モデル
      </div>

      {/* Multi-Echelon Architecture */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>🏗️ 多階層ネットワーク構造</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Level 1: Plants */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '4px', minWidth: '150px' }}>
              <h5>🏭 Level 1: Plants ({samplePlants.length})</h5>
              {samplePlants.map((plant, idx) => (
                <div key={idx} style={{ fontSize: '11px', marginBottom: '2px' }}>
                  {plant.name}: {plant.capacity}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '20px' }}>⬇️</div>
          </div>

          {/* Level 2: Regional DCs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '4px', minWidth: '150px' }}>
              <h5>🏪 Level 2: Regional DCs ({regionalDCs.length})</h5>
              {regionalDCs.map((dc, idx) => (
                <div key={idx} style={{ fontSize: '11px', marginBottom: '2px' }}>
                  {dc.name}: {dc.capacity}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '20px' }}>⬇️</div>
          </div>

          {/* Level 3: Local DCs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff3cd', padding: '12px', borderRadius: '4px', minWidth: '150px' }}>
              <h5>🏬 Level 3: Local DCs ({localDCs.length})</h5>
              {localDCs.map((dc, idx) => (
                <div key={idx} style={{ fontSize: '11px', marginBottom: '2px' }}>
                  {dc.name}: {dc.capacity}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '20px' }}>⬇️</div>
          </div>

          {/* Level 4: Customers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#f3e5f5', padding: '12px', borderRadius: '4px', minWidth: '150px' }}>
              <h5>👥 Level 4: Customers ({sampleCustomers.length})</h5>
              {sampleCustomers.map((customer, idx) => (
                <div key={idx} style={{ fontSize: '11px', marginBottom: '2px' }}>
                  {customer.name}: {customer.demand}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <strong>📦 Products ({sampleProducts.length}種類):</strong> {sampleProducts.map(p => p.name).join(', ')}
        </div>
      </div>

      {/* Configuration Section */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>⚙️ 最適化設定</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              最適化手法:
              <select 
                value={optimizationMethod} 
                onChange={(e) => setOptimizationMethod(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="lagrange_relaxation">Lagrange緩和法</option>
                <option value="tabu_search">タブサーチ</option>
                <option value="greedy">グリーディヒューリスティック</option>
              </select>
            </label>
          </div>

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

        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={useHeuristics} 
              onChange={(e) => setUseHeuristics(e.target.checked)}
            />
            <strong>ヒューリスティック手法併用</strong>
          </label>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleAbstractLNDP}
          disabled={loading}
          style={{
            padding: '16px 32px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '多階層最適化実行中...' : '🌐 Abstract LNDP最適化実行'}
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
          <h4>📊 Abstract LNDP最適化結果</h4>
          
          <div className="logistics-metrics">
            <div className="logistics-metric" style={{ backgroundColor: '#1976d2', color: 'white' }}>
              <div className="logistics-metric-label">総費用</div>
              <div className="logistics-metric-value">¥{result.total_cost.toLocaleString()}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#9c27b0', color: 'white' }}>
              <div className="logistics-metric-label">選択施設数</div>
              <div className="logistics-metric-value">{result.selected_facilities.length}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#f57c00', color: 'white' }}>
              <div className="logistics-metric-label">階層レベル</div>
              <div className="logistics-metric-value">{result.network_performance?.echelon_levels || 4}層</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#4caf50', color: 'white' }}>
              <div className="logistics-metric-label">解法ステータス</div>
              <div className="logistics-metric-value">{result.solution_status}</div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{ marginTop: '20px' }}>
            <h5>💰 費用内訳 (多階層):</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              <div style={{ backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '4px' }}>
                <strong>輸送費:</strong> ¥{result.cost_breakdown.transportation.toLocaleString()}
              </div>
              <div style={{ backgroundColor: '#e8f5e8', padding: '8px', borderRadius: '4px' }}>
                <strong>固定費:</strong> ¥{result.cost_breakdown.fixed.toLocaleString()}
              </div>
              <div style={{ backgroundColor: '#f3e5f5', padding: '8px', borderRadius: '4px' }}>
                <strong>在庫費用:</strong> ¥{result.cost_breakdown.inventory.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Selected Facilities by Level */}
          <div style={{ marginTop: '20px' }}>
            <h5>🏗️ 階層別選択施設:</h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {result.selected_facilities.map((facility: any, index: number) => {
                const isRegional = facility.name.includes('地域');
                const isLocal = facility.name.includes('ローカル');
                const bgColor = isRegional ? '#e8f5e8' : isLocal ? '#fff3cd' : '#f0f0f0';
                const level = isRegional ? 'Level 2 (Regional)' : isLocal ? 'Level 3 (Local)' : 'Unknown';
                
                return (
                  <div key={index} style={{ backgroundColor: bgColor, padding: '8px', borderRadius: '4px' }}>
                    <strong>{facility.name}</strong> ({level}) - 容量: {facility.capacity}, 固定費: ¥{facility.fixed_cost.toLocaleString()}
                    {result.facility_utilization[facility.name] && (
                      <span style={{ marginLeft: '16px', fontSize: '12px', color: '#666' }}>
                        稼働率: {(result.facility_utilization[facility.name] * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Echelon Flow */}
          <div style={{ marginTop: '16px' }}>
            <h5>🔄 多階層フロー:</h5>
            <div style={{ fontSize: '14px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(result.flow_assignments).map(([customer, flows]) => (
                <div key={customer} style={{ marginBottom: '8px' }}>
                  <div><strong>👥 {customer}:</strong></div>
                  <div>
                    {Object.entries(flows as any).map(([facility, amount]) => (
                      <div key={facility} style={{ marginLeft: '16px', fontSize: '12px' }}>
                        {facility.includes('地域') ? '🏪' : facility.includes('ローカル') ? '🏬' : '🏢'} {facility} → {String(amount)} 単位
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Performance */}
          <div style={{ marginTop: '16px' }}>
            <h5>📈 多階層ネットワーク性能:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              <div style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>階層数</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {result.network_performance?.echelon_levels || 4}層
                </div>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>最適化手法</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {result.network_performance?.optimization_method || optimizationMethod}
                </div>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>総需要</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {result.network_performance?.total_demand || sampleCustomers.reduce((sum, c) => sum + c.demand, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Description */}
      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '4px', marginTop: '20px' }}>
        <h4>🔬 Abstract LNDP Algorithm Features:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px' }}>
            <strong>🏗️ Multi-Echelon Structure:</strong>
            <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '16px' }}>
              <li>Plant → Regional DC → Local DC → Customer</li>
              <li>階層間フロー制約・均衡条件</li>
              <li>各階層での容量・需要制約</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px' }}>
            <strong>⚙️ Configurable Optimization:</strong>
            <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '16px' }}>
              <li>Lagrange緩和法による数理最適化</li>
              <li>タブサーチによるメタヒューリスティック</li>
              <li>グリーディヒューリスティックによる高速解法</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px' }}>
            <strong>📦 Advanced Features:</strong>
            <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '16px' }}>
              <li>複数製品・複数流通経路対応</li>
              <li>在庫方針設定（定期発注・継続発注）</li>
              <li>統合・分散ルール設定</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbstractLNDP;