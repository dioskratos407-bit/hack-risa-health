import os
import sys
import random
import pandas as pd

# Listas de nombres y apellidos realistas en español
FIRST_NAMES_M = [
    "Carlos", "Alejandro", "Mateo", "Santiago", "Gabriel", "Diego", "Javier", 
    "Luis", "Fernando", "Ricardo", "Gonzalo", "Andrés", "Felipe", "Rodrigo", 
    "Ignacio", "Esteban", "Manuel", "Hugo", "Álvaro", "Joaquín"
]

FIRST_NAMES_F = [
    "Ana", "María", "Valeria", "Camila", "Sofia", "Isabella", "Lucía", 
    "Elena", "Mariana", "Paula", "Daniela", "Gabriela", "Carmen", "Rosa", 
    "Victoria", "Valentina", "Natalia", "Andrea", "Lorena", "Claudia"
]

LAST_NAMES = [
    "Mendoza", "Rojas", "García", "Fernández", "González", "López", "Rodríguez", 
    "Martínez", "Sánchez", "Pérez", "Gómez", "Torres", "Díaz", "Vargas", 
    "Ramírez", "Morales", "Castillo", "Ortega", "Guerrero", "Silva", "Nuñez"
]

def generate_patients(input_file: str = "risa_supabase_import.csv", output_file: str = "patients_import.csv"):
    """
    Lee risa_supabase_import.csv, extrae los patient_id únicos y genera
    un archivo CSV con datos demográficos simulados listo para Supabase.
    """
    # Fijar semilla para reproducibilidad si se desea, o mantener dinámico
    random.seed(42)

    print("=" * 70)
    print("  GENERACIÓN DE DATOS DEMOGRÁFICOS DE PACIENTES (PARKING SUPABASE)")
    print("=" * 70)

    # 1. Búsqueda y lectura del archivo de observaciones
    target_path = input_file
    if not os.path.exists(target_path):
        alt_path = os.path.join("datos", input_file)
        if os.path.exists(alt_path):
            target_path = alt_path
        else:
            raise FileNotFoundError(f"No se encontró el archivo de entrada '{input_file}' en el directorio actual ni en 'datos/'.")

    print(f"Leyendo archivo de observaciones: {target_path}")
    df_obs = pd.read_csv(target_path, usecols=["patient_id"])
    
    # 2. Extracción de patient_id únicos
    unique_patients = sorted(df_obs["patient_id"].dropna().unique())
    
    total_unique = len(unique_patients)
    print(f"[OK] Se detectaron {total_unique:,} pacientes únicos en el dataset.")

    # 3. Generación de datos demográficos simulados (Mocking)
    patients_data = []
    
    statuses = ["STABLE", "HIGH_RISK", "CRITICAL"]
    status_weights = [0.70, 0.20, 0.10]
    
    for pid in unique_patients:
        gender = random.choice(["M", "F"])
        
        if gender == "M":
            first_name = random.choice(FIRST_NAMES_M)
        else:
            first_name = random.choice(FIRST_NAMES_F)
            
        last_name1 = random.choice(LAST_NAMES)
        last_name2 = random.choice(LAST_NAMES)
        full_name = f"{first_name} {last_name1} {last_name2}"
        
        age = random.randint(18, 85)
        admission_date = "2026-07-09T08:00:00Z"
        current_status = random.choices(statuses, weights=status_weights)[0]
        
        patients_data.append({
            "patient_id": pid,
            "full_name": full_name,
            "age": age,
            "gender": gender,
            "admission_date": admission_date,
            "current_status": current_status
        })

    df_patients = pd.DataFrame(patients_data)

    # 4. Exportación del resultado
    # Si la entrada estaba dentro de datos/, guardamos también en la misma ubicación
    out_dir = os.path.dirname(target_path)
    final_output_path = os.path.join(out_dir, output_file) if out_dir else output_file
    
    output_cols = ["patient_id", "full_name", "age", "gender", "admission_date", "current_status"]
    df_patients[output_cols].to_csv(final_output_path, index=False)

    # 5. Resumen en Consola
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    print("\n" + "=" * 70)
    print("  RESUMEN DE PACIENTES GENERADOS")
    print("=" * 70)
    print(f"  * Total Pacientes Únicos:   {total_unique:>8,}")
    print(f"  * Distribución de Status:")
    for status, count in df_patients["current_status"].value_counts().items():
        print(f"    - {status:<12}: {count:>5} ({count/total_unique*100:.1f}%)")
    print("-" * 70)
    print(f"  [OK] Archivo generado exitosamente: {final_output_path}")
    print("=" * 70 + "\n")

    return df_patients

if __name__ == "__main__":
    file_arg = sys.argv[1] if len(sys.argv) > 1 else "risa_supabase_import.csv"
    generate_patients(file_arg)
