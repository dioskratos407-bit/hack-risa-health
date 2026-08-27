'use client';

import React, { useState } from 'react';
import {
  Database,
  Link2,
  Key,
  Layers,
  ArrowRight,
  Clock,
  Cpu,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  FileCode,
  Activity,
  HeartPulse,
  FlaskConical,
  Pill,
  Wifi,
  Smartphone,
  Server,
} from 'lucide-react';

interface SchemaNode {
  id: string;
  tableName: string;
  displayName: string;
  category: 'core' | 'telemetry' | 'ehr' | 'hardware' | 'intelligence';
  icon: React.ElementType;
  primaryKeys: string[];
  joinKeys: string[];
  recordsCountApprox: string;
  description: string;
  columnsSample: { name: string; type: string; isKey?: boolean; isJoin?: boolean }[];
  // Coordenadas en el lienzo SVG interactivo (viewBox 0 0 900 480)
  x: number;
  y: number;
  width: number;
  height: number;
}

interface JoinRelation {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceCol: string;
  targetCol: string;
  joinType: 'INNER' | 'LEFT' | 'TEMPORAL_WINDOW';
  temporalCondition?: string;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
  purpose: string;
  sqlSnippet: string;
  // Puntos de inicio y fin para dibujar la curva SVG
  fromNodeId: string;
  toNodeId: string;
  labelPosition: { x: number; y: number };
}

const SCHEMA_NODES: SchemaNode[] = [
  {
    id: 'risa_patients',
    tableName: 'risa_patients',
    displayName: 'Pacientes Maestro (HUB)',
    category: 'core',
    icon: Database,
    primaryKeys: ['patient_id'],
    joinKeys: ['patient_id'],
    recordsCountApprox: '100 pacientes',
    description: 'Entidad central del sistema. Contiene demografía, cama/sala, centro de salud y nivel base de riesgo.',
    columnsSample: [
      { name: 'patient_id', type: 'VARCHAR (PK)', isKey: true, isJoin: true },
      { name: 'full_name', type: 'TEXT' },
      { name: 'age', type: 'INTEGER' },
      { name: 'assigned_facility_id', type: 'VARCHAR (FK)' },
      { name: 'risk_baseline', type: 'VARCHAR' },
    ],
    x: 360,
    y: 190,
    width: 180,
    height: 90,
  },
  {
    id: 'risa_master_data',
    tableName: 'risa_master_data',
    displayName: 'Telemetría (Signos Vitales)',
    category: 'telemetry',
    icon: Activity,
    primaryKeys: ['patient_id', 'timestamp', 'variable_code'],
    joinKeys: ['patient_id', 'device_id', 'variable_code', 'timestamp'],
    recordsCountApprox: '~1.62M lecturas',
    description: 'Serie temporal continua de HR, SpO2, SBP, DBP, RR y Temp tras deduplicación y filtros biológicos.',
    columnsSample: [
      { name: 'patient_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'device_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'variable_code', type: 'VARCHAR', isJoin: true },
      { name: 'timestamp', type: 'TIMESTAMPTZ', isJoin: true },
      { name: 'value', type: 'NUMERIC' },
    ],
    x: 60,
    y: 50,
    width: 190,
    height: 80,
  },
  {
    id: 'risa_conditions',
    tableName: 'risa_conditions',
    displayName: 'Antecedentes EHR',
    category: 'ehr',
    icon: HeartPulse,
    primaryKeys: ['condition_id'],
    joinKeys: ['patient_id'],
    recordsCountApprox: '~1,484 registros',
    description: 'Historial patológico del paciente (hipertensión, diabetes, EPOC, etc.) con fechas de inicio y estado ACTIVE.',
    columnsSample: [
      { name: 'condition_id', type: 'VARCHAR (PK)', isKey: true },
      { name: 'patient_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'condition_code', type: 'VARCHAR' },
      { name: 'condition_category', type: 'VARCHAR' },
      { name: 'status', type: 'VARCHAR' },
    ],
    x: 650,
    y: 50,
    width: 190,
    height: 80,
  },
  {
    id: 'risa_laboratory_results',
    tableName: 'risa_laboratory_results',
    displayName: 'Resultados Laboratorio',
    category: 'ehr',
    icon: FlaskConical,
    primaryKeys: ['lab_result_id'],
    joinKeys: ['patient_id', 'sample_datetime'],
    recordsCountApprox: '~4,593 análisis',
    description: 'Biomarcadores séricos (Troponina, Lactato, Creatinina, Gases) con rangos de referencia [low, high].',
    columnsSample: [
      { name: 'lab_result_id', type: 'VARCHAR (PK)', isKey: true },
      { name: 'patient_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'test_code', type: 'VARCHAR' },
      { name: 'result_value', type: 'NUMERIC' },
      { name: 'sample_datetime', type: 'TIMESTAMPTZ', isJoin: true },
    ],
    x: 650,
    y: 195,
    width: 190,
    height: 80,
  },
  {
    id: 'risa_medication_administrations',
    tableName: 'risa_medication_administrations',
    displayName: 'Medicación Administrada',
    category: 'ehr',
    icon: Pill,
    primaryKeys: ['administration_id'],
    joinKeys: ['patient_id', 'start_datetime'],
    recordsCountApprox: '~2,150 eventos',
    description: 'Fármacos administrados (vasopresores, antihipertensivos, antibióticos) con dosis, vía y tiempo.',
    columnsSample: [
      { name: 'administration_id', type: 'VARCHAR (PK)', isKey: true },
      { name: 'patient_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'generic_category', type: 'VARCHAR' },
      { name: 'dose_value', type: 'NUMERIC' },
      { name: 'start_datetime', type: 'TIMESTAMPTZ', isJoin: true },
    ],
    x: 650,
    y: 340,
    width: 190,
    height: 80,
  },
  {
    id: 'risa_connectivity_events',
    tableName: 'risa_connectivity_events',
    displayName: 'Conectividad & Red',
    category: 'hardware',
    icon: Wifi,
    primaryKeys: ['event_id'],
    joinKeys: ['patient_id', 'device_id', 'start_datetime'],
    recordsCountApprox: '~870 incidentes',
    description: 'Registro de desconexiones, latencia de sincronización y pérdidas de paquetes de concentradores.',
    columnsSample: [
      { name: 'event_id', type: 'VARCHAR (PK)', isKey: true },
      { name: 'patient_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'device_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'connectivity_status', type: 'VARCHAR' },
      { name: 'start_datetime', type: 'TIMESTAMPTZ', isJoin: true },
    ],
    x: 60,
    y: 195,
    width: 190,
    height: 80,
  },
  {
    id: 'risa_devices',
    tableName: 'risa_devices',
    displayName: 'Catálogo de Dispositivos',
    category: 'hardware',
    icon: Smartphone,
    primaryKeys: ['device_id'],
    joinKeys: ['device_id'],
    recordsCountApprox: '100 dispositivos',
    description: 'Inventario de monitores de cabecera y wearables asignados con firmware, modelo y fabricante.',
    columnsSample: [
      { name: 'device_id', type: 'VARCHAR (PK)', isKey: true, isJoin: true },
      { name: 'device_type', type: 'VARCHAR' },
      { name: 'manufacturer', type: 'VARCHAR' },
      { name: 'model', type: 'VARCHAR' },
    ],
    x: 60,
    y: 340,
    width: 190,
    height: 80,
  },
  {
    id: 'risa_alerts_and_insights',
    tableName: 'risa_alerts & risa_ai_insights',
    displayName: 'Motor IA & Alertas',
    category: 'intelligence',
    icon: Sparkles,
    primaryKeys: ['id / insight_id'],
    joinKeys: ['patient_id', 'timestamp'],
    recordsCountApprox: 'Salida de Inferencia',
    description: 'Alertas generadas por reglas deterministas y análisis clínico explicativo emitido por Gemini.',
    columnsSample: [
      { name: 'patient_id', type: 'VARCHAR (FK)', isJoin: true },
      { name: 'priority_tier', type: 'VARCHAR' },
      { name: 'risk_score', type: 'NUMERIC' },
      { name: 'objective_analysis', type: 'TEXT' },
    ],
    x: 360,
    y: 360,
    width: 180,
    height: 80,
  },
];

const JOIN_RELATIONS: JoinRelation[] = [
  {
    id: 'join_patient_telemetry',
    sourceTable: 'risa_patients',
    targetTable: 'risa_master_data',
    sourceCol: 'patient_id',
    targetCol: 'patient_id',
    joinType: 'INNER',
    cardinality: '1:N',
    purpose: 'Asocia las lecturas continuas de signos vitales con la ficha demográfica y baseline del paciente.',
    sqlSnippet: `SELECT p.patient_id, p.full_name, m.variable_code, m.value, m.timestamp
FROM risa_patients p
JOIN risa_master_data m ON p.patient_id = m.patient_id
WHERE m.timestamp <= t_sim;`,
    fromNodeId: 'risa_patients',
    toNodeId: 'risa_master_data',
    labelPosition: { x: 260, y: 135 },
  },
  {
    id: 'join_patient_conditions',
    sourceTable: 'risa_patients',
    targetTable: 'risa_conditions',
    sourceCol: 'patient_id',
    targetCol: 'patient_id',
    joinType: 'LEFT',
    cardinality: '1:N',
    purpose: 'Recupera morbilidades activas para contextualizar umbrales según patología previa.',
    sqlSnippet: `SELECT p.patient_id, c.condition_category, c.status
FROM risa_patients p
LEFT JOIN risa_conditions c ON p.patient_id = c.patient_id
WHERE c.status = 'ACTIVE';`,
    fromNodeId: 'risa_patients',
    toNodeId: 'risa_conditions',
    labelPosition: { x: 600, y: 135 },
  },
  {
    id: 'join_patient_labs',
    sourceTable: 'risa_patients',
    targetTable: 'risa_laboratory_results',
    sourceCol: 'patient_id',
    targetCol: 'patient_id',
    joinType: 'TEMPORAL_WINDOW',
    temporalCondition: 'sample_datetime BETWEEN (t_sim - 30 days) AND t_sim',
    cardinality: '1:N',
    purpose: 'Cruza biomarcadores recientes fuera de rango para contextualizar cambios agudos en signos vitales.',
    sqlSnippet: `SELECT p.patient_id, l.test_code, l.result_value, l.reference_low, l.reference_high
FROM risa_patients p
LEFT JOIN risa_laboratory_results l ON p.patient_id = l.patient_id
  AND l.sample_datetime BETWEEN (t_sim - INTERVAL '30 days') AND t_sim;`,
    fromNodeId: 'risa_patients',
    toNodeId: 'risa_laboratory_results',
    labelPosition: { x: 590, y: 220 },
  },
  {
    id: 'join_patient_meds',
    sourceTable: 'risa_patients',
    targetTable: 'risa_medication_administrations',
    sourceCol: 'patient_id',
    targetCol: 'patient_id',
    joinType: 'TEMPORAL_WINDOW',
    temporalCondition: 'start_datetime BETWEEN (t_sim - 30 days) AND t_sim',
    cardinality: '1:N',
    purpose: 'Verifica si caídas en presión o bradicardia son efectos farmacológicos esperados tras una dosis.',
    sqlSnippet: `SELECT p.patient_id, m.generic_category, m.dose_value, m.start_datetime
FROM risa_patients p
LEFT JOIN risa_medication_administrations m ON p.patient_id = m.patient_id
  AND m.start_datetime BETWEEN (t_sim - INTERVAL '30 days') AND t_sim;`,
    fromNodeId: 'risa_patients',
    toNodeId: 'risa_medication_administrations',
    labelPosition: { x: 600, y: 310 },
  },
  {
    id: 'join_patient_connectivity',
    sourceTable: 'risa_patients',
    targetTable: 'risa_connectivity_events',
    sourceCol: 'patient_id',
    targetCol: 'patient_id',
    joinType: 'TEMPORAL_WINDOW',
    temporalCondition: 'start_datetime BETWEEN (t_sim - 7 days) AND t_sim',
    cardinality: '1:N',
    purpose: 'Diferencia un deterioro clínico real de una alerta DATA_GAP originada por desconexión del concentrador.',
    sqlSnippet: `SELECT p.patient_id, conn.connectivity_status, conn.delayed_records
FROM risa_patients p
LEFT JOIN risa_connectivity_events conn ON p.patient_id = conn.patient_id
  AND conn.start_datetime >= (t_sim - INTERVAL '7 days');`,
    fromNodeId: 'risa_patients',
    toNodeId: 'risa_connectivity_events',
    labelPosition: { x: 270, y: 220 },
  },
  {
    id: 'join_telemetry_device',
    sourceTable: 'risa_master_data',
    targetTable: 'risa_devices',
    sourceCol: 'device_id',
    targetCol: 'device_id',
    joinType: 'LEFT',
    cardinality: 'N:1',
    purpose: 'Valida metadatos del dispositivo emisor y clasifica tipo de sensor (monitor fijo vs wearable).',
    sqlSnippet: `SELECT m.device_id, d.device_type, d.manufacturer
FROM risa_master_data m
LEFT JOIN risa_devices d ON m.device_id = d.device_id;`,
    fromNodeId: 'risa_master_data',
    toNodeId: 'risa_devices',
    labelPosition: { x: 130, y: 270 },
  },
  {
    id: 'join_fusion_ai',
    sourceTable: 'risa_patients',
    targetTable: 'risa_alerts_and_insights',
    sourceCol: 'patient_id + t_sim',
    targetCol: 'patient_id + context_timestamp',
    joinType: 'INNER',
    cardinality: '1:1',
    purpose: 'Alimenta al modelo Gemini con telemetría + EHR + conectividad para generar diagnóstico explicable y riesgo.',
    sqlSnippet: `INSERT INTO risa_ai_insights (patient_id, context_timestamp, objective_analysis, key_anomalies)
VALUES (p.id, t_sim, gemini_response.text, gemini_response.anomalies);`,
    fromNodeId: 'risa_patients',
    toNodeId: 'risa_alerts_and_insights',
    labelPosition: { x: 450, y: 320 },
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; svgStroke: string; svgFill: string }> = {
  core: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', badge: 'bg-blue-100 text-blue-800', svgStroke: '#2563eb', svgFill: '#eff6ff' },
  telemetry: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', badge: 'bg-indigo-100 text-indigo-800', svgStroke: '#4f46e5', svgFill: '#eef2ff' },
  ehr: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-800', svgStroke: '#059669', svgFill: '#ecfdf5' },
  hardware: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-800', svgStroke: '#d97706', svgFill: '#fffbeb' },
  intelligence: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-800', svgStroke: '#7c3aed', svgFill: '#f5f3ff' },
};

export const CrossTableSchemaGraph: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('risa_patients');
  const [activeTab, setActiveTab] = useState<'graph' | 'matrix' | 'pipeline'>('graph');

  const selectedNode = SCHEMA_NODES.find((n) => n.id === selectedNodeId) || SCHEMA_NODES[0];

  const relatedJoins = JOIN_RELATIONS.filter(
    (j) => j.fromNodeId === selectedNode.id || j.toNodeId === selectedNode.id
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Mapa Gráfico de Correlación & Topología de Bases de Datos
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Diagrama visual de uniones entre las 8 tablas mediante llaves <code className="font-mono text-slate-700 font-bold">patient_id</code>, <code className="font-mono text-slate-700 font-bold">device_id</code> y alineamiento en ventana temporal
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diagrama SVG de Red
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriz de Llaves (JOINs)
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flujo de Decisión
          </button>
        </div>
      </div>

      {/* Tab 1: Visual Interactive SVG Topology Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong className="font-bold">Columna Pivote Universal:</strong> Las tablas se unen al centro con <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 font-bold">patient_id</code> y se filtran por tiempo relativo. Haz clic en cualquier nodo para inspeccionar sus uniones.
              </span>
            </div>
            <span className="text-[11px] font-mono text-blue-700 font-semibold hidden md:inline">
              Tabla activa: {selectedNode.tableName}
            </span>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="w-full bg-slate-900 rounded-2xl p-4 shadow-inner overflow-x-auto border border-slate-800">
            <div className="min-w-[850px] relative">
              <svg viewBox="0 0 900 460" className="w-full h-[460px] select-none">
                <defs>
                  {/* Arrow markers */}
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                  </marker>
                  <marker id="arrow-emerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                  <marker id="arrow-violet" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
                  </marker>
                  <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                </defs>

                {/* Connection lines between tables */}
                {/* 1. Hub -> Master Data */}
                <path
                  d="M 360 220 C 260 200, 240 120, 240 100"
                  fill="none"
                  stroke={selectedNodeId === 'risa_master_data' || selectedNodeId === 'risa_patients' ? '#60a5fa' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_master_data' || selectedNodeId === 'risa_patients' ? 3 : 1.5}
                  strokeDasharray="4 4"
                />
                {/* 2. Hub -> Conditions */}
                <path
                  d="M 540 220 C 620 200, 640 120, 660 100"
                  fill="none"
                  stroke={selectedNodeId === 'risa_conditions' || selectedNodeId === 'risa_patients' ? '#34d399' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_conditions' || selectedNodeId === 'risa_patients' ? 3 : 1.5}
                />
                {/* 3. Hub -> Labs */}
                <path
                  d="M 540 235 L 650 235"
                  fill="none"
                  stroke={selectedNodeId === 'risa_laboratory_results' || selectedNodeId === 'risa_patients' ? '#34d399' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_laboratory_results' || selectedNodeId === 'risa_patients' ? 3 : 1.5}
                />
                {/* 4. Hub -> Meds */}
                <path
                  d="M 540 250 C 620 270, 640 350, 660 365"
                  fill="none"
                  stroke={selectedNodeId === 'risa_medication_administrations' || selectedNodeId === 'risa_patients' ? '#34d399' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_medication_administrations' || selectedNodeId === 'risa_patients' ? 3 : 1.5}
                />
                {/* 5. Hub -> Connectivity */}
                <path
                  d="M 360 235 L 250 235"
                  fill="none"
                  stroke={selectedNodeId === 'risa_connectivity_events' || selectedNodeId === 'risa_patients' ? '#fbbf24' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_connectivity_events' || selectedNodeId === 'risa_patients' ? 3 : 1.5}
                />
                {/* 6. Master Data -> Devices */}
                <path
                  d="M 155 130 L 155 340"
                  fill="none"
                  stroke={selectedNodeId === 'risa_devices' || selectedNodeId === 'risa_master_data' ? '#fbbf24' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_devices' || selectedNodeId === 'risa_master_data' ? 3 : 1.5}
                  strokeDasharray="3 3"
                />
                {/* 7. Hub -> AI Inference */}
                <path
                  d="M 450 280 L 450 360"
                  fill="none"
                  stroke={selectedNodeId === 'risa_alerts_and_insights' || selectedNodeId === 'risa_patients' ? '#c084fc' : '#334155'}
                  strokeWidth={selectedNodeId === 'risa_alerts_and_insights' || selectedNodeId === 'risa_patients' ? 3.5 : 2}
                  markerEnd="url(#arrow-violet)"
                />

                {/* Join Key Badges in the Canvas */}
                <g transform="translate(260, 140)">
                  <rect width="105" height="22" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
                  <text x="52" y="15" fill="#93c5fd" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ON patient_id
                  </text>
                </g>

                <g transform="translate(560, 140)">
                  <rect width="105" height="22" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                  <text x="52" y="15" fill="#6ee7b7" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ON patient_id
                  </text>
                </g>

                <g transform="translate(555, 224)">
                  <rect width="80" height="22" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                  <text x="40" y="15" fill="#6ee7b7" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    t_sim - 30d
                  </text>
                </g>

                <g transform="translate(560, 310)">
                  <rect width="80" height="22" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                  <text x="40" y="15" fill="#6ee7b7" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    t_sim - 30d
                  </text>
                </g>

                <g transform="translate(265, 224)">
                  <rect width="80" height="22" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                  <text x="40" y="15" fill="#fcd34d" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    t_sim - 7d
                  </text>
                </g>

                <g transform="translate(108, 235)">
                  <rect width="95" height="22" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                  <text x="47" y="15" fill="#fcd34d" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ON device_id
                  </text>
                </g>

                <g transform="translate(400, 310)">
                  <rect width="100" height="22" rx="6" fill="#1e293b" stroke="#a855f7" strokeWidth="1" />
                  <text x="50" y="15" fill="#d8b4fe" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    FUSIÓN CLÍNICA
                  </text>
                </g>

                {/* Draw Table Nodes */}
                {SCHEMA_NODES.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  const isCentral = node.id === 'risa_patients';
                  const isAI = node.id === 'risa_alerts_and_insights';

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      {/* Node Box */}
                      <rect
                        width={node.width}
                        height={node.height}
                        rx="12"
                        fill={isSelected ? '#1e293b' : '#0f172a'}
                        stroke={
                          isSelected
                            ? '#38bdf8'
                            : isCentral
                            ? '#3b82f6'
                            : isAI
                            ? '#a855f7'
                            : '#334155'
                        }
                        strokeWidth={isSelected ? 2.5 : isCentral || isAI ? 2 : 1}
                      />

                      {/* Header Badge in Node */}
                      <text
                        x="12"
                        y="22"
                        fill={isCentral ? '#60a5fa' : isAI ? '#c084fc' : '#94a3b8'}
                        fontSize="9"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {node.category.toUpperCase()}
                      </text>

                      <text
                        x={node.width - 12}
                        y="22"
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {node.recordsCountApprox.split(' ')[0]}
                      </text>

                      {/* Table Display Name */}
                      <text
                        x="12"
                        y="42"
                        fill="#f8fafc"
                        fontSize="12"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {node.displayName}
                      </text>

                      {/* Table Physical Name */}
                      <text
                        x="12"
                        y="58"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {node.tableName.length > 22 ? node.tableName.slice(0, 20) + '..' : node.tableName}
                      </text>

                      {/* Key tags bottom */}
                      <text
                        x="12"
                        y="74"
                        fill={isCentral ? '#93c5fd' : '#cbd5e1'}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        PK: {node.primaryKeys[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Selected Table Inspector Detail Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Detalle de Unión: <span className="font-mono text-blue-700">{selectedNode.tableName}</span>
                  </h4>
                  <p className="text-xs text-slate-500">{selectedNode.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500">Claves Primarias:</span>
                <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedNode.primaryKeys.join(', ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Columns Sample */}
              <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Columnas Clave & Tipado
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  {selectedNode.columnsSample.map((col) => (
                    <div key={col.name} className="py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono">
                        {col.isKey && <Key className="w-3 h-3 text-amber-500" />}
                        {col.isJoin && !col.isKey && <Link2 className="w-3 h-3 text-blue-500" />}
                        <span className={col.isJoin || col.isKey ? 'font-bold text-slate-800' : 'text-slate-600'}>
                          {col.name}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Joins for Selected Table */}
              <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Sentencias de Unión con esta Tabla ({relatedJoins.length})
                </span>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {relatedJoins.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Sin uniones directas registradas.</p>
                  ) : (
                    relatedJoins.map((join) => (
                      <div
                        key={join.id}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-blue-700 font-mono text-[11px] truncate">
                            {join.sourceTable} ↔ {join.targetTable}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {join.cardinality} ({join.joinType})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{join.purpose}</p>
                        <div className="font-mono text-[10px] text-slate-500 bg-white p-1.5 rounded border border-slate-200 overflow-x-auto">
                          ON {join.sourceCol} = {join.targetCol}
                          {join.temporalCondition ? ` AND ${join.temporalCondition}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Join Columns Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Matriz completa de sentencias <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">JOIN</code> utilizadas por el backend para consolidar datos en endpoints como <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">/api/patient-clinical-log</code> y <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">/api/dashboard/correlations</code>:
          </p>

          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tabla Origen</th>
                    <th className="py-2.5 px-3">Tabla Destino</th>
                    <th className="py-2.5 px-3">Columna de Unión</th>
                    <th className="py-2.5 px-3">Tipo & Cardinalidad</th>
                    <th className="py-2.5 px-3">Condición Temporal</th>
                    <th className="py-2.5 px-3">Propósito Clínico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {JOIN_RELATIONS.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {r.sourceTable}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {r.targetTable}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {r.sourceCol} = {r.targetCol}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {r.cardinality} • {r.joinType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {r.temporalCondition || 'Todo el historial'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                        {r.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: End-to-End Data Fusion Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500">
            Flujo paso a paso de cómo los datos de las bases de datos heterogéneas se fusionan cronológicamente antes de llegar al motor de IA y reglas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Paso 1: Ingesta & Limpieza
                </span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">3 Fuentes Crudas Heterogéneas</h4>
              <p className="text-xs text-slate-600">
                Observaciones clínicas, monitores de cabecera y wearables se limpian con <code className="font-mono text-[11px]">clean_health_data.py</code> para generar la serie temporal <code className="font-mono text-[11px]">risa_master_data</code>.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                Entrada: ~2.59M filas → Salida: ~1.62M filas
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Paso 2: Cruce por patient_id + t_sim
                </span>
                <Link2 className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Ensamble del Vector Clínico</h4>
              <p className="text-xs text-slate-600">
                Para el instante simulado <code className="font-mono text-[11px]">t_sim</code>, se cruzan los antecedentes (<code className="font-mono text-[11px]">risa_conditions</code>), laboratorios de 30 días, fármacos y eventos de conectividad.
              </p>
              <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-blue-200">
                Objeto: PatientClinicalContext
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                  Paso 3: Decisión & Inferencia
                </span>
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Motor de Reglas + Gemini 2.5</h4>
              <p className="text-xs text-slate-600">
                Las reglas evalúan anomalías fisiológicas ajustadas por diagnóstico previo; Gemini recibe el contexto fusionado para explicar la etiología en <code className="font-mono text-[11px]">risa_ai_insights</code>.
              </p>
              <div className="text-[11px] font-mono text-violet-800 bg-white p-2 rounded border border-violet-200">
                Salida: Priorización MEDIUM / HIGH / CRITICAL
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossTableSchemaGraph;
