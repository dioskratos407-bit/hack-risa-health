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

export const mockAIInsights: AIInsightsData = {
  analyzedSources: [
    'Hemograma Completo (25/08/2026)',
    'Monitoreo Continuo Wearable (26/08/2026)',
    'Registro de Telemetría SpO2 (26/08/2026)',
  ],
  objectiveAnalysis:
    'Se ha detectado una alteración cruzada en los últimos 45 minutos. La Frecuencia Cardíaca se ha elevado de 75 a 115 bpm (+53%), mientras que la saturación (SpO2) muestra una caída sostenida por debajo del 92%. Se requiere revisión médica del especialista para evaluar estos cambios hemodinámicos.',
  keyAnomalies: [
    {
      metric: 'HR',
      label: 'Frecuencia Cardíaca',
      change: '+53%',
      isDanger: true,
      sparklineData: [
        { val: 75 },
        { val: 78 },
        { val: 84 },
        { val: 98 },
        { val: 115 },
        { val: 125 },
      ],
    },
    {
      metric: 'SpO2',
      label: 'Saturación SpO2',
      change: '-6%',
      isDanger: true,
      sparklineData: [
        { val: 98 },
        { val: 98 },
        { val: 97 },
        { val: 96 },
        { val: 94 },
        { val: 92 },
      ],
    },
  ],
};
