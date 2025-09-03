import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export interface DemandRecord {
  date: string;
  cust: string;
  prod: string;
  demand: number;
  promo_0?: number;
  promo_1?: number;
  sales?: number;
}

export interface RiskPoolingRequest {
  demand_data: DemandRecord[];
  pool_groups: string[][];
  product?: string;
  period?: string;
}

export interface RiskPoolingResult {
  original_stats: Record<string, any>;
  pooled_stats: Record<string, any>;
  safety_stock_reduction: Record<string, number>;
  risk_reduction: Record<string, number>;
  pooling_efficiency: number;
}

export interface MeanCVAnalysisRequest {
  demand_data: DemandRecord[];
  segment_by?: string;
  period?: string;
  cv_threshold?: number;
}

export interface SegmentData {
  segment: string;
  mean: number;
  std: number;
  cv: number;
  classification: string;
}

export interface MeanCVAnalysisResult {
  segments: SegmentData[];
  mean_cv_plot: any;
  classification: Record<string, string>;
  management_strategy: Record<string, string>;
}

export const abcApi = {
  async performRiskPooling(request: RiskPoolingRequest): Promise<RiskPoolingResult> {
    const response = await axios.post(`${API_BASE_URL}/abc/risk-pooling-detailed`, request);
    return response.data;
  },

  async performMeanCVAnalysis(request: MeanCVAnalysisRequest): Promise<MeanCVAnalysisResult> {
    const response = await axios.post(`${API_BASE_URL}/abc/mean-cv-analysis`, request);
    return response.data;
  },

  // 既存のツリーマップAPI
  async createTreeMap(request: { demand_data: DemandRecord[]; parent?: string; value?: string }) {
    const response = await axios.post(`${API_BASE_URL}/abc/tree-map`, request);
    return response.data;
  },

  // 既存のABC分析API
  async performABCAnalysis(request: { 
    demand_data: DemandRecord[]; 
    threshold: number[]; 
    agg_col?: string; 
    value_col?: string; 
  }) {
    const response = await axios.post(`${API_BASE_URL}/abc/analysis`, request);
    return response.data;
  },

  // ランク分析API
  async performRankAnalysis(request: {
    demand_data: DemandRecord[];
    value?: string;
    top_rank?: number;
  }) {
    const response = await axios.post(`${API_BASE_URL}/abc/rank-analysis`, request);
    return response.data;
  }
};