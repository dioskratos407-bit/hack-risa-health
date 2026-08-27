import { PatientItem, mockPatientsList } from './mockPatients';
import { PriorityLevel } from './mockData';
import { defaultAiClinicalSummary } from './mockPatientDetails';

export interface DigitalTwinPoint {
  time: string;
  patientHR: number;
  riskPatternHR: number;
}

export interface PatientDetailExtended extends PatientItem {
  riskScore: number;
  priorityLevel: PriorityLevel;
  primaryCondition: string;
  attendingPhysician: string;
  isPrioritized: boolean;
  aiClinicalSummary: string;
}

export const mockDigitalTwinData: DigitalTwinPoint[] = [
  { time: '08:00', patientHR: 72, riskPatternHR: 76 },
  { time: '09:00', patientHR: 74, riskPatternHR: 78 },
  { time: '10:00', patientHR: 79, riskPatternHR: 82 },
  { time: '11:00', patientHR: 84, riskPatternHR: 87 },
  { time: '12:00', patientHR: 90, riskPatternHR: 93 },
  { time: '13:00', patientHR: 97, riskPatternHR: 100 },
  { time: '14:00', patientHR: 105, riskPatternHR: 107 },
  { time: '15:00', patientHR: 113, riskPatternHR: 114 },
  { time: '16:00', patientHR: 121, riskPatternHR: 122 },
  { time: '17:00', patientHR: 128, riskPatternHR: 129 },
  { time: '18:00', patientHR: 133, riskPatternHR: 134 },
  { time: '19:00', patientHR: 137, riskPatternHR: 138 },
];

export function getPatientDetailById(id: string): PatientDetailExtended {
  const basePatient =
    mockPatientsList.find((p) => p.id.toLowerCase() === id.toLowerCase()) ||
    mockPatientsList[0];

  // Assign simulated clinical details based on ID
  const isCritical = basePatient.id === 'PAT-0001' || basePatient.id === 'PAT-0002';
  const isHigh = basePatient.id === 'PAT-0004' || basePatient.id === 'PAT-0008';

  return {
    ...basePatient,
    riskScore: isCritical ? 0.95 : isHigh ? 0.82 : 0.45,
    priorityLevel: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MEDIUM',
    primaryCondition: 'Monitoreo de Sepsis Temprana & Telemetría Cardíaca',
    attendingPhysician: 'Dr. RISA - Red Integrada de Salud',
    isPrioritized: true, // Default to true for demo view
    aiClinicalSummary: defaultAiClinicalSummary,
  };
}
