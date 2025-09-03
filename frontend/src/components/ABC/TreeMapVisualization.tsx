import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { TreeMapRequest, DemandRecord, ABCAnalysisRequest } from '../../types';
import { abcApi } from '../../services/api';
import '../SAPStyle.css';

const TreeMapVisualization: React.FC = () => {
  const [demandData, setDemandData] = useState<DemandRecord[]>([
    { date: "2023-01-01", cust: "顧客A", prod: "製品X", demand: 100 },
    { date: "2023-01-01", cust: "顧客B", prod: "製品Y", demand: 150 },
    { date: "2023-01-02", cust: "顧客A", prod: "製品Y", demand: 80 },
    { date: "2023-01-03", cust: "顧客C", prod: "製品Z", demand: 200 },
    { date: "2023-01-04", cust: "顧客B", prod: "製品X", demand: 90 },
  ]);
  const [parent, setParent] = useState<'cust' | 'prod'>('cust');
  const [plotData, setPlotData] = useState<any>(null);
  const [abcData, setAbcData] = useState<any>(null);
  const [showABC, setShowABC] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateTreeMap = async () => {
    setLoading(true);
    try {
      const request: TreeMapRequest = {
        demand_data: demandData,
        parent,
        value: 'demand',
      };
      const response = await abcApi.createTreeMap(request);
      const figure = JSON.parse(response.data.figure);
      setPlotData(figure);
      
      // ABC分析も実行する場合
      if (showABC) {
        await generateABCAnalysis();
      }
    } catch (error) {
      console.error('Error generating TreeMap:', error);
      alert('TreeMapの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const generateABCAnalysis = async () => {
    try {
      const abcRequest: ABCAnalysisRequest = {
        demand_data: demandData,
        threshold: [0.7, 0.2, 0.1],
        agg_col: parent === 'cust' ? 'cust' : 'prod',
        value_col: 'demand',
        abc_name: 'abc_category',
        rank_name: 'rank',
      };
      const response = await abcApi.performAnalysis(abcRequest);
      setAbcData(response.data);
    } catch (error) {
      console.error('Error generating ABC analysis:', error);
    }
  };

  const generateTreeMapWithABC = async () => {
    setLoading(true);
    try {
      // ABC分析を先に実行
      const abcRequest: ABCAnalysisRequest = {
        demand_data: demandData,
        threshold: [0.7, 0.2, 0.1],
        agg_col: parent === 'cust' ? 'cust' : 'prod',
        value_col: 'demand',
        abc_name: 'abc_category',
        rank_name: 'rank',
      };
      const abcResponse = await abcApi.performAnalysis(abcRequest);
      setAbcData(abcResponse.data);
      
      // 通常のTreeMapを生成（ABC情報は別途表示）
      const request: TreeMapRequest = {
        demand_data: demandData,
        parent,
        value: 'demand',
      };
      const treeMapResponse = await abcApi.createTreeMap(request);
      const figure = JSON.parse(treeMapResponse.data.figure);
      setPlotData(figure);
    } catch (error) {
      console.error('Error generating TreeMap with ABC:', error);
      alert('ABC統合TreeMapの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addDemandRow = () => {
    setDemandData([...demandData, { 
      date: "2023-01-01", 
      cust: "", 
      prod: "", 
      demand: 0 
    }]);
  };

  const updateDemandRow = (index: number, field: keyof DemandRecord, value: string | number) => {
    const newData = [...demandData];
    (newData[index] as any)[field] = field === 'demand' ? Number(value) : value;
    setDemandData(newData);
  };

  const removeDemandRow = (index: number) => {
    setDemandData(demandData.filter((_, i) => i !== index));
  };

  return (
    <div className="sap-application">
      <div className="sap-page-header">
        <h1 className="sap-page-title">📊 需要TreeMap可視化</h1>
        <p className="sap-page-subtitle">TreeMapを使用した需要パターンの視覚的分析ツール</p>
      </div>
      
      <div className="sap-main">
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

        {/* グループ化セクション */}
        <div className="sap-form-section">
          <div className="sap-form-header">グループ化</div>
          <div className="sap-form-content">
            <div className="sap-form-grid">
              <div className="sap-field">
                <label className="sap-radio">
                  <input
                    type="radio"
                    value="cust"
                    checked={parent === 'cust'}
                    onChange={(e) => setParent(e.target.value as 'cust' | 'prod')}
                  />
                  <span className="sap-radio-text">顧客別</span>
                </label>
              </div>
              <div className="sap-field">
                <label className="sap-radio">
                  <input
                    type="radio"
                    value="prod"
                    checked={parent === 'prod'}
                    onChange={(e) => setParent(e.target.value as 'cust' | 'prod')}
                  />
                  <span className="sap-radio-text">製品別</span>
                </label>
              </div>
            </div>
            
            <div className="sap-form-grid" style={{ marginTop: '16px' }}>
              <div className="sap-field">
                <button 
                  onClick={generateTreeMap} 
                  disabled={loading}
                  className="sap-button sap-button-emphasized"
                >
                  {loading ? '生成中...' : 'TreeMapを生成'}
                </button>
              </div>
              <div className="sap-field">
                <button 
                  onClick={generateTreeMapWithABC} 
                  disabled={loading}
                  className="sap-button sap-button-primary"
                >
                  {loading ? '生成中...' : 'ABC分析統合TreeMap'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="sap-checkbox">
                <input
                  type="checkbox"
                  checked={showABC}
                  onChange={(e) => setShowABC(e.target.checked)}
                />
                <span className="sap-checkbox-label">ABC分析結果を表示</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* チャート表示セクション */}
        {plotData && (
          <div className="sap-chart-container">
            <div className="sap-chart-header">
              <h3 className="sap-chart-title">
                {showABC ? 'ABC分析統合TreeMap' : '需要TreeMap'}
              </h3>
            </div>
            <div className="sap-chart-content" style={{ textAlign: 'center' }}>
              <Plot
                data={plotData.data}
                layout={{
                  ...plotData.layout,
                  width: 800,
                  height: 600,
                  title: showABC ? 'ABC分析統合TreeMap' : '需要TreeMap'
                }}
              />
            </div>
          </div>
        )}
        
        {/* ABC分析結果セクション */}
        {showABC && abcData && (
          <div className="sap-panel">
            <div className="sap-panel-header">
              <h3 className="sap-panel-title">ABC分析結果</h3>
            </div>
            <div className="sap-panel-content">
              {/* カテゴリ別集計 */}
              {abcData.categories && (
                <div className="sap-form-section">
                  <div className="sap-form-header">カテゴリ別集計</div>
                  <div className="sap-form-content">
                    {Object.entries(abcData.categories).map(([key, values]: [string, any]) => (
                      <div key={key} className="sap-object-attribute">
                        <span className="sap-object-attribute-label">
                          {key === '0' ? 'カテゴリーA' : key === '1' ? 'カテゴリーB' : 'カテゴリーC'}:
                        </span>
                        <span className="sap-object-attribute-value">
                          {Array.isArray(values) ? values.join(', ') : values}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 集計データ */}
              {abcData.aggregated_data && (
                <div className="sap-form-section">
                  <div className="sap-form-header">集計データ</div>
                  <div className="sap-form-content">
                    <div className="sap-table-container">
                      <table className="sap-table">
                        <thead>
                          <tr>
                            <th>{parent === 'cust' ? '顧客' : '製品'}</th>
                            <th>需要量</th>
                            <th>累積割合</th>
                            <th>ABCカテゴリ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(abcData.aggregated_data).map(([key, value]: [string, any], index) => (
                            <tr key={index}>
                              <td>{key}</td>
                              <td>{typeof value === 'object' ? value.demand || value : value}</td>
                              <td>-</td>
                              <td>-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeMapVisualization;