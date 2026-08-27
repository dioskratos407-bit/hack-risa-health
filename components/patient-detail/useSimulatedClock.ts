'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertRecord } from './AlertsPanel';
import { evaluatePoint, hasOwnCandidate, detectDataGap, CONTINUOUS_VARS } from '@/lib/anomalyRules';
import { useGlobalSimulation } from '@/components/simulation/GlobalSimulationContext';

export interface TimelineRecord {
  timestamp: string;
  variable_code: string;
  value: string | number;
  device_id?: string | null;
}

export { VARIABLE_UNITS, VARIABLE_LABELS } from '@/lib/variableMeta';

// Cadencia mínima (en tiempo SIMULADO) entre solicitudes de análisis contextual
// mientras el reloj avanza en modo manual. El servidor re-verifica su propio cooldown
// y el score de contexto, así que esto solo evita requests redundantes.
const ANALYSIS_REQUEST_INTERVAL_SIM_MS = 6 * 60 * 60 * 1000;

function toNumeric(value: string | number): number {
  return typeof value === 'number' ? value : parseFloat(value as string);
}

/** Último registro de `records` con timestamp <= targetEpoch y dentro de la tolerancia. */
function findNearestAtOrBefore<T extends { timestamp: string; value: string | number }>(
  records: T[],
  targetEpoch: number,
  toleranceMs: number
): T | undefined {
  for (let i = records.length - 1; i >= 0; i--) {
    const epoch = new Date(records[i].timestamp).getTime();
    if (epoch <= targetEpoch) {
      return targetEpoch - epoch <= toleranceMs ? records[i] : undefined;
    }
  }
  return undefined;
}

export interface UseSimulatedClockResult {
  minEpoch: number;
  maxEpoch: number;
  windowLoading: boolean;
  currentEpoch: number;
  setCurrentEpoch: (epoch: number) => void;
  currentTimeISO: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  data: TimelineRecord[];
  loading: boolean;
  error: string | null;
  fetchData: () => void;
  handleReset: () => void;
  alerts: AlertRecord[];
}

/**
 * Reloj de simulación compartido: fetchea la línea de tiempo del paciente (todas las
 * variables, cluster=ALL) según avanza `currentEpoch`, corre el motor de priorización
 * de anomalías sobre los puntos nuevos revelados, e hidrata/persiste alertas. Vive a
 * nivel de página (no dentro de un tab) para que "Viaje en el Tiempo" y "Log de
 * Eventos" compartan el mismo estado y no se reinicie al cambiar de pestaña.
 */
export function useSimulatedClock(
  patientId: string,
  onAnalysisEvent?: (event: 'start' | 'done' | 'skipped') => void
): UseSimulatedClockResult {
  const globalSim = useGlobalSimulation();

  // Cada paciente tiene su propia ventana real de datos (escalonada ~1 día respecto a
  // los demás, no comparten un rango fijo) -- se resuelve por API en vez de asumir el
  // rango de PAT-0001 para todos, que era la causa de que otros pacientes no mostraran
  // ningún dato (su ventana real ni siquiera se solapaba con el timeT inicial fijo).
  const [minEpoch, setMinEpoch] = useState<number>(() => Date.now());
  const [maxEpoch, setMaxEpoch] = useState<number>(() => Date.now());
  const [windowLoading, setWindowLoading] = useState<boolean>(true);
  const [windowReady, setWindowReady] = useState<boolean>(false);

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const [data, setData] = useState<TimelineRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const processedAlertKeysRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTimeISO = windowReady ? new Date(currentEpoch).toISOString().split('.')[0] + 'Z' : '';

  useEffect(() => {
    let cancelled = false;
    setWindowLoading(true);
    setWindowReady(false);
    setIsPlaying(false);

    fetch(`/api/patient-window?patientId=${encodeURIComponent(patientId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          const min = new Date(json.minTime).getTime();
          const max = new Date(json.maxTime).getTime();
          setMinEpoch(min);
          setMaxEpoch(max);
          setCurrentEpoch(min);
        } else {
          setError(json.error || 'No se pudo resolver el rango de datos del paciente.');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Error de conexión con el servidor');
      })
      .finally(() => {
        if (!cancelled) {
          setWindowLoading(false);
          setWindowReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  // Marca a este paciente como "enfocado" en la simulación global mientras su
  // expediente está abierto -- el motor global lo incluye en TODOS sus ticks (no solo
  // en el barrido round-robin) para que su reloj avance de forma fluida mientras se ve.
  useEffect(() => {
    globalSim.setFocusedPatient(patientId);
    return () => globalSim.setFocusedPatient(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, globalSim.setFocusedPatient]);

  // Mientras la simulación global está corriendo, el reloj de este paciente sigue el
  // cursor que el motor global le asigna en cada tick, en vez del timer manual local.
  useEffect(() => {
    if (!globalSim.running || !globalSim.focusedCursor || globalSim.focusedPatientId !== patientId) return;
    const newEpoch = new Date(globalSim.focusedCursor).getTime();
    setCurrentEpoch((prev) => (newEpoch > prev ? Math.min(newEpoch, maxEpoch) : prev));
  }, [globalSim.running, globalSim.focusedCursor, globalSim.focusedPatientId, patientId, maxEpoch]);

  // Evita que el timer manual ("Iniciar Reproducción") compita con el avance que ya
  // está aplicando la simulación global sobre el mismo currentEpoch.
  useEffect(() => {
    if (globalSim.running) setIsPlaying(false);
  }, [globalSim.running]);

  const fetchData = useCallback(async () => {
    if (!windowReady) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/patient-timeline?patientId=${encodeURIComponent(
        patientId
      )}&timeT=${encodeURIComponent(currentTimeISO)}&cluster=ALL`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Error al obtener la línea de tiempo');
        setData([]);
      } else {
        setData(json.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, [patientId, currentTimeISO, windowReady]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hydrate previously persisted alerts when the patient changes
  useEffect(() => {
    processedAlertKeysRef.current.clear();
    setAlerts([]);

    const hydrateAlerts = async () => {
      try {
        const res = await fetch(`/api/alerts?patientId=${encodeURIComponent(patientId)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAlerts(json.data);
          json.data.forEach((a: AlertRecord) => {
            processedAlertKeysRef.current.add(`${a.variable_code}|${a.timestamp}`);
          });
        }
      } catch {
        // Las alertas son un panel complementario; un fallo de hidratación no debe romper el reloj.
      }
    };

    hydrateAlerts();
  }, [patientId]);

  // Simulation Playback Timer (control manual -- se pausa mientras la simulación
  // global está corriendo, ver el efecto de arriba)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentEpoch((prev) => {
          const next = prev + playbackSpeed * 60 * 1000;
          if (next >= maxEpoch) {
            setIsPlaying(false);
            return maxEpoch;
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, maxEpoch]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentEpoch(minEpoch);
  }, [minEpoch]);

  // Disparador del análisis con IA en modo manual: NO es una alerta de umbral, sino el
  // avance del contexto -- cada vez que el reloj acumula suficiente tiempo simulado
  // nuevo, se le propone al servidor analizar el intervalo incremental. El servidor
  // decide (cooldown en tiempo simulado + score de cambio de contexto) si efectivamente
  // llama a la IA. Cuando la Simulación del Sistema está corriendo, este camino se
  // desactiva: el motor global ya analiza al paciente enfocado en sus ticks.
  const lastAnalysisRequestEpochRef = useRef<number>(0);
  useEffect(() => {
    lastAnalysisRequestEpochRef.current = 0;
  }, [patientId]);

  useEffect(() => {
    if (globalSim.running || !windowReady || currentEpoch <= 0 || data.length === 0) return;
    if (currentEpoch - lastAnalysisRequestEpochRef.current < ANALYSIS_REQUEST_INTERVAL_SIM_MS) return;
    lastAnalysisRequestEpochRef.current = currentEpoch;

    onAnalysisEvent?.('start');
    fetch('/api/analyze-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, timeT: currentTimeISO }),
    })
      .then((res) => res.json())
      .then((json) => {
        onAnalysisEvent?.(json.success && json.insightUpdated ? 'done' : 'skipped');
      })
      .catch(() => onAnalysisEvent?.('skipped'));
  }, [currentEpoch, currentTimeISO, data.length, globalSim.running, windowReady, patientId, onAnalysisEvent]);

  // Motor de priorización: evalúa cada punto nuevo revelado por el reloj simulado,
  // aplica los patrones de gestión de falsas alarmas y solo persiste/muestra lo que
  // supera el piso de prioridad (HIGH+). Ver lib/anomalyRules.ts.
  useEffect(() => {
    if (data.length === 0) return;

    const byVariable: Record<string, TimelineRecord[]> = {};
    data.forEach((d) => {
      if (!byVariable[d.variable_code]) byVariable[d.variable_code] = [];
      byVariable[d.variable_code].push(d);
    });

    const activityRecords = byVariable['ACTIVITY_LEVEL'] || [];
    const ACTIVITY_TOLERANCE_MS = 30 * 60 * 1000;
    const CROSS_VAR_TOLERANCE_MS = 20 * 60 * 1000;

    const postAlert = (detection: {
      variableCode: string;
      value: number;
      timestamp: string;
      kind: 'VALUE_ANOMALY' | 'DATA_GAP';
      priorityTier: 'MEDIUM' | 'HIGH' | 'CRITICAL';
      priorityScore: number;
      ruleReason: string;
    }) => {
      const tempId = `local-${detection.variableCode}|${detection.timestamp}`;
      setAlerts((prev) => [
        {
          id: tempId,
          patient_id: patientId,
          variable_code: detection.variableCode,
          value: isNaN(detection.value) ? null : detection.value,
          timestamp: detection.timestamp,
          severity: detection.priorityTier === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          rule_reason: detection.ruleReason,
          kind: detection.kind,
          priority_tier: detection.priorityTier,
          priority_score: detection.priorityScore,
        },
        ...prev,
      ]);

      fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          variableCode: detection.variableCode,
          value: isNaN(detection.value) ? null : detection.value,
          timestamp: detection.timestamp,
          kind: detection.kind,
          priorityTier: detection.priorityTier,
          priorityScore: detection.priorityScore,
          ruleReason: detection.ruleReason,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setAlerts((prev) => prev.map((a) => (a.id === tempId ? json.data : a)));
          }
        })
        .catch(() => {
          // La alerta ya se mostró optimistamente con el motor local; un fallo de red
          // al persistir no debe romper la simulación.
        });
    };

    CONTINUOUS_VARS.forEach((varCode) => {
      const records = byVariable[varCode];
      if (!records || records.length === 0) return;

      records.forEach((record, idx) => {
        const key = `${varCode}|${record.timestamp}`;
        if (processedAlertKeysRef.current.has(key)) return;
        processedAlertKeysRef.current.add(key);

        const numericValue = toNumeric(record.value);
        const recordEpoch = new Date(record.timestamp).getTime();

        const history = records
          .slice(0, idx)
          .map((r) => toNumeric(r.value))
          .filter((v) => !isNaN(v));

        const nextValue = idx + 1 < records.length ? toNumeric(records[idx + 1].value) : undefined;

        const nearestActivity = findNearestAtOrBefore(activityRecords, recordEpoch, ACTIVITY_TOLERANCE_MS);
        const activityLevel = nearestActivity ? String(nearestActivity.value) : undefined;

        const otherActiveTrends: string[] = [];
        CONTINUOUS_VARS.forEach((otherVar) => {
          if (otherVar === varCode) return;
          const otherRecords = byVariable[otherVar];
          if (!otherRecords || otherRecords.length === 0) return;
          const nearest = findNearestAtOrBefore(otherRecords, recordEpoch, CROSS_VAR_TOLERANCE_MS);
          if (!nearest) return;
          const nearestIdx = otherRecords.indexOf(nearest);
          const otherHistory = otherRecords
            .slice(0, nearestIdx)
            .map((r) => toNumeric(r.value))
            .filter((v) => !isNaN(v));
          if (hasOwnCandidate(otherVar, toNumeric(nearest.value), otherHistory)) {
            otherActiveTrends.push(otherVar);
          }
        });

        const detection = evaluatePoint({
          variableCode: varCode,
          value: numericValue,
          timestamp: record.timestamp,
          history,
          nextValue,
          activityLevel,
          otherActiveTrends,
        });
        if (!detection) return;

        postAlert(detection);
      });
    });

    // Patrón 5 -- Trampa del vacío: se revisa una vez por tick (no por punto), acotado
    // por hora simulada para no re-alertar en cada re-render mientras el vacío persiste.
    const gapBucket = Math.floor(currentEpoch / (60 * 60 * 1000));
    CONTINUOUS_VARS.forEach((varCode) => {
      const gapKey = `gap|${varCode}|${gapBucket}`;
      if (processedAlertKeysRef.current.has(gapKey)) return;
      processedAlertKeysRef.current.add(gapKey);

      const records = byVariable[varCode] || [];
      const gap = detectDataGap(varCode, records.map((r) => r.timestamp), currentTimeISO);
      if (!gap) return;

      postAlert(gap);
    });
  }, [data, patientId, currentEpoch, currentTimeISO, onAnalysisEvent]);

  return {
    minEpoch,
    maxEpoch,
    windowLoading,
    currentEpoch,
    setCurrentEpoch,
    currentTimeISO,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    data,
    loading,
    error,
    fetchData,
    handleReset,
    alerts,
  };
}
