export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PatientSignal {
  id: string;
  patientId: string;
  riskScore: number; // Decimal value between 0 and 1 (e.g., 0.94)
  priorityLevel: PriorityLevel;
  signalType: string;
  lastUpdate: string;
}

export interface DashboardMetricsSummary {
  totalPatientsEvaluated: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  activeDevicesCount: number;
}

export const mockPatientSignals: PatientSignal[] = [
  {
    id: 'SIG-9081',
    patientId: 'PAT-4821',
    riskScore: 0.94,
    priorityLevel: 'CRITICAL',
    signalType: 'ECG Continuous - ST Elevation',
    lastUpdate: 'Hace 2 min',
  },
  {
    id: 'SIG-9082',
    patientId: 'PAT-7392',
    riskScore: 0.88,
    priorityLevel: 'CRITICAL',
    signalType: 'SpO2 Desaturation (< 84%)',
    lastUpdate: 'Hace 5 min',
  },
  {
    id: 'SIG-9083',
    patientId: 'PAT-1204',
    riskScore: 0.79,
    priorityLevel: 'HIGH',
    signalType: 'Invasive BP Spike (Hypertensive Crisis)',
    lastUpdate: 'Hace 12 min',
  },
  {
    id: 'SIG-9084',
    patientId: 'PAT-3059',
    riskScore: 0.72,
    priorityLevel: 'HIGH',
    signalType: 'Cardiac Arrhythmia (AFib Detected)',
    lastUpdate: 'Hace 18 min',
  },
  {
    id: 'SIG-9085',
    patientId: 'PAT-8841',
    riskScore: 0.58,
    priorityLevel: 'MEDIUM',
    signalType: 'Respiratory Rate Anomalous (Tachypnea)',
    lastUpdate: 'Hace 25 min',
  },
  {
    id: 'SIG-9086',
    patientId: 'PAT-5520',
    riskScore: 0.45,
    priorityLevel: 'MEDIUM',
    signalType: 'HRV Decline (Autonomic Stress)',
    lastUpdate: 'Hace 32 min',
  },
  {
    id: 'SIG-9087',
    patientId: 'PAT-6193',
    riskScore: 0.28,
    priorityLevel: 'LOW',
    signalType: 'Body Temp Mild Elevation (37.8°C)',
    lastUpdate: 'Hace 45 min',
  },
  {
    id: 'SIG-9088',
    patientId: 'PAT-2047',
    riskScore: 0.15,
    priorityLevel: 'LOW',
    signalType: 'Baseline Vital Signs Stable',
    lastUpdate: 'Hace 1 hora',
  },
];

export const mockDashboardMetrics: DashboardMetricsSummary = {
  totalPatientsEvaluated: 142,
  criticalAlertsCount: 2,
  highAlertsCount: 2,
  activeDevicesCount: 138,
};
