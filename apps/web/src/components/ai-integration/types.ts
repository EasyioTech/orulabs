export interface AnalyzedMetric {
  label: string;
  value: string | number;
  change: string;
}

export interface AnalyzedChartRow {
  name: string;
  sales: number;
  visits: number;
  returns: number;
}

export interface AnalyzedData {
  summary: string;
  metrics: AnalyzedMetric[];
  chartData: AnalyzedChartRow[];
}
