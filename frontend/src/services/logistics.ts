import axios from 'axios';

const LOGISTICS_API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1', '') + '/api/v1/logistics' || 'http://localhost:8000/api/v1/logistics';

// 型定義
export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CustomerData extends LocationData {
  demand: number;
  weight?: number;
}

export interface DCData extends LocationData {
  capacity: number;
  fixed_cost: number;
  variable_cost: number;
  opening_cost?: number;
}

export interface PlantData extends LocationData {
  capacity: number;
  production_cost: number;
}

export interface WeiszfeldRequest {
  customers: CustomerData[];
  num_facilities: number;
  max_iterations?: number;
  tolerance?: number;
  use_great_circle?: boolean;
}

export interface WeiszfeldResult {
  facility_locations: LocationData[];
  total_cost: number;
  iterations: number;
  convergence_history: number[];
  customer_assignments: Record<string, number>;
}

export interface KMedianRequest {
  customers: CustomerData[];
  dc_candidates: DCData[];
  k: number;
  max_iterations?: number;
  learning_rate?: number;
  momentum?: number;
}

export interface KMedianResult {
  selected_facilities: number[];
  facility_locations: DCData[];
  total_cost: number;
  objective_history: number[];
  customer_assignments: Record<string, number>;
}

export interface ClusteringRequest {
  customers: CustomerData[];
  method: string;
  n_clusters: number;
  use_road_distance?: boolean;
}

export interface ClusteringResult {
  clusters: Record<string, number>;
  cluster_centers: LocationData[];
  aggregated_customers: CustomerData[];
  silhouette_score: number;
}

export interface LNDRequest {
  customers: CustomerData[];
  dc_candidates: DCData[];
  plants: PlantData[];
  model_type?: string;
  optimization_objective?: string;
  capacity_constraints?: boolean;
  max_facilities?: number;
  co2_constraint?: number;
}

export interface LNDResult {
  selected_facilities: DCData[];
  flow_assignments: Record<string, Record<string, number>>;
  total_cost: number;
  cost_breakdown: Record<string, number>;
  facility_utilization: Record<string, number>;
  network_performance: Record<string, number>;
  solution_status: string;
  solve_time: number;
  co2_emissions?: number;
}

export interface NetworkVisualizationRequest {
  lnd_result: LNDResult;
  show_flows?: boolean;
  flow_threshold?: number;
  map_style?: string;
}

export interface NetworkVisualizationResult {
  plotly_figure: any;
  network_stats: Record<string, number>;
  legend_data: Record<string, any>;
}

class LogisticsAPI {
  // ヘルスチェック
  async healthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${LOGISTICS_API_BASE}/health`);
      return response.data;
    } catch (error) {
      console.error('Logistics health check failed:', error);
      throw error;
    }
  }

  // Weiszfeld法による施設立地最適化
  async optimizeFacilityLocations(request: WeiszfeldRequest): Promise<WeiszfeldResult> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/weiszfeld`, request);
      return response.data;
    } catch (error) {
      console.error('Weiszfeld optimization failed:', error);
      throw error;
    }
  }

  // K-Median最適化
  async solveKMedian(request: KMedianRequest): Promise<KMedianResult> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/k-median`, request);
      return response.data;
    } catch (error) {
      console.error('K-Median optimization failed:', error);
      throw error;
    }
  }

  // 顧客クラスタリング
  async clusterCustomers(request: ClusteringRequest): Promise<ClusteringResult> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/clustering`, request);
      return response.data;
    } catch (error) {
      console.error('Customer clustering failed:', error);
      throw error;
    }
  }

  // 物流ネットワーク設計
  async solveLogisticsNetworkDesign(request: LNDRequest): Promise<LNDResult> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/lnd`, request);
      return response.data;
    } catch (error) {
      console.error('Logistics network design failed:', error);
      throw error;
    }
  }

  // ネットワーク可視化
  async createNetworkVisualization(request: NetworkVisualizationRequest): Promise<NetworkVisualizationResult> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/visualization`, request);
      return response.data;
    } catch (error) {
      console.error('Network visualization failed:', error);
      throw error;
    }
  }

  // 包括的物流分析
  async comprehensiveAnalysis(
    customers: CustomerData[],
    dc_candidates: DCData[],
    plants: PlantData[] = [],
    analysis_options?: Record<string, boolean>
  ): Promise<any> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/comprehensive-analysis`, {
        customers,
        dc_candidates,
        plants,
        analysis_options
      });
      return response.data;
    } catch (error) {
      console.error('Comprehensive logistics analysis failed:', error);
      throw error;
    }
  }

  // サンプルデータ生成
  async generateSampleData(
    num_customers: number = 20,
    num_dc_candidates: number = 5,
    region: string = 'japan'
  ): Promise<any> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/generate-sample-data`, {
        num_customers,
        num_dc_candidates,
        region
      });
      return response.data;
    } catch (error) {
      console.error('Sample data generation failed:', error);
      throw error;
    }
  }

  // アルゴリズムベンチマーク
  async benchmarkAlgorithms(
    customers: CustomerData[],
    dc_candidates: DCData[],
    algorithms: string[] = ['weiszfeld', 'k_median', 'basic_lnd']
  ): Promise<any> {
    try {
      const response = await axios.post(`${LOGISTICS_API_BASE}/benchmark-algorithms`, {
        customers,
        dc_candidates,
        algorithms
      });
      return response.data;
    } catch (error) {
      console.error('Algorithm benchmark failed:', error);
      throw error;
    }
  }
}

export const logisticsApi = new LogisticsAPI();