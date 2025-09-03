import React, { useState, useEffect } from 'react';
import EOQCalculator from './EOQCalculator';
import WagnerWhitinOptimizer from './WagnerWhitinOptimizer';
import SSPolicyCalculator from './SSPolicyCalculator';
import SSADynamicProgramming from './SSADynamicProgramming';
import SSATabuSearch from './SSATabuSearch';
import InventorySimulation from './InventorySimulation';
import BaseStockOptimization from './BaseStockOptimization';
import DemandDistributionFitting from './DemandDistributionFitting';
import ComprehensiveAnalysis from './ComprehensiveAnalysis';
import { inventoryApi } from '../../services/api';
import '../Dashboard.css';

type InventoryTab = 'eoq' | 'wagner-whitin' | 'ss-policy' | 'ssa-dp' | 'ssa-tabu' | 'simulation' | 'base-stock' | 'demand-fitting' | 'comprehensive';

const InventoryOptimization: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('eoq');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.healthCheck();
      setHealthStatus(response.data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({ status: 'error', message: 'API接続エラー' });
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'eoq':
        return <EOQCalculator />;
      case 'wagner-whitin':
        return <WagnerWhitinOptimizer />;
      case 'ss-policy':
        return <SSPolicyCalculator />;
      case 'ssa-dp':
        return <SSADynamicProgramming />;
      case 'ssa-tabu':
        return <SSATabuSearch />;
      case 'simulation':
        return <InventorySimulation />;
      case 'base-stock':
        return <BaseStockOptimization />;
      case 'demand-fitting':
        return <DemandDistributionFitting />;
      case 'comprehensive':
        return <ComprehensiveAnalysis />;
      default:
        return <EOQCalculator />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">在庫最適化システム</h1>
          <p className="dashboard-subtitle">03inventory.ipynbの機能を完全移植した在庫最適化ツール</p>
        </div>
        
        <div className="dashboard-filters">
          {healthStatus && (
            <div className="filter-group">
              <span className="filter-label">API状態</span>
              <div className={`kpi-trend ${healthStatus.status === 'healthy' ? 'positive' : 'negative'}`}>
                <span className={`trend-arrow ${healthStatus.status === 'healthy' ? 'up' : 'down'}`}></span>
                <span>{healthStatus.status === 'healthy' ? 'API接続正常' : 'API接続エラー'}</span>
                {loading && <span> (確認中...)</span>}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="inventory-tabs-container">
          <div className="inventory-tabs-grid">
            <div 
              className={`inventory-tab-card ${activeTab === 'eoq' ? 'active' : ''}`}
              onClick={() => setActiveTab('eoq')}
            >
              <div className="tab-card-icon">📊</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">EOQ計算</h3>
                <p className="tab-card-description">経済発注量モデルによる最適発注量計算</p>
                <span className="tab-card-badge">基本</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'wagner-whitin' ? 'active' : ''}`}
              onClick={() => setActiveTab('wagner-whitin')}
            >
              <div className="tab-card-icon">🔄</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">動的ロットサイジング</h3>
                <p className="tab-card-description">Wagner-Whitinアルゴリズムによる動的計画</p>
                <span className="tab-card-badge advanced">高度</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'ss-policy' ? 'active' : ''}`}
              onClick={() => setActiveTab('ss-policy')}
            >
              <div className="tab-card-icon">🎯</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">(s,S)政策</h3>
                <p className="tab-card-description">発注点sと発注数量Sによる在庫管理</p>
                <span className="tab-card-badge">基本</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'ssa-dp' ? 'active' : ''}`}
              onClick={() => setActiveTab('ssa-dp')}
            >
              <div className="tab-card-icon">🤖</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">SSA-DP最適化</h3>
                <p className="tab-card-description">動的計画法による高精度最適化</p>
                <span className="tab-card-badge advanced">高度</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'ssa-tabu' ? 'active' : ''}`}
              onClick={() => setActiveTab('ssa-tabu')}
            >
              <div className="tab-card-icon">🔍</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">SSAタブサーチ</h3>
                <p className="tab-card-description">タブサーチメタヒューリスティック</p>
                <span className="tab-card-badge expert">エキスパート</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'simulation' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulation')}
            >
              <div className="tab-card-icon">🎮</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">在庫シミュレーション</h3>
                <p className="tab-card-description">モンテカルロシミュレーション</p>
                <span className="tab-card-badge">シミュレーション</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'base-stock' ? 'active' : ''}`}
              onClick={() => setActiveTab('base-stock')}
            >
              <div className="tab-card-icon">📦</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">ベースストック最適化</h3>
                <p className="tab-card-description">基準在庫レベルの最適化</p>
                <span className="tab-card-badge advanced">高度</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'demand-fitting' ? 'active' : ''}`}
              onClick={() => setActiveTab('demand-fitting')}
            >
              <div className="tab-card-icon">📈</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">需要分布推定</h3>
                <p className="tab-card-description">履歴データからの統計分布推定</p>
                <span className="tab-card-badge">統計</span>
              </div>
            </div>
            
            <div 
              className={`inventory-tab-card ${activeTab === 'comprehensive' ? 'active' : ''}`}
              onClick={() => setActiveTab('comprehensive')}
            >
              <div className="tab-card-icon">📋</div>
              <div className="tab-card-content">
                <h3 className="tab-card-title">包括的分析</h3>
                <p className="tab-card-description">全手法の統合比較分析</p>
                <span className="tab-card-badge expert">エキスパート</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="tab-content">
        {renderTabContent()}
        </div>
        
        {healthStatus && healthStatus.algorithms && (
          <div className="form-section">
            <h2 className="form-title">利用可能なアルゴリズム</h2>
            <div className="form-grid">
              {healthStatus.algorithms.map((algorithm: string, index: number) => (
                <div key={index} className="form-group">
                  <span className="form-label">{algorithm}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryOptimization;