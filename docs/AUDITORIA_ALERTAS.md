# Auditoría Manual de Alertas de Prioridad Alta

**Objetivo:** verificar, revisando los archivos crudos fila por fila, que las alertas
marcadas como `HIGH` corresponden a riesgo real y no a falsos positivos originados por
ruido, calidad de señal o contexto. Los 4 casos siguientes se auditaron contra
`datos/vital_signs.csv` y `datos/wearable_observations.csv` (archivos originales del
reto, sin procesar), citando los identificadores de fila (`OBS-*`, `WOBS-*`) para que
cualquier evaluador pueda repetir la verificación.

**Mapeo de códigos (crudo → limpio):** `RR → RESP`, `SBP → SYS_BP`, `DBP → DIA_BP`,
`WEARABLE_HR → HR` (con prioridad Monitor > Wearable en la deduplicación).

**Veredicto global de la muestra:** 3 de 4 casos son verdaderos positivos con evidencia
cruda íntegra; 1 caso (Caso 3) es un **falso positivo contextual** documentado abajo con
su causa raíz. Ninguno de los 4 se originó en ruido ni en lecturas de mala calidad:
todas las filas ancla tienen `quality_flag=OK`.

---

## Caso 1 — ALT-874 · PAT-0001 · Bradipnea limítrofe (umbral directo)

**Alerta:** `RESP = 11.697 rpm` en `2026-07-17 13:20` — "por debajo del umbral (12)".
Score 70, tier HIGH.

**Filas crudas** (`vital_signs.csv`, monitor `DEV-00001`):

```
OBS-0000001150 | 2026-07-17 12:00 | RR | 12.765 rpm | quality=OK
OBS-0000001151 | 2026-07-17 12:20 | RR | 12.568 rpm | quality=OK
OBS-0000001152 | 2026-07-17 12:40 | RR | 11.952 rpm | quality=OK   <- ya sub-12
OBS-0000001153 | 2026-07-17 13:00 | RR | 13.576 rpm | quality=OK
OBS-0000001154 | 2026-07-17 13:20 | RR | 11.697 rpm | quality=OK   <- ANCLA DE LA ALERTA
OBS-0000001155 | 2026-07-17 13:40 | RR | 13.447 rpm | quality=OK
```

Contexto (`wearable_observations.csv`): `ACTIVITY_LEVEL = REST` en toda la ventana
(WOBS-0000001029 a WOBS-0000001041), `quality=OK`.

**Verificación:** el valor de la alerta coincide **exactamente** con la fila cruda
OBS-0000001154. No es un pico aislado: hay dos lecturas sub-12 en 40 minutos
(OBS-...52 y OBS-...54) con vecinas coherentes, y el paciente estaba en reposo (la
frecuencia baja no se explica por sueño ni artefacto).

**Veredicto: verdadero positivo (limítrofe).** Lectura real de frecuencia respiratoria
por debajo del rango, recurrente, con calidad OK. Severidad clínica baja (el valor
rebota a rango en la lectura siguiente), coherente con tier HIGH y no CRITICAL.

---

## Caso 2 — ALT-953/954/955 · PAT-0043 · Episodio multivariable + ruido filtrado

**Alertas (mismo instante, `2026-07-11 04:00`):**
`SYS_BP = 87.959` (< 90), `DIA_BP = 58.621` (< 60), `RESP = 11.482` (< 12).
Score 70 cada una, tier HIGH.

**Filas crudas** (`vital_signs.csv`, monitor `DEV-00043`):

```
OBS-0000084584 | 02:00 | SBP |  99.667 mmHg | quality=OK
OBS-0000084585 | 04:00 | SBP |  87.959 mmHg | quality=OK   <- ANCLA
OBS-0000084586 | 06:00 | SBP |  94.139 mmHg | quality=OK
OBS-0000084656 | 02:00 | DBP |  61.810 mmHg | quality=OK
OBS-0000084657 | 04:00 | DBP |  58.621 mmHg | quality=OK   <- ANCLA
OBS-0000084658 | 06:00 | DBP |  52.584 mmHg | quality=OK   <- sigue cayendo
OBS-0000083634 | 03:20 | RR  |  10.757 rpm  | quality=OK
OBS-0000083635 | 03:40 | RR  |   2.521 rpm  | quality=CHECK  <- RUIDO (ver abajo)
OBS-0000083636 | 04:00 | RR  |  11.482 rpm  | quality=OK   <- ANCLA
```

Contexto: `ACTIVITY_LEVEL = SLEEP` desde las 03:00 (WOBS-0000046011 en adelante).

**Verificación:** los tres valores coinciden exactamente con sus filas crudas. Hallazgo
clave para el control de ruido: la fila OBS-0000083635 registra `RR = 2.521 rpm` con
`quality_flag=CHECK` — un valor fisiológicamente absurdo marcado por el propio
dispositivo. **El ETL descarta las filas CHECK (4,164 en total en el dataset), así que
esa lectura basura no participó en la alerta**: la detección de las 04:00 se basa en
lecturas OK coherentes entre sí. Además la caída de DIA_BP es sostenida (61.8 → 58.6 →
52.6 a lo largo de 4 horas), no un pico.

**Veredicto: verdadero positivo, con matiz de contexto declarado.** Tres variables
simultáneamente bajo el rango con tendencia sostenida es exactamente el patrón
multivariable que el sistema busca. Matiz honesto: el paciente estaba dormido, y
durante el sueño es fisiológicamente esperable presión y frecuencia respiratoria más
bajas (descenso nocturno); el motor modela el contexto de actividad física
(MODERATE/HIGH) pero **no modela el sueño** — limitación conocida declarada en el
README. Aún con ese matiz, la caída sostenida de la diastólica justifica revisión.

---

## Caso 3 — ALT-956/960 · PAT-0036 · FALSO POSITIVO CONTEXTUAL (documentado)

**Alertas (`2026-07-20 12:45`):** `HR = 113.228` (> 100) y `RESP = 21.361` (> 20).
Score 45 cada una — bajo el umbral HIGH (60), pero **escaladas a HIGH por la regla de
corroboración multivariable** (2+ variables desviadas a la vez).

**Filas crudas:**

```
vital_signs.csv (DEV-00036):
OBS-0000071989 | 12:25 | HR | 84.299  | quality=OK
OBS-0000071990 | 12:45 | HR | 113.228 | quality=OK   <- ANCLA
OBS-0000071992 | 13:25 | HR | 115.185 | quality=OK
OBS-0000071993 | 13:45 | HR | 88.052  | quality=OK   <- normaliza

wearable_observations.csv (WRB-00036, dispositivo independiente):
WOBS-0000039831 | 12:15 | ACTIVITY_LEVEL | REST | quality=OK
WOBS-0000039834 | 12:45 | ACTIVITY_LEVEL | HIGH | quality=OK   <- inicia ejercicio
WOBS-0000039832 | 12:45 | WEARABLE_HR    | 114.0 | quality=OK  <- corrobora 113.2
WOBS-0000039840 | 13:45 | ACTIVITY_LEVEL | REST | quality=OK   <- termina ejercicio
```

**Verificación:** las lecturas son reales (dos dispositivos independientes miden ~113-114
lpm, calidad OK) — **no es ruido**. Pero la elevación coincide al minuto con el cambio
de actividad REST → HIGH, y ambas variables se normalizan en cuanto la actividad vuelve
a REST. Es un episodio de ejercicio físico: taquicardia y taquipnea esperables.

**Veredicto: falso positivo contextual.** El patrón "Contexto manda" del motor sí operó
(descontó 25 puntos: el score quedó en 45 en vez de 70), pero la regla de corroboración
multivariable lo escaló a HIGH de todos modos. **Causa raíz identificada:** cuando la
actividad física explica a las dos variables a la vez (HR y RESP suben juntas al hacer
ejercicio), la corroboración cuenta dos veces la misma causa. Limitación conocida
declarada en el README; la corrección propuesta (no corroborar entre variables cuya
elevación comparte la misma explicación contextual) se deja documentada y no se
implementó dentro del plazo del reto.

---

## Caso 4 — ALT-992/994/995 · PAT-0059 · Progresión temporal (detección oportuna)

**Secuencia de alertas:**

| Hora | Alerta | Valor HR | Regla | Score |
|---|---|---|---|---|
| 17:15 | ALT-992 | 98.972 (aún en rango) | tendencia (z sobre línea base) | 35 → HIGH por corroboración |
| 17:35 | ALT-994 | 113.270 | umbral (> 100) | 45 |
| 17:55 | ALT-995 | 146.315 | umbral crítico (> 140) | 75 |

**Filas crudas** (`vital_signs.csv`, DEV-00059, todas `quality=OK`):

```
OBS-0000107921 | 16:35 | HR |  62.706
OBS-0000107922 | 16:55 | HR |  72.318
OBS-0000107923 | 17:15 | HR |  98.972   <- ANCLA ALT-992 (tendencia)
OBS-0000107924 | 17:35 | HR | 113.270   <- ANCLA ALT-994 (umbral)
OBS-0000107925 | 17:55 | HR | 146.315   <- ANCLA ALT-995 (rango crítico)
OBS-0000107926 | 18:15 | HR |  86.881
```

RR sube en paralelo (15.5 → 19.4 → 20.8 → 21.7, OBS-0000108351..54) y el wearable
corrobora la elevación (WOBS-0000059668: 91.4 lpm a las 17:15). Actividad: HIGH entre
17:15 y 17:45.

**Verificación:** la progresión completa existe en los datos crudos con calidad OK y
corroboración de un segundo dispositivo. El punto central: **la primera señal se emitió
a las 17:15, cuando HR = 98.9 aún estaba dentro del rango normal — 40 minutos antes de
la lectura en rango crítico (146.3)**. Un sistema de umbral estático no habría dicho
nada hasta las 17:35. La lectura crítica de 146.315 fue verificada contra
`flagged_transient_glitches.csv`: NO fue marcada como glitch (sus vecinas 113 → 146 →
87 son consistentes con un episodio real, no con un error puntual de sensor).

**Veredicto: verdadero positivo con valor demostrativo de detección temprana.** Matiz:
parte de la elevación coincide con actividad HIGH (el motor descontó por contexto: la
lectura crítica quedó en 75/HIGH y no en CRITICAL), pero una FC de 146 lpm amerita
revisión aunque haya ejercicio de por medio — el comportamiento del motor (alertar
moderando el tier) es el razonable.

---

## Resumen de la muestra auditada

| Caso | Alertas | Tipo de detección | Ruido/calidad | Veredicto |
|---|---|---|---|---|
| 1 | ALT-874 | Umbral directo | Sin ruido (todas OK) | Verdadero positivo (limítrofe) |
| 2 | ALT-953/954/955 | Multivariable simultánea | 1 fila CHECK **correctamente filtrada por el ETL** | Verdadero positivo (matiz: sueño) |
| 3 | ALT-956/960 | Corroboración multivariable | Sin ruido (2 dispositivos coinciden) | **Falso positivo contextual** |
| 4 | ALT-992/994/995 | Tendencia → umbral → crítico | Verificado contra el filtro de glitches | Verdadero positivo (señal 40 min antes del valor crítico) |

Tasa de falsos positivos de la muestra: **1 de 4 casos (9 alertas auditadas, 2 falsas)**.
El falso positivo no proviene de ruido ni de datos de mala calidad sino de una
interacción entre dos reglas del motor, con causa raíz identificada y declarada.

## Cómo reproducir esta auditoría

Las filas citadas se localizan por su identificador en los archivos originales del
reto. Con los CSV en `datos/`:

```bash
grep "OBS-0000001154" datos/vital_signs.csv
grep "WOBS-0000039834" datos/wearable_observations.csv
```

Las alertas viven en la tabla `risa_alerts` de Supabase (columnas: paciente, variable,
valor, timestamp de la lectura ancla, score, tier, regla que disparó) y son consultables
desde la UI (expediente del paciente) o vía `GET /api/alerts?patientId=PAT-XXXX`.
