import React, { useState } from 'react';
import WeiszfeldOptimization from './WeiszfeldOptimization';
import KMedianOptimization from './KMedianOptimization';
import AdvancedKMedian from './AdvancedKMedian';
import CustomerClustering from './CustomerClustering';
import NetworkDesign from './NetworkDesign';
import MultiSourceLND from './MultiSourceLND';
import SingleSourceLND from './SingleSourceLND';
import AbstractLNDP from './AbstractLNDP';
import NetworkVisualization from './NetworkVisualization';
import SampleDataGenerator from './SampleDataGenerator';
import './LogisticsOptimization.css';

const LogisticsOptimization: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('weiszfeld');

  const tabs = [
    { id: 'weiszfeld', label: 'Weiszfeld法' },
    { id: 'kmedian', label: 'K-Median最適化' },
    { id: 'advanced_kmedian', label: '高度なK-Median' },
    { id: 'clustering', label: '顧客クラスタリング' },
    { id: 'network', label: 'ネットワーク設計' },
    { id: 'multi_source_lnd', label: 'Multi-Source LND' },
    { id: 'single_source_lnd', label: 'Single-Source LND' },
    { id: 'abstract_lndp', label: 'Abstract LNDP' },
    { id: 'visualization', label: 'ネットワーク可視化' },
    { id: 'sample', label: 'サンプルデータ生成' }
  ];

  return (
    <div className="logistics-optimization">
      <h1 style={{ color: '#1976d2', fontWeight: 'bold' }}>
        物流ネットワーク設計システム (MELOS)
      </h1>
      
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '16px', 
        borderRadius: '4px', 
        marginBottom: '24px',
        border: '1px solid #2196f3'
      }}>
        <strong>📊 MELOS (MEta Logistic network Optimization System)</strong><br />
        統合的な物流ネットワーク設計・最適化ツール
      </div>

      <div className="tabs-container" style={{ 
        borderBottom: '1px solid #ddd', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: currentTab === tab.id ? '#1976d2' : '#f5f5f5',
                color: currentTab === tab.id ? 'white' : '#333',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: currentTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content" style={{ padding: '24px 0' }}>
        {currentTab === 'weiszfeld' && <WeiszfeldOptimization />}
        {currentTab === 'kmedian' && <KMedianOptimization />}
        {currentTab === 'advanced_kmedian' && <AdvancedKMedian />}
        {currentTab === 'clustering' && <CustomerClustering />}
        {currentTab === 'network' && <NetworkDesign />}
        {currentTab === 'multi_source_lnd' && <MultiSourceLND />}
        {currentTab === 'single_source_lnd' && <SingleSourceLND />}
        {currentTab === 'abstract_lndp' && <AbstractLNDP />}
        {currentTab === 'visualization' && <NetworkVisualization />}
        {currentTab === 'sample' && <SampleDataGenerator />}
      </div>
    </div>
  );
};

export default LogisticsOptimization;