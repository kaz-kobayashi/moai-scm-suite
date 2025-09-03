import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { inventoryApi } from '../../services/api';
import '../SAPStyle.css';

interface DemandData {
  period: string;
  demand: number;
}

interface DistributionCandidate {
  distribution: string;
  enabled: boolean;
}

const DemandDistributionFitting: React.FC = () => {
  const [demandData, setDemandData] = useState<DemandData[]>([
    { period: '2023-01', demand: 85 },
    { period: '2023-02', demand: 92 },
    { period: '2023-03', demand: 78 },
    { period: '2023-04', demand: 95 },
    { period: '2023-05', demand: 103 },
    { period: '2023-06', demand: 88 },
    { period: '2023-07', demand: 91 },
    { period: '2023-08', demand: 97 },
    { period: '2023-09', demand: 86 },
    { period: '2023-10', demand: 94 },
    { period: '2023-11', demand: 99 },
    { period: '2023-12', demand: 105 },
  ]);

  const [distributionCandidates, setDistributionCandidates] = useState<DistributionCandidate[]>([
    { distribution: 'normal', enabled: true },
    { distribution: 'gamma', enabled: true },
    { distribution: 'lognormal', enabled: true },
    { distribution: 'weibull', enabled: true },
    { distribution: 'exponential', enabled: false },
    { distribution: 'uniform', enabled: false },
    { distribution: 'beta', enabled: false },
    { distribution: 'poisson', enabled: false },
  ]);

  const [fittingMethod, setFittingMethod] = useState<'mle' | 'moment' | 'ls'>('mle');
  const [significanceLevel, setSignificanceLevel] = useState(0.05);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addDataRow = () => {
    const nextPeriod = `2024-${String(demandData.length - 11).padStart(2, '0')}`;
    setDemandData([...demandData, { 
      period: nextPeriod, 
      demand: Math.round(90 + Math.random() * 20) 
    }]);
  };

  const updateDataRow = (index: number, field: keyof DemandData, value: string | number) => {
    const newData = [...demandData];
    (newData[index] as any)[field] = field === 'demand' ? Number(value) : value;
    setDemandData(newData);
  };

  const removeDataRow = (index: number) => {
    setDemandData(demandData.filter((_, i) => i !== index));
  };

  const toggleDistribution = (index: number) => {
    const newCandidates = [...distributionCandidates];
    newCandidates[index].enabled = !newCandidates[index].enabled;
    setDistributionCandidates(newCandidates);
  };

  const generateSampleData = () => {
    const sampleData: DemandData[] = [];
    for (let i = 1; i <= 24; i++) {
      const year = 2023 + Math.floor((i - 1) / 12);
      const month = ((i - 1) % 12) + 1;
      const period = `${year}-${String(month).padStart(2, '0')}`;
      
      // Generate sample data with trend and seasonality
      const trend = 90 + i * 0.5;
      const seasonal = 10 * Math.sin(2 * Math.PI * month / 12);
      const noise = (Math.random() - 0.5) * 20;
      const demand = Math.round(Math.max(0, trend + seasonal + noise));
      
      sampleData.push({ period, demand });
    }
    setDemandData(sampleData);
  };

  const uploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const newData: DemandData[] = [];
      
      lines.slice(1).forEach(line => { // Skip header
        const [period, demand] = line.split(',');
        if (period && demand && !isNaN(Number(demand))) {
          newData.push({ period: period.trim(), demand: Number(demand) });
        }
      });
      
      if (newData.length > 0) {
        setDemandData(newData);
      }
    };
    reader.readAsText(file);
  };

  const runFitting = async () => {
    setLoading(true);
    try {
      const enabledDistributions = distributionCandidates
        .filter(d => d.enabled)
        .map(d => d.distribution);
      
      const request = {
        demand_data: demandData.map(d => d.demand),
        period_labels: demandData.map(d => d.period),
        distribution_candidates: enabledDistributions,
        fitting_method: fittingMethod,
        significance_level: significanceLevel,
        include_goodness_of_fit: true,
        include_plots: true,
        include_forecast: true,
      };
      
      const response = await inventoryApi.fitDemandDistribution(request);
      setResult(response.data);
    } catch (error) {
      console.error('Error running demand distribution fitting:', error);
      alert('需要分布フィッティングに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">📈 需要分布フィッティング</h1>
        <p className="sap-page-subtitle">履歴需要データから最適な確率分布を推定し、将来需要の予測に活用します</p>
      </div>
      
      <div className="sap-main">
        <div className="sap-form-section">
          <div className="sap-form-header">需要データ入力</div>
          <div className="sap-form-content">
            <div className="sap-form-actions">
              <button className="sap-button sap-button-emphasized" onClick={addDataRow}>
                ➕ 行追加
              </button>
              <button className="sap-button" onClick={generateSampleData}>
                🎲 サンプルデータ生成
              </button>
              <input type="file" accept=".csv" onChange={uploadCSV} style={{ display: 'none' }} id="csv-upload" />
              <label htmlFor="csv-upload" className="sap-button sap-button-neutral">
                📤 CSVアップロード
              </label>
            </div>
          
            <div className="sap-table-container">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th className="sap-table-header">期間</th>
                    <th className="sap-table-header">需要量</th>
                    <th className="sap-table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {demandData.map((row, index) => (
                    <tr key={index}>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="text"
                          value={row.period}
                          onChange={(e) => updateDataRow(index, 'period', e.target.value)}
                          placeholder="YYYY-MM"
                        />
                      </td>
                      <td className="sap-table-cell">
                        <input
                          className="sap-input"
                          type="number"
                          value={row.demand}
                          onChange={(e) => updateDataRow(index, 'demand', e.target.value)}
                          min="0"
                        />
                      </td>
                      <td className="sap-table-cell">
                        <button 
                          className="sap-button sap-button-negative"
                          onClick={() => removeDataRow(index)} 
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {demandData.length > 0 && (
                <div className="sap-object-status">
                  <span>データ数: {demandData.length}</span>
                  <span>
                    平均: {(demandData.reduce((sum, d) => sum + d.demand, 0) / demandData.length).toFixed(1)}
                  </span>
                  <span>
                    標準偏差: {
                      Math.sqrt(
                        demandData.reduce((sum, d) => {
                          const mean = demandData.reduce((s, dd) => s + dd.demand, 0) / demandData.length;
                          return sum + Math.pow(d.demand - mean, 2);
                        }, 0) / (demandData.length - 1)
                      ).toFixed(1)
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="sap-form-section">
          <div className="sap-form-header">分布候補選択</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              {distributionCandidates.map((candidate, index) => (
                <div key={index} className="sap-field">
                  <label className="sap-checkbox">
                    <input
                      type="checkbox"
                      checked={candidate.enabled}
                      onChange={() => toggleDistribution(index)}
                    />
                    <span>{candidate.distribution}分布</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="sap-form-section">
          <div className="sap-form-header">フィッティング設定</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-label">推定方法:</label>
                <select
                  className="sap-select"
                  value={fittingMethod}
                  onChange={(e) => setFittingMethod(e.target.value as any)}
                >
                  <option value="mle">最尤推定 (MLE)</option>
                  <option value="moment">モーメント法</option>
                  <option value="ls">最小二乗法</option>
                </select>
              </div>
              
              <div className="sap-field">
                <label className="sap-label">有意水準:</label>
                <input
                  className="sap-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.1"
                  value={significanceLevel}
                  onChange={(e) => setSignificanceLevel(Number(e.target.value))}
                />
                <span className="sap-hint">({(significanceLevel * 100)}%)</span>
              </div>
            </div>
            
            <div className="sap-form-actions">
              <button
                className="sap-button sap-button-emphasized"
                onClick={runFitting}
                disabled={loading || demandData.length === 0}
              >
                {loading ? '分布フィッティング実行中...' : '📈 分布フィッティング実行'}
              </button>
            </div>
          </div>
        </div>
        
        {result && (
          <div className="sap-form-section">
            <div className="sap-form-header">フィッティング結果</div>
            <div className="sap-form-content">
              {result.best_fit && (
                <div className="sap-message-strip sap-message-strip-success">
                  <strong>最適分布:</strong> {result.best_fit.distribution}分布
                  <span>AIC: {result.best_fit.aic?.toFixed(2)}</span>
                  <span>BIC: {result.best_fit.bic?.toFixed(2)}</span>
                </div>
              )}
              
              {result.fitting_plot && (
                <div style={{ marginTop: '20px' }}>
                  <Plot
                    data={JSON.parse(result.fitting_plot).data}
                    layout={{
                      ...JSON.parse(result.fitting_plot).layout,
                      width: 800,
                      height: 500,
                    }}
                    config={{ responsive: true }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandDistributionFitting;