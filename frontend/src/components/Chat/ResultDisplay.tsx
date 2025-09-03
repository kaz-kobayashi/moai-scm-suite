import React from 'react';
import Plot from 'react-plotly.js';

interface ResultDisplayProps {
  result: any;
  functionName: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, functionName }) => {
  if (!result || !result.success) {
    return (
      <div className="result-display error">
        <h4>❌ エラー</h4>
        <p>{result?.message || '計算に失敗しました'}</p>
      </div>
    );
  }

  const renderPlotlyChart = (data: any, title: string) => {
    if (data && data.data && data.layout) {
      return (
        <div className="chart-container">
          <Plot
            data={data.data}
            layout={{
              ...data.layout,
              autosize: true,
              margin: { t: 40, r: 20, b: 40, l: 50 }
            }}
            style={{ width: '100%', height: '400px' }}
            config={{ displayModeBar: false }}
          />
        </div>
      );
    }
    return null;
  };

  const renderTable = (data: any[], title: string) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    const keys = Object.keys(data[0]);
    return (
      <div className="table-container">
        <h5>{title}</h5>
        <div className="table-wrapper">
          <table className="result-table">
            <thead>
              <tr>
                {keys.map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  {keys.map(key => (
                    <td key={key}>
                      {typeof row[key] === 'number' ? row[key].toFixed(2) : String(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <p className="table-note">（上位10件のみ表示。全{data.length}件）</p>
          )}
        </div>
      </div>
    );
  };

  const renderMetrics = (metrics: any, title: string) => {
    return (
      <div className="metrics-container">
        <h5>📊 {title}</h5>
        <div className="metrics-grid">
          {Object.entries(metrics).map(([key, value], index) => {
            // フォーマットされた値を表示
            let displayValue = String(value);
            if (typeof value === 'number') {
              displayValue = value.toLocaleString();
            }
            // 円マークや単位を除去して数値のみ抽出（アニメーション用）
            const numericValue = typeof value === 'number' ? value : 
              parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
            
            return (
              <div key={key} className="metric-item" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="metric-label">{key}</div>
                <div className="metric-value" data-value={numericValue}>
                  {displayValue}
                </div>
                <div className="metric-trend">
                  {index % 3 === 0 ? '📈 上昇' : index % 3 === 1 ? '📊 安定' : '💡 最適'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderABCResults = () => {
    // aggregated_dataから表示用データを変換
    const aggregatedData = result.aggregated_data;
    const tableData = [];
    
    if (aggregatedData && aggregatedData.demand) {
      const products = Object.keys(aggregatedData.demand);
      for (const prod of products) {
        tableData.push({
          製品: prod,
          需要: aggregatedData.demand[prod],
          順位: aggregatedData.rank ? aggregatedData.rank[prod] + 1 : '-',
          ABC分類: aggregatedData.abc ? aggregatedData.abc[prod] : '-'
        });
      }
    }

    // カテゴリ別集計
    const categorySummary: any = {};
    if (result.categories) {
      Object.keys(result.categories).forEach(idx => {
        const categoryLetter = ['A', 'B', 'C'][parseInt(idx)];
        const products = result.categories[idx];
        if (products && products.length > 0) {
          const totalDemand = products.reduce((sum: number, prod: string) => {
            return sum + (aggregatedData?.demand?.[prod] || 0);
          }, 0);
          categorySummary[`${categoryLetter}カテゴリ製品数`] = products.length;
          categorySummary[`${categoryLetter}カテゴリ需要合計`] = totalDemand;
        }
      });
    }

    // 追加のKPI計算
    const totalProducts = Object.keys(aggregatedData?.demand || {}).length;
    const totalDemand = Object.values(aggregatedData?.demand || {}).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    const avgDemand = totalProducts > 0 ? totalDemand / totalProducts : 0;
    
    // ダッシュボード用の大きなメトリクス
    const dashboardMetrics = {
      '総製品数': totalProducts,
      '総需要': totalDemand,
      '平均需要': Math.round(avgDemand),
      'A製品数': result.categories?.[0]?.length || 0,
      'B製品数': result.categories?.[1]?.length || 0,
      'C製品数': result.categories?.[2]?.length || 0
    };

    return (
      <div className="result-display abc">
        <h4>📊 ABC分析結果 - 製品重要度分類</h4>
        
        {renderMetrics(dashboardMetrics, '分析サマリー')}
        
        {Object.keys(categorySummary).length > 0 && renderMetrics(categorySummary, 'カテゴリ別詳細')}
        
        {result.chart && renderPlotlyChart(result.chart, 'ABC分析チャート')}
        
        {result.treemap && renderPlotlyChart(result.treemap, '需要TreeMap')}
        
        {tableData.length > 0 && renderTable(tableData, 'ABC分類結果')}

        <div className="abc-explanation">
          <h5>💡 ABC分析による製品分類</h5>
          <ul>
            <li><strong>🏆 Aカテゴリ</strong>: 最重要製品（通常上位70%の売上貢献）- 重点管理対象</li>
            <li><strong>🥈 Bカテゴリ</strong>: 中重要製品（通常20%の売上貢献）- 効率的管理</li>
            <li><strong>🥉 Cカテゴリ</strong>: 低重要製品（通常10%の売上貢献）- 簡易管理</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderVRPResults = () => {
    return (
      <div className="result-display vrp">
        <h4>🚚 VRP最適化結果</h4>
        
        {result.total_cost && (
          <div className="cost-summary">
            <h5>💰 総コスト: {result.total_cost.toLocaleString()}円</h5>
          </div>
        )}
        
        {result.routes && renderTable(result.routes, '最適ルート')}
        
        {result.solution_map && renderPlotlyChart(result.solution_map, 'ルートマップ')}
        
        {result.metrics && renderMetrics(result.metrics, 'パフォーマンス指標')}
      </div>
    );
  };

  const renderInventoryResults = () => {
    // 実際のAPIレスポンス構造に基づく処理
    const eoqMetrics: any = {};
    const sampleData = {
      annual_demand: 12000,
      order_cost: 100,
      holding_cost: 2.5,
      unit_cost: 5
    };
    
    // APIの実際の構造を使用
    if (result.eoq) {
      eoqMetrics['経済発注量 (EOQ)'] = `${Math.round(result.eoq)} 個`;
    }
    if (result.total_cost) {
      eoqMetrics['年間総コスト'] = `${Math.round(result.total_cost)} 円`;
    }
    if (result.order_frequency) {
      eoqMetrics['発注頻度'] = `${result.order_frequency.toFixed(3)} 回/日`;
    }
    if (result.cycle_time) {
      eoqMetrics['発注サイクル'] = `${result.cycle_time.toFixed(3)} 日`;
    }
    
    // 在庫効率性の計算
    const efficiency = result.total_annual_cost ? Math.round((1000000 / result.total_annual_cost) * 100) : 0;
    if (efficiency > 0) {
      eoqMetrics['効率性スコア'] = efficiency;
    }

    // Wagner-Whitin結果の処理
    const wagnerMetrics: any = {};
    if (result.total_cost) {
      wagnerMetrics['総コスト'] = `${result.total_cost.toLocaleString()} 円`;
    }
    if (result.orders && Array.isArray(result.orders)) {
      wagnerMetrics['発注回数'] = result.orders.filter((order: number) => order > 0).length;
      wagnerMetrics['総発注量'] = result.orders.reduce((sum: number, order: number) => sum + order, 0);
    }

    // Wagner-Whitin発注計画表
    let orderTableData = [];
    if (result.orders && result.order_periods && Array.isArray(result.orders)) {
      orderTableData = result.orders.map((order: number, index: number) => ({
        '期間': index + 1,
        '需要': result.demands ? result.demands[index] : '-',
        '発注量': order,
        '発注': order > 0 ? '✓' : '-'
      }));
    }

    return (
      <div className="result-display inventory">
        <h4>📦 在庫最適化結果 - スマート発注計画</h4>
        
        {Object.keys(eoqMetrics).length > 0 && renderMetrics(eoqMetrics, '最適発注パラメータ')}
        
        {Object.keys(wagnerMetrics).length > 0 && renderMetrics(wagnerMetrics, '動的計画結果')}
        
        {result.chart && renderPlotlyChart(result.chart, '在庫最適化グラフ')}
        
        {orderTableData.length > 0 && renderTable(orderTableData, '期間別発注計画')}
        
        {result.optimal_qty && (
          <div className="optimal-values">
            <h5>🎯 最適値</h5>
            <p>最適発注量: {result.optimal_qty} 個</p>
            {result.total_cost && <p>総コスト: {result.total_cost.toLocaleString()}円</p>}
            {result.cycle_time && <p>発注サイクル: {result.cycle_time} 日</p>}
          </div>
        )}
        
        {result.chart && renderPlotlyChart(result.chart, '在庫最適化グラフ')}
        
        {result.policy && renderMetrics(result.policy, '在庫方針')}
        
        {result.simulation_results && renderTable(result.simulation_results, 'シミュレーション結果')}

        {result.eoq && (
          <div className="calculation-details">
            <h5>🧮 EOQ計算詳細</h5>
            <div className="calculation-steps">
              <p><strong>入力パラメータ：</strong></p>
              <ul>
                <li>年間需要量 (D): {sampleData.annual_demand.toLocaleString()}個</li>
                <li>単位あたりの取得コスト: ${sampleData.unit_cost}</li>
                <li>在庫保持コスト (年間) (H): ${sampleData.holding_cost}/単位</li>
                <li>注文手数料 (S): ${sampleData.order_cost}/order</li>
              </ul>
              
              <p><strong>EOQの計算：</strong></p>
              <p>EOQ = √(2DS/H) = √(2 × {sampleData.annual_demand} × {sampleData.order_cost} / {sampleData.holding_cost})</p>
              <p>EOQ = √({2 * sampleData.annual_demand * sampleData.order_cost / sampleData.holding_cost}) = {Math.round(result.eoq)}個</p>
              
              <p><strong>発注サイクルの計算：</strong></p>
              <p>年間営業日を260日として計算:</p>
              <p>発注サイクル = 年間営業日 / 年間発注頻度</p>
              <p>発注サイクル = 260日 / {result.order_frequency.toFixed(2)}回 = {result.cycle_time.toFixed(1)}日</p>
              
              <p><strong>年間総コストの計算：</strong></p>
              <p>発注コスト = (年間需要 / EOQ) × 発注費用 = ({sampleData.annual_demand} / {Math.round(result.eoq)}) × {sampleData.order_cost} = {Math.round((sampleData.annual_demand / result.eoq) * sampleData.order_cost)}円</p>
              <p>保管コスト = (EOQ / 2) × 保管費用 = ({Math.round(result.eoq)} / 2) × {sampleData.holding_cost} = {Math.round((result.eoq / 2) * sampleData.holding_cost)}円</p>
              <p>年間総コスト = {Math.round(result.total_cost)}円</p>
              
              <p>この計算により、最適な発注量とコストバランスが求められます。</p>
            </div>
          </div>
        )}

        <div className="inventory-explanation">
          <h5>💡 在庫最適化手法について</h5>
          <ul>
            <li><strong>EOQ（経済的発注量）</strong>: 発注コストと保管コストの最適バランスを見つける手法</li>
            <li><strong>Wagner-Whitin法</strong>: 需要が期間によって変動する場合の動的計画法</li>
            <li><strong>年間総コスト</strong>: 発注コスト + 保管コスト + 商品原価</li>
            <li><strong>発注計画</strong>: いつ、どれだけ発注するかの最適スケジュール</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderLogisticsResults = () => {
    // Weiszfeld法の結果処理
    const logisticsMetrics: any = {};
    
    if (result.optimal_facilities && Array.isArray(result.optimal_facilities)) {
      logisticsMetrics['最適施設数'] = result.optimal_facilities.length;
    }
    
    if (result.total_cost) {
      logisticsMetrics['総輸送コスト'] = result.total_cost;
    }
    
    if (result.iterations) {
      logisticsMetrics['最適化回数'] = result.iterations;
    }
    
    if (result.objective_value) {
      logisticsMetrics['効率性指標'] = Math.round(result.objective_value);
    }
    
    // ネットワーク効率性の計算
    const networkEfficiency = result.optimal_facilities ? 
      Math.round((100 / result.optimal_facilities.length) * 10) : 0;
    if (networkEfficiency > 0) {
      logisticsMetrics['ネットワーク効率'] = networkEfficiency;
    }

    // 施設表示用データの変換
    let facilityTableData = [];
    if (result.optimal_facilities && Array.isArray(result.optimal_facilities)) {
      facilityTableData = result.optimal_facilities.map((facility: any, index: number) => ({
        '施設番号': index + 1,
        '緯度': facility.latitude ? facility.latitude.toFixed(4) : facility.lat?.toFixed(4) || '-',
        '経度': facility.longitude ? facility.longitude.toFixed(4) : facility.lon?.toFixed(4) || '-',
        '名前': facility.name || `施設${index + 1}`
      }));
    }

    return (
      <div className="result-display logistics">
        <h4>🏭 物流ネットワーク設計結果 - 最適配置計画</h4>
        
        {Object.keys(logisticsMetrics).length > 0 && renderMetrics(logisticsMetrics, 'ネットワーク最適化指標')}
        
        {result.total_cost && (
          <div className="network-summary">
            <h5>💰 総コスト: {result.total_cost.toLocaleString()}円</h5>
            {result.num_facilities && <p>選択施設数: {result.num_facilities} 箇所</p>}
          </div>
        )}
        
        {facilityTableData.length > 0 && renderTable(facilityTableData, '最適施設配置')}
        
        {result.facilities && renderTable(result.facilities, '選択された施設')}
        
        {result.network_map && renderPlotlyChart(result.network_map, 'ネットワーク配置図')}
        
        {result.flow_assignments && renderTable(result.flow_assignments, 'フロー配分')}
        
        {result.performance && renderMetrics(result.performance, 'ネットワーク性能')}

        <div className="logistics-explanation">
          <h5>💡 物流ネットワーク設計とは</h5>
          <ul>
            <li><strong>Weiszfeld法</strong>: 顧客への輸送コストを最小化する施設配置を求める手法</li>
            <li><strong>目的関数値</strong>: すべての顧客からの重み付き距離の総和</li>
            <li><strong>収束</strong>: 繰り返し計算で最適解に近づくプロセス</li>
            <li><strong>施設配置</strong>: 倉庫や配送センターの最適な立地を決定</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderSampleDataResults = () => {
    // サンプルデータ生成結果の処理
    const sampleMetrics: any = {};
    
    if (result.metadata) {
      sampleMetrics['地域'] = result.metadata.region || 'japan';
      sampleMetrics['総需要'] = Math.round(result.metadata.total_demand || 0);
      sampleMetrics['総容量'] = Math.round(result.metadata.total_capacity || 0);
    }
    
    if (result.customers && Array.isArray(result.customers)) {
      sampleMetrics['顧客数'] = result.customers.length;
    }
    
    if (result.dc_candidates && Array.isArray(result.dc_candidates)) {
      sampleMetrics['DC候補数'] = result.dc_candidates.length;
    }
    
    if (result.plants && Array.isArray(result.plants)) {
      sampleMetrics['工場数'] = result.plants.length;
    }

    // 顧客データテーブル
    let customerTableData = [];
    if (result.customers && Array.isArray(result.customers)) {
      customerTableData = result.customers.slice(0, 10).map((customer: any, idx: number) => ({
        '顧客名': customer.name || `顧客${idx + 1}`,
        '緯度': customer.latitude?.toFixed(4) || '-',
        '経度': customer.longitude?.toFixed(4) || '-',
        '需要': Math.round(customer.demand || 0)
      }));
    }

    // DC候補データテーブル
    let dcTableData = [];
    if (result.dc_candidates && Array.isArray(result.dc_candidates)) {
      dcTableData = result.dc_candidates.map((dc: any, idx: number) => ({
        'DC名': dc.name || `DC${idx + 1}`,
        '緯度': dc.latitude?.toFixed(4) || '-',
        '経度': dc.longitude?.toFixed(4) || '-',
        '容量': Math.round(dc.capacity || 0),
        '固定費': Math.round(dc.fixed_cost || 0),
        '変動費': dc.variable_cost?.toFixed(2) || '-'
      }));
    }

    // 工場データテーブル
    let plantTableData = [];
    if (result.plants && Array.isArray(result.plants)) {
      plantTableData = result.plants.map((plant: any, idx: number) => ({
        '工場名': plant.name || `工場${idx + 1}`,
        '緯度': plant.latitude?.toFixed(4) || '-',
        '経度': plant.longitude?.toFixed(4) || '-',
        '容量': Math.round(plant.capacity || 0),
        '生産コスト': plant.production_cost?.toFixed(2) || '-'
      }));
    }

    return (
      <div className="result-display sample-data">
        <h4>📍 サンプルデータ生成結果</h4>
        
        {Object.keys(sampleMetrics).length > 0 && renderMetrics(sampleMetrics, 'データサマリー')}
        
        {customerTableData.length > 0 && (
          <div className="data-section">
            {renderTable(customerTableData, '顧客データ')}
            {result.customers.length > 10 && (
              <p className="table-note">（他 {result.customers.length - 10} 件の顧客データ）</p>
            )}
          </div>
        )}
        
        {dcTableData.length > 0 && renderTable(dcTableData, 'DC候補データ')}
        
        {plantTableData.length > 0 && renderTable(plantTableData, '工場データ')}
        
        <div className="sample-data-explanation">
          <h5>💡 生成されたサンプルデータについて</h5>
          <ul>
            <li><strong>顧客データ</strong>: 各顧客の位置（緯度・経度）と需要量</li>
            <li><strong>DC候補データ</strong>: 配送センター候補地の位置、容量、コスト情報</li>
            <li><strong>工場データ</strong>: 生産拠点の位置、生産能力、コスト</li>
            <li>このデータを使用して、物流ネットワーク設計や施設配置最適化を実行できます</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderGenericResults = () => {
    return (
      <div className="result-display generic">
        <h4>✅ 実行結果</h4>
        
        {result.message && <p className="result-message">{result.message}</p>}
        
        {result.data && typeof result.data === 'object' && (
          <div className="result-data">
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        )}
        
        {result.chart && renderPlotlyChart(result.chart, '結果チャート')}
        
        {result.table && Array.isArray(result.table) && renderTable(result.table, '結果データ')}
      </div>
    );
  };

  // 機能に応じた表示を選択
  switch (functionName) {
    case 'abc_analysis':
    case 'treemap_visualization':
      return renderABCResults();
    case 'vrp_optimization':
      return renderVRPResults();
    case 'inventory_optimization':
      return renderInventoryResults();
    case 'logistics_optimization':
    case 'logistics_network_design':
      return renderLogisticsResults();
    case 'generate_network_sample_data':
      return renderSampleDataResults();
    default:
      return renderGenericResults();
  }
};

export default ResultDisplay;