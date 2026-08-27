/**
 * Metadatos demográficos/administrativos de cada paciente (tabla risa_patients,
 * cargada una vez desde datos/patients.csv -- ver supabase/patients_table.sql).
 * A diferencia de risa_master_data (lecturas en el tiempo), aquí hay una sola fila
 * por paciente, por eso vive aparte y se consulta una vez, no por ventana simulada.
 */

export interface PatientDemographics {
  patientId: string;
  sexAtBirth: 'M' | 'F';
  ageYears: number;
  ageGroup: string;
  regionType: string;
  careProgram: string;
  baselineRiskProfile: string;
  enrollmentDate: string;
  active: boolean;
}

/** Vocabulario fijo del dataset del reto -- usado para poblar los filtros sin
 * depender de que ya haya llegado la respuesta de /api/patients. */
export const AGE_GROUP_OPTIONS = ['18-39', '40-59', '60-74', '75+'] as const;
export const REGION_TYPE_OPTIONS = ['URBAN', 'PERIURBAN', 'RURAL'] as const;
export const CARE_PROGRAM_OPTIONS = [
  'AMBULATORY',
  'HOME_MONITORING',
  'POST_DISCHARGE',
  'GENERAL_FOLLOWUP',
] as const;

export const REGION_TYPE_LABELS: Record<string, string> = {
  URBAN: 'Urbana',
  PERIURBAN: 'Periurbana',
  RURAL: 'Rural',
};

export const CARE_PROGRAM_LABELS: Record<string, string> = {
  AMBULATORY: 'Ambulatorio',
  HOME_MONITORING: 'Monitoreo domiciliario',
  POST_DISCHARGE: 'Post-alta',
  GENERAL_FOLLOWUP: 'Seguimiento general',
};
