export interface PatientDocument {
  id: string;
  name: string;
  date: string;
  type: 'PDF' | 'Imagen' | 'Texto';
  size: string;
  category: string;
}

export interface BiomarkerPoint {
  date: string;
  value: number;
}

export interface BiomarkerData {
  id: string;
  name: string;
  unit: string;
  latest: string;
  max: string;
  min: string;
  data: BiomarkerPoint[];
}

export type EventType = 'INGRESO' | 'EXAMEN' | 'ALERTA';

export interface PatientEvent {
  id: string;
  timestamp: string;
  type: EventType;
  title: string;
  description: string;
  doctor?: string;
}

export const mockPatientDocuments: PatientDocument[] = [
  {
    id: 'DOC-101',
    name: 'Análisis de Sangre - Hemograma Completo',
    date: '26 Ago 2026 - 08:30',
    type: 'PDF',
    size: '2.4 MB',
    category: 'Laboratorio Clínico',
  },
  {
    id: 'DOC-102',
    name: 'Nota de Evolución - Cardiología',
    date: '25 Ago 2026 - 14:15',
    type: 'Texto',
    size: '450 KB',
    category: 'Informe Médico',
  },
  {
    id: 'DOC-103',
    name: 'Radiografía Torácica AP y Lateral',
    date: '24 Ago 2026 - 11:00',
    type: 'Imagen',
    size: '14.8 MB',
    category: 'Diagnóstico por Imagen',
  },
  {
    id: 'DOC-104',
    name: 'Electrocardiograma de 12 Derivaciones',
    date: '23 Ago 2026 - 09:45',
    type: 'PDF',
    size: '1.8 MB',
    category: 'Telemetría',
  },
  {
    id: 'DOC-105',
    name: 'Panel Hepático y Función Renal',
    date: '21 Ago 2026 - 16:20',
    type: 'PDF',
    size: '3.1 MB',
    category: 'Laboratorio Clínico',
  },
];

export const mockBiomarkersData: Record<string, BiomarkerData> = {
  hemoglobina: {
    id: 'hemoglobina',
    name: 'Hemoglobina',
    unit: 'g/dL',
    latest: '14.2 g/dL',
    max: '15.8 g/dL',
    min: '12.1 g/dL',
    data: [
      { date: '15 Ago', value: 12.5 },
      { date: '17 Ago', value: 13.1 },
      { date: '19 Ago', value: 13.8 },
      { date: '21 Ago', value: 14.5 },
      { date: '23 Ago', value: 14.0 },
      { date: '25 Ago', value: 14.2 },
    ],
  },
  frecuenciaCardiaca: {
    id: 'frecuenciaCardiaca',
    name: 'Frecuencia Cardíaca',
    unit: 'bpm',
    latest: '118 bpm',
    max: '134 bpm',
    min: '72 bpm',
    data: [
      { date: '08:00', value: 72 },
      { date: '10:00', value: 79 },
      { date: '12:00', value: 90 },
      { date: '14:00', value: 105 },
      { date: '16:00', value: 121 },
      { date: '18:00', value: 134 },
    ],
  },
  spo2: {
    id: 'spo2',
    name: 'Saturación de Oxígeno (SpO2)',
    unit: '%',
    latest: '92%',
    max: '99%',
    min: '88%',
    data: [
      { date: '15 Ago', value: 98 },
      { date: '17 Ago', value: 97 },
      { date: '19 Ago', value: 96 },
      { date: '21 Ago', value: 94 },
      { date: '23 Ago', value: 91 },
      { date: '25 Ago', value: 92 },
    ],
  },
};

export const mockPatientEvents: PatientEvent[] = [
  {
    id: 'EVT-501',
    timestamp: '26 Ago 2026 - 14:30',
    type: 'ALERTA',
    title: 'Alerta de Taquicardia y Caída SpO2',
    description: 'El sistema RISA detectó un cruce de umbral en la frecuencia cardíaca (>120 bpm) con ligera desaturación.',
    doctor: 'Sistema de Alertas RISA',
  },
  {
    id: 'EVT-502',
    timestamp: '25 Ago 2026 - 10:15',
    type: 'EXAMEN',
    title: 'Toma de Muestra de Laboratorio',
    description: 'Se procesó hemograma completo, electrolitos séricos y biomarcadores inflamatorios en el laboratorio central.',
    doctor: 'Lic. Carmen Torres',
  },
  {
    id: 'EVT-503',
    timestamp: '24 Ago 2026 - 16:45',
    type: 'EXAMEN',
    title: 'Evaluación Cardiología y Telemetría',
    description: 'Revisión por especialista con ajuste de esquema de monitoreo no invasivo continuo.',
    doctor: 'Dr. Alejandro Benítez',
  },
  {
    id: 'EVT-504',
    timestamp: '23 Ago 2026 - 08:00',
    type: 'INGRESO',
    title: 'Ingreso a la Unidad de Monitoreo Intermedio',
    description: 'Admisión del paciente con registro inicial de constantes vitales e instalación de sensores de telemetría.',
    doctor: 'Dr. RISA - Red Integrada',
  },
];
