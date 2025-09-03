import React, { useState } from 'react';
import { abcApi, DemandRecord, RiskPoolingResult } from '../../services/abc';
import './ABCAnalysis.css';

const RiskPoolingAnalysis: React.FC = () => {
  const [poolGroups, setPoolGroups] = useState<string[][]>([]);
  const [currentGroup, setCurrentGroup] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [period, setPeriod] = useState<string>('1w');
  const [result, setResult] = useState<RiskPoolingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // サンプル需要データ
  const generateSampleData = (): DemandRecord[] => {
    const products = ['製品A', '製品B', '製品C'];
    const customers = ['顧客1', '顧客2', '顧客3', '顧客4', '顧客5'];
    const data: DemandRecord[] = [];
    
    // 3ヶ月分のデータを生成
    for (let day = 0; day < 90; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      for (const prod of products) {
        for (const cust of customers) {
          if (Math.random() > 0.3) { // 70%の確率でデータを生成
            data.push({
              date: date.toISOString().split('T')[0],
              cust,
              prod,
              demand: Math.floor(Math.random() * 50) + 10
            });
          }
        }
      }
    }
    
    return data;
  };

  const handleAddGroup = () => {
    const customers = currentGroup.split(',').map(c => c.trim()).filter(c => c);
    if (customers.length > 0) {
      setPoolGroups([...poolGroups, customers]);
      setCurrentGroup('');
    }
  };

  const handleRemoveGroup = (index: number) => {
    setPoolGroups(poolGroups.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (poolGroups.length === 0) {
      setError('少なくとも1つのプールグループを設定してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const demandData = generateSampleData();
      
      const request = {
        demand_data: demandData,
        pool_groups: poolGroups,
        product: selectedProduct || undefined,
        period: period
      };

      const result = await abcApi.performRiskPooling(request);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'リスクプーリング分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="abc-section">
      <h2>🏢 リスクプーリング分析</h2>

      <div className="abc-info-box">
        <strong>ℹ️ リスクプーリングについて</strong><br />
        複数の顧客や拠点の在庫を統合管理することで、需要の変動を平準化し、
        安全在庫を削減する効果を分析します。
      </div>

      <div className="abc-form">
        <h3>プールグループの設定</h3>
        
        <div className="abc-input-group">
          <label>顧客グループ（カンマ区切り）</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="abc-input"
              type="text"
              value={currentGroup}
              onChange={(e) => setCurrentGroup(e.target.value)}
              placeholder="顧客1, 顧客2, 顧客3"
              style={{ flex: 1 }}
            />
            <button 
              className="abc-button"
              onClick={handleAddGroup}
              style={{ width: 'auto' }}
            >
              グループ追加
            </button>
          </div>
        </div>

        {poolGroups.length > 0 && (
          <div className="abc-pool-groups">
            <h4>設定済みグループ</h4>
            {poolGroups.map((group, index) => (
              <div key={index} className="abc-pool-group-item">
                <span>グループ {index + 1}: {group.join(', ')}</span>
                <button 
                  className="abc-button-small"
                  onClick={() => handleRemoveGroup(index)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="abc-input-group">
          <label>分析対象製品（オプション）</label>
          <input
            className="abc-input"
            type="text"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            placeholder="全製品分析の場合は空欄"
          />
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

        <button
          className="abc-button"
          onClick={handleAnalyze}
          disabled={loading || poolGroups.length === 0}
        >
          {loading ? '分析中...' : 'リスクプーリング分析実行'}
        </button>
      </div>

      {error && <div className="abc-error">{error}</div>}

      {result && (
        <div className="abc-results">
          <div className="abc-result-header">📊 リスクプーリング分析結果</div>
          
          <div className="abc-metrics">
            <div className="abc-metric">
              <div className="abc-metric-label">プーリング効率</div>
              <div className="abc-metric-value">
                {(result.pooling_efficiency * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <h4>安全在庫削減率</h4>
          <table className="abc-data-table">
            <thead>
              <tr>
                <th>プールグループ</th>
                <th>安全在庫削減率</th>
                <th>リスク削減率</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.safety_stock_reduction).map(([group, reduction]) => (
                <tr key={group}>
                  <td>{group}</td>
                  <td className="abc-positive">
                    {(reduction * 100).toFixed(1)}%
                  </td>
                  <td className="abc-positive">
                    {(result.risk_reduction[group] * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>統計比較</h4>
          <table className="abc-data-table">
            <thead>
              <tr>
                <th>グループ</th>
                <th>管理方法</th>
                <th>安全在庫</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.original_stats).map(([group, stats]) => (
                <React.Fragment key={group}>
                  <tr>
                    <td rowSpan={2}>{group}</td>
                    <td>個別管理</td>
                    <td>{stats.total_safety_stock.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>プール管理</td>
                    <td className="abc-positive">
                      {result.pooled_stats[group].safety_stock.toFixed(2)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RiskPoolingAnalysis;