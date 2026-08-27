# HealthSignal RISA — Monitoreo, Detección y Priorización de Riesgo Clínico

Prototipo funcional end-to-end para el reto: ingesta y limpieza de telemetría clínica
multi-fuente, detección de señales de riesgo por análisis temporal y contextual (no
solo umbrales), correlación con la historia clínica electrónica (antecedentes,
laboratorios, medicación, conectividad), priorización de pacientes, y explicación de
resultados con IA — todo operando sobre los **datos reales del reto** (1000 pacientes,
2.36 millones de lecturas limpias + 17 fuentes CSV integradas), sin mockups ni datos
fabricados.

**Flujo demostrable:** Procesamiento e integración → Análisis temporal y contextual →
Correlación multi-fuente → Identificación de señales → Valoración del riesgo →
Priorización → Explicación.

- Diagrama de arquitectura (solo lo implementado): [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- Auditoría manual de alertas HIGH contra archivos crudos: [`docs/AUDITORIA_ALERTAS.md`](docs/AUDITORIA_ALERTAS.md)

---

## 1. Qué hace la solución

1. **ETL (`clean_health_data.py`)** unifica tres fuentes heterogéneas
   (`vital_signs.csv` del monitor clínico, `device_observations.csv` con metadatos de
   señal, `wearable_observations.csv` del wearable) a un modelo EAV único
   (`paciente, dispositivo, timestamp, variable, valor`), aplicando 5 etapas de
   limpieza auditadas (sección 5).
2. **Motor de reglas determinístico (`lib/anomalyRules.ts`)** evalúa cada lectura
   revelada por el reloj simulado: umbrales clínicos, variación abrupta frente a la
   línea base propia del paciente (z-score con piso de desviación absoluta), contexto
   de actividad física, corroboración multivariable y vacíos de datos. Produce
   alertas con score 0-100 y tier (MEDIUM/HIGH/CRITICAL).
3. **Motor contextual incremental (`lib/contextEngine.ts`)** decide *cuándo* vale la
   pena un análisis con IA: comprime cada intervalo nuevo a estadísticas calculadas
   localmente (Δ vs. basal, z-scores, pendientes por regresión, correlaciones de
   Pearson entre variables) y solo llama a la IA si el **score de contexto agregado**
   supera el umbral — el disparador es el estado conjunto del paciente, no una alerta
   aislada.
4. **Contexto clínico ampliado (`lib/clinicalContext.ts`)** cruza la telemetría con la
   historia clínica electrónica del reto: antecedentes activos, laboratorios y
   medicación administrada dentro del mismo intervalo incremental, y eventos de
   conectividad del dispositivo (para no leer una desconexión como un hallazgo
   clínico). Un único fetcher sirve dos ventanas distintas: la incremental que consume
   la IA y la "hacia atrás desde ahora" que lee el expediente del paciente.
5. **Explicación (`lib/gemini.ts` → Gemini 2.5 Flash)** genera el análisis para el
   panel "Hallazgos Destacados": recibe el contexto comprimido, el contexto clínico
   ampliado (punto 4) y el diagnóstico previo como memoria (≈600 tokens por llamada,
   costo constante); los números que se muestran en la UI se inyectan desde el cálculo
   local — el modelo no puede alucinar cifras. El contenido reinyectado desde la base
   (nota previa) viaja saneado y delimitado (`<<<DATO>>>`) para mitigar inyección de
   prompt (`lib/validation.ts#sanitizeForPrompt`).
6. **Transparencia de datos (`/calidad-datos`, `/correlacion-datos`)**: dos paneles
   dedicados a auditar el propio sistema — el primero muestra el embudo de retención
   del ETL y una muestra cruda explorable (~12,000 filas) con el motivo exacto de cada
   descarte; el segundo cruza deterministamente conectividad, antecedentes, laboratorios
   y medicación contra las alertas/diagnósticos generados, con un grafo del esquema de
   las 17 tablas y sus relaciones (`lib/dataCorrelations.ts`).
7. **UI (Next.js)**: dashboard con conteos reales, bandeja de priorizados (ranking por
   tier y score) con las correlaciones cruzadas embebidas, directorio de los 1000
   pacientes con filtros demográficos (región, programa de atención, grupo etario) y
   estados derivados de datos reales (Diagnosticado / Analizando / Con Alertas / Sin
   Actividad), y expediente por paciente con reloj de "viaje en el tiempo"
   estrictamente anti-fuga-futura (`t ≤ t_simulado`) más una pestaña de Historial
   Clínico. El botón **"Iniciar Simulación del Sistema"** reproduce la ingesta para
   todo el roster y activa todo el pipeline en vivo.

## 2. Tecnologías y declaración de componentes externos

**Desarrollado por el equipo** (código en este repositorio):
pipeline ETL completo, motor de reglas y priorización, compresión estadística y motor
contextual incremental, contexto clínico ampliado y correlación cruzada multi-tabla,
auditoría de calidad de datos, orquestación de la simulación, prompts y validación
(incluida saneación anti-inyección) de la salida de IA, endpoints, UI, políticas RLS,
validación de entrada y rate limiting.

**Componentes de terceros** (declaración explícita):

| Recurso externo | Tipo | Uso |
|---|---|---|
| Google Gemini 2.5 Flash (`generativelanguage.googleapis.com`) | Modelo fundacional (API) | Redacción del análisis contextual explicativo |
| Supabase (PostgreSQL + PostgREST) | Servicio cloud | Almacén de lecturas, alertas, diagnósticos y datos clínicos/EHR (17 tablas) |
| Next.js 16 / React 19 | Framework | Aplicación web y API routes |
| pandas / numpy | Librerías Python | ETL |
| Recharts, Tailwind CSS 4, lucide-react | Librerías UI | Gráficas, grafo de esquema y estilos |
| `@supabase/supabase-js` | SDK | Acceso a datos (app y `scripts/load-etl-audit.mjs`) |
| Dataset del reto (17 CSV) | Datos | Única fuente de datos: 3 de telemetría (`vital_signs`, `device_observations`, `wearable_observations`) + 14 de historia clínica, catálogos, infraestructura y conectividad (sección 3); no se usaron datasets complementarios ni datos sintéticos |
| Claude (Anthropic) | IA generativa (herramienta de desarrollo) | Asistencia en el desarrollo del código |

## 3. Instalación y ejecución

Requisitos: Node.js 20+, Python 3.11+, un proyecto de Supabase y una API key de Gemini.

```bash
# 1. Dependencias
npm install
pip install -r requirements.txt

# 2. Datos: colocar los 17 CSV del reto en datos/ (no se versionan por tamaño)
#    Telemetría (entran al ETL):
#      vital_signs.csv · device_observations.csv · wearable_observations.csv
#    Historia clínica, infraestructura, conectividad y catálogos (se importan
#    directo a Supabase, el ETL no los toca):
#      patients.csv · healthcare_facilities.csv · devices.csv · encounters.csv ·
#      conditions.csv · laboratory_results.csv · medications.csv ·
#      medication_administrations.csv · connectivity_events.csv ·
#      patient_context.csv · data_dictionary.csv · source_catalog.csv ·
#      units_catalog.csv · variable_catalog.csv

# 3. ETL (la carpeta es un argumento; por defecto "datos", sin rutas rígidas)
python clean_health_data.py datos
#    -> genera datos/risa_supabase_import.csv + datos/data_quality_audit.csv +
#       datos/raw_data_sample.csv (auditorías de calidad, ver sección 5)

# 4. Base de datos: crear las tablas en el SQL Editor de Supabase, en este orden
#    (cada script deja su propia política RLS de solo-lectura para la clave anónima):
#      supabase/patients_table.sql
#      supabase/facilities_devices_encounters.sql
#      supabase/conditions_labs_medications.sql
#      supabase/connectivity_patient_context.sql
#      supabase/catalogs.sql
#      supabase/etl_quality_audit.sql
#    Luego importar cada CSV a su tabla homónima (Table Editor -> import CSV):
#      risa_supabase_import.csv -> risa_master_data · patients.csv -> risa_patients ·
#      y así con el resto (nombre de tabla = "risa_" + nombre del CSV, ver comentario
#      de cabecera de cada script). Por último, seguridad de las 3 tablas originales:
#      ejecutar supabase/rls.sql en el SQL Editor

# 5. Credenciales
cp .env.example .env.local   # completar las 4 variables

# 6. Cargar la auditoría ETL a Supabase (alimenta el panel /calidad-datos)
node scripts/load-etl-audit.mjs --dry-run   # valida conteos sin escribir
node scripts/load-etl-audit.mjs             # carga real (exige SUPABASE_SERVICE_ROLE_KEY)

# 7. Ejecutar
npm run dev                  # -> http://localhost:3000
```

**Reproducir la demostración:** abrir `http://localhost:3000`, pulsar **"Iniciar
Simulación del Sistema"** (header). En segundos aparecen alertas de pacientes
distintos en el dashboard; el badge del header cuenta `alertas · análisis IA`. Abrir
un paciente desde "Señales de Riesgo Recientes" muestra su expediente con el reloj
avanzando, las gráficas revelándose, la pestaña "Historial Clínico" con sus
antecedentes/laboratorios/medicación y — cuando su contexto agregado lo amerita — el
panel "Hallazgos Destacados" generándose en vivo. Desde el menú lateral, "Calidad de
Datos" muestra la trazabilidad del ETL y "Correlación de Datos" el cruce entre las 17
tablas cargadas.

## 4. Mecanismo de análisis y priorización

**Detección (por lectura):** umbral clínico absoluto **o** desviación estadística
frente a la línea base del propio paciente (z ≥ 3.2 **y** un piso de desviación
absoluta por variable — ambos requisitos, ver sección 5). Cinco patrones ajustan el
score: (1) *contexto manda* — elevaciones de HR/RESP durante actividad física se
descuentan; (2) *artefacto* — un pico cuya lectura siguiente vuelve a rango se
penaliza; (3) *anomalía aislada* se queda en su score base; (4) *peligro silencioso* —
2+ variables desviadas a la vez escalan a HIGH aunque ninguna sea extrema por sí sola;
(5) *trampa del vacío* — la ausencia prolongada de lecturas genera alerta `DATA_GAP`.

**Valoración y priorización:** score → tier (≥80 CRITICAL, ≥60 HIGH; MEDIUM/LOW se
suprimen de la bandeja para controlar fatiga de alertas). La bandeja de priorizados
ordena por tier máximo alcanzado y score, e incluye también pacientes diagnosticados
por contexto que nunca cruzaron un umbral.

**Explicación (IA):** el análisis se ancla a un instante simulado x+t y solo consume
el intervalo (x, x+t] más el diagnóstico previo (memoria comprimida de todo lo
anterior a x), enriquecido con antecedentes activos, laboratorios y medicación
resueltos en ese mismo intervalo y una nota de conectividad cuando aplica (sección 1,
punto 4). Cooldown de 6 h simuladas por paciente y presupuesto de 2 llamadas por tick
de simulación acotan el costo. La nota previa reinyectada desde la base viaja saneada
y encerrada en delimitadores explícitos (`<<<DATO>>>`), con instrucción explícita al
modelo de tratarla siempre como dato, nunca como instrucción — mitigación de
inyección de prompt vía contenido persistido.

**Correlación multi-fuente:** además de la explicación por paciente, `/correlacion-datos`
cruza deterministamente 4 dominios contra las señales ya calculadas (sin inventar un
coeficiente estadístico que la muestra no soporta): eventos de conectividad vs. tasa de
alertas de alto riesgo, categorías de antecedentes vs. pacientes CRITICAL/HIGH,
laboratorios fuera de rango vs. diagnósticos de IA marcados como peligro, y cobertura
de cada una de las 17 tablas cargadas — cada relación se expresa como conteo con su
denominador explícito (`lib/dataCorrelations.ts`).

**Limitaciones conocidas (honestidad técnica):**

- Los umbrales clínicos y los pesos del score son heurísticos definidos por el equipo,
  **no validados clínicamente**; el sistema es soporte analítico, no diagnóstico.
- El contexto modela actividad física pero **no el sueño**: lecturas nocturnas bajas
  pueden sobre-puntuarse (caso 2 de la auditoría).
- La corroboración multivariable puede contar dos veces una misma causa contextual
  (ejercicio eleva HR y RESP a la vez) y escalar de más: es el único falso positivo
  hallado en la auditoría manual (caso 3), con causa raíz documentada.
- No hay ground truth de eventos clínicos en el dataset, por lo que no es posible
  calcular precision/recall reales (sección 6).
- Las correlaciones de `/correlacion-datos` son conteos descriptivos con su
  denominador, no un test estadístico de causalidad; el tamaño de muestra de algunas
  categorías (ej. antecedentes poco frecuentes) es demasiado chico para inferir más
  allá de lo que el conteo dice literalmente.
- La saneación de la nota previa (`sanitizeForPrompt` + delimitadores) es una
  mitigación de inyección de prompt, no una garantía: reduce el riesgo de que texto
  generado por el propio modelo en un ciclo anterior altere su comportamiento en el
  siguiente, pero no reemplaza un sandbox de salida.
- Sin autenticación de usuarios; RLS + validación + rate limiting sí implementados.
- El análisis IA depende de un servicio externo; si falla, las alertas determinísticas
  no se ven afectadas (degradación controlada).

## 5. Justificación de decisiones técnicas (limpieza, nulos, ruido, falsas alertas)

Cada decisión es medible en `datos/data_quality_audit.csv`, generado por el ETL
(entrada: 2,531,849 filas → salida: 2,365,711). Estos mismos conteos, más una muestra
cruda estratificada y explorable fila a fila, están disponibles en vivo en
[`/calidad-datos`](app/calidad-datos/page.tsx) (ver sección 1, punto 6):

| Decisión | Por qué | Impacto medido |
|---|---|---|
| Triaje por `quality_flag` en vez de descartar todo lo no-OK | `UNIT_VARIANT` eran temperaturas reales en °F: se **recuperan** convirtiendo la unidad; `RETRANSMITTED` sin duplicado OK se recupera; `CHECK` y `LOW_SIGNAL` se descartan porque el dispositivo mismo dudó de la medición | 166 + 1 filas recuperadas; 4,164 + 108 descartadas (la auditoría muestra un `RR = 2.5 rpm` con CHECK que habría generado falsa alerta) |
| Deduplicación jerárquica Clínico > Monitor > Wearable | Cuando dos dispositivos miden lo mismo en el mismo minuto, gana la fuente de mayor confiabilidad clínica, no el promedio (que mezclaría errores) | 147,374 duplicados resueltos |
| Nulos/no parseables: descarte, no imputación | Imputar signos vitales fabrica datos clínicos; en monitoreo la lectura ausente debe tratarse como ausencia (y el motor la vigila vía `DATA_GAP`) | 0 filas (el dataset no traía nulos tras el triaje) |
| Validación de rango biológico por variable | Valores fisiológicamente imposibles (p. ej. SpO2 > 100) son error de sensor, no hallazgo | 549 filas descartadas |
| Filtro de ruido transitorio: z-score modificado (mediana/MAD) **más piso de desviación absoluta** | El z sobre MAD casi nulo marca como "glitch" variaciones triviales de señales estables: la primera corrida sin piso marcó 50,003 falsos glitches (2.1% de los datos); con el piso (exige que el pico sea además clínicamente grande) quedaron 75 genuinos, verificados a mano | 75 lecturas aisladas removidas, auditables en `flagged_transient_glitches.csv` |
| Anti-fuga temporal (`sync_datetime >= timestamp`) | Una lectura sincronizada "antes" de medirse rompe la causalidad del análisis temporal | 0 filas (verificado, no asumido) |
| Control de falsas alertas en el motor | El mismo patrón del piso absoluto se replica en la detección en vivo (z ≥ 3.2 **y** desviación mínima por variable), más los patrones de contexto/artefacto/corroboración y la supresión de tiers bajos | Tasa de la muestra auditada: 1 caso falso positivo de 4 (sección 6) |

## 6. Evaluación y métricas

**Selección justificada:** el dataset del reto no incluye etiquetas de eventos
clínicos reales (ground truth), así que reportar precision/recall clásicos exigiría
inventar las etiquetas contra las que se evalúa — sería una métrica circular. Se
eligieron métricas medibles con honestidad sobre lo que sí existe, priorizando
**trazabilidad y detección oportuna** (criterio del reto):

| Métrica | Resultado | Cómo se midió |
|---|---|---|
| **Cobertura de Evidencia** (alertas cuya lectura ancla existe, con valor exacto, en el dataset limpio) | **100% (180/180)** | Verificación programática de cada alerta contra `risa_supabase_import.csv` |
| **Causalidad Temporal** (evidencia disponible antes de la decisión) | **100%** | Por construcción (`timestamp <= t_sim` en toda consulta + `sync_datetime >= timestamp` en ETL) y verificado: toda alerta se ancla a una lectura existente en su instante |
| **Tasa de falsas alertas (muestra auditada)** | 1 de 4 casos (2 de 9 alertas), causa raíz identificada | Auditoría manual fila por fila contra los CSV crudos ([detalle](docs/AUDITORIA_ALERTAS.md)) |
| **Detección oportuna (evidencia de caso)** | Señal 40 min antes del valor en rango crítico (PAT-0059: alerta de tendencia con HR 98.9 aún normal, a las 17:15; valor crítico 146.3 a las 17:55) | Caso 4 de la auditoría, filas crudas citadas |
| **Control de ruido del ETL** | 50,003 → 75 falsos glitches tras introducir el piso de desviación absoluta | Comparación entre corridas del ETL, archivo de auditoría versionable |
| **Calidad del ranking** | La bandeja ordena por tier máximo + score; los 4 casos auditados HIGH contienen riesgo real o desviación genuina multivariable | Cualitativa sobre la muestra auditada (sin ground truth no se calcula NDCG real, y se declara) |

**Distribución de alertas generadas** (datos reales de `risa_alerts` al momento de la
entrega): 180 alertas — 131 HIGH, 49 MEDIUM, 0 CRITICAL — sobre un roster de 1000
pacientes: el sistema **no** inunda de alertas (fatiga controlada por diseño).

## 7. Evidencia central: progresión Datos → Contexto → Patrón → Señal → Prioridad → Explicación

El caso PAT-0059 ([auditoría, caso 4](docs/AUDITORIA_ALERTAS.md)) demuestra el flujo
completo sin depender de variables aisladas ni umbrales estáticos:

1. **Datos:** HR 62.7 → 72.3 → 98.9 (filas crudas OBS-0000107921..23, calidad OK).
2. **Evolución/Contexto:** el wearable (dispositivo independiente) corrobora la
   elevación; actividad pasa de REST a HIGH.
3. **Patrón:** z de tendencia sobre la línea base propia del paciente + RESP subiendo
   en paralelo (corroboración multivariable).
4. **Señal:** alerta a las 17:15 **con HR aún en rango normal** — un umbral estático
   no habría dicho nada.
5. **Prioridad:** score moderado por el contexto de actividad (35 → HIGH por
   corroboración; la lectura crítica posterior queda en 75/HIGH, no CRITICAL).
6. **Explicación:** el panel "Hallazgos Destacados" del paciente narra el episodio
   citando valores y correlaciones calculadas localmente; cada número es trazable a la
   tabla `risa_alerts` y de ahí a la fila cruda del CSV original.

La trazabilidad inversa (alerta → fila cruda con identificador `OBS-*`) está
documentada y es reproducible con `grep` en [`docs/AUDITORIA_ALERTAS.md`](docs/AUDITORIA_ALERTAS.md).

## 8. Estructura del repositorio

```
clean_health_data.py      ETL (punto de entrada: python clean_health_data.py [carpeta])
requirements.txt          dependencias Python reproducibles
scripts/load-etl-audit.mjs  carga la auditoria ETL + muestra cruda a Supabase

app/                      Next.js: paginas y API routes (punto de entrada web: npm run dev)
  pacientes/               directorio (filtros demograficos) y expediente por paciente
  priorizados/              bandeja priorizada + correlaciones cruzadas embebidas
  calidad-datos/            auditoria de calidad ETL + muestra cruda explorable
  correlacion-datos/        correlacion multi-fuente + grafo del esquema (17 tablas)
  api/simulate/tick/        motor de simulacion global (deteccion server-side)
  api/analyze-context/      disparo del analisis contextual con IA
  api/data-quality/         resumen de auditoria ETL + muestra cruda paginada
  api/dashboard/correlations/  correlaciones cruzadas (conectividad, antecedentes, labs)
  api/patient-clinical-log/    contexto clinico de un paciente (antecedentes/labs/meds)
  api/patients/              metadatos demograficos de los 1000 pacientes
  api/...                    dashboard, alerts, insights, patient-*, timeline

lib/                       motores y utilidades
  anomalyRules, contextStats, contextEngine, gemini    deteccion, compresion y explicacion
  clinicalContext                                       antecedentes/labs/meds/conectividad
  dataCorrelations                                      correlaciones cruzadas multi-tabla
  dataQualityAudit                                       auditoria ETL + muestra cruda
  patientDemographics                                    metadatos y vocabulario del directorio
  validation, rateLimit, supabaseClient                  seguridad de los endpoints
  activityAggregates                                     agregados de actividad/alertas

components/                UI (dashboard, directorio, expediente, calidad, correlacion, simulacion)
  data-quality/             embudo de retencion, desglose por categoria, muestra cruda
  prioritized/CrossDataCorrelations.tsx      panel de correlaciones (Recharts)
  prioritized/CrossTableSchemaGraph.tsx      grafo interactivo del esquema de datos
  patient-detail/PatientClinicalHistory.tsx  pestaña "Historial Clinico" del expediente

supabase/                  scripts SQL (ejecutar en el orden de la seccion 3)
  patients_table.sql                    risa_patients (metadatos demograficos)
  facilities_devices_encounters.sql     risa_facilities, risa_devices, risa_encounters
  conditions_labs_medications.sql       risa_conditions, risa_laboratory_results,
                                         risa_medications, risa_medication_administrations
  connectivity_patient_context.sql      risa_connectivity_events, risa_patient_context
  catalogs.sql                          risa_units_catalog, risa_variable_catalog,
                                         risa_source_catalog, risa_data_dictionary
  etl_quality_audit.sql                 risa_etl_quality_audit, risa_raw_data_sample
  rls.sql                               RLS de risa_master_data/risa_alerts/risa_ai_insights
                                         (las tablas de arriba traen su propia politica)

docs/ARQUITECTURA.md      diagrama y decisiones de arquitectura
docs/AUDITORIA_ALERTAS.md auditoria manual de alertas HIGH contra archivos crudos
datos/                    CSVs del reto y derivados del ETL (no versionados, salvo
                           datos/data_quality_audit.csv que sí se versiona)
```
