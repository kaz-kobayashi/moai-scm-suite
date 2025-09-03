import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { DemandRecord } from '../../types';
import { abcApi } from '../../services/api';
import '../SAPStyle.css';

const RankAnalysis: React.FC = () => {
  const [demandData, setDemandData] = useState<DemandRecord[]>([
    { date: "2023-01-01", cust: "顧客A", prod: "製品X", demand: 100 },
    { date: "2023-02-01", cust: "顧客A", prod: "製品X", demand: 120 },
    { date: "2023-03-01", cust: "顧客A", prod: "製品X", demand: 80 },
    { date: "2023-01-01", cust: "顧客B", prod: "製品Y", demand: 150 },
    { date: "2023-02-01", cust: "顧客B", prod: "製品Y", demand: 140 },
    { date: "2023-03-01", cust: "顧客B", prod: "製品Y", demand: 160 },
    { date: "2023-01-01", cust: "顧客C", prod: "製品Z", demand: 200 },
    { date: "2023-02-01", cust: "顧客C", prod: "製品Z", demand: 180 },
    { date: "2023-03-01", cust: "顧客C", prod: "製品Z", demand: 220 },
  ]);
  const [analysis, setAnalysis] = useState<'cust' | 'prod'>('prod');
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateRankAnalysis = async () => {
    setLoading(true);
    try {
      const request = {
        demand_data: demandData,
        analysis_type: analysis,
        time_column: 'date',
        group_column: analysis,
        value_column: 'demand',
      };
      const response = await abcApi.performRankAnalysis(request);
      const figure = JSON.parse(response.data.figure);
      setPlotData(figure);
    } catch (error) {
      console.error('Error generating rank analysis:', error);
      alert('ランク分析の生成に失敗しました');
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

  const updateDemandRow = (index: number, field: keyof DemandRecord, value: string | number) => {
    const newData = [...demandData];
    (newData[index] as any)[field] = field === 'demand' ? Number(value) : value;
    setDemandData(newData);
  };

  const removeDemandRow = (index: number) => {
    setDemandData(demandData.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* ページヘッダー */}
      <div className="sap-page-header">
        <h1 className="sap-page-title">📈 ランク分析（時系列）</h1>
        <p className="sap-page-subtitle">製品や顧客の需要ランキングの時系列変化を分析します</p>
      </div>

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
                        placeholder="顧客名"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="sap-input sap-input-small"
                        value={row.prod}
                        onChange={(e) => updateDemandRow(index, 'prod', e.target.value)}
                        placeholder="製品名"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="sap-input sap-input-small"
                        value={row.demand}
                        onChange={(e) => updateDemandRow(index, 'demand', e.target.value)}
                        min="0"
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

      {/* 分析対象選択セクション */}
      <div className="sap-form-section">
        <div className="sap-form-header">分析対象</div>
        <div className="sap-form-content">
          <div className="sap-form-grid">
            <div className="sap-field">
              <label className="sap-radio">
                <input
                  type="radio"
                  value="cust"
                  checked={analysis === 'cust'}
                  onChange={(e) => setAnalysis(e.target.value as 'cust' | 'prod')}
                />
                <span className="sap-radio-text">顧客別ランク分析</span>
              </label>
              <span className="sap-hint">顧客ごとの需要ランキング時系列変化を分析</span>
            </div>
            <div className="sap-field">
              <label className="sap-radio">
                <input
                  type="radio"
                  value="prod"
                  checked={analysis === 'prod'}
                  onChange={(e) => setAnalysis(e.target.value as 'cust' | 'prod')}
                />
                <span className="sap-radio-text">製品別ランク分析</span>
              </label>
              <span className="sap-hint">製品ごとの需要ランキング時系列変化を分析</span>
            </div>
          </div>
        </div>
      </div>

      {/* 実行ボタンセクション */}
      <div className="sap-action-bar">
        <button 
          onClick={generateRankAnalysis} 
          disabled={loading} 
          className="sap-button sap-button-emphasized"
        >
          {loading ? '分析中...' : 'ランク分析を実行'}
        </button>
      </div>
      
      {/* チャート表示セクション */}
      {plotData && (
        <div className="sap-chart-container">
          <div className="sap-chart-header">
            <h3 className="sap-chart-title">ランク変化の時系列分析</h3>
          </div>
          <div className="sap-chart-content" style={{ textAlign: 'center' }}>
            <Plot
              data={plotData.data}
              layout={{
                ...plotData.layout,
                width: 900,
                height: 600,
                title: `${analysis === 'cust' ? '顧客' : '製品'}別需要ランクの時系列変化`
              }}
            />
          </div>
        </div>
      )}

      {/* 分析結果の説明セクション */}
      {plotData && (
        <div className="sap-panel">
          <div className="sap-panel-header">
            <h3 className="sap-panel-title">分析結果の見方</h3>
          </div>
          <div className="sap-panel-content">
            <div className="sap-list">
              <div className="sap-list-item">
                <div className="sap-list-item-title">縦軸（ランク）</div>
                <div className="sap-list-item-description">1位が最上位、数値が小さいほど高ランク</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">横軸（時間軸）</div>
                <div className="sap-list-item-description">時間の経過に沿ったランク変化を表示</div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">各線の意味</div>
                <div className="sap-list-item-description">
                  {analysis === 'cust' ? '顧客' : '製品'}ごとのランク変化を個別の線で表示
                </div>
              </div>
              <div className="sap-list-item">
                <div className="sap-list-item-title">トレンドの解釈</div>
                <div className="sap-list-item-description">
                  線が下降している場合はランクが向上、上昇している場合はランクが低下を示す
                </div>
              </div>
            </div>

            {/* 分析のポイント */}
            <div className="sap-form-section">
              <div className="sap-form-header">分析のポイント</div>
              <div className="sap-form-content">
                <div className="sap-object-header">
                  <div className="sap-object-attributes">
                    <div className="sap-object-attribute">
                      <span className="sap-object-attribute-label">ランク上昇:</span>
                      <span className="sap-object-attribute-value sap-status success">
                        需要増加により競争力が向上
                      </span>
                    </div>
                    <div className="sap-object-attribute">
                      <span className="sap-object-attribute-label">ランク下降:</span>
                      <span className="sap-object-attribute-value sap-status warning">
                        需要減少により相対的地位が低下
                      </span>
                    </div>
                    <div className="sap-object-attribute">
                      <span className="sap-object-attribute-label">安定したランク:</span>
                      <span className="sap-object-attribute-value sap-status info">
                        一定の市場地位を維持
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RankAnalysis;