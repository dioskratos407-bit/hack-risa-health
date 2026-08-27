/**
 * Roster de pacientes de la plataforma. Ya no es data mock: son los 1000 pacientes
 * reales presentes en risa_master_data (PAT-0001 .. PAT-1000, rango contiguo verificado
 * contra datos/risa_supabase_import.csv), así que se genera en vez de listarse a mano.
 *
 * Solo contiene el id: los campos que antes acompañaban a cada paciente (edad, género,
 * última atención, estado) eran valores inventados y ya no se usan en ninguna vista --
 * el estado de cada paciente hoy se deriva de datos reales en /api/patient-states.
 */

export interface PatientItem {
  id: string;
}

export const TOTAL_PATIENTS = 1000;

export const mockPatientsList: PatientItem[] = Array.from(
  { length: TOTAL_PATIENTS },
  (_, index) => ({ id: `PAT-${String(index + 1).padStart(4, '0')}` })
);
