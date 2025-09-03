import React, { useState } from 'react';
import { vrpApi } from '../../services/api';
import VRPMapVisualization from './VRPMapVisualization';

const VRPOptimization: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  
  // サンプルデータ (matrix-basedアプローチを使用) - 東京都心部の座標
  const [modelData] = useState({
    jobs: [
      {
        id: 0,
        location_index: 0,
        service: 600,
        delivery: [100],
        pickup: [0],
        time_windows: [[28800, 50400]], // 8:00-14:00
        skills: [0],
        priority: 10,
        description: "顧客A"
      },
      {
        id: 1,
        location_index: 1,
        service: 600,
        delivery: [150],
        pickup: [0],
        time_windows: [[32400, 54000]], // 9:00-15:00
        skills: [0],
        priority: 10,
        description: "顧客B"
      }
    ],
    vehicles: [
      {
        id: 0,
        start_index: 2,
        end_index: 2,
        capacity: [1000],
        time_window: [25200, 61200], // 7:00-17:00
        skills: [0],
        description: "車両1",
        costs: {
          fixed: 0,
          per_hour: 3600,
          per_km: 0
        },
        speed_factor: 1.0
      }
    ],
    shipments: [],
    matrices: {
      car: {
        durations: [
          [0, 1200, 800],    // 顧客A から 顧客A, 顧客B, デポ
          [1200, 0, 1000],   // 顧客B から 顧客A, 顧客B, デポ
          [800, 1000, 0]     // デポ から 顧客A, 顧客B, デポ
        ],
        distances: [
          [0, 6000, 4000],   // 距離 (メートル)
          [6000, 0, 5000],
          [4000, 5000, 0]
        ]
      }
    }
  });

  // 地図表示用の座標データ (東京都心部の実際の座標)
  const [locationData] = useState([
    { id: 0, lat: 35.6895, lng: 139.6917, name: "顧客A (東京駅周辺)", type: "customer" as const },
    { id: 1, lat: 35.6762, lng: 139.6503, name: "顧客B (赤坂周辺)", type: "customer" as const },
    { id: 2, lat: 35.6581, lng: 139.7414, name: "配送センター (渋谷)", type: "depot" as const }
  ]);

  const performOptimization = async () => {
    setLoading(true);
    try {
      const request = {
        model_data: modelData,
        matrix: true,
        threads: 4,
        explore: 5,
        osrm: false,
        host: "localhost"
      };
      
      console.log('Sending VRP request:', request);
      const response = await vrpApi.optimize(request);
      console.log('VRP response received:', response);
      console.log('VRP response data:', response.data);
      
      setOptimizationResult(response.data);
      
      if (response.data.error_message) {
        alert(`最適化エラー: ${response.data.error_message}`);
      } else {
        console.log('VRP optimization completed successfully');
      }
    } catch (error) {
      console.error('Error performing VRP optimization:', error);
      
      // Type guard for axios error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Error response:', axiosError.response);
        console.error('Error details:', axiosError.response?.data);
        console.error('Error status:', axiosError.response?.status);
        console.error('Error headers:', axiosError.response?.headers);
      }
      
      // Check if it's a network error
      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as any;
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          console.error('Network error detected. Backend might not be accessible.');
          console.error('Trying to reach: http://localhost:8001/api/v1');
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`VRP最適化の実行に失敗しました: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const generateNodes = async () => {
    setLoading(true);
    try {
      const request = {
        n: 10,
        random_seed: 1,
        prefecture: "東京都",
        matrix: true,
        host: "localhost"
      };
      
      const response = await vrpApi.generateNodes(request);
      console.log('Generated nodes:', response.data);
      alert('ノードデータが生成されました（コンソールを確認してください）');
    } catch (error) {
      console.error('Error generating nodes:', error);
      alert('ノードの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vrp-optimization" style={{ padding: '20px', maxWidth: '1200px' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
        VRP配送計画最適化
      </h2>
      
      <div className="model-section" style={{ backgroundColor: '#f8f9fa', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>モデルデータ</h3>
        <div className="model-summary" style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
          <p style={{ backgroundColor: '#e8f4f8', padding: '10px', borderRadius: '5px', margin: '0' }}>
            <strong>ジョブ数:</strong> {modelData.jobs.length}
          </p>
          <p style={{ backgroundColor: '#e8f4f8', padding: '10px', borderRadius: '5px', margin: '0' }}>
            <strong>車両数:</strong> {modelData.vehicles.length}
          </p>
          <p style={{ backgroundColor: '#e8f4f8', padding: '10px', borderRadius: '5px', margin: '0' }}>
            <strong>輸送数:</strong> {modelData.shipments.length}
          </p>
        </div>
        
        <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>ジョブ（顧客）</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>名称</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>位置インデックス</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>配達量</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>時間枠</th>
            </tr>
          </thead>
          <tbody>
            {modelData.jobs.map((job, index) => (
              <tr key={job.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{job.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{job.description}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{job.location_index}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{job.delivery[0]}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {Math.floor(job.time_windows[0][0]/3600)}:00-{Math.floor(job.time_windows[0][1]/3600)}:00
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>車両</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>名称</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>積載量</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>稼働時間</th>
            </tr>
          </thead>
          <tbody>
            {modelData.vehicles.map((vehicle, index) => (
              <tr key={vehicle.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.description}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{vehicle.capacity[0]}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {Math.floor(vehicle.time_window[0]/3600)}:00-{Math.floor(vehicle.time_window[1]/3600)}:00
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="actions" style={{ marginBottom: '20px' }}>
        <button 
          onClick={performOptimization} 
          disabled={loading}
          style={{
            backgroundColor: loading ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? '最適化中...' : 'VRP最適化を実行'}
        </button>
        <button 
          onClick={generateNodes} 
          disabled={loading}
          style={{
            backgroundColor: loading ? '#95a5a6' : '#2ecc71',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          ランダムノード生成
        </button>
      </div>
      
      {optimizationResult && (
        <div className="result-section" style={{ backgroundColor: '#f1f2f6', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>最適化結果</h3>
          {optimizationResult.error_message ? (
            <div className="error-message" style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '5px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>エラー</h4>
              <p style={{ margin: '0' }}>{optimizationResult.error_message}</p>
            </div>
          ) : (
            <>
              <div className="summary" style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h4 style={{ color: '#27ae60', marginBottom: '15px' }}>サマリー</h4>
                <p>総コスト: {optimizationResult.output_data?.summary?.cost}</p>
                <p>ルート数: {optimizationResult.output_data?.summary?.routes}</p>
                <p>未割当タスク: {optimizationResult.output_data?.summary?.unassigned}</p>
                <p>総移動時間: {optimizationResult.output_data?.summary?.duration}秒</p>
                <p>総配達量: {optimizationResult.output_data?.summary?.delivery?.join(', ')}</p>
              </div>
              
              {optimizationResult.output_data?.routes && (
                <div className="routes" style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                  <h4 style={{ color: '#27ae60', marginBottom: '15px' }}>ルート詳細</h4>
                  {optimizationResult.output_data.routes.map((route: any, index: number) => (
                    <div key={index} className="route" style={{ backgroundColor: '#ecf0f1', padding: '15px', marginBottom: '15px', borderRadius: '5px', borderLeft: '4px solid #3498db' }}>
                      <h5>ルート {index + 1} (車両 {route.vehicle})</h5>
                      <p>コスト: {route.cost}</p>
                      <p>移動時間: {route.duration}秒</p>
                      <p>配達量: {route.delivery?.join(', ')}</p>
                      <p>サービス時間: {route.service}秒</p>
                      <p>ステップ数: {route.steps?.length || 0}</p>
                      
                      {route.steps && route.steps.length > 0 && (
                        <div className="steps" style={{ marginTop: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '3px' }}>
                          <h6 style={{ margin: '0 0 10px 0', color: '#34495e' }}>ステップ詳細:</h6>
                          {route.steps.map((step: any, stepIndex: number) => (
                            <div key={stepIndex} style={{marginLeft: '20px', fontSize: '0.9em', padding: '5px 0', borderBottom: stepIndex < route.steps.length - 1 ? '1px dotted #bdc3c7' : 'none'}}>
                              {stepIndex + 1}. {step.type === 'start' ? '出発' : 
                                           step.type === 'end' ? '到着' : 
                                           step.type === 'job' ? `顧客: ${step.description}` : step.type}
                              {step.arrival && ` (到着: ${Math.floor(step.arrival/3600)}:${String(Math.floor((step.arrival%3600)/60)).padStart(2,'0')})`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 地図表示コンポーネントの追加 */}
              <VRPMapVisualization 
                locations={locationData}
                routes={optimizationResult.output_data?.routes || []}
                matrices={modelData.matrices}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VRPOptimization;