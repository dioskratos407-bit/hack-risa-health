export interface PrioritizedPatient {
  id: string;
  patientName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  riskScore: number; // Float between 0 and 1 (e.g. 0.95)
  alertReason: string;
  timestamp: string;
}

export const mockPrioritizedPatients: PrioritizedPatient[] = [
  {
    id: 'PAT-0001',
    patientName: 'Dra. María Elena Rostova',
    priority: 'CRITICAL',
    riskScore: 0.95,
    alertReason: 'Similitud del 89% con patrón de sepsis temprana',
    timestamp: 'Hace 2 min',
  },
  {
    id: 'PAT-0002',
    patientName: 'Carlos Alberto Mendoza',
    priority: 'CRITICAL',
    riskScore: 0.89,
    alertReason: 'Desaturación severa de SpO2 (< 84%) con taquicardia sostenida',
    timestamp: 'Hace 5 min',
  },
  {
    id: 'PAT-0004',
    patientName: 'Dr. Alejandro Benítez',
    priority: 'HIGH',
    riskScore: 0.82,
    alertReason: 'Pico hipertensivo agudo y alteración de onda arterial',
    timestamp: 'Hace 12 min',
  },
  {
    id: 'PAT-0008',
    patientName: 'Ricardo Antonio Paredes',
    priority: 'HIGH',
    riskScore: 0.76,
    alertReason: 'Detección de Arritmia Cardíaca paroxística (FA)',
    timestamp: 'Hace 18 min',
  },
  {
    id: 'PAT-0005',
    patientName: 'Valentina Morales Vega',
    priority: 'MEDIUM',
    riskScore: 0.64,
    alertReason: 'Taquipnea persistente y declive progresivo en variabilidad HRV',
    timestamp: 'Hace 25 min',
  },
  {
    id: 'PAT-0007',
    patientName: 'Isabella Patricia Castro',
    priority: 'MEDIUM',
    riskScore: 0.58,
    alertReason: 'Elevación térmica febril leve con inestabilidad autonómica',
    timestamp: 'Hace 32 min',
  },
];
