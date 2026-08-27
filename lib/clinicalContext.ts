import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Contexto clínico complementario a los signos vitales: antecedentes, laboratorios,
 * medicación y conectividad del dispositivo. Un único fetcher sirve a dos consumidores
 * con ventanas de tiempo distintas:
 *
 * - lib/contextEngine.ts (motor de IA): pasa `intervalStartISO` = el mismo intervalo
 *   incremental que usa para los signos vitales, para mantener el prompt acotado a lo
 *   nuevo desde el último diagnóstico.
 * - app/api/patient-clinical-log (UI): no pasa `intervalStartISO`, así que usa las
 *   ventanas por defecto de abajo -- una vista "de un tiempo X para atrás" pensada para
 *   lectura humana, no para el LLM.
 *
 * Los antecedentes (condiciones ACTIVE) nunca se acotan por intervalo: son contexto de
 * fondo del paciente, no un evento puntual -- se listan completos mientras
 * recorded_datetime respete el viaje en el tiempo (<= windowEndISO).
 */

const DEFAULT_LABS_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_MEDS_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_CONNECTIVITY_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ROWS_PER_SECTION = 50;

export interface PatientConditionSummary {
  conditionId: string;
  category: string;
  onsetDate: string;
  status: string;
}

export interface PatientLabResultSummary {
  labResultId: string;
  testCode: string;
  testName: string;
  resultValue: number;
  unit: string;
  referenceLow: number;
  referenceHigh: number;
  sampleDatetime: string;
  outOfRange: boolean;
}

export interface PatientMedicationSummary {
  administrationId: string;
  medicationId: string;
  medicationClass: string | null;
  genericCategory: string | null;
  administrationRoute: string | null;
  startDatetime: string;
  endDatetime: string;
  doseValue: number;
  doseUnit: string;
  status: string;
}

export interface PatientConnectivityEventSummary {
  eventId: string;
  deviceId: string;
  startDatetime: string;
  endDatetime: string;
  connectivityStatus: string;
  delayedRecords: number;
  packetLossEstimate: number;
}

export interface PatientClinicalContext {
  activeConditions: PatientConditionSummary[];
  recentLabs: PatientLabResultSummary[];
  recentMedications: PatientMedicationSummary[];
  recentConnectivityEvents: PatientConnectivityEventSummary[];
}

export interface FetchClinicalContextOptions {
  /** Si se da, acota labs/medicación/conectividad a (intervalStartISO, windowEndISO] en vez de las ventanas por defecto. */
  intervalStartISO?: string;
}

export const CONDITION_CATEGORY_LABELS: Record<string, string> = {
  CARDIOVASCULAR_HISTORY: 'antecedente cardiovascular',
  RENAL_HISTORY: 'antecedente renal',
  RESPIRATORY_HISTORY: 'antecedente respiratorio',
  METABOLIC_HISTORY: 'antecedente metabólico',
};

export const CONNECTIVITY_STATUS_LABELS: Record<string, string> = {
  DISCONNECTED: 'desconexión',
  DELAYED_SYNC: 'sincronización retrasada',
  INTERMITTENT: 'conexión intermitente',
};

export const MEDICATION_CATEGORY_LABELS: Record<string, string> = {
  CARDIOVASCULAR_SUPPORT: 'soporte cardiovascular',
  RESPIRATORY_SUPPORT: 'soporte respiratorio',
  SYMPTOM_SUPPORT: 'soporte sintomático',
  GENERAL_SUPPORT: 'soporte general',
  METABOLIC_SUPPORT: 'soporte metabólico',
};

