import axios from 'axios';
import { ABCAnalysisRequest, ABCAnalysisResult, TreeMapRequest, VRPRequest, VRPResult } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ABC Analysis APIs
export const abcApi = {
  createTreeMap: (request: TreeMapRequest) => 
    api.post<{ figure: string }>('/abc/tree-map', request),
  
  performAnalysis: (request: ABCAnalysisRequest) => 
    api.post<ABCAnalysisResult>('/abc/analysis', request),
  
  generateFigures: (request: any) => 
    api.post<any>('/abc/figures', request),
  
  performRankAnalysis: (request: any) => 
    api.post<{ figure: string }>('/abc/rank-analysis', request),
  
  analyzeRiskPooling: (request: any) => 
    api.post<any>('/abc/risk-pooling', request),
  
  analyzeMeanCV: (request: any) => 
    api.post<{ figure: string }>('/abc/mean-cv', request),
};

// VRP APIs
export const vrpApi = {
  optimize: (request: VRPRequest) => 
    api.post<VRPResult>('/vrp/optimize', request),
  
  createSolution: (output_data: any) => 
    api.post<any>('/vrp/solution', output_data),
  
  computeDistanceTable: (request: any) => 
    api.post<any>('/vrp/distance-table', request),
  
  generateNodes: (request: any) => 
    api.post<any>('/vrp/generate-nodes', request),
  
  buildModel: (request: any) => 
    api.post<any>('/vrp/build-model', request),
  
  generateVRP: (request: any) => 
    api.post<any>('/vrp/generate-vrp', request),
};

// Inventory Optimization APIs
export const inventoryApi = {
  calculateEOQ: (request: any) => 
    api.post<any>('/inventory/eoq', request),
  
  calculateWagnerWhitin: (request: any) => 
    api.post<any>('/inventory/wagner-whitin', request),
  
  approximateSSPolicy: (request: any) => 
    api.post<any>('/inventory/approximate-ss', request),
  
  performSSADynamicProgramming: (request: any) => 
    api.post<any>('/inventory/ssa-dynamic-programming', request),
  
  performSSATabuSearch: (request: any) => 
    api.post<any>('/inventory/ssa-tabu-search', request),
  
  simulateInventory: (request: any) => 
    api.post<any>('/inventory/simulate', request),
  
  optimizeBaseStock: (request: any) => 
    api.post<any>('/inventory/optimize-base-stock', request),
  
  fitDemandDistribution: (request: any) => 
    api.post<any>('/inventory/fit-demand-distribution', request),
  
  comprehensiveAnalysis: (request: any) => 
    api.post<any>('/inventory/comprehensive-analysis', request),
  
  healthCheck: () => 
    api.get<any>('/inventory/health'),
};

export default api;