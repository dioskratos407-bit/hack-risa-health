export interface ClinicalMeasurement {
  date: string;  // ISO 8601 string format
  value: number;
  unit: string;
  healthyBaseline: number; // Healthy baseline reference curve
  riskPattern: number;     // Disease/risk baseline reference curve
}

export interface ClinicalParameter {
  id: string;
  name: string;
  data: ClinicalMeasurement[];
}

export type EventType = 'INGRESO' | 'EXAMEN' | 'ALERTA' | 'TRATAMIENTO';

export interface PatientEvent {
  id: string;
  timestamp: string; // ISO 8601 string format
  type: EventType;
  title: string;
  description: string;
}

export const defaultAiClinicalSummary =
  'El motor de IA ha analizado 4 documentos recientes (incluyendo Hemograma y Notas de Cardiología). Se observa una tendencia sostenida a la hipoxemia (caída de SpO2) correlacionada con taquicardia compensatoria. Las mediciones cruzan el umbral de riesgo clínico, sugiriendo un cuadro de sepsis temprana. Se requiere intervención médica inmediata.';

export const mockClinicalParameters: ClinicalParameter[] = [
  {
    id: 'hr',
    name: 'Frecuencia Cardíaca (HR)',
    data: [
      { date: '2026-08-26T08:00:00Z', value: 72, unit: 'bpm', healthyBaseline: 75, riskPattern: 76 },
      { date: '2026-08-26T09:00:00Z', value: 74, unit: 'bpm', healthyBaseline: 75, riskPattern: 78 },
      { date: '2026-08-26T10:00:00Z', value: 78, unit: 'bpm', healthyBaseline: 75, riskPattern: 82 },
      { date: '2026-08-26T11:00:00Z', value: 75, unit: 'bpm', healthyBaseline: 75, riskPattern: 87 },
      { date: '2026-08-26T12:00:00Z', value: 81, unit: 'bpm', healthyBaseline: 75, riskPattern: 93 },
      { date: '2026-08-26T13:00:00Z', value: 83, unit: 'bpm', healthyBaseline: 75, riskPattern: 100 },
      { date: '2026-08-26T14:00:00Z', value: 79, unit: 'bpm', healthyBaseline: 75, riskPattern: 107 },
      { date: '2026-08-26T15:00:00Z', value: 84, unit: 'bpm', healthyBaseline: 75, riskPattern: 114 },
      { date: '2026-08-26T16:00:00Z', value: 115, unit: 'bpm', healthyBaseline: 75, riskPattern: 121 },
      { date: '2026-08-26T17:00:00Z', value: 125, unit: 'bpm', healthyBaseline: 75, riskPattern: 128 },
    ],
  },
  {
    id: 'spo2',
    name: 'Saturación de Oxígeno (SpO2)',
    data: [
      { date: '2026-08-26T08:00:00Z', value: 98, unit: '%', healthyBaseline: 98, riskPattern: 98 },
      { date: '2026-08-26T09:00:00Z', value: 99, unit: '%', healthyBaseline: 98, riskPattern: 98 },
      { date: '2026-08-26T10:00:00Z', value: 98, unit: '%', healthyBaseline: 98, riskPattern: 97 },
      { date: '2026-08-26T11:00:00Z', value: 98, unit: '%', healthyBaseline: 98, riskPattern: 96 },
      { date: '2026-08-26T12:00:00Z', value: 97, unit: '%', healthyBaseline: 98, riskPattern: 95 },
      { date: '2026-08-26T13:00:00Z', value: 97, unit: '%', healthyBaseline: 98, riskPattern: 95 },
      { date: '2026-08-26T14:00:00Z', value: 96, unit: '%', healthyBaseline: 98, riskPattern: 94 },
      { date: '2026-08-26T15:00:00Z', value: 96, unit: '%', healthyBaseline: 98, riskPattern: 93 },
      { date: '2026-08-26T16:00:00Z', value: 94, unit: '%', healthyBaseline: 98, riskPattern: 92 },
      { date: '2026-08-26T17:00:00Z', value: 92, unit: '%', healthyBaseline: 98, riskPattern: 91 },
    ],
  },
  {
    id: 'hemoglobina',
    name: 'Hemoglobina',
    data: [
      { date: '2026-08-20T08:00:00Z', value: 13.5, unit: 'g/dL', healthyBaseline: 13.5, riskPattern: 12.0 },
      { date: '2026-08-23T08:00:00Z', value: 13.2, unit: 'g/dL', healthyBaseline: 13.5, riskPattern: 12.0 },
      { date: '2026-08-26T08:00:00Z', value: 13.4, unit: 'g/dL', healthyBaseline: 13.5, riskPattern: 12.0 },
    ],
  },
];

export const mockPatientEvents: PatientEvent[] = [
  {
    id: 'EVT-001',
    timestamp: '2026-08-26T08:00:00Z',
    type: 'INGRESO',
    title: 'Admisión a Planta',
    description: 'Admisión a planta por observación',
  },
  {
    id: 'EVT-002',
    timestamp: '2026-08-26T09:30:00Z',
    type: 'EXAMEN',
    title: 'Examen Hematológico',
    description: 'Extracción de sangre para hemograma completo',
  },
  {
    id: 'EVT-003',
    timestamp: '2026-08-26T11:00:00Z',
    type: 'TRATAMIENTO',
    title: 'Infusión Intravenosa',
    description: 'Administración de fluidos IV',
  },
  {
    id: 'EVT-004',
    timestamp: '2026-08-26T13:15:00Z',
    type: 'EXAMEN',
    title: 'Monitorización de Constantes',
    description: 'Monitorización continua de signos vitales activada',
  },
  {
    id: 'EVT-005',
    timestamp: '2026-08-26T16:45:00Z',
    type: 'ALERTA',
    title: 'Alerta Crítica de Telemetría',
    description: 'Caída de SpO2 combinada con taquicardia. Se recomienda evaluación inmediata',
  },
];
