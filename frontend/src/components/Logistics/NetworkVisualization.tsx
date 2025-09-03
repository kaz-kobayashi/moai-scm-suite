import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { LNDResult, CustomerData, DCData, PlantData, NetworkVisualizationResult } from '../../services/logistics';
import { logisticsApi } from '../../services/logistics';

const NetworkVisualization: React.FC = () => {
  const [lndResult, setLndResult] = useState<LNDResult | null>(null);
  const [visualizationResult, setVisualizationResult] = useState<NetworkVisualizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [plotError, setPlotError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'map' | 'scatter'>('map');

  // 顧客データをuseMemoで最適化
  const customers = useMemo(() => [
    { name: '東京エリア顧客', latitude: 35.6762, longitude: 139.6503, demand: 150 },
    { name: '神奈川エリア顧客', latitude: 35.4437, longitude: 139.6380, demand: 120 },
    { name: '埼玉エリア顧客', latitude: 35.8617, longitude: 139.6455, demand: 100 },
    { name: '千葉エリア顧客', latitude: 35.6074, longitude: 140.1065, demand: 80 },
    { name: '茨城エリア顧客', latitude: 36.3418, longitude: 140.4468, demand: 60 }
  ], []);

  // DC候補データをuseMemoで最適化
  const dcCandidates = useMemo(() => [
    { name: '東京物流センター', latitude: 35.6762, longitude: 139.6503, capacity: 300, fixed_cost: 15000, variable_cost: 2.5 },
    { name: '横浜物流センター', latitude: 35.4437, longitude: 139.6380, capacity: 250, fixed_cost: 12000, variable_cost: 3.0 },
    { name: '大宮物流センター', latitude: 35.9067, longitude: 139.6244, capacity: 200, fixed_cost: 10000, variable_cost: 2.8 },
    { name: '千葉物流センター', latitude: 35.6074, longitude: 140.1065, capacity: 180, fixed_cost: 9000, variable_cost: 3.2 },
    { name: 'つくば物流センター', latitude: 36.0835, longitude: 140.1133, capacity: 150, fixed_cost: 8000, variable_cost: 3.5 }
  ], []);

  const handleLNDOptimization = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPlotError(null);

    try {
      // サンプルデータでLND最適化を実行
      const customersData: CustomerData[] = customers;

      const plants: PlantData[] = [
        { name: '本社工場', latitude: 35.6051, longitude: 139.6823, capacity: 1000, production_cost: 10.0 }
      ];

      const request = {
        customers: customersData,
        dc_candidates: dcCandidates,
        plants,
        model_type: 'multi_source',
        optimization_objective: 'cost',
        capacity_constraints: true,
        max_facilities: 3
      };

      console.log('LND Request:', request);
      const result = await logisticsApi.solveLogisticsNetworkDesign(request);
      console.log('LND Result:', result);
      setLndResult(result);

      // ネットワーク可視化データを取得
      console.log('LND result received:', result);
      
      // 直接フォールバック可視化を使用（バックエンドAPIの問題を回避）
      console.log('Creating visualization with fallback method');
      // 可視化は後でuseEffectで処理するため、ここではLND結果のみ設定
      
      // バックエンドAPIは後で修正予定（コメントアウト）
      /*
      try {
        const visualizationRequest = {
          lnd_result: result,
          show_flows: true,
          flow_threshold: 0,
          map_style: 'open-street-map'
        };

        console.log('Calling visualization API with:', visualizationRequest);
        const vizResult = await logisticsApi.createNetworkVisualization(visualizationRequest);
        console.log('Visualization result:', vizResult);
        setVisualizationResult(vizResult);
      } catch (vizError) {
        console.error('可視化データ取得エラー:', vizError);
        
        // フォールバック: 簡易的な可視化データを生成
        const fallbackVisualization = createFallbackVisualization(result, customersData, dcCandidates);
        setVisualizationResult(fallbackVisualization);
      }
      */
    } catch (err) {
      console.error('LND最適化エラー:', err);
      setError('ネットワーク最適化に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [customers, dcCandidates]);

  // シンプルなテスト可視化を生成する関数
  const createTestVisualization = () => {
    console.log('Creating test visualization');
    setLoading(false);
    setError(null);
    setPlotError(null);
    
    const testResult: NetworkVisualizationResult = {
      plotly_figure: {
        data: [{
          type: 'scatter',
          mode: 'markers',
          x: [139.6503, 139.6380, 139.6455, 140.1065, 140.4468],
          y: [35.6762, 35.4437, 35.8617, 35.6074, 36.3418],
          marker: {
            size: [15, 12, 10, 8, 6],
            color: ['red', 'blue', 'green', 'orange', 'purple'],
            symbol: 'circle',
            line: { color: 'white', width: 1 }
          },
          text: ['東京', '神奈川', '埼玉', '千葉', '茨城'],
          hoverinfo: 'text',
          name: 'テスト地点'
        }],
        layout: {
          title: {
            text: 'テスト可視化プロット',
            font: { size: 16 },
            x: 0.5,
            xanchor: 'center' as const
          },
          xaxis: { 
            title: '経度',
            showgrid: true,
            range: [138, 141]
          },
          yaxis: { 
            title: '緯度',
            showgrid: true,
            range: [35, 37]
          },
          showlegend: true,
          margin: { l: 60, r: 40, t: 50, b: 60 },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white'
        }
      },
      network_stats: {
        total_customers: 5,
        active_facilities: 0,
        total_cost: 0
      },
      legend_data: {}
    };
    
    setVisualizationResult(testResult);
    
    // テスト用のLND結果も設定
    const testLNDResult: LNDResult = {
      selected_facilities: [],
      flow_assignments: {},
      total_cost: 0,
      cost_breakdown: { total: 0 },
      facility_utilization: {},
      network_performance: { test: 1 },
      solution_status: 'Test',
      solve_time: 0
    };
    
    setLndResult(testLNDResult);
  };

  // フォールバック可視化データ生成（地図表示対応）
  const createFallbackVisualization = useCallback((
    lndResult: LNDResult, 
    customers: CustomerData[], 
    dcCandidates: DCData[]
  ): NetworkVisualizationResult => {
    const selectedDCs = lndResult.selected_facilities || [];
    console.log('Creating fallback visualization with:', { selectedDCs: selectedDCs.length, customers: customers.length });
    
    // 地図用トレース配列
    const mapTraces = [];
    
    // 顧客データを地図上にプロット
    if (customers.length > 0) {
      mapTraces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: customers.map(c => c.latitude),
        lon: customers.map(c => c.longitude),
        marker: {
          size: customers.map(c => Math.max(10, Math.min(25, c.demand / 8))),
          color: '#0284c7',
          opacity: 0.8,
          line: { color: 'white', width: 2 }
        },
        text: customers.map(c => `${c.name}<br>需要: ${c.demand}単位`),
        hoverinfo: 'text',
        name: '顧客拠点',
        showlegend: true
      });
    }

    // 選択されていないDC候補をオレンジの四角で表示
    const unselectedDCs = dcCandidates.filter(dc => 
      !selectedDCs.some(selected => selected.name === dc.name)
    );
    
    if (unselectedDCs.length > 0) {
      mapTraces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: unselectedDCs.map(dc => dc.latitude),
        lon: unselectedDCs.map(dc => dc.longitude),
        marker: {
          size: 12,
          color: '#ea580c',
          symbol: 'square',
          opacity: 0.7,
          line: { color: 'white', width: 2 }
        },
        text: unselectedDCs.map(dc => `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ¥${dc.fixed_cost.toLocaleString()}<br>（未選択）`),
        hoverinfo: 'text',
        name: 'DC候補（未選択）',
        showlegend: true
      });
    }

    // 選択された物流センターを赤い星で表示
    if (selectedDCs.length > 0) {
      mapTraces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: selectedDCs.map(dc => dc.latitude),
        lon: selectedDCs.map(dc => dc.longitude),
        marker: {
          size: 20,
          color: '#dc2626',
          symbol: 'star',
          opacity: 1.0,
          line: { color: 'white', width: 3 }
        },
        text: selectedDCs.map(dc => `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ¥${dc.fixed_cost.toLocaleString()}<br>変動費: ¥${dc.variable_cost}<br>（選択済み）`),
        hoverinfo: 'text',
        name: '選択された物流センター',
        showlegend: true
      });

      // 地図表示でも物流フローの線を追加（LNDのflow_assignmentsを使用）
      if (lndResult.flow_assignments) {
        console.log('=== LND Flow Assignments ===');
        console.log('Flow assignments:', lndResult.flow_assignments);
        console.log('=============================');
        
        Object.keys(lndResult.flow_assignments).forEach(facilityName => {
          const facility = selectedDCs.find(dc => dc.name === facilityName);
          if (facility) {
            const customerFlows = lndResult.flow_assignments[facilityName];
            Object.keys(customerFlows).forEach(customerName => {
              const flowAmount = customerFlows[customerName];
              if (flowAmount > 0) {
                const customer = customers.find(c => c.name === customerName);
                if (customer) {
                  mapTraces.push({
                    type: 'scattergeo',
                    mode: 'lines',
                    lat: [customer.latitude, facility.latitude],
                    lon: [customer.longitude, facility.longitude],
                    line: {
                      color: 'rgba(99, 102, 241, 0.6)',
                      width: Math.max(1, Math.min(4, flowAmount / 50)), // 流量に応じて線の太さを調整
                      opacity: 0.7
                    },
                    hoverinfo: 'skip',
                    name: '物流フロー',
                    showlegend: false
                  });
                }
              }
            });
          }
        });
      } else {
        // flow_assignmentsがない場合のフォールバック（簡易接続）
        selectedDCs.forEach((facility, facilityIndex) => {
          customers.forEach((customer, customerIndex) => {
            if (facilityIndex === 0 || selectedDCs.length === 1) {
              mapTraces.push({
                type: 'scattergeo',
                mode: 'lines',
                lat: [customer.latitude, facility.latitude],
                lon: [customer.longitude, facility.longitude],
                line: {
                  color: 'rgba(99, 102, 241, 0.4)',
                  width: 2
                },
                hoverinfo: 'skip',
                name: '物流フロー',
                showlegend: customerIndex === 0 && facilityIndex === 0
              });
            }
          });
        });
      }
    }

    // 地理的な範囲を計算
    const allLats = [...customers.map(c => c.latitude), ...dcCandidates.map(dc => dc.latitude)];
    const allLons = [...customers.map(c => c.longitude), ...dcCandidates.map(dc => dc.longitude)];
    
    // 日本の関東地方を中心とした地図設定
    const centerLat = allLats.length > 0 ? (Math.min(...allLats) + Math.max(...allLats)) / 2 : 35.7;
    const centerLon = allLons.length > 0 ? (Math.min(...allLons) + Math.max(...allLons)) / 2 : 139.7;

    const mapResult = {
      plotly_figure: {
        data: mapTraces,
        layout: {
          title: {
            text: '物流ネットワーク設計結果（地図表示）',
            font: { 
              family: "'Helvetica Neue', Arial, sans-serif",
              size: 18,
              color: '#1f2937'
            },
            x: 0.5,
            xanchor: 'center' as const
          },
          geo: {
            showframe: false,
            showcoastlines: true,
            coastlinecolor: '#cccccc',
            projection: { type: 'natural earth' },
            center: { lat: centerLat, lon: centerLon },
            lonaxis: { 
              range: [Math.min(...allLons) - 0.5, Math.max(...allLons) + 0.5],
              showgrid: true,
              gridcolor: 'rgba(128,128,128,0.2)'
            },
            lataxis: { 
              range: [Math.min(...allLats) - 0.3, Math.max(...allLats) + 0.3],
              showgrid: true,
              gridcolor: 'rgba(128,128,128,0.2)'
            },
            bgcolor: 'rgba(243,244,246,0.8)',
            showcountries: true,
            countrycolor: 'rgba(204,204,204,0.5)',
            showlakes: true,
            lakecolor: 'rgba(173,216,230,0.6)'
          },
          showlegend: true,
          legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#e5e7eb',
            borderwidth: 1,
            font: { size: 11 }
          },
          margin: { l: 20, r: 20, t: 60, b: 20 },
          paper_bgcolor: 'white'
        }
      },
      network_stats: {
        total_customers: customers.length,
        active_facilities: selectedDCs.length,
        total_cost: lndResult.total_cost || 0
      },
      legend_data: {
        customers: '青い円：顧客拠点（サイズは需要量を反映）',
        unselected_dcs: 'オレンジの四角：DC候補（未選択）',
        selected_facilities: '赤い星：選択された物流センター'
      }
    };

    console.log('Generated map visualization:', mapResult);
    return mapResult;
  }, []);

  // 散布図版の可視化データ生成
  const createScatterVisualization = useCallback((
    lndResult: LNDResult, 
    customers: CustomerData[], 
    dcCandidates: DCData[]
  ): NetworkVisualizationResult => {
    const selectedDCs = lndResult.selected_facilities || [];
    console.log('Creating scatter visualization with:', { selectedDCs: selectedDCs.length, customers: customers.length });
    
    const scatterTraces = [];
    
    // 顧客データを散布図でプロット
    if (customers.length > 0) {
      scatterTraces.push({
        type: 'scatter',
        mode: 'markers',
        x: customers.map(c => c.longitude),
        y: customers.map(c => c.latitude),
        marker: {
          size: customers.map(c => Math.max(8, Math.min(20, c.demand / 10))),
          color: '#0284c7',
          symbol: 'circle',
          line: { color: 'white', width: 1 }
        },
        text: customers.map(c => `${c.name}<br>需要: ${c.demand}単位`),
        hoverinfo: 'text',
        name: '顧客拠点',
        showlegend: true
      });
    }

    // 選択されていないDC候補をオレンジの四角で表示
    const unselectedDCs = dcCandidates.filter(dc => 
      !selectedDCs.some(selected => selected.name === dc.name)
    );
    
    if (unselectedDCs.length > 0) {
      scatterTraces.push({
        type: 'scatter',
        mode: 'markers',
        x: unselectedDCs.map(dc => dc.longitude),
        y: unselectedDCs.map(dc => dc.latitude),
        marker: {
          size: 12,
          color: '#ea580c',
          symbol: 'square',
          line: { color: 'white', width: 2 }
        },
        text: unselectedDCs.map(dc => `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ¥${dc.fixed_cost.toLocaleString()}<br>（未選択）`),
        hoverinfo: 'text',
        name: 'DC候補（未選択）',
        showlegend: true
      });
    }

    // 選択された物流センターを赤い星で表示
    if (selectedDCs.length > 0) {
      scatterTraces.push({
        type: 'scatter',
        mode: 'markers',
        x: selectedDCs.map(dc => dc.longitude),
        y: selectedDCs.map(dc => dc.latitude),
        marker: {
          size: 15,
          color: '#dc2626',
          symbol: 'star',
          line: { color: 'white', width: 2 }
        },
        text: selectedDCs.map(dc => `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ¥${dc.fixed_cost.toLocaleString()}<br>変動費: ¥${dc.variable_cost}<br>（選択済み）`),
        hoverinfo: 'text',
        name: '選択された物流センター',
        showlegend: true
      });

      // 物流フローの接続線を追加（LNDのflow_assignmentsを使用）
      if (lndResult.flow_assignments) {
        Object.keys(lndResult.flow_assignments).forEach(facilityName => {
          const facility = selectedDCs.find(dc => dc.name === facilityName);
          if (facility) {
            const customerFlows = lndResult.flow_assignments[facilityName];
            Object.keys(customerFlows).forEach(customerName => {
              const flowAmount = customerFlows[customerName];
              if (flowAmount > 0) {
                const customer = customers.find(c => c.name === customerName);
                if (customer) {
                  scatterTraces.push({
                    type: 'scatter',
                    mode: 'lines',
                    x: [customer.longitude, facility.longitude],
                    y: [customer.latitude, facility.latitude],
                    line: {
                      color: 'rgba(99, 102, 241, 0.6)',
                      width: Math.max(1, Math.min(4, flowAmount / 50)), // 流量に応じて線の太さを調整
                      opacity: 0.7
                    },
                    hoverinfo: 'skip',
                    name: '物流フロー',
                    showlegend: false
                  });
                }
              }
            });
          }
        });
      } else {
        // flow_assignmentsがない場合のフォールバック（簡易接続）
        selectedDCs.forEach((facility, facilityIndex) => {
          customers.forEach((customer, customerIndex) => {
            if (facilityIndex === 0 || selectedDCs.length === 1) {
              scatterTraces.push({
                type: 'scatter',
                mode: 'lines',
                x: [customer.longitude, facility.longitude],
                y: [customer.latitude, facility.latitude],
                line: {
                  color: 'rgba(99, 102, 241, 0.4)',
                  width: 2
                },
                hoverinfo: 'skip',
                name: '物流フロー',
                showlegend: customerIndex === 0 && facilityIndex === 0
              });
            }
          });
        });
      }
    }

    const allLats = [...customers.map(c => c.latitude), ...dcCandidates.map(dc => dc.latitude)];
    const allLons = [...customers.map(c => c.longitude), ...dcCandidates.map(dc => dc.longitude)];
    
    const latRange = allLats.length > 0 ? [Math.min(...allLats) - 0.3, Math.max(...allLats) + 0.3] : [35, 36.5];
    const lonRange = allLons.length > 0 ? [Math.min(...allLons) - 0.5, Math.max(...allLons) + 0.5] : [139, 140.5];

    const scatterResult = {
      plotly_figure: {
        data: scatterTraces,
        layout: {
          title: {
            text: '物流ネットワーク設計結果（散布図）',
            font: { 
              family: "'Helvetica Neue', Arial, sans-serif",
              size: 18,
              color: '#1f2937'
            },
            x: 0.5,
            xanchor: 'center' as const
          },
          xaxis: { 
            title: '経度',
            showgrid: true,
            gridcolor: 'rgba(128,128,128,0.2)',
            range: lonRange
          },
          yaxis: { 
            title: '緯度',
            showgrid: true,
            gridcolor: 'rgba(128,128,128,0.2)',
            range: latRange
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
      },
      network_stats: {
        total_customers: customers.length,
        active_facilities: selectedDCs.length,
        total_cost: lndResult.total_cost || 0
      },
      legend_data: {
        customers: '青い円：顧客拠点（サイズは需要量を反映）',
        unselected_dcs: 'オレンジの四角：DC候補（未選択）',
        selected_facilities: '赤い星：選択された物流センター',
        flows: '紫の線：物流フロー（太さは流量を反映）'
      }
    };

    console.log('Generated scatter visualization:', scatterResult);
    return scatterResult;
  }, []);

  // 初回読み込み時にLND計算を実行
  useEffect(() => {
    handleLNDOptimization();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 表示モードが変更されたときに可視化を更新
  useEffect(() => {
    if (lndResult) {
      const updatedVisualization = mapMode === 'map' 
        ? createFallbackVisualization(lndResult, customers, dcCandidates)
        : createScatterVisualization(lndResult, customers, dcCandidates);
      setVisualizationResult(updatedVisualization);
    }
  }, [mapMode, lndResult, customers, dcCandidates, createFallbackVisualization, createScatterVisualization]);

  return (
    <div className="section">
      <div className="page-header">
        <h1 className="page-title">ネットワーク可視化</h1>
        <p className="page-subtitle">物流ネットワーク設計結果の地図表示</p>
      </div>

      <div className="toolbar mb-6">
        <div className="toolbar-left">
          <button 
            onClick={handleLNDOptimization} 
            disabled={loading}
            className="btn btn-md btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                最適化実行中...
              </>
            ) : (
              'ネットワーク最適化'
            )}
          </button>
          <button 
            onClick={createTestVisualization}
            disabled={loading}
            className="btn btn-md btn-secondary"
          >
            テスト表示
          </button>
          <button 
            onClick={() => {
              setVisualizationResult(null);
              setLndResult(null);
              setError(null);
              setPlotError(null);
            }}
            disabled={loading}
            className="btn btn-md btn-outline"
          >
            クリア
          </button>
        </div>

        {lndResult && (
          <div className="toolbar-center">
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
        
        <div className="toolbar-right">
          <button className="btn btn-md btn-outline">エクスポート</button>
          <button className="btn btn-md btn-outline">印刷</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <div>
            <div className="alert-title">エラーが発生しました</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {plotError && (
        <div className="alert alert-error mb-6">
          <div>
            <div className="alert-title">描画エラー</div>
            <div>{plotError}</div>
          </div>
        </div>
      )}

      {/* KPI Overview */}
      {lndResult && (
        <div className="kpi-grid mb-8">
          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">総コスト</p>
              <div className="kpi-trend positive">
                <span>最適化済</span>
              </div>
            </div>
            <p className="kpi-value">¥{lndResult.total_cost.toLocaleString()}</p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">選択施設数</p>
              <div className="kpi-trend neutral">
                <span>計画値</span>
              </div>
            </div>
            <p className="kpi-value">{lndResult.selected_facilities.length} <span className="kpi-unit">拠点</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">平均距離</p>
              <div className="kpi-trend positive">
                <span>効率的</span>
              </div>
            </div>
            <p className="kpi-value">{lndResult.network_performance.average_distance?.toFixed(1) || 'N/A'} <span className="kpi-unit">km</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">解法ステータス</p>
              <div className="kpi-trend positive">
                <span>完了</span>
              </div>
            </div>
            <p className="kpi-value text-lg">{lndResult.solution_status}</p>
          </div>
        </div>
      )}

      {/* デバッグ情報 */}
      {visualizationResult && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">デバッグ情報</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="alert alert-info">
                <div>データポイント数: {visualizationResult.plotly_figure?.data?.length || 0}</div>
              </div>
              <div className="alert alert-info">
                <div>レイアウト: {visualizationResult.plotly_figure?.layout ? '設定済み' : '未設定'}</div>
              </div>
              <div className="alert alert-info">
                <div>タイトル: {visualizationResult.plotly_figure?.layout?.title?.text || 'N/A'}</div>
              </div>
              {visualizationResult.plotly_figure?.data?.[0] && (
                <div className="alert alert-info">
                  <div>トレース: タイプ={visualizationResult.plotly_figure.data[0].type}, データ数={visualizationResult.plotly_figure.data[0].x?.length || 0}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 物流ネットワーク地図 */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">物流ネットワーク地図</h2>
        </div>
        <div className="card-content">
          {loading && (
            <div className="flex flex-col items-center justify-center" style={{ padding: '40px' }}>
              <div className="spinner mb-4"></div>
              <p>ネットワーク最適化を実行中...</p>
            </div>
          )}

          {visualizationResult && visualizationResult.plotly_figure && !loading && (
            <div className="border rounded-lg">
              <Plot
                data={visualizationResult.plotly_figure.data || []}
                layout={{
                  ...visualizationResult.plotly_figure.layout,
                  height: 600,
                  font: {
                    family: "'Helvetica Neue', Arial, sans-serif",
                    size: 12,
                    color: '#2c3e50'
                  },
                  paper_bgcolor: 'white',
                  plot_bgcolor: 'white'
                }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
                  displaylogo: false,
                  toImageButtonOptions: {
                    format: 'png',
                    filename: 'logistics-network',
                    height: 600,
                    width: 800,
                    scale: 1
                  }
                }}
                style={{ width: '100%', height: '600px' }}
                onInitialized={() => {
                  console.log('Plot initialized successfully');
                }}
                onUpdate={() => {
                  console.log('Plot updated');
                }}
                onError={(error) => {
                  console.error('Plotly rendering error:', error);
                  setPlotError('地図の描画でエラーが発生しました: ' + error.message);
                }}
              />
            </div>
          )}

          {!visualizationResult && !loading && (
            <div className="flex items-center justify-center border rounded-lg" style={{ height: '400px' }}>
              <div className="text-center">
                <p className="text-lg mb-2">📍 物流ネットワーク地図を表示するには</p>
                <p className="text-secondary">「ネットワーク最適化」ボタンをクリックしてください</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ネットワーク詳細情報 */}
      {lndResult && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">選択された物流センター</h3>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>施設名</th>
                    <th>位置</th>
                    <th>容量</th>
                    <th>固定費</th>
                    <th>変動費</th>
                  </tr>
                </thead>
                <tbody>
                  {lndResult.selected_facilities.map((facility, index) => (
                    <tr key={index}>
                      <td>{facility.name}</td>
                      <td>{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</td>
                      <td>{facility.capacity}</td>
                      <td>¥{facility.fixed_cost.toLocaleString()}</td>
                      <td>¥{facility.variable_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 凡例とヘルプ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">地図の見方</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="alert alert-info">
              <div className="flex items-center gap-2">
                <span style={{ color: '#0284c7', fontSize: '16px' }}>●</span>
                <span>顧客拠点（需要量に応じてサイズ変化）</span>
              </div>
            </div>
            <div className="alert alert-info">
              <div className="flex items-center gap-2">
                <span style={{ color: '#ea580c', fontSize: '16px' }}>■</span>
                <span>DC候補（未選択）</span>
              </div>
            </div>
            <div className="alert alert-info">
              <div className="flex items-center gap-2">
                <span style={{ color: '#dc2626', fontSize: '16px' }}>★</span>
                <span>選択された物流センター</span>
              </div>
            </div>
            <div className="alert alert-info">
              <div className="flex items-center gap-2">
                <span style={{ color: '#6366f1', fontSize: '16px' }}>―</span>
                <span>物流フロー（散布図でのみ表示）</span>
              </div>
            </div>
          </div>
          
          <div className="alert alert-success">
            <div>
              <div className="alert-title">操作方法</div>
              <div>マップをドラッグして移動、スクロールでズーム、マーカーをクリックで詳細情報を表示</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualization;