// API Types

export interface DemandRecord {
  date: string;
  cust: string;
  prod: string;  
  demand: number;
  promo_0?: number;
  promo_1?: number;
  sales?: number;
}

export interface ABCAnalysisRequest {
  demand_data: DemandRecord[];
  threshold: number[];
  agg_col: string;
  value_col: string;
  abc_name: string;
  rank_name: string;
}

export interface ABCAnalysisResult {
  aggregated_data: Record<string, any>;
  new_data: Record<string, any>;
  categories: Record<number, string[]>;
}

export interface TreeMapRequest {
  demand_data: DemandRecord[];
  parent: string;
  value: string;
}

export interface VRPRequest {
  model_data: any;
  matrix: boolean;
  threads: number;
  explore: number;
  osrm: boolean;
  host: string;
}

export interface VRPResult {
  input_data: any;
  output_data: any;
  error_message: string;
}

// Inventory Optimization Types

export interface EOQRequest {
  annual_demand: number;
  order_cost: number;
  holding_cost: number;
  unit_cost?: number;
  backorder_cost?: number;
  discount_breaks?: number[][];
}

export interface EOQResult {
  eoq: number;
  total_cost: number;
  order_frequency: number;
  cycle_time: number;
  safety_stock?: number;
}

export interface WagnerWhitinRequest {
  demands: number[];
  fixed_costs: number | number[];
  variable_costs: number | number[];
  holding_costs: number | number[];
}

export interface WagnerWhitinResult {
  orders: number[];
  total_cost: number;
  order_periods: number[];
}

export interface SSPolicyRequest {
  mu: number;
  sigma: number;
  lead_time: number;
  backorder_cost: number;
  holding_cost: number;
  fixed_cost: number;
}

export interface SSPolicyResult {
  s: number;
  S: number;
  order_up_to_level: number;
  reorder_point: number;
}

export interface ComprehensiveAnalysisRequest {
  products: ProductData[];
  demand_data: DemandData[];
  analysis_options?: {
    calculate_eoq?: boolean;
    fit_distributions?: boolean;
    approximate_ss?: boolean;
    simulate_policies?: boolean;
  };
}

export interface ProductData {
  prod: string;
  name?: string;
  unit_cost?: number;
  holding_cost_rate: number;
  lead_time?: number;
  service_level?: number;
}

export interface DemandData {
  date: string;
  prod: string;
  demand: number;
  forecast?: number;
}