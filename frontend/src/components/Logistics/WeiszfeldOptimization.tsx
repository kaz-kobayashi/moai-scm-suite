import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { logisticsApi, CustomerData, WeiszfeldResult, DCData } from '../../services/logistics';

const WeiszfeldOptimization: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [numFacilities, setNumFacilities] = useState<number>(3);
  const [maxIterations, setMaxIterations] = useState<number>(1000);
  const [tolerance, setTolerance] = useState<number>(1e-6);
  const [useGreatCircle, setUseGreatCircle] = useState<boolean>(true);
  const [result, setResult] = useState<WeiszfeldResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'map' | 'scatter'>('scatter');
  const [dcCandidates, setDcCandidates] = useState<DCData[]>([]);

  // サンプル顧客データを追加（50顧客）
  const addSampleCustomers = () => {
    const sampleCustomers: CustomerData[] = [];
    
    // 東京都内の主要エリアの基準点
    const basePoints = [
      { name: '新宿', lat: 35.6938, lon: 139.7034 },
      { name: '渋谷', lat: 35.6594, lon: 139.7005 },
      { name: '池袋', lat: 35.7295, lon: 139.7109 },
      { name: '上野', lat: 35.7078, lon: 139.7750 },
      { name: '品川', lat: 35.6284, lon: 139.7387 },
      { name: '東京', lat: 35.6762, lon: 139.6503 },
      { name: '秋葉原', lat: 35.6984, lon: 139.7731 },
      { name: '六本木', lat: 35.6627, lon: 139.7320 },
      { name: '恵比寿', lat: 35.6465, lon: 139.7100 },
      { name: '中野', lat: 35.7065, lon: 139.6657 }
    ];
    
    // 各基準点周辺に5顧客ずつ配置
    for (let i = 0; i < 50; i++) {
      const baseIndex = Math.floor(i / 5);
      const basePoint = basePoints[baseIndex % basePoints.length];
      
      // 基準点から半径約2km以内にランダム配置
      const latOffset = (Math.random() - 0.5) * 0.036; // 約2km相当
      const lonOffset = (Math.random() - 0.5) * 0.036;
      
      sampleCustomers.push({
        name: `${basePoint.name}エリア顧客${(i % 5) + 1}`,
        latitude: basePoint.lat + latOffset,
        longitude: basePoint.lon + lonOffset,
        demand: Math.round(Math.random() * 100 + 20) // 20-120の需要
      });
    }
    
    setCustomers(sampleCustomers);
    
    // サンプルDC候補も追加
    const sampleDCCandidates: DCData[] = [
      { name: 'DC候補1', latitude: 35.6762, longitude: 139.6503, capacity: 1000, fixed_cost: 50000, variable_cost: 2 },
      { name: 'DC候補2', latitude: 35.6938, longitude: 139.7034, capacity: 800, fixed_cost: 40000, variable_cost: 2.5 },
      { name: 'DC候補3', latitude: 35.7295, longitude: 139.7109, capacity: 1200, fixed_cost: 60000, variable_cost: 1.8 },
      { name: 'DC候補4', latitude: 35.6594, longitude: 139.7005, capacity: 900, fixed_cost: 45000, variable_cost: 2.2 },
      { name: 'DC候補5', latitude: 35.6284, longitude: 139.7387, capacity: 1100, fixed_cost: 55000, variable_cost: 2.0 }
    ];
    
    setDcCandidates(sampleDCCandidates);
  };

  const removeCustomer = (index: number) => {
    setCustomers(customers.filter((_, i) => i !== index));
  };

  const handleOptimize = async () => {
    if (customers.length === 0) {
      setError('顧客データを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = {
        customers,
        num_facilities: numFacilities,
        max_iterations: maxIterations,
        tolerance,
        use_great_circle: useGreatCircle
      };

      const optimizationResult = await logisticsApi.optimizeFacilityLocations(request);
      setResult(optimizationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = (index: number, field: keyof CustomerData, value: any) => {
    const updatedCustomers = customers.map((customer, i) => 
      i === index ? { ...customer, [field]: value } : customer
    );
    setCustomers(updatedCustomers);
  };

  // 地図可視化データを生成（scattergeo使用）
  const generateMapVisualization = () => {
    if (!result || customers.length === 0) return null;

    const traces: any[] = [];

    // 施設ごとに異なる色を設定
    const facilityColors = [
      '#dc2626', // Red
      '#16a34a', // Green  
      '#2563eb', // Blue
      '#ca8a04', // Yellow
      '#9333ea', // Purple
      '#ea580c', // Orange
      '#0891b2', // Cyan
      '#be123c'  // Rose
    ];

    const customerColors = [
      '#fca5a5', // Light Red
      '#86efac', // Light Green
      '#93c5fd', // Light Blue  
      '#fde047', // Light Yellow
      '#c4b5fd', // Light Purple
      '#fed7aa', // Light Orange
      '#67e8f9', // Light Cyan
      '#fda4af'  // Light Rose
    ];

    // 顧客の施設への割り当てを取得（APIの結果を使用）
    const customerAssignments: number[] = customers.map(customer => {
      const assignedFacilityIndex = result.customer_assignments[customer.name];
      return assignedFacilityIndex !== undefined ? assignedFacilityIndex : 0;
    });

    console.log('=== Weiszfeld API Assignment Info ===');
    console.log('API customer_assignments:', result.customer_assignments);
    console.log('Customer assignment array:', customerAssignments);
    console.log('Facility locations:', result.facility_locations);
    console.log('Customers:', customers.map(c => c.name));
    console.log('=====================================');

    // 施設ごとに顧客をグループ化して色分け表示
    result.facility_locations.forEach((facility, facilityIndex) => {
      const assignedCustomers = customers.filter((_, index) => 
        customerAssignments[index] === facilityIndex
      );

      if (assignedCustomers.length > 0) {
        // この施設に割り当てられた顧客を表示
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: assignedCustomers.map(c => c.latitude),
          lon: assignedCustomers.map(c => c.longitude),
          marker: {
            size: assignedCustomers.map(c => Math.max(8, Math.min(20, c.demand / 4))),
            color: customerColors[facilityIndex % customerColors.length],
            opacity: 0.8,
            line: { 
              color: facilityColors[facilityIndex % facilityColors.length], 
              width: 2 
            }
          },
          text: assignedCustomers.map(c => 
            `${c.name}<br>需要: ${c.demand}単位<br>割り当て: 施設${facilityIndex + 1}`
          ),
          hoverinfo: 'text',
          name: `施設${facilityIndex + 1}の顧客`,
          showlegend: true
        });

        // 顧客と施設の接続線を追加
        assignedCustomers.forEach(customer => {
          traces.push({
            type: 'scattergeo',
            mode: 'lines',
            lat: [customer.latitude, facility.latitude],
            lon: [customer.longitude, facility.longitude],
            line: {
              color: facilityColors[facilityIndex % facilityColors.length],
              width: 2,
              opacity: 0.6
            },
            hoverinfo: 'skip',
            name: `施設${facilityIndex + 1}フロー`,
            showlegend: false
          });
        });
      }
    });

    // DC候補を地図上にオレンジの四角でプロット
    if (dcCandidates.length > 0) {
      traces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: dcCandidates.map(dc => dc.latitude),
        lon: dcCandidates.map(dc => dc.longitude),
        marker: {
          size: 12,
          color: '#9ca3af',
          symbol: 'square',
          opacity: 0.5,
          line: { color: 'white', width: 1 }
        },
        text: dcCandidates.map(dc => 
          `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ${dc.fixed_cost.toLocaleString()}円`
        ),
        hoverinfo: 'text',
        name: 'DC候補',
        showlegend: true
      });
    }

    // 最適施設位置を地図上にプロット
    if (result.facility_locations && result.facility_locations.length > 0) {
      result.facility_locations.forEach((facility, index) => {
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: [facility.latitude],
          lon: [facility.longitude],
          marker: {
            size: 25,
            color: facilityColors[index % facilityColors.length],
            symbol: 'star',
            line: { color: 'white', width: 3 }
          },
          text: `最適施設 ${index + 1}<br>緯度: ${facility.latitude.toFixed(4)}<br>経度: ${facility.longitude.toFixed(4)}`,
          hoverinfo: 'text',
          name: `最適施設${index + 1}`,
          showlegend: true
        });
      });
    }

    return {
      data: traces,
      layout: {
        title: {
          text: 'Weiszfeld法による施設立地最適化結果（地図表示）',
          font: { 
            family: "'Helvetica Neue', Arial, sans-serif", 
            size: 16, 
            color: '#1f2937' 
          },
          x: 0.5,
          xanchor: 'center' as const
        },
        geo: {
          showframe: false,
          showcoastlines: true,
          projection: { type: 'natural earth' },
          center: { lat: 35.7, lon: 139.7 },
          lonaxis: { range: [139.3, 140.1] },
          lataxis: { range: [35.5, 35.9] }
        },
        showlegend: true,
        legend: {
          x: 0,
          y: 1,
          bgcolor: 'rgba(255,255,255,0.9)',
          bordercolor: '#e5e7eb',
          borderwidth: 1
        },
        margin: { l: 20, r: 20, t: 50, b: 20 },
        paper_bgcolor: 'white',
        height: 600
      }
    };
  };

  // 従来の散布図可視化（フォールバック用）
  const generateScatterVisualization = () => {
    if (!result || customers.length === 0) return null;

    const traces: any[] = [];

    // 施設ごとに異なる色を設定
    const facilityColors = [
      '#dc2626', // Red
      '#16a34a', // Green  
      '#2563eb', // Blue
      '#ca8a04', // Yellow
      '#9333ea', // Purple
      '#ea580c', // Orange
      '#0891b2', // Cyan
      '#be123c'  // Rose
    ];

    const customerColors = [
      '#fca5a5', // Light Red
      '#86efac', // Light Green
      '#93c5fd', // Light Blue  
      '#fde047', // Light Yellow
      '#c4b5fd', // Light Purple
      '#fed7aa', // Light Orange
      '#67e8f9', // Light Cyan
      '#fda4af'  // Light Rose
    ];

    // 顧客の施設への割り当てを取得（APIの結果を使用）
    const customerAssignments: number[] = customers.map(customer => {
      const assignedFacilityIndex = result.customer_assignments[customer.name];
      return assignedFacilityIndex !== undefined ? assignedFacilityIndex : 0;
    });

    console.log('=== Weiszfeld API Assignment Info ===');
    console.log('API customer_assignments:', result.customer_assignments);
    console.log('Customer assignment array:', customerAssignments);
    console.log('Facility locations:', result.facility_locations);
    console.log('Customers:', customers.map(c => c.name));
    console.log('=====================================');

    // 施設ごとに顧客をグループ化して色分け表示
    result.facility_locations.forEach((facility, facilityIndex) => {
      const assignedCustomers = customers.filter((_, index) => 
        customerAssignments[index] === facilityIndex
      );

      if (assignedCustomers.length > 0) {
        // この施設に割り当てられた顧客を表示
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: assignedCustomers.map(c => c.longitude),
          y: assignedCustomers.map(c => c.latitude),
          marker: {
            size: assignedCustomers.map(c => Math.max(8, Math.min(20, c.demand / 3))),
            color: customerColors[facilityIndex % customerColors.length],
            symbol: 'circle',
            line: { 
              color: facilityColors[facilityIndex % facilityColors.length], 
              width: 2 
            }
          },
          text: assignedCustomers.map(c => 
            `${c.name}<br>需要: ${c.demand}<br>割り当て: 施設${facilityIndex + 1}`
          ),
          hoverinfo: 'text',
          name: `施設${facilityIndex + 1}の顧客`,
          showlegend: true
        });
      }
    });

    // DC候補をオレンジの四角でプロット
    if (dcCandidates.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: dcCandidates.map(dc => dc.longitude),
        y: dcCandidates.map(dc => dc.latitude),
        marker: {
          size: 15,
          color: '#ea580c',
          symbol: 'square',
          line: { color: 'white', width: 2 }
        },
        text: dcCandidates.map(dc => 
          `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ${dc.fixed_cost.toLocaleString()}円`
        ),
        hoverinfo: 'text',
        name: 'DC候補',
        showlegend: true
      });
    }

    // 最適施設位置をプロット（色分け）
    if (result.facility_locations && result.facility_locations.length > 0) {
      result.facility_locations.forEach((facility, index) => {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: [facility.longitude],
          y: [facility.latitude],
          marker: {
            size: 25,
            color: facilityColors[index % facilityColors.length],
            symbol: 'star',
            line: { color: 'white', width: 3 }
          },
          text: `最適施設 ${index + 1}<br>位置: ${facility.latitude.toFixed(4)}, ${facility.longitude.toFixed(4)}`,
          hoverinfo: 'text',
          name: `最適施設${index + 1}`,
          showlegend: true
        });
      });

      // 接続線を追加（色分け）
      result.facility_locations.forEach((facility, facilityIndex) => {
        const assignedCustomers = customers.filter((_, index) => 
          customerAssignments[index] === facilityIndex
        );

        assignedCustomers.forEach(customer => {
          traces.push({
            type: 'scatter',
            mode: 'lines',
            x: [customer.longitude, facility.longitude],
            y: [customer.latitude, facility.latitude],
            line: {
              color: facilityColors[facilityIndex % facilityColors.length],
              width: 2,
              opacity: 0.6
            },
            hoverinfo: 'skip',
            name: `施設${facilityIndex + 1}フロー`,
            showlegend: false
          });
        });
      });
    }

    return {
      data: traces,
      layout: {
        title: {
          text: `Weiszfeld法による施設立地最適化結果`,
          font: { 
            family: "'Helvetica Neue', Arial, sans-serif", 
            size: 16, 
            color: '#2c3e50' 
          },
          x: 0.5,
          xanchor: 'center' as const
        },
        xaxis: { 
          title: { text: '経度' },
          showgrid: true,
          gridcolor: 'rgba(128,128,128,0.2)'
        },
        yaxis: { 
          title: { text: '緯度' },
          showgrid: true,
          gridcolor: 'rgba(128,128,128,0.2)'
        },
        showlegend: true,
        legend: {
          x: 1.02,
          y: 1,
          bgcolor: 'rgba(255,255,255,0.9)',
          bordercolor: '#d1d7dc',
          borderwidth: 1
        },
        margin: { l: 60, r: 120, t: 60, b: 60 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        hovermode: 'closest' as const
      }
    };
  };

  // 表示モードに応じた可視化データを取得
  const plotData = mapMode === 'map' ? generateMapVisualization() : generateScatterVisualization();

  return (
    <div className="section">
      <div className="page-header">
        <h1 className="page-title">Weiszfeld法による施設立地最適化</h1>
        <p className="page-subtitle">反復改良法による最適施設位置の決定</p>
      </div>

      <div className="toolbar mb-6">
        <div className="toolbar-left">
          <button 
            onClick={addSampleCustomers}
            className="btn btn-md btn-secondary"
          >
            サンプルデータ
          </button>
          <button
            onClick={handleOptimize}
            disabled={loading || customers.length === 0}
            className="btn btn-md btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                最適化中...
              </>
            ) : (
              '最適化実行'
            )}
          </button>
        </div>
        
        {result && (
          <div className="toolbar-right">
            <div className="btn-group">
              <button
                onClick={() => setMapMode('map')}
                className={`btn btn-sm ${mapMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🗺️ 地図表示
              </button>
              <button
                onClick={() => setMapMode('scatter')}
                className={`btn btn-sm ${mapMode === 'scatter' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📊 散布図
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <div>
            <div className="alert-title">エラーが発生しました</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* パラメータ設定 */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">パラメータ設定</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">施設数</label>
              <input
                className="form-input"
                type="number"
                value={numFacilities}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumFacilities(parseInt(e.target.value) || 0)}
                min="1"
                max="10"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">最大反復回数</label>
              <input
                className="form-input"
                type="number"
                value={maxIterations}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxIterations(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">収束許容値</label>
              <input
                className="form-input"
                type="number"
                value={tolerance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTolerance(parseFloat(e.target.value) || 1e-6)}
                step="1e-7"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <input
                  className="form-checkbox"
                  type="checkbox"
                  checked={useGreatCircle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseGreatCircle(e.target.checked)}
                />
                大円距離を使用
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      {result && (
        <div className="kpi-grid mb-8">
          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">総輸送費用</p>
              <div className="kpi-trend positive">
                <span>最適化済</span>
              </div>
            </div>
            <p className="kpi-value">{result.total_cost.toFixed(2)} <span className="kpi-unit">コスト</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">施設数</p>
              <div className="kpi-trend neutral">
                <span>設定済</span>
              </div>
            </div>
            <p className="kpi-value">{result.facility_locations.length} <span className="kpi-unit">施設</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">反復回数</p>
              <div className="kpi-trend positive">
                <span>収束完了</span>
              </div>
            </div>
            <p className="kpi-value">{result.iterations} <span className="kpi-unit">回</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">顧客数</p>
              <div className="kpi-trend positive">
                <span>分析完了</span>
              </div>
            </div>
            <p className="kpi-value">{customers.length} <span className="kpi-unit">顧客</span></p>
          </div>
        </div>
      )}

      {/* 最適化結果マップ */}
      {result && plotData && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">最適化結果マップ</h2>
          </div>
          <div className="card-content">
            <div className="border rounded-lg">
              <Plot
                data={plotData.data}
                layout={{
                  ...plotData.layout,
                  height: 500,
                  font: {
                    family: "'Helvetica Neue', Arial, sans-serif",
                    size: 12,
                    color: '#2c3e50'
                  }
                }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
                  displaylogo: false
                }}
                style={{ width: '100%', height: '500px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 顧客データテーブル */}
      {customers.length > 0 && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">顧客データ ({customers.length}件)</h3>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>顧客名</th>
                    <th>緯度</th>
                    <th>経度</th>
                    <th>需要</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 20).map((customer, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          className="form-input"
                          value={customer.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            updateCustomer(index, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          step="0.0001"
                          value={customer.latitude}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            updateCustomer(index, 'latitude', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          step="0.0001"
                          value={customer.longitude}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            updateCustomer(index, 'longitude', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          value={customer.demand}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            updateCustomer(index, 'demand', parseInt(e.target.value))}
                        />
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-error"
                          onClick={() => removeCustomer(index)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length > 20 && (
                    <tr>
                      <td colSpan={5} className="text-center text-secondary">
                        ... 他{customers.length - 20}件
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 最適施設位置の詳細 */}
      {result && result.facility_locations && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">最適施設位置</h3>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>施設番号</th>
                    <th>緯度</th>
                    <th>経度</th>
                  </tr>
                </thead>
                <tbody>
                  {result.facility_locations.map((facility, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge badge-primary">施設 {index + 1}</span>
                      </td>
                      <td>{facility.latitude.toFixed(6)}</td>
                      <td>{facility.longitude.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 操作ガイド */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Weiszfeld法について</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="alert alert-info">
              <div>複数の需要地点に対する最適な施設位置を決定するアルゴリズム</div>
            </div>
            <div className="alert alert-info">
              <div>総輸送費用を最小化する施設位置を反復的に計算</div>
            </div>
          </div>
          
          <div className="alert alert-success">
            <div>
              <div className="alert-title">{mapMode === 'map' ? '地図の見方' : 'グラフの見方'}</div>
              <div>
                {mapMode === 'map' 
                  ? '地図上では、各最適施設と割り当てられた顧客が同じ色系統で表示されます。明るい色の円は顧客拠点（サイズは需要量に比例）、濃い色の星は最適施設位置、同色の線は配送ルートを示します。グレーの四角はDC候補地点です。'
                  : '散布図では、各最適施設と割り当てられた顧客が同じ色系統で表示されます。明るい色の円は顧客、濃い色の星は最適施設、同色の線は配送ルートを示し、色によって施設-顧客の対応がわかります。'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeiszfeldOptimization;