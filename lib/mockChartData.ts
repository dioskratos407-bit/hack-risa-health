export interface TimeSeriesDataPoint {
  time: string;
  patientHR: number;     // Real patient measurement in bpm
  riskPatternHR: number; // Historical risk pattern baseline in bpm
}

export const mockTimeSeriesData: TimeSeriesDataPoint[] = [
  { time: '08:00', patientHR: 71, riskPatternHR: 75 },
  { time: '09:00', patientHR: 73, riskPatternHR: 77 },
  { time: '10:00', patientHR: 75, riskPatternHR: 80 },
  { time: '11:00', patientHR: 78, riskPatternHR: 84 },
  { time: '12:00', patientHR: 82, riskPatternHR: 89 },
  { time: '13:00', patientHR: 87, riskPatternHR: 94 },
  { time: '14:00', patientHR: 93, riskPatternHR: 100 },
  { time: '15:00', patientHR: 101, riskPatternHR: 107 },
  { time: '16:00', patientHR: 110, riskPatternHR: 115 },
  { time: '17:00', patientHR: 119, riskPatternHR: 122 },
  { time: '18:00', patientHR: 127, riskPatternHR: 129 },
  { time: '19:00', patientHR: 134, riskPatternHR: 135 },
];
