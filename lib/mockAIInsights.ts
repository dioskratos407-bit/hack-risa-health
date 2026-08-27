export interface SparklinePoint {
  val: number;
}

export interface AIAnomalyItem {
  metric: string;
  label: string;
  change: string;
  isDanger: boolean;
  sparklineData: SparklinePoint[];
}

export interface AIInsightsData {
  analyzedSources: string[];
  objectiveAnalysis: string;
  keyAnomalies: AIAnomalyItem[];
}
