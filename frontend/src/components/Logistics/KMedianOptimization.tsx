import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { logisticsApi, CustomerData, DCData, KMedianResult } from '../../services/logistics';

const KMedianOptimization: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [dcCandidates, setDcCandidates] = useState<DCData[]>([]);
  const [k, setK] = useState<number>(3);
  const [result, setResult] = useState<KMedianResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'map' | 'scatter'>('scatter');

  const addSampleData = () => {
    // 東京エリアの顧客データ（20件）
    const sampleCustomers: CustomerData[] = [
      { name: '新宿店', latitude: 35.6938, longitude: 139.7034, demand: 120 },
      { name: '渋谷店', latitude: 35.6594, longitude: 139.7005, demand: 90 },
      { name: '池袋店', latitude: 35.7295, longitude: 139.7109, demand: 110 },
      { name: '上野店', latitude: 35.7078, longitude: 139.7750, demand: 85 },
      { name: '品川店', latitude: 35.6284, longitude: 139.7387, demand: 100 },
      { name: '東京店', latitude: 35.6762, longitude: 139.6503, demand: 95 },
      { name: '秋葉原店', latitude: 35.6984, longitude: 139.7731, demand: 80 },
      { name: '六本木店', latitude: 35.6627, longitude: 139.7320, demand: 75 },
      { name: '恵比寿店', latitude: 35.6465, longitude: 139.7100, demand: 70 },
      { name: '中野店', latitude: 35.7065, longitude: 139.6657, demand: 65 },
      { name: '錦糸町店', latitude: 35.6972, longitude: 139.8169, demand: 85 },
      { name: '立川店', latitude: 35.6994, longitude: 139.4130, demand: 90 },
      { name: '町田店', latitude: 35.5438, longitude: 139.4468, demand: 88 },
      { name: '吉祥寺店', latitude: 35.7031, longitude: 139.5796, demand: 92 },
      { name: '調布店', latitude: 35.6517, longitude: 139.5414, demand: 78 },
      { name: '三鷹店', latitude: 35.6833, longitude: 139.5597, demand: 82 },
      { name: '府中店', latitude: 35.6697, longitude: 139.4775, demand: 76 },
      { name: '多摩店', latitude: 35.6272, longitude: 139.4464, demand: 73 },
      { name: '八王子店', latitude: 35.6561, longitude: 139.3376, demand: 95 },
      { name: '青梅店', latitude: 35.7881, longitude: 139.2658, demand: 68 }
    ];

    // DC候補地点（10件）
    const sampleDCs: DCData[] = [
      { name: '江戸川DC', latitude: 35.7065, longitude: 139.8685, capacity: 500, fixed_cost: 25000, variable_cost: 2.2 },
      { name: '江東DC', latitude: 35.6756, longitude: 139.8172, capacity: 600, fixed_cost: 30000, variable_cost: 2.0 },
      { name: '練馬DC', latitude: 35.7356, longitude: 139.6531, capacity: 450, fixed_cost: 22000, variable_cost: 2.3 },
      { name: '板橋DC', latitude: 35.7514, longitude: 139.7086, capacity: 400, fixed_cost: 20000, variable_cost: 2.4 },
      { name: '足立DC', latitude: 35.7750, longitude: 139.8049, capacity: 380, fixed_cost: 18000, variable_cost: 2.5 },
      { name: '葛飾DC', latitude: 35.7443, longitude: 139.8487, capacity: 420, fixed_cost: 19000, variable_cost: 2.3 },
      { name: '大田DC', latitude: 35.5614, longitude: 139.7159, capacity: 550, fixed_cost: 28000, variable_cost: 2.1 },
      { name: '世田谷DC', latitude: 35.6464, longitude: 139.6533, capacity: 480, fixed_cost: 24000, variable_cost: 2.2 },
      { name: '杉並DC', latitude: 35.7000, longitude: 139.6364, capacity: 350, fixed_cost: 16000, variable_cost: 2.6 },
      { name: '中野DC', latitude: 35.7065, longitude: 139.6657, capacity: 320, fixed_cost: 15000, variable_cost: 2.7 }
    ];

    setCustomers(sampleCustomers);
    setDcCandidates(sampleDCs);
  };

  const handleOptimize = async () => {
    if (customers.length === 0 || dcCandidates.length === 0) {
      setError('顧客データとDC候補データの両方を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = {
        customers,
        dc_candidates: dcCandidates,
        k,
        max_iterations: 1000,
        learning_rate: 0.01,
        momentum: 0.9
      };

      const optimizationResult = await logisticsApi.solveKMedian(request);
      console.log('=== K-Median Frontend Received ===');
      console.log('Full API result:', optimizationResult);
      console.log('Customer assignments:', optimizationResult.customer_assignments);
      console.log('Selected facilities:', optimizationResult.selected_facilities);
      console.log('DC candidates:', dcCandidates.map((dc, idx) => ({ idx, name: dc.name })));
      console.log('======================================');
      setResult(optimizationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'K-Median最適化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = () => {
    const newCustomer: CustomerData = {
      name: `顧客${customers.length + 1}`,
      latitude: 35.6762 + (Math.random() - 0.5) * 0.1,
      longitude: 139.6503 + (Math.random() - 0.5) * 0.1,
      demand: Math.round(Math.random() * 50 + 20)
    };
    setCustomers([...customers, newCustomer]);
  };

  const addDCCandidate = () => {
    const newDC: DCData = {
      name: `DC候補${dcCandidates.length + 1}`,
      latitude: 35.6762 + (Math.random() - 0.5) * 0.1,
      longitude: 139.6503 + (Math.random() - 0.5) * 0.1,
      capacity: Math.round(Math.random() * 200 + 100),
      fixed_cost: Math.round(Math.random() * 10000 + 5000),
      variable_cost: Math.round((Math.random() * 2 + 1.5) * 10) / 10
    };
    setDcCandidates([...dcCandidates, newDC]);
  };

  // 地図可視化データを生成（scattergeo使用）
  const generateMapVisualization = () => {
    if (customers.length === 0 && dcCandidates.length === 0) return null;

    const traces: any[] = [];

    if (!result) {
      // 結果がない場合は基本的な表示のみ
      if (customers.length > 0) {
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: customers.map(c => c.latitude),
          lon: customers.map(c => c.longitude),
          marker: {
            size: customers.map(c => Math.max(10, Math.min(25, c.demand / 8))),
            color: '#0284c7',
            opacity: 0.8,
            line: { color: 'white', width: 2 }
          },
          text: customers.map(c => `${c.name}<br>需要: ${c.demand}単位`),
          hoverinfo: 'text',
          name: '顧客拠点',
          showlegend: true
        });
      }

      if (dcCandidates.length > 0) {
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: dcCandidates.map(dc => dc.latitude),
          lon: dcCandidates.map(dc => dc.longitude),
          marker: {
            size: 12,
            color: '#9ca3af',
            symbol: 'square',
            opacity: 0.5,
            line: { color: 'white', width: 1 }
          },
          text: dcCandidates.map(dc => 
            `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ${dc.fixed_cost.toLocaleString()}円`
          ),
          hoverinfo: 'text',
          name: 'DC候補',
          showlegend: true
        });
      }

      return {
        data: traces,
        layout: {
          title: {
            text: 'K-Median DC立地候補（地図表示）',
            font: { 
              family: "'Helvetica Neue', Arial, sans-serif", 
              size: 16, 
              color: '#1f2937' 
            },
            x: 0.5,
            xanchor: 'center' as const
          },
          geo: {
            showframe: false,
            showcoastlines: true,
            projection: { type: 'natural earth' },
            center: { lat: 35.7, lon: 139.7 },
            lonaxis: { range: [139.2, 140.0] },
            lataxis: { range: [35.4, 35.9] }
          },
          showlegend: true,
          legend: {
            x: 0,
            y: 1,
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#e5e7eb',
            borderwidth: 1
          },
          margin: { l: 20, r: 20, t: 50, b: 20 },
          paper_bgcolor: 'white',
          height: 600
        }
      };
    }

    // 施設ごとに異なる色を設定
    const facilityColors = [
      '#dc2626', // Red
      '#16a34a', // Green  
      '#2563eb', // Blue
      '#ca8a04', // Yellow
      '#9333ea', // Purple
      '#ea580c', // Orange
      '#0891b2', // Cyan
      '#be123c'  // Rose
    ];

    const customerColors = [
      '#fca5a5', // Light Red
      '#86efac', // Light Green
      '#93c5fd', // Light Blue  
      '#fde047', // Light Yellow
      '#c4b5fd', // Light Purple
      '#fed7aa', // Light Orange
      '#67e8f9', // Light Cyan
      '#fda4af'  // Light Rose
    ];

    // 顧客の施設への割り当てを取得（APIの結果を使用）
    const selectedDCs = result.selected_facilities;
    
    // customer_assignmentsから選択された施設の配列インデックスへのマッピングを作成
    const facilityIndexToArrayIndex = new Map<number, number>();
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      facilityIndexToArrayIndex.set(facilityIndex, arrayIndex);
    });
    
    // 顧客ごとの割り当てを取得
    const customerAssignments: number[] = customers.map(customer => {
      const assignedFacilityIndex = result.customer_assignments[customer.name];
      const arrayIndex = facilityIndexToArrayIndex.get(assignedFacilityIndex);
      // デフォルト値の代わりにundefinedチェック
      if (arrayIndex === undefined) {
        console.warn(`Customer ${customer.name} assigned to facility ${assignedFacilityIndex} which is not in selected facilities`);
        return 0;
      }
      return arrayIndex;
    });

    console.log('=== K-Median Debug Info ===');
    console.log('API result:', result);
    console.log('Customer assignments from API:', result.customer_assignments);
    console.log('Selected facilities indices:', selectedDCs);
    console.log('DC candidates:', dcCandidates);
    console.log('Facility index mapping:', facilityIndexToArrayIndex);
    console.log('Customer assignment array:', customerAssignments);
    
    // 詳細なマッピング情報を出力
    console.log('=== Detailed Assignment Mapping ===');
    customers.forEach((customer, index) => {
      const apiAssignment = result.customer_assignments[customer.name];
      const arrayIndex = facilityIndexToArrayIndex.get(apiAssignment);
      const facilityName = dcCandidates[apiAssignment]?.name || 'Unknown';
      console.log(`${customer.name}: API=${apiAssignment} (${facilityName}), ArrayIndex=${arrayIndex}`);
    });
    
    // 各施設への割り当て数を確認
    console.log('=== Assignment Count by Facility ===');
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      const facility = dcCandidates[facilityIndex];
      const assignedCount = customerAssignments.filter(a => a === arrayIndex).length;
      console.log(`${facility.name} (idx=${facilityIndex}, array=${arrayIndex}): ${assignedCount} customers`);
      
      // 割り当てられた顧客の名前も表示
      const assignedCustomerNames = customers
        .filter((_, i) => customerAssignments[i] === arrayIndex)
        .map(c => c.name);
      if (assignedCustomerNames.length > 0) {
        console.log(`  Assigned customers: ${assignedCustomerNames.join(', ')}`);
      }
    });
    console.log('==============================');

    // 施設ごとに顧客をグループ化して色分け表示
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      const facility = dcCandidates[facilityIndex];
      const assignedCustomers = customers.filter((_, index) => 
        customerAssignments[index] === arrayIndex
      );

      if (assignedCustomers.length > 0) {
        // この施設に割り当てられた顧客を表示
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: assignedCustomers.map(c => c.latitude),
          lon: assignedCustomers.map(c => c.longitude),
          marker: {
            size: assignedCustomers.map(c => Math.max(8, Math.min(20, c.demand / 4))),
            color: customerColors[arrayIndex % customerColors.length],
            opacity: 0.8,
            line: { 
              color: facilityColors[arrayIndex % facilityColors.length], 
              width: 2 
            }
          },
          text: assignedCustomers.map(c => 
            `${c.name}<br>需要: ${c.demand}単位<br>割り当て: ${facility.name}`
          ),
          hoverinfo: 'text',
          name: `${facility.name}の顧客`,
          showlegend: true
        });

        // 顧客と施設の接続線を追加
        assignedCustomers.forEach(customer => {
          traces.push({
            type: 'scattergeo',
            mode: 'lines',
            lat: [customer.latitude, facility.latitude],
            lon: [customer.longitude, facility.longitude],
            line: {
              color: facilityColors[arrayIndex % facilityColors.length],
              width: 2,
              opacity: 0.6
            },
            hoverinfo: 'skip',
            name: `${facility.name}フロー`,
            showlegend: false
          });
        });
      }
    });

    // 未選択のDC候補をグレーの四角でプロット
    const unselectedDCs = dcCandidates.filter((_, index) => 
      !selectedDCs.includes(index)
    );
    
    if (unselectedDCs.length > 0) {
      traces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: unselectedDCs.map(dc => dc.latitude),
        lon: unselectedDCs.map(dc => dc.longitude),
        marker: {
          size: 12,
          color: '#9ca3af',
          symbol: 'square',
          opacity: 0.5,
          line: { color: 'white', width: 1 }
        },
        text: unselectedDCs.map(dc => 
          `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ${dc.fixed_cost.toLocaleString()}円<br>（未選択）`
        ),
        hoverinfo: 'text',
        name: 'DC候補（未選択）',
        showlegend: true
      });
    }

    // 選択されたDCを色分けして表示
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      const facility = dcCandidates[facilityIndex];
      traces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: [facility.latitude],
        lon: [facility.longitude],
        marker: {
          size: 25,
          color: facilityColors[arrayIndex % facilityColors.length],
          symbol: 'star',
          line: { color: 'white', width: 3 }
        },
        text: `${facility.name}<br>緯度: ${facility.latitude.toFixed(4)}<br>経度: ${facility.longitude.toFixed(4)}`,
        hoverinfo: 'text',
        name: facility.name,
        showlegend: true
      });
    });

    return {
      data: traces,
      layout: {
        title: {
          text: 'K-Median最適化結果（地図表示）',
          font: { 
            family: "'Helvetica Neue', Arial, sans-serif", 
            size: 16, 
            color: '#1f2937' 
          },
          x: 0.5,
          xanchor: 'center' as const
        },
        geo: {
          showframe: false,
          showcoastlines: true,
          projection: { type: 'natural earth' },
          center: { lat: 35.7, lon: 139.7 },
          lonaxis: { range: [139.2, 140.0] },
          lataxis: { range: [35.4, 35.9] }
        },
        showlegend: true,
        legend: {
          x: 0,
          y: 1,
          bgcolor: 'rgba(255,255,255,0.9)',
          bordercolor: '#e5e7eb',
          borderwidth: 1
        },
        margin: { l: 20, r: 20, t: 50, b: 20 },
        paper_bgcolor: 'white',
        height: 600
      }
    };
  };

  // 散布図可視化データを生成
  const generateScatterVisualization = () => {
    if (customers.length === 0 && dcCandidates.length === 0) return null;

    const traces: any[] = [];

    if (!result) {
      // 結果がない場合は基本的な表示のみ
      if (customers.length > 0) {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: customers.map(c => c.longitude),
          y: customers.map(c => c.latitude),
          marker: {
            size: customers.map(c => Math.max(8, Math.min(20, c.demand / 5))),
            color: '#0284c7',
            symbol: 'circle',
            line: { color: 'white', width: 1 }
          },
          text: customers.map(c => `${c.name}<br>需要: ${c.demand}`),
          hoverinfo: 'text',
          name: '顧客',
          showlegend: true
        });
      }

      if (dcCandidates.length > 0) {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: dcCandidates.map(dc => dc.longitude),
          y: dcCandidates.map(dc => dc.latitude),
          marker: {
            size: dcCandidates.map(dc => Math.max(10, Math.min(25, dc.capacity / 20))),
            color: '#ea580c',
            symbol: 'square',
            line: { color: 'white', width: 2 }
          },
          text: dcCandidates.map(dc => 
            `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ${dc.fixed_cost}<br>変動費: ${dc.variable_cost}<br>候補`
          ),
          hoverinfo: 'text',
          name: 'DC候補',
          showlegend: true
        });
      }

      return {
        data: traces,
        layout: {
          title: {
            text: 'K-Median DC立地候補',
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
            borderwidth: 1
          },
          margin: { l: 60, r: 120, t: 60, b: 60 },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
          hovermode: 'closest' as const
        }
      };
    }

    // 施設ごとに異なる色を設定
    const facilityColors = [
      '#dc2626', // Red
      '#16a34a', // Green  
      '#2563eb', // Blue
      '#ca8a04', // Yellow
      '#9333ea', // Purple
      '#ea580c', // Orange
      '#0891b2', // Cyan
      '#be123c'  // Rose
    ];

    const customerColors = [
      '#fca5a5', // Light Red
      '#86efac', // Light Green
      '#93c5fd', // Light Blue  
      '#fde047', // Light Yellow
      '#c4b5fd', // Light Purple
      '#fed7aa', // Light Orange
      '#67e8f9', // Light Cyan
      '#fda4af'  // Light Rose
    ];

    // 顧客の施設への割り当てを取得（APIの結果を使用）
    const selectedDCs = result.selected_facilities;
    
    // customer_assignmentsから選択された施設の配列インデックスへのマッピングを作成
    const facilityIndexToArrayIndex = new Map<number, number>();
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      facilityIndexToArrayIndex.set(facilityIndex, arrayIndex);
    });
    
    // 顧客ごとの割り当てを取得
    const customerAssignments: number[] = customers.map(customer => {
      const assignedFacilityIndex = result.customer_assignments[customer.name];
      const arrayIndex = facilityIndexToArrayIndex.get(assignedFacilityIndex);
      // デフォルト値の代わりにundefinedチェック
      if (arrayIndex === undefined) {
        console.warn(`Customer ${customer.name} assigned to facility ${assignedFacilityIndex} which is not in selected facilities`);
        return 0;
      }
      return arrayIndex;
    });

    console.log('=== K-Median Scatter Debug Info ===');
    console.log('API result:', result);
    console.log('Customer assignments from API:', result.customer_assignments);
    console.log('Selected facilities:', selectedDCs);
    console.log('Customer assignment array:', customerAssignments);
    console.log('=====================================');

    // 施設ごとに顧客をグループ化して色分け表示
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      const facility = dcCandidates[facilityIndex];
      const assignedCustomers = customers.filter((_, index) => 
        customerAssignments[index] === arrayIndex
      );

      if (assignedCustomers.length > 0) {
        // この施設に割り当てられた顧客を表示
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: assignedCustomers.map(c => c.longitude),
          y: assignedCustomers.map(c => c.latitude),
          marker: {
            size: assignedCustomers.map(c => Math.max(8, Math.min(20, c.demand / 3))),
            color: customerColors[arrayIndex % customerColors.length],
            symbol: 'circle',
            line: { 
              color: facilityColors[arrayIndex % facilityColors.length], 
              width: 2 
            }
          },
          text: assignedCustomers.map(c => 
            `${c.name}<br>需要: ${c.demand}<br>割り当て: ${facility.name}`
          ),
          hoverinfo: 'text',
          name: `${facility.name}の顧客`,
          showlegend: true
        });
      }
    });

    // 未選択のDC候補をオレンジの四角でプロット
    const unselectedDCs = dcCandidates.filter((_, index) => 
      !selectedDCs.includes(index)
    );
    
    if (unselectedDCs.length > 0) {
      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: unselectedDCs.map(dc => dc.longitude),
        y: unselectedDCs.map(dc => dc.latitude),
        marker: {
          size: 15,
          color: '#ea580c',
          symbol: 'square',
          line: { color: 'white', width: 2 }
        },
        text: unselectedDCs.map(dc => 
          `${dc.name}<br>容量: ${dc.capacity}<br>固定費: ${dc.fixed_cost.toLocaleString()}円<br>（未選択）`
        ),
        hoverinfo: 'text',
        name: 'DC候補（未選択）',
        showlegend: true
      });
    }

    // 選択されたDCを色分けして表示
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      const facility = dcCandidates[facilityIndex];
      traces.push({
        type: 'scatter',
        mode: 'markers',
        x: [facility.longitude],
        y: [facility.latitude],
        marker: {
          size: 25,
          color: facilityColors[arrayIndex % facilityColors.length],
          symbol: 'star',
          line: { color: 'white', width: 3 }
        },
        text: `${facility.name}<br>位置: ${facility.latitude.toFixed(4)}, ${facility.longitude.toFixed(4)}`,
        hoverinfo: 'text',
        name: facility.name,
        showlegend: true
      });
    });

    // 接続線を追加（色分け）
    selectedDCs.forEach((facilityIndex, arrayIndex) => {
      const facility = dcCandidates[facilityIndex];
      const assignedCustomers = customers.filter((_, index) => 
        customerAssignments[index] === arrayIndex
      );

      assignedCustomers.forEach(customer => {
        traces.push({
          type: 'scatter',
          mode: 'lines',
          x: [customer.longitude, facility.longitude],
          y: [customer.latitude, facility.latitude],
          line: {
            color: facilityColors[arrayIndex % facilityColors.length],
            width: 2,
            opacity: 0.6
          },
          hoverinfo: 'skip',
          name: `${facility.name}フロー`,
          showlegend: false
        });
      });
    });

    return {
      data: traces,
      layout: {
        title: {
          text: 'K-Median最適化結果',
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
          borderwidth: 1
        },
        margin: { l: 60, r: 120, t: 60, b: 60 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        hovermode: 'closest' as const
      }
    };
  };

  // 表示モードに応じた可視化データを取得
  const plotData = mapMode === 'map' ? generateMapVisualization() : generateScatterVisualization();

  return (
    <div className="section">
      <div className="page-header">
        <h1 className="page-title">K-Median DC立地最適化</h1>
        <p className="page-subtitle">制約付きK-Median問題による最適DC配置決定</p>
      </div>

      <div className="toolbar mb-6">
        <div className="toolbar-left">
          <button 
            onClick={addSampleData}
            className="btn btn-md btn-secondary"
          >
            サンプルデータ
          </button>
          <button
            onClick={handleOptimize}
            disabled={loading || customers.length === 0 || dcCandidates.length === 0}
            className="btn btn-md btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                最適化中...
              </>
            ) : (
              'K-Median最適化実行'
            )}
          </button>
        </div>
        
        {result && (
          <div className="toolbar-right">
            <div className="btn-group">
              <button
                onClick={() => setMapMode('map')}
                className={`btn btn-sm ${mapMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🗺️ 地図表示
              </button>
              <button
                onClick={() => setMapMode('scatter')}
                className={`btn btn-sm ${mapMode === 'scatter' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📊 散布図
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <div>
            <div className="alert-title">エラーが発生しました</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* パラメータ設定 */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">最適化パラメータ</h3>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">選択するDC数 (K)</label>
            <input
              className="form-input"
              type="number"
              value={k}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setK(parseInt(e.target.value) || 0)}
              min="1"
              max={dcCandidates.length}
            />
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      {result && (
        <div className="kpi-grid mb-8">
          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">総費用</p>
              <div className="kpi-trend positive">
                <span>最適化済</span>
              </div>
            </div>
            <p className="kpi-value">{result.total_cost.toFixed(0)} <span className="kpi-unit">円</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">選択DC数</p>
              <div className="kpi-trend neutral">
                <span>最適配置</span>
              </div>
            </div>
            <p className="kpi-value">{result.selected_facilities.length} <span className="kpi-unit">拠点</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">サービス顧客数</p>
              <div className="kpi-trend positive">
                <span>配送完了</span>
              </div>
            </div>
            <p className="kpi-value">{Object.keys(result.customer_assignments).length} <span className="kpi-unit">顧客</span></p>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <p className="kpi-label">平均割当距離</p>
              <div className="kpi-trend positive">
                <span>効率化</span>
              </div>
            </div>
            <p className="kpi-value">N/A <span className="kpi-unit">km</span></p>
          </div>
        </div>
      )}

      {/* 最適化結果マップ */}
      {plotData && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">DC立地最適化マップ</h2>
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
      <div className="card mb-8">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="card-title">顧客データ ({customers.length}件)</h3>
            <button 
              onClick={addCustomer}
              className="btn btn-sm btn-secondary"
            >
              顧客追加
            </button>
          </div>
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
                  {result && <th>割当DC</th>}
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 15).map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.name}</td>
                    <td>{customer.latitude.toFixed(4)}</td>
                    <td>{customer.longitude.toFixed(4)}</td>
                    <td>{customer.demand}</td>
                    {result && (
                      <td>
                        {result.customer_assignments[customer.name] !== undefined ? (
                          <span className="badge badge-success">
                            {dcCandidates[result.customer_assignments[customer.name]]?.name || `DC${result.customer_assignments[customer.name]}`}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">未割当</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {customers.length > 15 && (
                  <tr>
                    <td colSpan={result ? 5 : 4} className="text-center text-secondary">
                      ... 他{customers.length - 15}件
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DC候補データテーブル */}
      <div className="card mb-8">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="card-title">DC候補データ ({dcCandidates.length}件)</h3>
            <button 
              onClick={addDCCandidate}
              className="btn btn-sm btn-secondary"
            >
              DC候補追加
            </button>
          </div>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>DC名</th>
                  <th>緯度</th>
                  <th>経度</th>
                  <th>容量</th>
                  <th>固定費</th>
                  <th>変動費</th>
                  {result && <th>選択状況</th>}
                </tr>
              </thead>
              <tbody>
                {dcCandidates.map((dc, index) => (
                  <tr key={index}>
                    <td>{dc.name}</td>
                    <td>{dc.latitude.toFixed(4)}</td>
                    <td>{dc.longitude.toFixed(4)}</td>
                    <td>{dc.capacity}</td>
                    <td>{dc.fixed_cost.toLocaleString()}円</td>
                    <td>{dc.variable_cost}</td>
                    {result && (
                      <td>
                        {result.selected_facilities.includes(index) ? (
                          <span className="badge badge-success">選択済み</span>
                        ) : (
                          <span className="badge badge-neutral">候補</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 操作ガイド */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">K-Median問題について</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="alert alert-info">
              <div>制約付きK-Median問題：容量制約のある最適DC配置決定</div>
            </div>
            <div className="alert alert-info">
              <div>固定費・変動費を考慮した総コスト最小化</div>
            </div>
          </div>
          
          <div className="alert alert-success">
            <div>
              <div className="alert-title">{mapMode === 'map' ? '地図の見方' : 'グラフの見方'}</div>
              <div>
                {mapMode === 'map' 
                  ? '地図上では、各選択されたDCと割り当てられた顧客が同じ色系統で表示されます。明るい色の円は顧客拠点（サイズは需要量に比例）、濃い色の星は選択されたDC、同色の線は配送ルートを示します。グレーの四角は未選択のDC候補です。'
                  : '散布図では、各選択されたDCと割り当てられた顧客が同じ色系統で表示されます。明るい色の円は顧客、濃い色の星は選択されたDC、同色の線は配送ルートを示し、色によってDC-顧客の対応がわかります。'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KMedianOptimization;