export async function fetchPatientClinicalContext(
  supabase: SupabaseClient,
  patientId: string,
  windowEndISO: string,
  options: FetchClinicalContextOptions = {}
): Promise<PatientClinicalContext> {
  const windowEndEpoch = new Date(windowEndISO).getTime();

  const labsStartISO =
    options.intervalStartISO ?? new Date(windowEndEpoch - DEFAULT_LABS_LOOKBACK_MS).toISOString();
  const medsStartISO =
    options.intervalStartISO ?? new Date(windowEndEpoch - DEFAULT_MEDS_LOOKBACK_MS).toISOString();
  const connStartISO =
    options.intervalStartISO ?? new Date(windowEndEpoch - DEFAULT_CONNECTIVITY_LOOKBACK_MS).toISOString();

  const [conditionsRes, labsRes, medsRes, connRes] = await Promise.all([
    supabase
      .from('risa_conditions')
      .select('condition_id,condition_category,onset_date,status,recorded_datetime')
      .eq('patient_id', patientId)
      .eq('status', 'ACTIVE')
      .lte('recorded_datetime', windowEndISO)
      .order('onset_date', { ascending: false }),
    supabase
      .from('risa_laboratory_results')
      .select('lab_result_id,test_code,test_name,result_value,unit,reference_low,reference_high,sample_datetime')
      .eq('patient_id', patientId)
      .gt('sample_datetime', labsStartISO)
      .lte('sample_datetime', windowEndISO)
      .order('sample_datetime', { ascending: false })
      .limit(MAX_ROWS_PER_SECTION),
    supabase
      .from('risa_medication_administrations')
      .select(
        'administration_id,medication_id,start_datetime,end_datetime,dose_value,dose_unit,administration_status,risa_medications(medication_class,generic_category,administration_route)'
      )
      .eq('patient_id', patientId)
      .gt('start_datetime', medsStartISO)
      .lte('start_datetime', windowEndISO)
      .order('start_datetime', { ascending: false })
      .limit(MAX_ROWS_PER_SECTION),
    supabase
      .from('risa_connectivity_events')
      .select('event_id,device_id,start_datetime,end_datetime,connectivity_status,delayed_records,packet_loss_estimate')
      .eq('patient_id', patientId)
      .gt('start_datetime', connStartISO)
      .lte('start_datetime', windowEndISO)
      .order('start_datetime', { ascending: false })
      .limit(MAX_ROWS_PER_SECTION),
  ]);

  const activeConditions: PatientConditionSummary[] = (conditionsRes.data || []).map((row: any) => ({
    conditionId: row.condition_id,
    category: row.condition_category,
    onsetDate: row.onset_date,
    status: row.status,
  }));

  const recentLabs: PatientLabResultSummary[] = (labsRes.data || []).map((row: any) => {
    const resultValue = Number(row.result_value);
    const referenceLow = Number(row.reference_low);
    const referenceHigh = Number(row.reference_high);
    return {
      labResultId: row.lab_result_id,
      testCode: row.test_code,
      testName: row.test_name,
      resultValue,
      unit: row.unit,
      referenceLow,
      referenceHigh,
      sampleDatetime: row.sample_datetime,
      outOfRange: resultValue < referenceLow || resultValue > referenceHigh,
    };
  });

  const recentMedications: PatientMedicationSummary[] = (medsRes.data || []).map((row: any) => {
    // El embed de PostgREST puede llegar como objeto o como arreglo de 1 según la versión del cliente.
    const med = Array.isArray(row.risa_medications) ? row.risa_medications[0] : row.risa_medications;
    return {
      administrationId: row.administration_id,
      medicationId: row.medication_id,
      medicationClass: med?.medication_class ?? null,
      genericCategory: med?.generic_category ?? null,
      administrationRoute: med?.administration_route ?? null,
      startDatetime: row.start_datetime,
      endDatetime: row.end_datetime,
      doseValue: Number(row.dose_value),
      doseUnit: row.dose_unit,
      status: row.administration_status,
    };
  });

  const recentConnectivityEvents: PatientConnectivityEventSummary[] = (connRes.data || []).map((row: any) => ({
    eventId: row.event_id,
    deviceId: row.device_id,
    startDatetime: row.start_datetime,
    endDatetime: row.end_datetime,
    connectivityStatus: row.connectivity_status,
    delayedRecords: Number(row.delayed_records),
    packetLossEstimate: Number(row.packet_loss_estimate),
  }));

  return { activeConditions, recentLabs, recentMedications, recentConnectivityEvents };
}
