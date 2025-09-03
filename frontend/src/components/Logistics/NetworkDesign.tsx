import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { logisticsApi, CustomerData, DCData, PlantData, LNDResult } from '../../services/logistics';

const NetworkDesign: React.FC = () => {
  const [result, setResult] = useState<LNDResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'map' | 'scatter'>('scatter');
  const [customers] = useState<CustomerData[]>([
    { name: '顧客A', latitude: 35.6782, longitude: 139.6523, demand: 50 },
    { name: '顧客B', latitude: 35.6894, longitude: 139.6917, demand: 30 },
    { name: '顧客C', latitude: 35.6586, longitude: 139.7454, demand: 80 }
  ]);
  const [dcCandidates] = useState<DCData[]>([
    { name: 'DC東京', latitude: 35.6762, longitude: 139.6503, capacity: 200, fixed_cost: 10000, variable_cost: 2.5 },
    { name: 'DC渋谷', latitude: 35.6894, longitude: 139.6917, capacity: 150, fixed_cost: 8000, variable_cost: 3.0 },
    { name: 'DC新宿', latitude: 35.6586, longitude: 139.7454, capacity: 300, fixed_cost: 15000, variable_cost: 2.0 }
  ]);
  const [plants] = useState<PlantData[]>([
    { name: '工場A', latitude: 35.6051, longitude: 139.6823, capacity: 500, production_cost: 10.0 }
  ]);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        customers,
        dc_candidates: dcCandidates,
        plants,
        model_type: 'multi_source',
        optimization_objective: 'cost',
        capacity_constraints: true,
        max_facilities: 5
      };

      const optimizationResult = await logisticsApi.solveLogisticsNetworkDesign(request);
      console.log('=== LND Frontend Received ===');
      console.log('Full API result:', optimizationResult);
      console.log('Flow assignments:', optimizationResult.flow_assignments);
      console.log('Selected facilities:', optimizationResult.selected_facilities);
      console.log('=====================================');
      setResult(optimizationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const renderVisualization = () => {
    if (!result) return null;

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    
    // 顧客の割り当てDCを特定
    const getCustomerAssignedDC = (customerName: string): number => {
      if (!result.flow_assignments) return 0;
      
      for (let facilityIdx = 0; facilityIdx < result.selected_facilities.length; facilityIdx++) {
        const facilityName = result.selected_facilities[facilityIdx].name;
        const customerFlows = result.flow_assignments[facilityName];
        if (customerFlows && customerFlows[customerName] > 0) {
          return facilityIdx;
        }
      }
      return 0;
    };

    // 顧客データ（DCと同じ色で表示）
    const customerTrace = {
      type: mapMode === 'map' ? 'scattergeo' : 'scatter',
      mode: 'markers',
      ...(mapMode === 'map' ? {
        lat: customers.map(c => c.latitude),
        lon: customers.map(c => c.longitude),
        geo: 'geo'
      } : {
        x: customers.map(c => c.longitude),
        y: customers.map(c => c.latitude)
      }),
      marker: {
        size: customers.map(c => Math.max(12, Math.min(25, c.demand / 3))),
        color: customers.map(c => {
          const assignedDCIndex = getCustomerAssignedDC(c.name);
          return colors[assignedDCIndex % colors.length];
        }),
        line: { color: 'white', width: 3 }
      },
      text: customers.map(c => {
        const assignedDCIndex = getCustomerAssignedDC(c.name);
        const assignedDC = result.selected_facilities[assignedDCIndex];
        return `${c.name}<br>需要: ${c.demand}<br>割当DC: ${assignedDC?.name || '未割当'}`;
      }),
      hovertemplate: '%{text}<extra></extra>',
      name: '顧客',
      showlegend: true
    };

    // 選択されたDC（色分け）
    const selectedDCTrace = {
      type: mapMode === 'map' ? 'scattergeo' : 'scatter',
      mode: 'markers',
      ...(mapMode === 'map' ? {
        lat: result.selected_facilities.map(f => f.latitude),
        lon: result.selected_facilities.map(f => f.longitude),
        geo: 'geo'
      } : {
        x: result.selected_facilities.map(f => f.longitude),
        y: result.selected_facilities.map(f => f.latitude)
      }),
      marker: {
        size: 15,
        color: result.selected_facilities.map((_, idx) => colors[idx % colors.length]),
        symbol: 'square',
        line: { color: 'white', width: 3 }
      },
      text: result.selected_facilities.map(f => 
        `${f.name}<br>容量: ${f.capacity}<br>稼働率: ${((result.facility_utilization[f.name] || 0) * 100).toFixed(1)}%`
      ),
      hovertemplate: '%{text}<extra></extra>',
      name: '選択されたDC',
      showlegend: true
    };

    // 工場（緑の三角）
    const plantTrace = {
      type: mapMode === 'map' ? 'scattergeo' : 'scatter',
      mode: 'markers',
      ...(mapMode === 'map' ? {
        lat: plants.map(p => p.latitude),
        lon: plants.map(p => p.longitude),
        geo: 'geo'
      } : {
        x: plants.map(p => p.longitude),
        y: plants.map(p => p.latitude)
      }),
      marker: {
        size: 18,
        color: '#4caf50',
        symbol: 'triangle-up',
        line: { color: 'white', width: 3 }
      },
      text: plants.map(p => `${p.name}<br>容量: ${p.capacity}`),
      hovertemplate: '%{text}<extra></extra>',
      name: '工場',
      showlegend: true
    };

    // フロー線（植物-DC、DC-顧客間）
    const flowTraces: any[] = [];
    
    // Plant → DC フロー（緑の線）
    result.selected_facilities.forEach((facility, facilityIdx) => {
      plants.forEach(plant => {
        const plantToDCTrace = {
          type: mapMode === 'map' ? 'scattergeo' : 'scatter',
          mode: 'lines',
          ...(mapMode === 'map' ? {
            lat: [plant.latitude, facility.latitude],
            lon: [plant.longitude, facility.longitude],
            geo: 'geo'
          } : {
            x: [plant.longitude, facility.longitude],
            y: [plant.latitude, facility.latitude]
          }),
          line: {
            color: '#4caf50',
            width: 3,
            dash: 'dash'
          },
          hovertemplate: `${plant.name} → ${facility.name}<br>工場-DC間フロー<extra></extra>`,
          name: '工場-DCフロー',
          showlegend: facilityIdx === 0
        };
        flowTraces.push(plantToDCTrace);
      });
    });

    // DC → Customer フロー（色分け）
    if (result.flow_assignments) {
      Object.keys(result.flow_assignments).forEach((facilityName, facilityIdx) => {
        const facility = result.selected_facilities.find(dc => dc.name === facilityName);
        if (facility) {
          const customerFlows = result.flow_assignments[facilityName];
          const facilityColor = colors[facilityIdx % colors.length];
          
          Object.keys(customerFlows).forEach(customerName => {
            const customer = customers.find(c => c.name === customerName);
            const flow = customerFlows[customerName];
            
            if (customer && flow > 0) {
              const flowTrace = {
                type: mapMode === 'map' ? 'scattergeo' : 'scatter',
                mode: 'lines',
                ...(mapMode === 'map' ? {
                  lat: [facility.latitude, customer.latitude],
                  lon: [facility.longitude, customer.longitude],
                  geo: 'geo'
                } : {
                  x: [facility.longitude, customer.longitude],
                  y: [facility.latitude, customer.latitude]
                }),
                line: {
                  color: facilityColor,
                  width: Math.max(2, Math.min(6, flow / 10))
                },
                hovertemplate: `${facilityName} → ${customerName}<br>フロー: ${flow.toFixed(1)}<extra></extra>`,
                name: `${facilityName}への割り当て`,
                showlegend: false
              };
              flowTraces.push(flowTrace);
            }
          });
        }
      });
    }

    const data = [customerTrace, selectedDCTrace, plantTrace, ...flowTraces];

    const layout: any = {
      title: '物流ネットワーク設計結果',
      showlegend: true,
      legend: {
        x: 1,
        y: 1,
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: 'rgba(0, 0, 0, 0.2)',
        borderwidth: 1
      }
    };

    if (mapMode === 'map') {
      layout.geo = {
        showland: true,
        landcolor: 'rgb(243, 243, 243)',
        coastlinecolor: 'rgb(204, 204, 204)',
        projection: { type: 'mercator' },
        center: { lat: 35.6762, lon: 139.6503 },
        lonaxis: { range: [139.2, 140.0] },
        lataxis: { range: [35.4, 35.9] },
        showlakes: true,
        lakecolor: 'rgb(255, 255, 255)',
        resolution: 50
      };
    } else {
      layout.xaxis = { title: '経度' };
      layout.yaxis = { title: '緯度' };
    }

    return (
      <div style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>表示モード:</span>
          <button
            onClick={() => setMapMode('scatter')}
            style={{
              padding: '8px 16px',
              backgroundColor: mapMode === 'scatter' ? '#2196f3' : '#f0f0f0',
              color: mapMode === 'scatter' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            散布図
          </button>
          <button
            onClick={() => setMapMode('map')}
            style={{
              padding: '8px 16px',
              backgroundColor: mapMode === 'map' ? '#2196f3' : '#f0f0f0',
              color: mapMode === 'map' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            地図
          </button>
        </div>
        
        <Plot
          data={data}
          layout={layout}
          style={{ width: '100%', height: '600px' }}
          config={{ responsive: true }}
        />
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#fff3e0', 
          borderRadius: '4px',
          border: '1px solid #ff9800'
        }}>
          <strong>🗺️ 地図の見方:</strong><br />
          • 色付き丸: 顧客（色は割当DCと対応、サイズは需要量に比例）<br />
          • 色付き四角: 選択されたDC（色で区分）<br />
          • 緑の三角: 工場<br />
          • 緑の破線: 工場→DC間フロー<br />
          • 色付き実線: DC→顧客間フロー（太さはフロー量に比例、色はDCと対応）
        </div>
      </div>
    );
  };

  return (
    <div className="logistics-section">
      <h2>🌐 物流ネットワーク設計 (LND)</h2>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '16px', 
        borderRadius: '4px', 
        marginBottom: '24px',
        border: '1px solid #2196f3'
      }}>
        <strong>ℹ️ 物流ネットワーク設計について</strong><br />
        顧客需要を満たしながら総費用を最小化する最適な配送センター配置と物流フローを決定します。
        工場からDC、DCから顧客への多段階ネットワークを最適化できます。
      </div>

      <div className="logistics-form">
        <button
          className="logistics-button"
          onClick={handleOptimize}
          disabled={loading}
        >
          {loading ? 'ネットワーク設計中...' : 'ネットワーク設計実行（サンプルデータ）'}
        </button>
      </div>

      {error && <div className="logistics-error">{error}</div>}

      {result && (
        <div className="logistics-results">
          <div className="logistics-result-header">📊 ネットワーク設計結果</div>
          
          <div className="logistics-metrics">
            <div className="logistics-metric" style={{ backgroundColor: '#1976d2', color: 'white', border: '1px solid #1565c0' }}>
              <div className="logistics-metric-label" style={{ color: 'white', opacity: 0.9 }}>総費用</div>
              <div className="logistics-metric-value" style={{ color: 'white' }}>¥{result.total_cost.toLocaleString()}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#388e3c', color: 'white', border: '1px solid #2e7d32' }}>
              <div className="logistics-metric-label" style={{ color: 'white', opacity: 0.9 }}>選択施設数</div>
              <div className="logistics-metric-value" style={{ color: 'white' }}>{result.selected_facilities.length}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#0288d1', color: 'white', border: '1px solid #0277bd' }}>
              <div className="logistics-metric-label" style={{ color: 'white', opacity: 0.9 }}>求解状態</div>
              <div className="logistics-metric-value" style={{ color: 'white' }}>{result.solution_status}</div>
            </div>
            <div className="logistics-metric" style={{ backgroundColor: '#7b1fa2', color: 'white', border: '1px solid #6a1b9a' }}>
              <div className="logistics-metric-label" style={{ color: 'white', opacity: 0.9 }}>計算時間</div>
              <div className="logistics-metric-value" style={{ color: 'white' }}>{result.solve_time.toFixed(2)}s</div>
            </div>
          </div>

          <h4>費用内訳</h4>
          <table className="logistics-data-table">
            <thead>
              <tr>
                <th>費用項目</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.cost_breakdown).map(([key, value]) => (
                <tr key={key}>
                  <td>
                    {key === 'transportation' ? '輸送費' :
                     key === 'fixed' ? '固定費' :
                     key === 'variable' ? '変動費' : '在庫費'}
                  </td>
                  <td>¥{value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>選択されたDC</h4>
          <table className="logistics-data-table">
            <thead>
              <tr>
                <th>施設名</th>
                <th>容量</th>
                <th>固定費</th>
                <th>稼働率</th>
              </tr>
            </thead>
            <tbody>
              {result.selected_facilities.map((facility, index) => (
                <tr key={index}>
                  <td>{facility.name}</td>
                  <td>{facility.capacity}</td>
                  <td>¥{facility.fixed_cost.toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: result.facility_utilization[facility.name] > 0.8 ? '#d32f2f' : 
                                     result.facility_utilization[facility.name] > 0.6 ? '#f57c00' : '#388e3c',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {((result.facility_utilization[facility.name] || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>ネットワーク性能</h4>
          <table className="logistics-data-table">
            <thead>
              <tr>
                <th>指標</th>
                <th>値</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.network_performance).map(([key, value]) => (
                <tr key={key}>
                  <td>
                    {key === 'average_distance' ? '平均配送距離' :
                     key === 'facility_count' ? '施設数' :
                     key === 'total_demand' ? '総需要' : key}
                  </td>
                  <td>
                    {typeof value === 'number' ? value.toFixed(2) : value}
                    {key === 'average_distance' && 'km'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {renderVisualization()}
        </div>
      )}
    </div>
  );
};

export default NetworkDesign;