import React, { useState } from 'react';
import TreeMapVisualization from './components/ABC/TreeMapVisualization';
import ABCAnalysis from './components/ABC/ABCAnalysis';
import VRPOptimization from './components/VRP/VRPOptimization';
import InventoryOptimization from './components/Inventory/InventoryOptimization';
import LogisticsOptimization from './components/Logistics/LogisticsOptimization';
import ChatInterface from './components/Chat/ChatInterface';
import { AuthProvider, UserProfile } from './components/Auth/GoogleAuth';
import './components/Dashboard.css';

type TabType = 'treemap' | 'abc' | 'vrp' | 'inventory' | 'logistics' | 'chat';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  
  // Google OAuth Client ID - 環境変数から取得（本番環境用）
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

  const handleFunctionCall = async (functionName: string, args: any): Promise<any> => {
    try {
      // 関数名に基づいて適切なタブに切り替え
      switch (functionName) {
        case 'abc_analysis':
          setActiveTab('abc');
          return { success: true, message: 'ABC分析タブに切り替えました' };
        case 'treemap_visualization':
          setActiveTab('treemap');
          return { success: true, message: '需要TreeMapタブに切り替えました' };
        case 'vrp_optimization':
          setActiveTab('vrp');
          return { success: true, message: '配送計画(VRP)タブに切り替えました' };
        case 'inventory_optimization':
          setActiveTab('inventory');
          return { success: true, message: '在庫最適化タブに切り替えました' };
        case 'logistics_optimization':
        case 'logistics_network_design':
          setActiveTab('logistics');
          return { success: true, message: '物流ネットワーク設計タブに切り替えました' };
        default:
          throw new Error(`未知の機能: ${functionName}`);
      }
    } catch (error) {
      console.error('Function call error:', error);
      throw error;
    }
  };


  return (
    <AuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="page">
      {/* Modern Header */}
      <header className="nav">
        <div className="nav-brand">MOAI Supply Chain Suite</div>
        <div className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            アシスタント
          </button>
          <button 
            className={`nav-link ${activeTab === 'treemap' ? 'active' : ''}`}
            onClick={() => setActiveTab('treemap')}
          >
            需要分析
          </button>
          <button 
            className={`nav-link ${activeTab === 'abc' ? 'active' : ''}`}
            onClick={() => setActiveTab('abc')}
          >
            ABC分析
          </button>
          <button 
            className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            在庫計画
          </button>
          <button 
            className={`nav-link ${activeTab === 'logistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('logistics')}
          >
            ネットワーク設計
          </button>
          <button 
            className={`nav-link ${activeTab === 'vrp' ? 'active' : ''}`}
            onClick={() => setActiveTab('vrp')}
          >
            輸送計画
          </button>
          <UserProfile />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'chat' && <ChatInterface onFunctionCall={handleFunctionCall} />}
        
        {activeTab === 'treemap' && (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">需要分析ダッシュボード</h1>
                <p className="dashboard-subtitle">TreeMapを使用した需要パターンの視覚的分析ツール</p>
              </div>
            </div>
            <div className="dashboard-content">
              <TreeMapVisualization />
            </div>
          </div>
        )}
        
        {activeTab === 'abc' && (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">ABC分析システム</h1>
                <p className="dashboard-subtitle">売上高・需要分析によるABC分析と顧客セグメンテーション</p>
              </div>
            </div>
            <div className="dashboard-content">
              <ABCAnalysis />
            </div>
          </div>
        )}
        
        {activeTab === 'vrp' && (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">輸送計画最適化システム</h1>
                <p className="dashboard-subtitle">Vehicle Routing Problem (VRP) による配送経路最適化</p>
              </div>
            </div>
            <div className="dashboard-content">
              <VRPOptimization />
            </div>
          </div>
        )}
        
        {activeTab === 'inventory' && (
          <div className="section">
            <InventoryOptimization />
          </div>
        )}
        
        {activeTab === 'logistics' && (
          <div className="section">
            <LogisticsOptimization />
          </div>
        )}
      </main>
      </div>
    </AuthProvider>
  );
}

export default App;