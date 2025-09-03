import React, { useState, useEffect } from 'react';
import { abcApi, DemandRecord, MeanCVAnalysisResult, SegmentData } from '../../services/abc';
import Plot from 'react-plotly.js';
import './ABCAnalysis.css';

const MeanCVAnalysis: React.FC = () => {
  const [segmentBy, setSegmentBy] = useState<string>('prod');
  const [period, setPeriod] = useState<string>('1w');
  const [cvThreshold, setCvThreshold] = useState<number>(0.5);
  const [result, setResult] = useState<MeanCVAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // サンプル需要データ
  const generateSampleData = (): DemandRecord[] => {
    const products = [
      '製品A', '製品B', '製品C', '製品D', '製品E',
      '製品F', '製品G', '製品H', '製品I', '製品J'
    ];
    const customers = ['顧客1', '顧客2', '顧客3', '顧客4', '顧客5'];
    const data: DemandRecord[] = [];
    
    // 製品ごとに異なる需要パターンを設定
    const productPatterns = {
      '製品A': { baseDemand: 100, variability: 0.1 },   // 高需要・低変動
      '製品B': { baseDemand: 80, variability: 0.2 },    // 高需要・低変動
      '製品C': { baseDemand: 90, variability: 0.6 },    // 高需要・高変動
      '製品D': { baseDemand: 70, variability: 0.8 },    // 高需要・高変動
      '製品E': { baseDemand: 20, variability: 0.1 },    // 低需要・低変動
      '製品F': { baseDemand: 15, variability: 0.2 },    // 低需要・低変動
      '製品G': { baseDemand: 10, variability: 0.9 },    // 低需要・高変動
      '製品H': { baseDemand: 25, variability: 1.2 },    // 低需要・高変動
      '製品I': { baseDemand: 50, variability: 0.3 },    // 中需要・中変動
      '製品J': { baseDemand: 40, variability: 0.4 },    // 中需要・中変動
    };
    
    // 3ヶ月分のデータを生成
    for (let day = 0; day < 90; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      for (const prod of products) {
        const pattern = productPatterns[prod as keyof typeof productPatterns] || 
                       { baseDemand: 30, variability: 0.5 };
        
        for (const cust of customers) {
          if (Math.random() > 0.3) { // 70%の確率でデータを生成
            const demand = Math.max(
              0,
              pattern.baseDemand + 
              (Math.random() - 0.5) * pattern.baseDemand * pattern.variability
            );
            
            data.push({
              date: date.toISOString().split('T')[0],
              cust,
              prod,
              demand: Math.floor(demand)
            });
          }
        }
      }
    }
    
    return data;
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const demandData = generateSampleData();
      
      const request = {
        demand_data: demandData,
        segment_by: segmentBy,
        period: period,
        cv_threshold: cvThreshold
      };

      const result = await abcApi.performMeanCVAnalysis(request);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mean-CV分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回実行
  useEffect(() => {
    handleAnalyze();
  }, []);

  const getStrategyColor = (classification: string) => {
    switch (classification) {
      case 'High Volume, Low Variability':
        return '#4caf50'; // 緑
      case 'High Volume, High Variability':
        return '#ff9800'; // オレンジ
      case 'Low Volume, Low Variability':
        return '#2196f3'; // 青
      case 'Low Volume, High Variability':
        return '#f44336'; // 赤
      default:
        return '#9e9e9e'; // グレー
    }
  };

  return (
    <div className="abc-section">
      <h2>📈 Mean-CV分析</h2>

      <div className="abc-info-box">
        <strong>ℹ️ Mean-CV分析について</strong><br />
        製品や顧客の平均需要（Mean）と変動係数（CV: Coefficient of Variation）を分析し、
        在庫管理戦略を最適化します。高需要・低変動の製品と低需要・高変動の製品では
        異なる管理手法が必要です。
      </div>

      <div className="abc-form">
        <div className="abc-input-group">
          <label>セグメント化の軸</label>
          <select
            className="abc-input"
            value={segmentBy}
            onChange={(e) => setSegmentBy(e.target.value)}
          >
            <option value="prod">製品別</option>
            <option value="cust">顧客別</option>
          </select>
        </div>

        <div className="abc-input-group">
          <label>集計期間</label>
          <select
            className="abc-input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="1d">日次</option>
            <option value="1w">週次</option>
            <option value="1M">月次</option>
          </select>
        </div>

        <div className="abc-input-group">
          <label>CV閾値</label>
          <input
            className="abc-input"
            type="number"
            value={cvThreshold}
            onChange={(e) => setCvThreshold(parseFloat(e.target.value) || 0.5)}
            min="0"
            max="2"
            step="0.1"
          />
        </div>

        <button
          className="abc-button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? '分析中...' : 'Mean-CV分析実行'}
        </button>
      </div>

      {error && <div className="abc-error">{error}</div>}

      {result && (
        <div className="abc-results">
          <div className="abc-result-header">📊 Mean-CV分析結果</div>
          
          {/* 散布図 */}
          {result.mean_cv_plot && (
            <div className="abc-plot-container">
              <Plot
                data={result.mean_cv_plot.data}
                layout={{
                  ...result.mean_cv_plot.layout,
                  height: 500,
                  margin: { t: 50, b: 50, l: 60, r: 150 }
                }}
                config={{ responsive: true }}
              />
            </div>
          )}

          {/* セグメント分類表 */}
          <h4>セグメント分類と管理戦略</h4>
          <table className="abc-data-table">
            <thead>
              <tr>
                <th>セグメント</th>
                <th>平均需要</th>
                <th>標準偏差</th>
                <th>CV</th>
                <th>分類</th>
                <th>推奨管理戦略</th>
              </tr>
            </thead>
            <tbody>
              {result.segments && Array.isArray(result.segments) && result.segments.map((segment: SegmentData, index: number) => (
                <tr key={index}>
                  <td>{segment.segment}</td>
                  <td>{segment.mean?.toFixed(2)}</td>
                  <td>{segment.std?.toFixed(2)}</td>
                  <td>{segment.cv?.toFixed(3)}</td>
                  <td>
                    <span style={{
                      backgroundColor: getStrategyColor(segment.classification),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {segment.classification}
                    </span>
                  </td>
                  <td>{result.management_strategy && result.management_strategy[segment.segment]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 戦略別サマリー */}
          <h4>戦略別サマリー</h4>
          <div className="abc-strategy-summary">
            {result.segments && Array.isArray(result.segments) && Object.entries(
              result.segments.reduce((acc: Record<string, string[]>, segment: any) => {
                const classification = segment.classification;
                if (!acc[classification]) {
                  acc[classification] = [];
                }
                acc[classification].push(segment.segment);
                return acc;
              }, {} as Record<string, string[]>)
            ).map(([classification, segments]) => (
              <div key={classification} className="abc-strategy-card">
                <div 
                  className="abc-strategy-header"
                  style={{ backgroundColor: getStrategyColor(classification) }}
                >
                  {classification}
                </div>
                <div className="abc-strategy-content">
                  <p><strong>セグメント数:</strong> {segments.length}</p>
                  <p><strong>該当セグメント:</strong></p>
                  <div className="abc-segment-list">
                    {segments.slice(0, 5).join(', ')}
                    {segments.length > 5 && ` ... 他${segments.length - 5}件`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeanCVAnalysis;