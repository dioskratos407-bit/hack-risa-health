import os
import sys
import pandas as pd

def process_health_data(folder_path: str, output_path: str = "risa_supabase_import.csv"):
    """
    Capa CLEAN de Arquitectura de Salud.
    Procesa observations.csv (o vital_signs.csv), device_observations.csv y wearable_observations.csv
    aplicando reglas de calidad de señal, anti-fuga temporal, deduplicación jerárquica,
    integridad biológica y formato listo para Supabase (EAV ISO 8601 UTC) con la columna device_id.
    """
    print("=" * 70)
    print("  CAPA CLEAN - PIPELINE DE INGESTIÓN Y CALIDAD DE DATOS DE SALUD")
    print("=" * 70)
    print(f"Carpeta de origen: {folder_path}\n")

    # Mapeo para la búsqueda del archivo de observaciones generales
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

    # =========================================================================
    # 1. REGLAS DE INGESTIÓN Y CALIDAD DE SEÑAL (FILTRO DURO)
    # =========================================================================
    print("--- PASO 1: Ingesta y Filtrado Duro por Calidad de Señal ---")

    # 1.1 Observaciones Generales
    df_obs = pd.read_csv(obs_file)
    n_obs_in = len(df_obs)
    df_obs_clean = df_obs[df_obs["quality_flag"] == "OK"].copy()
    n_obs_noise = n_obs_in - len(df_obs_clean)
    df_obs_clean["source_priority"] = 1
    print(f"Observaciones Generales -> Entrada: {n_obs_in:,} | Descartados por calidad: {n_obs_noise:,} | Conservados: {len(df_obs_clean):,}")

    # 1.2 Dispositivos (Monitores)
    df_dev = pd.read_csv(dev_file)
    n_dev_in = len(df_dev)
    df_dev["signal_quality"] = pd.to_numeric(df_dev["signal_quality"], errors="coerce")
    df_dev_clean = df_dev[
        (df_dev["variable_code"] != "SIGNAL_QUALITY_INDEX") & 
        (df_dev["signal_quality"] >= 0.70)
    ].copy()
    n_dev_noise = n_dev_in - len(df_dev_clean)
    df_dev_clean["source_priority"] = 2
    print(f"Dispositivos (Monitores) -> Entrada: {n_dev_in:,} | Descartados (Metadato/Calidad < 0.70): {n_dev_noise:,} | Conservados: {len(df_dev_clean):,}")

    # 1.3 Wearables
    df_wear = pd.read_csv(wear_file)
    n_wear_in = len(df_wear)
    df_wear_clean = df_wear[df_wear["measurement_quality"] == "OK"].copy()
    n_wear_qual_dropped = n_wear_in - len(df_wear_clean)

    # Filtro anti-fuga temporal: sync_datetime >= timestamp
    df_wear_clean["timestamp_dt"] = pd.to_datetime(df_wear_clean["timestamp"], errors="coerce")
    df_wear_clean["sync_datetime_dt"] = pd.to_datetime(df_wear_clean["sync_datetime"], errors="coerce")
    
    valid_time = df_wear_clean["sync_datetime_dt"] >= df_wear_clean["timestamp_dt"]
    df_wear_clean = df_wear_clean[valid_time].copy()
    n_wear_time_dropped = (len(df_wear) - n_wear_qual_dropped) - len(df_wear_clean)
    df_wear_clean["source_priority"] = 3
    print(f"Wearables -> Entrada: {n_wear_in:,} | Descartados por calidad: {n_wear_qual_dropped:,} | Descartados por Fuga Temporal: {n_wear_time_dropped:,} | Conservados: {len(df_wear_clean):,}")

    total_ingested = n_obs_in + n_dev_in + n_wear_in
    total_noise_dropped = n_obs_noise + n_dev_noise + n_wear_qual_dropped + n_wear_time_dropped

    # =========================================================================
    # 2. RESOLUCIÓN DE CONFLICTOS (DEDUPLICACIÓN JERÁRQUICA)
    # =========================================================================
    print("\n--- PASO 2: Homologación, Unificación y Deduplicación Jerárquica ---")

    var_mapping = {
        "WEARABLE_HR": "HR",
        "SBP": "SYS_BP",
        "DBP": "DIA_BP",
        "RR": "RESP",
        "SLEEP": "SLEEP_category"
    }

    # Inclusión explícita de device_id en las columnas requeridas
    cols_needed = ["patient_id", "device_id", "timestamp", "variable_code", "value", "source_priority"]

    for df in [df_obs_clean, df_dev_clean, df_wear_clean]:
        if not df.empty:
            df["variable_code"] = df["variable_code"].replace(var_mapping)

    merged_df = pd.concat([
        df_obs_clean[cols_needed],
        df_dev_clean[cols_needed],
        df_wear_clean[cols_needed]
    ], ignore_index=True)

    n_merged_before_dedup = len(merged_df)

    merged_df["timestamp_dt"] = pd.to_datetime(merged_df["timestamp"], errors="coerce")

    # Ordenar por patient_id, timestamp_dt, variable_code, source_priority (ascendente)
    merged_df = merged_df.sort_values(
        by=["patient_id", "timestamp_dt", "variable_code", "source_priority"],
        ascending=[True, True, True, True]
    )

    # Deduplicación por (patient_id, timestamp_dt, variable_code), conservando la mayor prioridad (first)
    dedup_df = merged_df.drop_duplicates(
        subset=["patient_id", "timestamp_dt", "variable_code"],
        keep="first"
    ).copy()

    n_dedup_dropped = n_merged_before_dedup - len(dedup_df)
    print(f"Registros pre-deduplicación: {n_merged_before_dedup:,}")
    print(f"Registros duplicados eliminados (Conflicto de prioridad): {n_dedup_dropped:,}")
    print(f"Registros tras deduplicación: {len(dedup_df):,}")

    # =========================================================================
    # 3. REGLAS DE INTEGRIDAD BIOLÓGICA Y TIPOS DE DATOS
    # =========================================================================
    print("\n--- PASO 3: Validación de Integridad Biológica y Categórica ---")

    continuous_vars = ["HR", "SpO2", "TEMP", "SYS_BP", "DIA_BP", "RESP", "STEPS"]
    categorical_vars = ["ACTIVITY_LEVEL", "SLEEP_category"]

    bio_ranges = {
        "HR": (30, 250),
        "SpO2": (50, 100),
        "TEMP": (30, 45),
        "SYS_BP": (50, 300),
        "DIA_BP": (30, 200),
        "RESP": (5, 60),
        "STEPS": (0, 30000)
    }

    categorical_whitelist = {"REST", "WALKING", "MODERATE", "VIGOROUS", "SLEEP", "AWAKE", "DEEP", "LIGHT"}

    df_continuous = dedup_df[dedup_df["variable_code"].isin(continuous_vars)].copy()
    df_categorical = dedup_df[dedup_df["variable_code"].isin(categorical_vars)].copy()
    df_other = dedup_df[~dedup_df["variable_code"].isin(continuous_vars + categorical_vars)].copy()

    df_continuous["numeric_value"] = pd.to_numeric(df_continuous["value"], errors="coerce")
    
    valid_continuous_list = []
    for var, (min_val, max_val) in bio_ranges.items():
        subset = df_continuous[df_continuous["variable_code"] == var]
        valid_subset = subset[
            (subset["numeric_value"].notna()) & 
            (subset["numeric_value"] >= min_val) & 
            (subset["numeric_value"] <= max_val)
        ]
        valid_continuous_list.append(valid_subset)

    if valid_continuous_list:
        df_continuous_clean = pd.concat(valid_continuous_list, ignore_index=True)
    else:
        df_continuous_clean = pd.DataFrame(columns=dedup_df.columns)

    n_continuous_dropped = len(df_continuous) - len(df_continuous_clean)

    df_categorical["clean_value"] = df_categorical["value"].astype(str).str.strip()
    df_categorical_clean = df_categorical[df_categorical["clean_value"].isin(categorical_whitelist)].copy()
    df_categorical_clean["value"] = df_categorical_clean["clean_value"]

    n_categorical_dropped = len(df_categorical) - len(df_categorical_clean)
    n_bio_dropped = n_continuous_dropped + n_categorical_dropped + len(df_other)

    print(f"Descarte por rangos biológicos (Continuas): {n_continuous_dropped:,}")
    print(f"Descarte por lista blanca (Categóricas): {n_categorical_dropped:,}")
    if len(df_other) > 0:
        print(f"Descarte por variable no reconocida: {len(df_other):,}")

    final_clean_df = pd.concat([
        df_continuous_clean[cols_needed + ["timestamp_dt"]],
        df_categorical_clean[cols_needed + ["timestamp_dt"]]
    ], ignore_index=True)

    # =========================================================================
    # 4. FORMATO DE SALIDA (SUPABASE READY)
    # =========================================================================
    print("\n--- PASO 4: Formateo de Salida (Supabase Ready ISO 8601 UTC) ---")

    final_clean_df["timestamp"] = pd.to_datetime(final_clean_df["timestamp_dt"], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    final_clean_df = final_clean_df.sort_values(by=["patient_id", "timestamp", "variable_code"])

    # Exportar modelo EAV ampliado con device_id: patient_id, device_id, timestamp, variable_code, value
    output_cols = ["patient_id", "device_id", "timestamp", "variable_code", "value"]
    final_export_df = final_clean_df[output_cols]

    export_path = os.path.join(folder_path, output_path) if not os.path.isabs(output_path) else output_path
    final_export_df.to_csv(export_path, index=False)

    total_final = len(final_export_df)
    total_dropped = total_ingested - total_final

    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    print("\n" + "=" * 70)
    print("  RESUMEN GENERAL DEL PROCESAMIENTO (DATALAKE -> SUPABASE CLEAN)")
    print("=" * 70)
    print(f"  * Total registros ingresados:           {total_ingested:>10,}")
    print(f"  * Eliminados por ruido / mala calidad:  {total_noise_dropped:>10,}")
    print(f"  * Eliminados por conflicto duplicidad:  {n_dedup_dropped:>10,}")
    print(f"  * Eliminados por rangos biologicos/cat: {n_bio_dropped:>10,}")
    print(f"  * TOTAL REGISTROS ELIMINADOS:           {total_dropped:>10,}")
    print("-" * 70)
    print(f"  [OK] REGISTROS FINALES EN ARCHIVO CLEAN: {total_final:>10,}")
    print(f"  [OK] Columnas de salida: {', '.join(output_cols)}")
    print(f"  [OK] Archivo generado: {export_path}")
    print("=" * 70 + "\n")

    return final_export_df

if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else "datos"
    process_health_data(folder)
