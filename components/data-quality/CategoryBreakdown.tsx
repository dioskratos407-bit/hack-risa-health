'use client';

import React from 'react';
import { QualityAuditRow } from '@/lib/dataQualityAudit';
import { CheckCircle2, XCircle, RefreshCw, AlertOctagon, HelpCircle } from 'lucide-react';

interface CategoryBreakdownProps {
  categories: QualityAuditRow[];
}

const CATEGORY_DESCRIPTIONS: Record<string, { label: string; desc: string; type: 'recovered' | 'dropped' }> = {
  recuperado_unidad_degF: {
    label: 'Conversión de Temperatura (°F → °C)',
    desc: 'Unidades en Fahrenheit detectadas y convertidas automáticamente a Celsius.',
    type: 'recovered',
  },
  recuperado_retransmit_huerfano: {
    label: 'Retransmisión Huérfana Rescatada',
    desc: 'Lectura retransmitida sin duplicado previo que se recuperó como medición válida.',
    type: 'recovered',
  },
  descartado_check_pendiente_revision: {
    label: 'Flag CHECK / Pendiente de Validación',
    desc: 'Registros marcados explícitamente como no validados o con artefactos por el operador.',
    type: 'dropped',
  },
  descartado_low_signal: {
    label: 'Baja Calidad de Señal (LOW_SIGNAL)',
    desc: 'Mediciones descartadas por relación señal/ruido deficiente en el sensor.',
    type: 'dropped',
  },
  descartado_retransmit_duplicado: {
    label: 'Retransmisión Redundante',
    desc: 'Paquetes duplicados enviados por reintentos de red del concentrador.',
    type: 'dropped',
  },
  descartado_metadato_o_baja_calidad: {
    label: 'Metadatos de Dispositivo o Señal < Umbral',
    desc: 'Mensajes de heartbeat, autodiagnóstico o mediciones de monitores de cabecera con signal_quality baja.',
    type: 'dropped',
  },
  descartado_calidad_sensor: {
    label: 'Sensor Wearable con Ruido Extremo',
    desc: 'Lecturas de dispositivos vestibles con índice de confianza nulo o insuficiente.',
    type: 'dropped',
  },
  descartado_fuga_temporal: {
    label: 'Fuga Temporal (Sync < Timestamp)',
    desc: 'Inconsistencias donde la hora de sincronización fue anterior a la hora de captura del sensor.',
    type: 'dropped',
  },
  descartado_conflicto_prioridad: {
    label: 'Deduplicación Jerárquica Inter-Fuente',
    desc: 'Solapamientos temporales resueltos por jerarquía clínica: Vital Signs Clínico > Dispositivo > Wearable.',
    type: 'dropped',
  },
  descartado_valor_faltante_no_parseable: {
    label: 'Valor Faltante o No Parseable',
    desc: 'Registros con campos vacíos, NaN o caracteres no numéricos en variables continuas.',
    type: 'dropped',
  },
  descartado_fuera_rango_biologico: {
    label: 'Fuera de Rango Biológico Plausible',
    desc: 'Valores fisiológicamente incompatibles con la vida (ej. SpO2 < 40%, FC > 300 bpm, Temp > 45°C).',
    type: 'dropped',
  },
  descartado_categoria_no_valida: {
    label: 'Categoría Clínica Inválida',
    desc: 'Registros categóricos con códigos que no corresponden a la taxonomía estándar.',
    type: 'dropped',
  },
  descartado_variable_no_reconocida: {
    label: 'Variable No Mapeada en Catálogo',
    desc: 'Códigos de variable crudos que no pudieron asociarse al diccionario maestro de signos vitales.',
    type: 'dropped',
  },
  descartado_pico_no_persistente: {
    label: 'Pico Transitorio Aislado (Glitch)',
    desc: 'Anomalías agudas detectadas con Modified Z-Score (|Z| > 3.5) que volvieron al nivel base en la lectura inmediata siguiente.',
    type: 'dropped',
  },
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories }) => {
  // Agrupar categorías por etapa
  const stagesMap = new Map<string, QualityAuditRow[]>();
  for (const cat of categories) {
    const list = stagesMap.get(cat.stage) || [];
    list.push(cat);
    stagesMap.set(cat.stage, list);
  }

  const stageKeys = Array.from(stagesMap.keys());

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Desglose de Reglas y Acciones de Auditoría (15 Categorías)
          </h3>
          <p className="text-xs text-slate-500">
            Detalle exacto de cada condición evaluada en el script <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">clean_health_data.py</code>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recuperado / Normalizado
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
            <XCircle className="w-3.5 h-3.5" />
            Descartado por Calidad
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {stageKeys.map((stageName) => {
          const items = stagesMap.get(stageName) || [];
          const totalStageDropped = items
            .filter((i) => i.category.startsWith('descartado_'))
            .reduce((sum, i) => sum + i.dropped_count, 0);
          const totalStageRecovered = items
            .filter((i) => i.category.startsWith('recuperado_'))
            .reduce((sum, i) => sum + i.dropped_count, 0);

          return (
            <div key={stageName} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              {/* Stage Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {stageName}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {items.length} {items.length === 1 ? 'regla evaluada' : 'reglas evaluadas'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  {totalStageRecovered > 0 && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      +{totalStageRecovered.toLocaleString()} recuperados
                    </span>
                  )}
                  <span className="text-slate-600 font-semibold">
                    Total descartado: <span className="text-rose-600 font-bold">{totalStageDropped.toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {/* Rules List */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const meta = CATEGORY_DESCRIPTIONS[item.category] || {
                    label: item.category.replace(/_/g, ' '),
                    desc: 'Criterio de filtrado de datos.',
                    type: item.category.startsWith('recuperado_') ? 'recovered' : 'dropped',
                  };
                  const isRecovered = meta.type === 'recovered';

                  return (
                    <div
                      key={item.category}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                            isRecovered
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : item.dropped_count > 0
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {isRecovered ? (
                            <RefreshCw className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{meta.label}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({item.category})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-base font-bold font-mono ${
                              isRecovered
                                ? 'text-emerald-700'
                                : item.dropped_count > 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isRecovered ? `+${item.dropped_count.toLocaleString()}` : item.dropped_count.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">filas afectadas</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
