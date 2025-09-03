import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { logisticsApi, CustomerData, ClusteringResult } from '../../services/logistics';

const CustomerClustering: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [method, setMethod] = useState<string>('kmeans');
  const [nClusters, setNClusters] = useState<number>(3);
  const [result, setResult] = useState<ClusteringResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  const handleClustering = async () => {
    if (customers.length === 0) {
      setError('顧客データを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = {
        customers,
        method,
        n_clusters: nClusters,
        use_road_distance: false
      };

      const clusteringResult = await logisticsApi.clusterCustomers(request);
      setResult(clusteringResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クラスタリングに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getClusterColor = (clusterId: number): string => {
    const colors = [
      '#0284c7', // Blue-600
      '#16a34a', // Green-500
      '#dc2626', // Red-600
      '#a16207', // Yellow-700
      '#7c3aed', // Violet-600
      '#0891b2', // Cyan-600
      '#c2410c', // Orange-600
      '#059669'  // Emerald-600
    ];
    return colors[clusterId % colors.length];
  };

  // クラスター可視化のためのPlotlyデータを生成
  const generateClusterVisualization = () => {
    if (!result || customers.length === 0) return null;

    const traces: any[] = [];
    
    // クラスターごとに顧客データをグループ化
    const clusterGroups: { [key: number]: CustomerData[] } = {};
    
    customers.forEach(customer => {
      const clusterId = result.clusters[customer.name];
      if (clusterId !== undefined) {
        if (!clusterGroups[clusterId]) {
          clusterGroups[clusterId] = [];
        }
        clusterGroups[clusterId].push(customer);
      }
    });

    // 各クラスターのトレースを作成
    Object.keys(clusterGroups).forEach(clusterIdStr => {
      const clusterId = parseInt(clusterIdStr);
      const clusterCustomers = clusterGroups[clusterId];
      
      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: clusterCustomers.map(c => c.longitude),
        y: clusterCustomers.map(c => c.latitude),
        marker: {
          size: clusterCustomers.map(c => Math.max(8, Math.min(20, c.demand / 3))),
          color: getClusterColor(clusterId),
          symbol: 'circle',
          line: { color: 'white', width: 1 }
        },
        text: clusterCustomers.map(c => `${c.name}<br>クラスター: ${clusterId}<br>需要: ${c.demand}`),
        hoverinfo: 'text',
        name: `クラスター ${clusterId}`,
        showlegend: true,
        legendgroup: `cluster_${clusterId}` // クラスター中心とグループ化
      });
    });

    // クラスター中心を追加（各クラスターの色に合わせて）
    if (result.cluster_centers && result.cluster_centers.length > 0) {
      result.cluster_centers.forEach((center, index) => {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: [center.longitude],
          y: [center.latitude],
          marker: {
            size: 18,
            color: getClusterColor(index),
            symbol: 'star',
            line: { color: 'white', width: 2 }
          },
          text: [`クラスター中心 ${index}<br>位置: ${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`],
          hoverinfo: 'text',
          name: `クラスター ${index} 中心`,
          showlegend: false, // 個別の中心は凡例に表示しない
          legendgroup: `cluster_${index}` // 対応するクラスターとグループ化
        });
      });
    }

    return {
      data: traces,
      layout: {
        title: {
          text: `顧客クラスタリング結果 (${method}, K=${nClusters})`,
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
          borderwidth: 1,
          font: { size: 12 }
        },
        margin: { l: 60, r: 120, t: 60, b: 60 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        hovermode: 'closest' as const
      }
    };
  };

  const plotData = generateClusterVisualization();

  return (
    <div className="section">
      <div className="page-header">
        <h1 className="page-title">顧客クラスタリング</h1>
        <p className="page-subtitle">地理的位置と需要パターンに基づく顧客グループ分析</p>
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
            onClick={handleClustering}
            disabled={loading || customers.length === 0}
            className="btn btn-md btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                クラスタリング中...
              </>
            ) : (
              'クラスタリング実行'
            )}
          </button>
        </div>
      </div>

      {/* パラメータ設定 */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">パラメータ設定</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">クラスタリング手法</label>
              <select
                className="form-select"
                value={method}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value)}
              >
                <option value="kmeans">K-means</option>
                <option value="hierarchical">階層クラスタリング</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">クラスター数</label>
              <input
                className="form-input"
                type="number"
                value={nClusters}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNClusters(parseInt(e.target.value) || 0)}
                min="1"
                max="10"
              />
            </div>
          </div>
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

      {/* KPI Overview */}
      {result && (
        <div className="kpi-grid mb-8">
          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">シルエット係数</p>
              <div className="kpi-trend positive">
                <span>品質良好</span>
              </div>
            </div>
            <p className="kpi-value">{result.silhouette_score.toFixed(3)}</p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">クラスター数</p>
              <div className="kpi-trend neutral">
                <span>最適化済</span>
              </div>
            </div>
            <p className="kpi-value">{result.cluster_centers.length} <span className="kpi-unit">グループ</span></p>
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

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">手法</p>
              <div className="kpi-trend positive">
                <span>適用済</span>
              </div>
            </div>
            <p className="kpi-value text-lg">{method === 'kmeans' ? 'K-Means' : '階層'}</p>
          </div>
        </div>
      )}

      {/* クラスター可視化地図 */}
      {result && plotData && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">クラスター分析結果マップ</h2>
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
                    <th>クラスター</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 20).map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.name}</td>
                      <td>{customer.latitude.toFixed(4)}</td>
                      <td>{customer.longitude.toFixed(4)}</td>
                      <td>{customer.demand}</td>
                      <td>
                        {result && result.clusters[customer.name] !== undefined ? (
                          <span 
                            className="badge badge-primary"
                            style={{ 
                              backgroundColor: getClusterColor(result.clusters[customer.name]),
                              color: 'white'
                            }}
                          >
                            C{result.clusters[customer.name]}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">未分類</span>
                        )}
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

      {/* 集約顧客データ */}
      {result && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">集約顧客データ</h3>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>集約顧客</th>
                    <th>緯度</th>
                    <th>経度</th>
                    <th>総需要</th>
                    <th>グループ</th>
                  </tr>
                </thead>
                <tbody>
                  {result.aggregated_customers.map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.name}</td>
                      <td>{customer.latitude.toFixed(6)}</td>
                      <td>{customer.longitude.toFixed(6)}</td>
                      <td>{customer.demand.toFixed(1)}</td>
                      <td>
                        <span 
                          className="badge badge-primary"
                          style={{ 
                            backgroundColor: getClusterColor(index),
                            color: 'white'
                          }}
                        >
                          クラスター {index}
                        </span>
                      </td>
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
          <h3 className="card-title">クラスタリング分析について</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="alert alert-info">
              <div>K-means法: 距離ベースの高速クラスタリング</div>
            </div>
            <div className="alert alert-info">
              <div>階層クラスタリング: 樹形図ベースの詳細分析</div>
            </div>
            <div className="alert alert-info">
              <div>シルエット係数: クラスタリング品質の指標 (0-1)</div>
            </div>
          </div>
          
          <div className="alert alert-success">
            <div>
              <div className="alert-title">マップの見方</div>
              <div>同じ色の顧客は同一クラスターに属し、星印はクラスター中心を示します。マーカーサイズは需要量を反映しています。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerClustering;