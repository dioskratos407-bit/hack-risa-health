'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Activity,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { CLINICAL_CLUSTERS } from '@/lib/clinicalClusters';
import { FinancialClinicalChart } from '@/components/patient-detail/FinancialClinicalChart';

interface TimeTravelClockProps {
  patientId?: string;
}

interface TimelineRecord {
  timestamp: string;
  variable_code: string;
  value: string | number;
}

export const TimeTravelClock: React.FC<TimeTravelClockProps> = ({
  patientId = 'PAT-0001',
}) => {
  // Timeline range boundaries (ISO UTC) - Basado en los datos reales del Paciente 1 (PAT-0001)
  const MIN_TIME = '2026-07-10T09:00:00Z';
  const MAX_TIME = '2026-07-19T09:00:00Z';

  const minEpoch = new Date(MIN_TIME).getTime();
  const maxEpoch = new Date(MAX_TIME).getTime();

  // State
  const [selectedCluster, setSelectedCluster] = useState<string>('HEMODINAMICO');
  const [selectedVariable, setSelectedVariable] = useState<string>('HR');
  const [currentEpoch, setCurrentEpoch] = useState<number>(
    new Date('2026-07-10T12:00:00Z').getTime()
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // minutes step per interval

  const [data, setData] = useState<TimelineRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTimeISO = new Date(currentEpoch).toISOString().split('.')[0] + 'Z';

  // Fetch API data when patientId, cluster or currentTimeISO changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/patient-timeline?patientId=${encodeURIComponent(
        patientId
      )}&timeT=${encodeURIComponent(currentTimeISO)}&cluster=${encodeURIComponent(
        selectedCluster
      )}`;

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
  }, [patientId, currentTimeISO, selectedCluster]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Simulation Playback Timer
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

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentEpoch(minEpoch);
  };

  const activeClusterObj = CLINICAL_CLUSTERS[selectedCluster] || CLINICAL_CLUSTERS['HEMODINAMICO'];

  // Update selected variable if cluster changes
  useEffect(() => {
    if (activeClusterObj.variables.length > 0 && !activeClusterObj.variables.includes(selectedVariable)) {
      setSelectedVariable(activeClusterObj.variables[0]);
    }
  }, [selectedCluster, activeClusterObj, selectedVariable]);

  // Filter records for the financial area chart by selected variable
  const variableData = data
    .filter((d) => d.variable_code === selectedVariable)
    .map((d) => ({
      timestamp: d.timestamp,
      value: typeof d.value === 'number' ? d.value : parseFloat(d.value as string),
    }));

  // Calculate latest values for cluster metrics
  const latestValues: Record<string, { value: string | number; timestamp: string }> = {};
  activeClusterObj.variables.forEach((varCode) => {
    const records = data.filter((d) => d.variable_code === varCode);
    if (records.length > 0) {
      const last = records[records.length - 1];
      latestValues[varCode] = { value: last.value, timestamp: last.timestamp };
    }
  });

  const lineColors: Record<string, string> = {
    HR: '#f43f5e',
    SYS_BP: '#3b82f6',
    DIA_BP: '#10b981',
    RESP: '#8b5cf6',
    SpO2: '#06b6d4',
    TEMP: '#f59e0b',
    STEPS: '#ec4899',
    ACTIVITY_LEVEL: '#6366f1',
  };

  const variableUnits: Record<string, string> = {
    HR: 'bpm',
    SYS_BP: 'mmHg',
    DIA_BP: 'mmHg',
    RESP: 'rpm',
    SpO2: '%',
    TEMP: '°C',
    STEPS: 'pasos',
    ACTIVITY_LEVEL: '',
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      {/* Time Travel Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl backdrop-blur-md text-blue-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Reloj Interactivo de Viaje en el Tiempo
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Anti-Fuga Futura (t &le; t_sim)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simulación temporal estricta con gráficas de rendimiento estilo bolsa financiera
              </p>
            </div>
          </div>

          {/* Current Simulated Time Display */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Tiempo Simulado (timeT)
              </div>
              <div className="font-mono text-sm font-bold text-blue-300">
                {currentTimeISO}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Time Slider, Cluster Selector & Playback Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* Cluster Selection */}
        <div className="lg:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Clúster Clínico
          </label>
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {Object.entries(CLINICAL_CLUSTERS).map(([key, cluster]) => (
              <option key={key} value={key}>
                {cluster.name} ({key})
              </option>
            ))}
          </select>
        </div>

        {/* Playback Controls & Speed */}
        <div className="lg:col-span-4 flex items-end gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-xs cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pausar Simulación
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Iniciar Reproducción
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            title="Reiniciar a inicio"
            className="p-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 shadow-xs outline-none"
          >
            <option value={1}>1x (1m/s)</option>
            <option value={5}>5x (5m/s)</option>
            <option value={15}>15x (15m/s)</option>
            <option value={60}>60x (1h/s)</option>
          </select>
        </div>

        {/* Refresh / Direct Sync */}
        <div className="lg:col-span-4 flex items-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Supabase
          </button>
        </div>

        {/* Interactive Timeline Range Slider */}
        <div className="lg:col-span-12 space-y-1 pt-2">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Inicio: {MIN_TIME.replace('T', ' ').replace('Z', '')}</span>
            <span className="font-bold text-blue-600">{currentTimeISO.replace('T', ' ').replace('Z', '')}</span>
            <span>Fin: {MAX_TIME.replace('T', ' ').replace('Z', '')}</span>
          </div>
          <input
            type="range"
            min={minEpoch}
            max={maxEpoch}
            step={15 * 60 * 1000} // 15 min steps
            value={currentEpoch}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentEpoch(Number(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Metric Cards for Cluster Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {activeClusterObj.variables.map((varCode) => {
          const metric = latestValues[varCode];
          const hasVal = metric !== undefined;
          const isSelected = selectedVariable === varCode;
          return (
            <button
              key={varCode}
              onClick={() => setSelectedVariable(varCode)}
              className={`p-4 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-md text-white ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                  {varCode}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: lineColors[varCode] || '#3b82f6' }}
                />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {hasVal ? metric.value : '--'}
                </span>
                <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                  {variableUnits[varCode] || ''}
                </span>
              </div>
              <div className={`mt-1 text-[11px] font-mono truncate ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                {hasVal ? `Último: ${metric.timestamp.replace('T', ' ').replace('Z', '')}` : 'Sin datos en t ≤ t_sim'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error / Feedback Message */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial Stock-Style Clinical AreaChart */}
      <FinancialClinicalChart
        rawData={variableData}
        timeTISO={currentTimeISO}
        variableName={selectedVariable}
        variableUnit={variableUnits[selectedVariable] || ''}
        lineColor={lineColors[selectedVariable] || '#f43f5e'}
        title="Tendencia"
      />
    </div>
  );
};
