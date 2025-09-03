import React, { useState } from 'react';
import { logisticsApi } from '../../services/logistics';

const SampleDataGenerator: React.FC = () => {
  const [numCustomers, setNumCustomers] = useState<number>(20);
  const [numDcCandidates, setNumDcCandidates] = useState<number>(5);
  const [region, setRegion] = useState<string>('japan');
  const [sampleData, setSampleData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<number>(0);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await logisticsApi.generateSampleData(numCustomers, numDcCandidates, region);
      setSampleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サンプルデータ生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const generateLocalSampleData = () => {
    const lat_min = 35.0, lat_max = 36.5;
    const lon_min = 139.0, lon_max = 140.5;
    
    const customers = Array.from({length: numCustomers}, (_, i) => ({
      name: `顧客${i + 1}`,
      latitude: lat_min + Math.random() * (lat_max - lat_min),
      longitude: lon_min + Math.random() * (lon_max - lon_min),
      demand: Math.round(Math.random() * 90 + 10)
    }));

    const dc_candidates = Array.from({length: numDcCandidates}, (_, i) => ({
      name: `DC候補${i + 1}`,
      latitude: lat_min + Math.random() * (lat_max - lat_min),
      longitude: lon_min + Math.random() * (lon_max - lon_min),
      capacity: Math.round(Math.random() * 1000 + 500),
      fixed_cost: Math.round(Math.random() * 40000 + 10000),
      variable_cost: Math.round((Math.random() * 4 + 1) * 10) / 10
    }));

    const plants = Array.from({length: 2}, (_, i) => ({
      name: `工場${i + 1}`,
      latitude: lat_min + Math.random() * (lat_max - lat_min),
      longitude: lon_min + Math.random() * (lon_max - lon_min),
      capacity: Math.round(Math.random() * 2000 + 1000),
      production_cost: Math.round((Math.random() * 10 + 5) * 10) / 10
    }));

    const localData = {
      customers,
      dc_candidates,
      plants,
      metadata: {
        region,
        generation_timestamp: new Date().toISOString(),
        total_demand: customers.reduce((sum, c) => sum + c.demand, 0),
        total_capacity: dc_candidates.reduce((sum, dc) => sum + dc.capacity, 0)
      }
    };

    setSampleData(localData);
    setError(null);
  };

  const downloadData = (dataType: string) => {
    if (!sampleData) return;

    let data;
    let filename: string;

    switch (dataType) {
      case 'customers':
        data = sampleData.customers;
        filename = 'customers.json';
        break;
      case 'dc_candidates':
        data = sampleData.dc_candidates;
        filename = 'dc_candidates.json';
        break;
      case 'plants':
        data = sampleData.plants;
        filename = 'plants.json';
        break;
      case 'all':
        data = sampleData;
        filename = 'sample_logistics_data.json';
        break;
      default:
        return;
    }

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (dataType: string) => {
    if (!sampleData) return;

    let data;
    let filename: string;
    let headers: string[];

    switch (dataType) {
      case 'customers':
        data = sampleData.customers;
        filename = 'customers.csv';
        headers = ['name', 'latitude', 'longitude', 'demand'];
        break;
      case 'dc_candidates':
        data = sampleData.dc_candidates;
        filename = 'dc_candidates.csv';
        headers = ['name', 'latitude', 'longitude', 'capacity', 'fixed_cost', 'variable_cost'];
        break;
      case 'plants':
        data = sampleData.plants;
        filename = 'plants.csv';
        headers = ['name', 'latitude', 'longitude', 'capacity', 'production_cost'];
        break;
      default:
        return;
    }

    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => headers.map((header: string) => row[header]).join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const tabs = ['顧客', 'DC候補', '工場'];

  return (
    <div className="logistics-section">
      <h2>📊 サンプルデータ生成</h2>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '16px', 
        borderRadius: '4px', 
        marginBottom: '24px',
        border: '1px solid #2196f3'
      }}>
        <strong>ℹ️ サンプルデータ生成について</strong><br />
        物流最適化の検証・テスト用にランダムなサンプルデータを生成します。
        顧客・配送センター・工場の地理的データと需要・容量情報を含みます。
      </div>

      <div className="logistics-two-column">
        {/* 生成設定 */}
        <div className="logistics-section">
          <h3>データ生成設定</h3>
          
          <div className="logistics-form">
            <div className="logistics-input-group">
              <label>顧客数</label>
              <input
                className="logistics-input"
                type="number"
                value={numCustomers}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumCustomers(parseInt(e.target.value) || 0)}
                min="1"
                max="100"
              />
            </div>
            
            <div className="logistics-input-group">
              <label>DC候補数</label>
              <input
                className="logistics-input"
                type="number"
                value={numDcCandidates}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumDcCandidates(parseInt(e.target.value) || 0)}
                min="1"
                max="20"
              />
            </div>
            
            <div className="logistics-input-group">
              <label>地域</label>
              <select
                className="logistics-input"
                value={region}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRegion(e.target.value)}
              >
                <option value="japan">日本（関東地域）</option>
                <option value="usa">米国</option>
                <option value="europe">欧州</option>
              </select>
            </div>
            
            <button
              className="logistics-button"
              onClick={generateLocalSampleData}
              style={{ marginBottom: '8px' }}
            >
              ローカル生成
            </button>

            <button
              className="logistics-button"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? 'API生成中...' : 'API経由で生成'}
            </button>
          </div>
        </div>

        {/* データ統計 */}
        {sampleData && (
          <div className="logistics-section">
            <h3>データ統計</h3>
            <div className="logistics-metrics">
              <div className="logistics-metric" style={{ backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #e0e0e0' }}>
                <div className="logistics-metric-label" style={{ color: '#555' }}>顧客数</div>
                <div className="logistics-metric-value" style={{ color: '#1976d2' }}>{sampleData.customers.length}</div>
              </div>
              <div className="logistics-metric" style={{ backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #e0e0e0' }}>
                <div className="logistics-metric-label" style={{ color: '#555' }}>DC候補数</div>
                <div className="logistics-metric-value" style={{ color: '#1976d2' }}>{sampleData.dc_candidates.length}</div>
              </div>
              <div className="logistics-metric" style={{ backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #e0e0e0' }}>
                <div className="logistics-metric-label" style={{ color: '#555' }}>工場数</div>
                <div className="logistics-metric-value" style={{ color: '#1976d2' }}>{sampleData.plants.length}</div>
              </div>
              <div className="logistics-metric" style={{ backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #e0e0e0' }}>
                <div className="logistics-metric-label" style={{ color: '#555' }}>総需要</div>
                <div className="logistics-metric-value" style={{ color: '#1976d2' }}>{sampleData.metadata.total_demand}</div>
              </div>
            </div>

            <button
              className="logistics-button"
              onClick={() => downloadData('all')}
              style={{ backgroundColor: '#388e3c', marginTop: '16px' }}
            >
              💾 全データダウンロード
            </button>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && <div className="logistics-error">{error}</div>}

      {/* データ表示 */}
      {sampleData ? (
        <div className="logistics-results">
          <div className="logistics-result-header">生成データ</div>

          {/* タブ */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '16px' }}>
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setCurrentTab(index)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: currentTab === index ? '#1976d2' : '#f5f5f5',
                  color: currentTab === index ? 'white' : '#333',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  marginRight: '4px'
                }}
              >
                {tab} ({
                  index === 0 ? sampleData.customers.length :
                  index === 1 ? sampleData.dc_candidates.length :
                  sampleData.plants.length
                })
              </button>
            ))}
          </div>

          {/* 顧客データ */}
          {currentTab === 0 && (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <button 
                  className="logistics-button"
                  onClick={() => downloadData('customers')}
                  style={{ marginRight: '8px' }}
                >
                  JSON
                </button>
                <button 
                  className="logistics-button"
                  onClick={() => downloadCSV('customers')}
                >
                  CSV
                </button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="logistics-data-table">
                  <thead>
                    <tr>
                      <th>顧客名</th>
                      <th>緯度</th>
                      <th>経度</th>
                      <th>需要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.customers.map((customer: any, index: number) => (
                      <tr key={index}>
                        <td>{customer.name}</td>
                        <td>{customer.latitude.toFixed(6)}</td>
                        <td>{customer.longitude.toFixed(6)}</td>
                        <td>
                          <span style={{ 
                            backgroundColor: '#1976d2', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px' 
                          }}>
                            {customer.demand}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DC候補データ */}
          {currentTab === 1 && (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <button 
                  className="logistics-button"
                  onClick={() => downloadData('dc_candidates')}
                  style={{ marginRight: '8px' }}
                >
                  JSON
                </button>
                <button 
                  className="logistics-button"
                  onClick={() => downloadCSV('dc_candidates')}
                >
                  CSV
                </button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="logistics-data-table">
                  <thead>
                    <tr>
                      <th>DC名</th>
                      <th>緯度</th>
                      <th>経度</th>
                      <th>容量</th>
                      <th>固定費</th>
                      <th>変動費</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.dc_candidates.map((dc: any, index: number) => (
                      <tr key={index}>
                        <td>{dc.name}</td>
                        <td>{dc.latitude.toFixed(6)}</td>
                        <td>{dc.longitude.toFixed(6)}</td>
                        <td>
                          <span style={{ 
                            backgroundColor: '#388e3c', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px' 
                          }}>
                            {dc.capacity}
                          </span>
                        </td>
                        <td>¥{dc.fixed_cost.toLocaleString()}</td>
                        <td>¥{dc.variable_cost}/単位</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 工場データ */}
          {currentTab === 2 && (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <button 
                  className="logistics-button"
                  onClick={() => downloadData('plants')}
                  style={{ marginRight: '8px' }}
                >
                  JSON
                </button>
                <button 
                  className="logistics-button"
                  onClick={() => downloadCSV('plants')}
                >
                  CSV
                </button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="logistics-data-table">
                  <thead>
                    <tr>
                      <th>工場名</th>
                      <th>緯度</th>
                      <th>経度</th>
                      <th>生産能力</th>
                      <th>生産費</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.plants.map((plant: any, index: number) => (
                      <tr key={index}>
                        <td>{plant.name}</td>
                        <td>{plant.latitude.toFixed(6)}</td>
                        <td>{plant.longitude.toFixed(6)}</td>
                        <td>
                          <span style={{ 
                            backgroundColor: '#f57c00', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px' 
                          }}>
                            {plant.capacity}
                          </span>
                        </td>
                        <td>¥{plant.production_cost}/単位</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="logistics-results">
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            <h3>サンプルデータがありません</h3>
            <p>「データ生成」ボタンをクリックしてサンプルデータを作成してください</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleDataGenerator;