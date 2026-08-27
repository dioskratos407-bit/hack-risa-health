import os
import sys
import numpy as np
import pandas as pd

# =============================================================================
# CONFIGURACIÓN DE REGLAS DE CALIDAD
# =============================================================================

VAR_MAPPING = {
    "WEARABLE_HR": "HR",
    "SBP": "SYS_BP",
    "DBP": "DIA_BP",
    "RR": "RESP",
    "SLEEP": "SLEEP_category",
}

CONTINUOUS_VARS = ["HR", "SpO2", "TEMP", "SYS_BP", "DIA_BP", "RESP", "STEPS"]
CATEGORICAL_VARS = ["ACTIVITY_LEVEL", "SLEEP_category"]

BIO_RANGES = {
    "HR": (30, 250),
    "SpO2": (50, 100),
    "TEMP": (30, 45),  # en grados Celsius, tras normalización de unidades
    "SYS_BP": (50, 300),
    "DIA_BP": (30, 200),
    "RESP": (5, 60),
    "STEPS": (0, 30000),
}

# Whitelist POR VARIABLE (no compartida) — evita que un valor válido para una
# variable categórica (ej. "DEEP" en fases de sueño) contamine la validación de otra
# variable categórica distinta (ej. "ACTIVITY_LEVEL") que nunca reporta ese valor.
CATEGORICAL_WHITELISTS = {
    "ACTIVITY_LEVEL": {"REST", "LIGHT", "MODERATE", "HIGH", "SLEEP"},
    "SLEEP_category": {"AWAKE", "LIGHT", "DEEP", "REM", "SLEEP"},
}

# Variables continuas sobre las que tiene sentido aplicar el filtro de ruido
# transitorio (señales fisiológicas de trazado continuo). STEPS queda fuera:
# sus picos y ceros son movimiento real, no ruido de sensor.
GLITCH_CHECK_VARS = ["HR", "SpO2", "TEMP", "SYS_BP", "DIA_BP", "RESP"]
GLITCH_WINDOW = 5              # tamaño de la ventana móvil (lecturas)
GLITCH_MIN_PERIODS = 3
GLITCH_MODIFIED_Z_THRESHOLD = 6.0  # umbral conservador (Iglewicz & Hoaglin)

# Piso de desviación absoluta (en la unidad nativa de cada variable) que un salto debe
# superar para siquiera candidatear a "pico transitorio". Sin este piso, el z-score
# modificado se dispara con desviaciones triviales cuando la variabilidad local (MAD)
# es casi nula -- que es el caso normal en señales fisiológicas muy estables (ej. TEMP,
# RESP) -- y termina marcando fluctuaciones perfectamente normales como ruido.
GLITCH_MIN_ABS_DEVIATION = {
    "HR": 25.0,       # bpm
    "SpO2": 4.0,      # %
    "TEMP": 1.0,      # °C
    "SYS_BP": 25.0,   # mmHg
    "DIA_BP": 15.0,   # mmHg
    "RESP": 6.0,      # rpm
}

# Muestreo estratificado de filas crudas para el sistema de visualización de calidad
# (crudo vs. limpio). Es puramente informativo: no participa en ninguna decisión de
# filtrado, solo captura una fotografía representativa de cada fuente ANTES de
# cualquier transformación (unidad, dedup, rango, etc.) para poder mostrarla en la app
# junto con si esa fila específica terminó en el archivo limpio y por qué no, si aplica.
RAW_SAMPLE_MAX_PER_SOURCE = 4000
RAW_SAMPLE_RANDOM_STATE = 42


def stratified_sample_ids(df: pd.DataFrame, strat_col: str, cap: int, random_state: int) -> set:
    """IDs de una muestra estratificada por `strat_col`, para que categorías raras no
    desaparezcan frente a categorías dominantes en un muestreo puramente aleatorio."""
    if df.empty:
        return set()
    n_groups = max(df[strat_col].nunique(dropna=False), 1)
    per_group_cap = max(1, cap // n_groups)
    sampled = df.groupby(strat_col, dropna=False, group_keys=False).apply(
        lambda g: g.sample(n=min(len(g), per_group_cap), random_state=random_state)
    )
    return set(sampled["_raw_row_id"])


def fahrenheit_to_celsius(series: pd.Series) -> pd.Series:
    return (series - 32.0) * 5.0 / 9.0


def process_health_data(folder_path: str, output_path: str = "risa_supabase_import.csv"):
    """
    Capa CLEAN de Arquitectura de Salud (RAW -> CLEAN/PROCESSED).

    Procesa vital_signs.csv (u observations.csv), device_observations.csv y
    wearable_observations.csv aplicando, en orden:
      1. Triaje de calidad por fuente (incluye recuperación de datos válidos
         mal etiquetados: variación de unidad, retransmisiones huérfanas) y
         filtro anti-fuga temporal.
      2. Normalización semántica (var_mapping) y deduplicación jerárquica
         (Clínico > Monitor > Wearable) con tolerancia de redondeo al minuto.
      3. Validación de integridad biológica (rangos fisiológicos vectorizados)
         y categórica (whitelist por variable).
      4. Filtro de ruido transitorio por señal (mediana móvil + persistencia),
         que descarta únicamente picos aislados que NO persisten en la
         siguiente lectura — nunca se imputa ni se altera un valor conservado.
      5. Formato de salida EAV listo para Supabase (ISO 8601 UTC).

    No se rellenan valores faltantes con 0 ni con "estados normales": lo que
    no se puede parsear o queda fuera de rango se descarta y se audita, nunca
    se sustituye. Cada descarte queda contabilizado y, para el filtro de
    ruido, además persistido en un CSV de auditoría aparte.

    Adicionalmente exporta una muestra estratificada y reproducible (random_state fijo)
    de filas crudas de las 3 fuentes, cada una etiquetada con si terminó en el archivo
    limpio y, si no, por qué -- para el sistema de visualización de calidad. Es un
    proceso de solo lectura sobre las mismas máscaras que ya calcula el pipeline: no
    agrega, cambia ni reordena ningún filtro existente.
    """
    print("=" * 70)
    print("  CAPA CLEAN - PIPELINE DE INGESTIÓN Y CALIDAD DE DATOS DE SALUD")
    print("=" * 70)
    print(f"Carpeta de origen: {folder_path}\n")

    obs_file = os.path.join(folder_path, "observations.csv")
    if not os.path.exists(obs_file):
        alt_obs = os.path.join(folder_path, "vital_signs.csv")
        if os.path.exists(alt_obs):
            print(f"[INFO] 'observations.csv' no encontrado. Utilizando '{alt_obs}' como observaciones generales.")
            obs_file = alt_obs
        else:
            raise FileNotFoundError(f"No se encontró 'observations.csv' ni 'vital_signs.csv' en {folder_path}")

    dev_file = os.path.join(folder_path, "device_observations.csv")
    wear_file = os.path.join(folder_path, "wearable_observations.csv")

    for fpath in [obs_file, dev_file, wear_file]:
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Archivo requerido no encontrado: {fpath}")

    audit_rows = []  # (etapa, categoria, conteo) -> se exporta como CSV de auditoría

    # Acumuladores para el sistema de visualización de calidad (crudo vs. limpio):
    # reason_map asocia _raw_row_id -> motivo de descarte (se llena progresivamente a
    # medida que se calcula cada máscara existente, sin duplicar ninguna regla), y
    # raw_sample_frames junta las fotografías de cada fuente al final del proceso.
    reason_map: dict = {}
    raw_sample_frames = []

    # =========================================================================
    # 1. TRIAJE DE CALIDAD POR FUENTE (con recuperación justificada de datos)
    # =========================================================================
    print("--- PASO 1: Ingesta y Triaje de Calidad por Fuente ---")

    # --- 1.1 Observaciones Generales (Clínico / Monitor Gateway) ---
    df_obs = pd.read_csv(obs_file, encoding="utf-8-sig")
    n_obs_in = len(df_obs)
    df_obs["_raw_row_id"] = "observations:" + df_obs.index.astype(str)

    # Fotografía de la muestra ANTES de la normalización de unidad de abajo, para que
    # el valor "crudo" mostrado en la auditoría sea realmente el original (ej. en
    # Fahrenheit), no el ya convertido a Celsius.
    obs_sample_ids = stratified_sample_ids(
        df_obs, "quality_flag", RAW_SAMPLE_MAX_PER_SOURCE, RAW_SAMPLE_RANDOM_STATE
    )
    sample_df_obs = df_obs.loc[df_obs["_raw_row_id"].isin(obs_sample_ids), [
        "_raw_row_id", "patient_id", "device_id", "variable_code", "timestamp", "value",
        "unit", "quality_flag",
    ]].copy()
    sample_df_obs["signal_quality"] = np.nan
    raw_sample_frames.append(sample_df_obs)

    # Normalización de unidad ANTES de cualquier filtro de calidad/rango:
    # algunas lecturas de TEMP llegan en Fahrenheit (marcadas quality_flag=UNIT_VARIANT).
    # Sin esta conversión, esos valores (~97-99) caerían fuera del rango biológico en
    # Celsius (30-45) y se perderían por completo, aunque son mediciones válidas.
    is_temp_f = (df_obs["variable_code"] == "TEMP") & (df_obs["unit"] == "degF")
    n_unit_recovered = int(is_temp_f.sum())
    if n_unit_recovered > 0:
        df_obs.loc[is_temp_f, "value"] = fahrenheit_to_celsius(
            pd.to_numeric(df_obs.loc[is_temp_f, "value"], errors="coerce")
        )
        df_obs.loc[is_temp_f, "unit"] = "degC"

    is_ok = df_obs["quality_flag"] == "OK"
    is_unit_variant = df_obs["quality_flag"] == "UNIT_VARIANT"  # ya normalizado arriba, ahora confiable
    is_check = df_obs["quality_flag"] == "CHECK"
    is_low_signal = df_obs["quality_flag"] == "LOW_SIGNAL"
    is_retransmit = df_obs["quality_flag"] == "RETRANSMITTED"

    # Las retransmisiones (fuente MONITOR_RETRANSMIT) casi siempre duplican una fila OK
    # ya recibida en el mismo (patient_id, timestamp, variable_code) — es el caso normal
    # de un reenvío por corte de conectividad. Pero si NO existe ese original (la única
    # copia que sobrevivió fue la retransmisión), descartarla sin más borraría la única
    # evidencia de esa medición. Se recupera solo ese caso huérfano.
    ok_keys = df_obs.loc[is_ok, ["patient_id", "timestamp", "variable_code"]].drop_duplicates()
    ok_keys["_has_ok"] = True
    retransmit_lookup = df_obs.loc[is_retransmit, ["patient_id", "timestamp", "variable_code"]].merge(
        ok_keys, on=["patient_id", "timestamp", "variable_code"], how="left"
    )
    is_orphan_retransmit = pd.Series(False, index=df_obs.index)
    is_orphan_retransmit.loc[df_obs.index[is_retransmit]] = retransmit_lookup["_has_ok"].isna().to_numpy()

    # Motivo de descarte por fila, solo para las filas que cayeron en la muestra --
    # mismas máscaras que ya calculó el triaje de arriba, no se inventa ninguna regla.
    for mask, reason in (
        (is_check, "descartado_check_pendiente_revision"),
        (is_low_signal, "descartado_low_signal"),
        (is_retransmit & ~is_orphan_retransmit, "descartado_retransmit_duplicado"),
    ):
        ids_in_sample = df_obs.loc[mask, "_raw_row_id"]
        for rid in ids_in_sample[ids_in_sample.isin(obs_sample_ids)]:
            reason_map[rid] = reason

    keep_mask = is_ok | is_unit_variant | is_orphan_retransmit
    df_obs_clean = df_obs[keep_mask].copy()
    df_obs_clean["source_priority"] = 1

    n_obs_check_dropped = int(is_check.sum())
    n_obs_low_signal_dropped = int(is_low_signal.sum())
    n_obs_retransmit_dup_dropped = int(is_retransmit.sum() - is_orphan_retransmit.sum())
    n_obs_noise = n_obs_in - len(df_obs_clean)

    print(f"Observaciones Generales -> Entrada: {n_obs_in:,} | Conservados: {len(df_obs_clean):,}")
    print(f"  Recuperados por normalización de unidad (degF->degC, UNIT_VARIANT): {n_unit_recovered:,}")
    print(f"  Recuperados por retransmisión huérfana (sin original OK): {int(is_orphan_retransmit.sum()):,}")
    print(f"  Descartados (CHECK, pendiente de revisión manual): {n_obs_check_dropped:,}")
    print(f"  Descartados (LOW_SIGNAL, confianza de sensor insuficiente): {n_obs_low_signal_dropped:,}")
    print(f"  Descartados (RETRANSMITTED duplicando un OK existente): {n_obs_retransmit_dup_dropped:,}")
    audit_rows += [
        ("1.1 Observaciones", "recuperado_unidad_degF", n_unit_recovered),
        ("1.1 Observaciones", "recuperado_retransmit_huerfano", int(is_orphan_retransmit.sum())),
        ("1.1 Observaciones", "descartado_check_pendiente_revision", n_obs_check_dropped),
        ("1.1 Observaciones", "descartado_low_signal", n_obs_low_signal_dropped),
        ("1.1 Observaciones", "descartado_retransmit_duplicado", n_obs_retransmit_dup_dropped),
    ]

    # --- 1.2 Dispositivos (Monitores) ---
    df_dev = pd.read_csv(dev_file, encoding="utf-8-sig")
    n_dev_in = len(df_dev)
    df_dev["_raw_row_id"] = "device_observations:" + df_dev.index.astype(str)
    df_dev["signal_quality"] = pd.to_numeric(df_dev["signal_quality"], errors="coerce")

    # Sin un "quality_flag" propio como en observaciones: se deriva un bucket
    # equivalente solo para poder mostrar/estratificar esta fuente igual que las otras.
    df_dev["_quality_bucket"] = np.where(
        df_dev["variable_code"] == "SIGNAL_QUALITY_INDEX",
        "METADATA",
        np.where(df_dev["signal_quality"] >= 0.70, "OK", "LOW_QUALITY"),
    )
    dev_sample_ids = stratified_sample_ids(
        df_dev, "_quality_bucket", RAW_SAMPLE_MAX_PER_SOURCE, RAW_SAMPLE_RANDOM_STATE
    )
    sample_df_dev = df_dev.loc[df_dev["_raw_row_id"].isin(dev_sample_ids), [
        "_raw_row_id", "patient_id", "device_id", "variable_code", "timestamp", "value",
        "signal_quality", "_quality_bucket",
    ]].copy()
    sample_df_dev = sample_df_dev.rename(columns={"_quality_bucket": "quality_flag"})
    sample_df_dev["unit"] = None
    raw_sample_frames.append(sample_df_dev)

    df_dev_clean = df_dev[
        (df_dev["variable_code"] != "SIGNAL_QUALITY_INDEX") & (df_dev["signal_quality"] >= 0.70)
    ].copy()
    n_dev_noise = n_dev_in - len(df_dev_clean)
    df_dev_clean["source_priority"] = 2

    dev_dropped_ids = df_dev.loc[~df_dev.index.isin(df_dev_clean.index), "_raw_row_id"]
    for rid in dev_dropped_ids[dev_dropped_ids.isin(dev_sample_ids)]:
        reason_map[rid] = "descartado_metadato_o_baja_calidad"
    print(f"Dispositivos (Monitores) -> Entrada: {n_dev_in:,} | Descartados (Metadato/Calidad < 0.70): {n_dev_noise:,} | Conservados: {len(df_dev_clean):,}")
    if len(df_dev_clean) == 0:
        print("  [AUDITORÍA] device_observations.csv no aportó ningún vital en esta carga: el 100% de sus filas")
        print("  son metadatos SIGNAL_QUALITY_INDEX (log de salud del dispositivo), no telemetría fisiológica.")
    audit_rows.append(("1.2 Dispositivos", "descartado_metadato_o_baja_calidad", n_dev_noise))

    # --- 1.3 Wearables ---
    df_wear = pd.read_csv(wear_file, encoding="utf-8-sig")
    n_wear_in = len(df_wear)
    df_wear["_raw_row_id"] = "wearable_observations:" + df_wear.index.astype(str)
    wear_sample_ids = stratified_sample_ids(
        df_wear, "measurement_quality", RAW_SAMPLE_MAX_PER_SOURCE, RAW_SAMPLE_RANDOM_STATE
    )
    sample_df_wear = df_wear.loc[df_wear["_raw_row_id"].isin(wear_sample_ids), [
        "_raw_row_id", "patient_id", "device_id", "variable_code", "timestamp", "value",
        "measurement_quality",
    ]].copy()
    sample_df_wear = sample_df_wear.rename(columns={"measurement_quality": "quality_flag"})
    sample_df_wear["unit"] = None
    sample_df_wear["signal_quality"] = np.nan
    raw_sample_frames.append(sample_df_wear)

    df_wear_clean = df_wear[df_wear["measurement_quality"] == "OK"].copy()
    n_wear_qual_dropped = n_wear_in - len(df_wear_clean)
    wear_qual_dropped_ids = df_wear.loc[~df_wear.index.isin(df_wear_clean.index), "_raw_row_id"]
    for rid in wear_qual_dropped_ids[wear_qual_dropped_ids.isin(wear_sample_ids)]:
        reason_map[rid] = "descartado_calidad_sensor"

    # Filtro anti-fuga temporal: la sincronización no puede ocurrir antes del evento físico.
    df_wear_clean["timestamp_dt"] = pd.to_datetime(df_wear_clean["timestamp"], errors="coerce")
    df_wear_clean["sync_datetime_dt"] = pd.to_datetime(df_wear_clean["sync_datetime"], errors="coerce")
    valid_time = df_wear_clean["sync_datetime_dt"] >= df_wear_clean["timestamp_dt"]
    wear_pre_time_index = df_wear_clean.index
    df_wear_clean = df_wear_clean[valid_time].copy()
    n_wear_time_dropped = (len(df_wear) - n_wear_qual_dropped) - len(df_wear_clean)
    df_wear_clean["source_priority"] = 3
    wear_time_dropped_ids = df_wear.loc[
        wear_pre_time_index.difference(df_wear_clean.index), "_raw_row_id"
    ]
    for rid in wear_time_dropped_ids[wear_time_dropped_ids.isin(wear_sample_ids)]:
        reason_map[rid] = "descartado_fuga_temporal"
    print(f"Wearables -> Entrada: {n_wear_in:,} | Descartados por calidad: {n_wear_qual_dropped:,} | Descartados por Fuga Temporal: {n_wear_time_dropped:,} | Conservados: {len(df_wear_clean):,}")
    audit_rows += [
        ("1.3 Wearables", "descartado_calidad_sensor", n_wear_qual_dropped),
        ("1.3 Wearables", "descartado_fuga_temporal", n_wear_time_dropped),
    ]

    total_ingested = n_obs_in + n_dev_in + n_wear_in
    total_noise_dropped = n_obs_noise + n_dev_noise + n_wear_qual_dropped + n_wear_time_dropped

    # =========================================================================
    # 2. HOMOLOGACIÓN SEMÁNTICA Y DEDUPLICACIÓN JERÁRQUICA
    # =========================================================================
    print("\n--- PASO 2: Homologación, Unificación y Deduplicación Jerárquica ---")

    cols_needed = ["patient_id", "device_id", "timestamp", "variable_code", "value", "source_priority", "_raw_row_id"]

    for df in [df_obs_clean, df_dev_clean, df_wear_clean]:
        if not df.empty:
            df["variable_code"] = df["variable_code"].replace(VAR_MAPPING)

    merged_df = pd.concat(
        [df_obs_clean[cols_needed], df_dev_clean[cols_needed], df_wear_clean[cols_needed]],
        ignore_index=True,
    )
    n_merged_before_dedup = len(merged_df)

    merged_df["timestamp_dt"] = pd.to_datetime(merged_df["timestamp"], errors="coerce")
    # Redondeo defensivo al minuto para la clave de deduplicación: en los datos actuales
    # todos los timestamps ya caen en el segundo :00, pero esto evita que jitter de
    # sub-minuto entre fuentes (si apareciera en cargas futuras) impida detectar el
    # mismo evento fisiológico reportado por dos sensores distintos.
    merged_df["dedup_timestamp"] = merged_df["timestamp_dt"].dt.floor("min")

    merged_df = merged_df.sort_values(
        by=["patient_id", "dedup_timestamp", "variable_code", "source_priority"],
        ascending=[True, True, True, True],
    )

    dedup_df = merged_df.drop_duplicates(
        subset=["patient_id", "dedup_timestamp", "variable_code"], keep="first"
    ).copy()

    dedup_dropped_ids = merged_df.loc[merged_df.index.difference(dedup_df.index), "_raw_row_id"]
    all_sample_ids = obs_sample_ids | dev_sample_ids | wear_sample_ids
    for rid in dedup_dropped_ids[dedup_dropped_ids.isin(all_sample_ids)]:
        reason_map[rid] = "descartado_conflicto_prioridad"

    n_dedup_dropped = n_merged_before_dedup - len(dedup_df)
    print(f"Registros pre-deduplicación: {n_merged_before_dedup:,}")
    print(f"Registros duplicados eliminados (Conflicto de prioridad Clínico>Monitor>Wearable): {n_dedup_dropped:,}")
    print(f"Registros tras deduplicación: {len(dedup_df):,}")
    audit_rows.append(("2. Deduplicación", "descartado_conflicto_prioridad", n_dedup_dropped))

    # =========================================================================
    # 3. INTEGRIDAD BIOLÓGICA Y CATEGÓRICA
    # =========================================================================
    print("\n--- PASO 3: Validación de Integridad Biológica y Categórica ---")

    known_vars = CONTINUOUS_VARS + CATEGORICAL_VARS
    df_continuous = dedup_df[dedup_df["variable_code"].isin(CONTINUOUS_VARS)].copy()
    df_categorical = dedup_df[dedup_df["variable_code"].isin(CATEGORICAL_VARS)].copy()
    df_other = dedup_df[~dedup_df["variable_code"].isin(known_vars)].copy()

    if len(df_other) > 0:
        unknown_counts = df_other["variable_code"].value_counts()
        print(f"  [AUDITORÍA] variable_code no reconocidos ({len(df_other):,} filas descartadas):")
        for code, cnt in unknown_counts.items():
            print(f"    - {code}: {cnt:,}")

    # Validación vectorizada de rangos fisiológicos (una sola pasada, sin concatenar
    # un subframe por variable): un valor no parseable se cuenta como "faltante",
    # nunca se convierte a 0 ni se trata como dato válido.
    df_continuous["numeric_value"] = pd.to_numeric(df_continuous["value"], errors="coerce")
    range_min = df_continuous["variable_code"].map({k: v[0] for k, v in BIO_RANGES.items()})
    range_max = df_continuous["variable_code"].map({k: v[1] for k, v in BIO_RANGES.items()})

    n_missing_unparseable = int(df_continuous["numeric_value"].isna().sum())
    in_range = (df_continuous["numeric_value"] >= range_min) & (df_continuous["numeric_value"] <= range_max)
    valid_continuous_mask = df_continuous["numeric_value"].notna() & in_range
    n_out_of_biological_range = int((~valid_continuous_mask & df_continuous["numeric_value"].notna()).sum())

    df_continuous_clean = df_continuous[valid_continuous_mask].copy()
    n_continuous_dropped = len(df_continuous) - len(df_continuous_clean)

    # Whitelist por variable (no global): un valor solo es válido para la variable
    # categórica que efectivamente lo reporta.
    df_categorical["clean_value"] = df_categorical["value"].astype(str).str.strip()
    categorical_valid_parts = []
    for var_code, allowed_values in CATEGORICAL_WHITELISTS.items():
        subset = df_categorical[df_categorical["variable_code"] == var_code]
        categorical_valid_parts.append(subset[subset["clean_value"].isin(allowed_values)])
    df_categorical_clean = (
        pd.concat(categorical_valid_parts, ignore_index=True) if categorical_valid_parts else df_categorical.iloc[0:0].copy()
    )
    df_categorical_clean["value"] = df_categorical_clean["clean_value"]
    n_categorical_dropped = len(df_categorical) - len(df_categorical_clean)

    # Motivo de descarte por fila (Paso 3), solo para las filas que cayeron en la
    # muestra -- mismas máscaras ya calculadas arriba.
    other_ids = df_other["_raw_row_id"]
    for rid in other_ids[other_ids.isin(all_sample_ids)]:
        reason_map[rid] = "descartado_variable_no_reconocida"

    missing_ids = df_continuous.loc[df_continuous["numeric_value"].isna(), "_raw_row_id"]
    for rid in missing_ids[missing_ids.isin(all_sample_ids)]:
        reason_map[rid] = "descartado_valor_faltante_no_parseable"

    out_of_range_ids = df_continuous.loc[
        ~valid_continuous_mask & df_continuous["numeric_value"].notna(), "_raw_row_id"
    ]
    for rid in out_of_range_ids[out_of_range_ids.isin(all_sample_ids)]:
        reason_map[rid] = "descartado_fuera_rango_biologico"

    categorical_dropped_ids = set(df_categorical["_raw_row_id"]) - set(df_categorical_clean["_raw_row_id"])
    for rid in categorical_dropped_ids:
        if rid in all_sample_ids:
            reason_map[rid] = "descartado_categoria_no_valida"

    n_bio_dropped = n_continuous_dropped + n_categorical_dropped + len(df_other)

    print(f"Descarte por valor faltante/no parseable (Continuas): {n_missing_unparseable:,}")
    print(f"Descarte por rango biológico implausible (Continuas): {n_out_of_biological_range:,}")
    print(f"Descarte por lista blanca por variable (Categóricas): {n_categorical_dropped:,}")
    audit_rows += [
        ("3. Integridad", "descartado_valor_faltante_no_parseable", n_missing_unparseable),
        ("3. Integridad", "descartado_fuera_rango_biologico", n_out_of_biological_range),
        ("3. Integridad", "descartado_categoria_no_valida", n_categorical_dropped),
        ("3. Integridad", "descartado_variable_no_reconocida", len(df_other)),
    ]

    # =========================================================================
    # 4. FILTRO DE RUIDO TRANSITORIO POR SEÑAL (persistencia como criterio)
    # =========================================================================
    print("\n--- PASO 4: Filtro de Ruido Transitorio (mediana móvil + persistencia) ---")
    print("Solo descarta picos AISLADOS que no persisten en la siguiente lectura del mismo")
    print("paciente/variable; una desviación sostenida se conserva para que la capa MODEL")
    print("la evalúe como posible señal de riesgo, con contexto e histórico.")

    df_continuous_clean = df_continuous_clean.sort_values(
        by=["patient_id", "variable_code", "dedup_timestamp"]
    ).reset_index(drop=True)

    glitch_eligible = df_continuous_clean["variable_code"].isin(GLITCH_CHECK_VARS)
    df_glitch = df_continuous_clean[glitch_eligible].copy()

    if len(df_glitch) > 0:
        group_keys = [df_glitch["patient_id"], df_glitch["variable_code"]]

        rolling_median = df_glitch.groupby(group_keys)["numeric_value"].transform(
            lambda s: s.rolling(GLITCH_WINDOW, center=True, min_periods=GLITCH_MIN_PERIODS).median()
        )
        abs_dev = (df_glitch["numeric_value"] - rolling_median).abs()
        mad = abs_dev.groupby(group_keys, group_keys=False).transform(
            lambda s: s.rolling(GLITCH_WINDOW, center=True, min_periods=GLITCH_MIN_PERIODS).median()
        )
        modified_z = 0.6745 * (df_glitch["numeric_value"] - rolling_median) / mad.replace(0, np.nan)
        min_abs_dev = df_glitch["variable_code"].map(GLITCH_MIN_ABS_DEVIATION)

        next_modified_z = modified_z.groupby(group_keys, group_keys=False).shift(-1)
        next_abs_dev = abs_dev.groupby(group_keys, group_keys=False).shift(-1)

        # Candidato a pico solo si ES estadísticamente inusual (z) Y clínicamente
        # relevante en magnitud absoluta (evita el falso positivo por MAD casi nulo).
        is_spike = (modified_z.abs() > GLITCH_MODIFIED_Z_THRESHOLD) & (abs_dev > min_abs_dev)
        reverts_next = (
            (next_modified_z.abs() <= GLITCH_MODIFIED_Z_THRESHOLD) | (next_abs_dev <= min_abs_dev)
        ).fillna(False)
        is_confirmed_glitch = (is_spike & reverts_next).fillna(False)

        n_glitches = int(is_confirmed_glitch.sum())
        if n_glitches > 0:
            flagged = df_glitch[is_confirmed_glitch][
                ["patient_id", "device_id", "variable_code", "timestamp", "value", "_raw_row_id"]
            ].copy()
            flagged["modified_z_score"] = modified_z[is_confirmed_glitch].round(2).to_numpy()
            flagged["motivo"] = "pico_transitorio_no_persistente"
            audit_path = os.path.join(folder_path, "flagged_transient_glitches.csv")
            flagged.drop(columns=["_raw_row_id"]).to_csv(audit_path, index=False)
            print(f"  Picos transitorios descartados (no persisten en la lectura siguiente): {n_glitches:,}")
            print(f"  Detalle exportado para auditoría clínica: {audit_path}")

            # Los picos confirmados se incluyen COMPLETOS en la muestra cruda (son
            # pocos y cada uno es un ejemplo valioso), no solo una fracción muestreada.
            glitch_sample = flagged[
                ["_raw_row_id", "patient_id", "device_id", "variable_code", "timestamp", "value"]
            ].copy()
            glitch_sample["unit"] = None
            glitch_sample["quality_flag"] = None
            glitch_sample["signal_quality"] = np.nan
            raw_sample_frames.append(glitch_sample)
            for rid in glitch_sample["_raw_row_id"]:
                reason_map[rid] = "descartado_pico_no_persistente"
        else:
            print("  No se detectaron picos transitorios aislados con este umbral.")

        df_continuous_clean = df_continuous_clean[
            ~(glitch_eligible & is_confirmed_glitch.reindex(df_continuous_clean.index, fill_value=False))
        ]
    else:
        n_glitches = 0
        print("  Sin datos continuos elegibles para este filtro.")

    audit_rows.append(("4. Ruido transitorio", "descartado_pico_no_persistente", n_glitches))

    final_clean_df = pd.concat(
        [
            df_continuous_clean[cols_needed + ["dedup_timestamp"]],
            df_categorical_clean[cols_needed + ["dedup_timestamp"]],
        ],
        ignore_index=True,
    )

    # =========================================================================
    # 5. FORMATO DE SALIDA (SUPABASE READY)
    # =========================================================================
    print("\n--- PASO 5: Formateo de Salida (Supabase Ready ISO 8601 UTC) ---")

    final_clean_df["timestamp"] = pd.to_datetime(final_clean_df["dedup_timestamp"], utc=True).dt.strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    final_clean_df = final_clean_df.sort_values(by=["patient_id", "timestamp", "variable_code"])

    output_cols = ["patient_id", "device_id", "timestamp", "variable_code", "value"]
    final_export_df = final_clean_df[output_cols]

    export_path = os.path.join(folder_path, output_path) if not os.path.isabs(output_path) else output_path
    final_export_df.to_csv(export_path, index=False)

    # --- Ensamblado de la muestra cruda para el sistema de visualización de calidad ---
    # was_kept_in_clean se resuelve por pertenencia a final_clean_df (que todavía
    # conserva _raw_row_id porque cols_needed lo incluye) -- ninguna fila de la muestra
    # se re-evalúa con una regla nueva, solo se consulta si sobrevivió o no.
    kept_ids = set(final_clean_df["_raw_row_id"])
    raw_sample_df = (
        pd.concat(raw_sample_frames, ignore_index=True)
        if raw_sample_frames
        else pd.DataFrame(columns=[
            "_raw_row_id", "patient_id", "device_id", "variable_code", "timestamp", "value",
            "unit", "quality_flag", "signal_quality",
        ])
    )
    raw_sample_df = raw_sample_df.drop_duplicates(subset=["_raw_row_id"])
    raw_sample_df["source_file"] = raw_sample_df["_raw_row_id"].str.split(":", n=1).str[0]
    raw_sample_df["was_kept_in_clean"] = raw_sample_df["_raw_row_id"].isin(kept_ids)
    raw_sample_df["rejection_reason"] = raw_sample_df["_raw_row_id"].map(reason_map)
    raw_sample_df.loc[raw_sample_df["was_kept_in_clean"], "rejection_reason"] = None
    raw_sample_df["raw_timestamp"] = pd.to_datetime(
        raw_sample_df["timestamp"], errors="coerce", utc=True
    ).dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    raw_sample_output_cols = [
        "source_file", "patient_id", "device_id", "variable_code", "raw_timestamp", "value",
        "unit", "quality_flag", "signal_quality", "was_kept_in_clean", "rejection_reason",
    ]
    raw_sample_export = raw_sample_df[raw_sample_output_cols].rename(columns={"value": "raw_value"})
    raw_sample_path = os.path.join(folder_path, "raw_data_sample.csv")
    raw_sample_export.to_csv(raw_sample_path, index=False)

    audit_df = pd.DataFrame(audit_rows, columns=["etapa", "categoria", "conteo"])
    audit_summary_path = os.path.join(folder_path, "data_quality_audit.csv")
    audit_df.to_csv(audit_summary_path, index=False)

    total_final = len(final_export_df)
    total_dropped = total_ingested - total_final

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("\n" + "=" * 70)
    print("  RESUMEN GENERAL DEL PROCESAMIENTO (DATALAKE -> SUPABASE CLEAN)")
    print("=" * 70)
    print(f"  * Total registros ingresados:            {total_ingested:>10,}")
    print(f"  * Eliminados por ruido / mala calidad:   {total_noise_dropped:>10,}")
    print(f"  * Eliminados por conflicto duplicidad:   {n_dedup_dropped:>10,}")
    print(f"  * Eliminados por integridad bio/cat:     {n_bio_dropped:>10,}")
    print(f"  * Eliminados por pico transitorio:       {n_glitches:>10,}")
    print(f"  * TOTAL REGISTROS ELIMINADOS:            {total_dropped:>10,}")
    print("-" * 70)
    print(f"  [OK] REGISTROS FINALES EN ARCHIVO CLEAN: {total_final:>10,}")
    print(f"  [OK] Columnas de salida: {', '.join(output_cols)}")
    print(f"  [OK] Archivo generado: {export_path}")
    print(f"  [OK] Auditoría de descartes: {audit_summary_path}")
    print(f"  [OK] Muestra cruda para auditoría visual: {raw_sample_path} ({len(raw_sample_export):,} filas)")
    print("=" * 70 + "\n")

    return final_export_df


if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else "datos"
    process_health_data(folder)
