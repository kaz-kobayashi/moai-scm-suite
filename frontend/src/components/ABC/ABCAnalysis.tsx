import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { ABCAnalysisRequest, DemandRecord } from '../../types';
import { abcApi } from '../../services/api';
import RankAnalysis from './RankAnalysis';
import RiskPoolingAnalysis from './RiskPoolingAnalysis';
import MeanCVAnalysis from './MeanCVAnalysis';
import '../SAPStyle.css';

type ABCTabType = 'basic' | 'rank' | 'risk-pooling' | 'mean-cv';

const ABCAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ABCTabType>('basic');
  const [demandData, setDemandData] = useState<DemandRecord[]>([
    { date: "2023-01-01", cust: "顧客A", prod: "製品X", demand: 1000 },
    { date: "2023-01-01", cust: "顧客B", prod: "製品Y", demand: 1500 },
    { date: "2023-01-01", cust: "顧客C", prod: "製品Z", demand: 500 },
    { date: "2023-01-02", cust: "顧客A", prod: "製品Y", demand: 800 },
    { date: "2023-01-02", cust: "顧客B", prod: "製品X", demand: 1200 },
  ]);
  const [threshold, setThreshold] = useState([0.7, 0.2, 0.1]);
  const [plotData, setPlotData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const performAnalysis = async () => {
    setLoading(true);
    try {
      // ABC分析の実行
      const analysisRequest: ABCAnalysisRequest = {
        demand_data: demandData,
        threshold,
        agg_col: 'prod',
        value_col: 'demand',
        abc_name: 'abc',
        rank_name: 'rank',
      };
      const analysisResponse = await abcApi.performAnalysis(analysisRequest);
      setAnalysisResult(analysisResponse.data);

      // 図の生成
      const figuresRequest = {
        demand_data: demandData,
        value: 'demand',
        cumsum: true,
        cust_thres: threshold.join(','),
        prod_thres: threshold.join(','),
      };
      const figuresResponse = await abcApi.generateFigures(figuresRequest);
      const prodFigure = JSON.parse(figuresResponse.data.product_figure);
      setPlotData(prodFigure);
    } catch (error) {
      console.error('Error performing ABC analysis:', error);
      alert('ABC分析の実行に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addDemandRow = () => {
    setDemandData([...demandData, { 
      date: new Date().toISOString().split('T')[0], 
      cust: "", 
      prod: "", 
      demand: 0 
    }]);
  };

  const removeDemandRow = (index: number) => {
    setDemandData(demandData.filter((_, i) => i !== index));
  };

  const updateDemandRow = (index: number, field: keyof DemandRecord, value: string | number) => {
    const newData = [...demandData];
    (newData[index] as any)[field] = field === 'demand' ? Number(value) : value;
    setDemandData(newData);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicABCAnalysis();
      case 'rank':
        return <RankAnalysis />;
      case 'risk-pooling':
        return <RiskPoolingAnalysis />;
      case 'mean-cv':
        return <MeanCVAnalysis />;
      default:
        return renderBasicABCAnalysis();
    }
  };

  const renderBasicABCAnalysis = () => (
    <>
      {/* 需要データセクション */}
      <div className="sap-form-section">
        <div className="sap-form-header">需要データ</div>
        <div className="sap-form-content">
          <div className="sap-table-container">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>顧客</th>
                  <th>製品</th>
                  <th>需要量</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {demandData.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="date"
                        className="sap-input sap-input-small"
                        value={row.date}
                        onChange={(e) => updateDemandRow(index, 'date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={row.cust}
                        onChange={(e) => updateDemandRow(index, 'cust', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={row.prod}
                        onChange={(e) => updateDemandRow(index, 'prod', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="sap-input sap-input-small"
                        value={row.demand}
                        onChange={(e) => updateDemandRow(index, 'demand', e.target.value)}
                      />
                    </td>
                    <td>
                      <button 
                        onClick={() => removeDemandRow(index)} 
                        className="sap-button sap-button-text sap-button-danger"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={addDemandRow}
            className="sap-button sap-button-primary"
          >
            行を追加
          </button>
        </div>
      </div>

      {/* ABC分類閾値セクション */}
      <div className="sap-form-section">
        <div className="sap-form-header">ABC分類閾値</div>
        <div className="sap-form-content">
          <div className="sap-form-grid">
            <div className="sap-field">
              <label className="sap-label">Aカテゴリ閾値</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                max="1" 
                className="sap-input"
                value={threshold[0]} 
                onChange={(e) => setThreshold([Number(e.target.value), threshold[1], threshold[2]])} 
              />
              <span className="sap-hint">累積需要割合の閾値 (例: 0.7 = 70%)</span>
            </div>
            <div className="sap-field">
              <label className="sap-label">Bカテゴリ閾値</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                max="1" 
                className="sap-input"
                value={threshold[1]} 
                onChange={(e) => setThreshold([threshold[0], Number(e.target.value), threshold[2]])} 
              />
              <span className="sap-hint">累積需要割合の閾値 (例: 0.2 = 20%)</span>
            </div>
            <div className="sap-field">
              <label className="sap-label">Cカテゴリ閾値</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                max="1" 
                className="sap-input"
                value={threshold[2]} 
                onChange={(e) => setThreshold([threshold[0], threshold[1], Number(e.target.value)])} 
              />
              <span className="sap-hint">累積需要割合の閾値 (例: 0.1 = 10%)</span>
            </div>
          </div>
          
          <div className="sap-object-header" style={{ marginTop: '16px' }}>
            <div className="sap-object-header-title">
              <span className="sap-object-attribute-label">閾値合計:</span>
              <span className="sap-object-number">
                {threshold.reduce((a, b) => a + b, 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 実行ボタンセクション */}
      <div className="sap-action-bar">
        <button 
          onClick={performAnalysis} 
          disabled={loading}
          className="sap-button sap-button-emphasized"
        >
          {loading ? '分析中...' : 'ABC分析を実行'}
        </button>
      </div>
      
      {/* チャート表示セクション */}
      {plotData && (
        <div className="sap-chart-container">
          <div className="sap-chart-header">
            <h3 className="sap-chart-title">製品別ABC分析（累積需要）</h3>
          </div>
          <div className="sap-chart-content" style={{ textAlign: 'center' }}>
            <Plot
              data={plotData.data}
              layout={{
                ...plotData.layout,
                width: 800,
                height: 600,
                title: '製品別ABC分析（累積需要）'
              }}
            />
          </div>
        </div>
      )}
      
      {/* 分析結果セクション */}
      {analysisResult && (
        <div className="sap-panel">
          <div className="sap-panel-header">
            <h3 className="sap-panel-title">分析結果</h3>
          </div>
          <div className="sap-panel-content">
            <div className="sap-form-section">
              <div className="sap-form-header">カテゴリ分類</div>
              <div className="sap-form-content">
                {Object.entries(analysisResult.categories).map(([key, products]: [string, any]) => (
                  <div key={key} className="sap-object-attribute">
                    <span className="sap-object-attribute-label">
                      {key === '0' ? 'Aカテゴリ' : key === '1' ? 'Bカテゴリ' : 'Cカテゴリ'}:
                    </span>
                    <span className="sap-object-attribute-value">
                      {products.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">📊 ABC分析システム</h1>
        <p className="sap-page-subtitle">需要データをABCカテゴリに分類し、パレート分析を実行します</p>
      </div>
      
      {/* タブナビゲーション */}
      <div className="sap-form-section">
        <div className="sap-form-header">分析タイプ</div>
        <div className="sap-form-content">
          <div className="sap-form-grid">
            <div className="sap-field">
              <button 
                className={`sap-button ${activeTab === 'basic' ? 'sap-button-emphasized' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                ABC基本分析
              </button>
            </div>
            <div className="sap-field">
              <button 
                className={`sap-button ${activeTab === 'rank' ? 'sap-button-emphasized' : ''}`}
                onClick={() => setActiveTab('rank')}
              >
                ランク分析
              </button>
            </div>
            <div className="sap-field">
              <button 
                className={`sap-button ${activeTab === 'risk-pooling' ? 'sap-button-emphasized' : ''}`}
                onClick={() => setActiveTab('risk-pooling')}
              >
                リスクプーリング
              </button>
            </div>
            <div className="sap-field">
              <button 
                className={`sap-button ${activeTab === 'mean-cv' ? 'sap-button-emphasized' : ''}`}
                onClick={() => setActiveTab('mean-cv')}
              >
                平均-CV分析
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="sap-main">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ABCAnalysis;