import os
import pandas as pd

def main():
    raw_dir = "raw_data"
    f1_path = os.path.join(raw_dir, "archivo_1.xlsx")
    f2_path = os.path.join(raw_dir, "archivo_2.xlsx")

    print("Cargando archivos...")
    df1 = pd.read_excel(f1_path, engine="openpyxl")
    df2 = pd.read_excel(f2_path, engine="openpyxl")

    print("\n--- 1. Limpieza de Texto (strip) ---")
    # Apply strip to string columns in df1
    for col in df1.select_dtypes(include=['object']).columns:
        df1[col] = df1[col].astype(str).str.strip()
    
    # Apply strip to string columns in df2
    for col in df2.select_dtypes(include=['object']).columns:
        df2[col] = df2[col].astype(str).str.strip()

    print("Limpieza realizada en todas las columnas de tipo texto.")

    print("\n--- 2. Validación de Tipos ---")
    # Ensure types are correct
    # df1
    df1['num_cons'] = df1['num_cons'].astype(int)
    for qna_col in ['qna_ini', 'qna_fin', 'qna_pago']:
        df1[qna_col] = df1[qna_col].astype(int)
    for money_col in ['tot_perc_cheque', 'tot_ded_cheque', 'tot_net_cheque']:
        df1[money_col] = df1[money_col].astype(float)
    
    # df2
    df2['num_cons'] = df2['num_cons'].astype(int)
    for qna_col in ['qna_ini', 'qna_fin']:
        df2[qna_col] = df2[qna_col].astype(int)
    df2['importe'] = df2['importe'].astype(float)
    
    # Normalize 'concepto' to string without decimals (if it was read as float-like text)
    # Check if we can convert it to integer first or keep as stripped string
    # Let's inspect unique concepts
    df2['concepto'] = df2['concepto'].astype(str).str.strip()
    # If any float like '51.0', convert to '51'
    df2['concepto'] = df2['concepto'].apply(lambda x: str(int(float(x))) if x.replace('.','',1).isdigit() and '.' in x else x)

    print("Validación de tipos completada.")

    print("\n--- 3. Integridad Referencial ---")
    # Every num_cons in df2 must exist in df1
    df1_cons = set(df1['num_cons'])
    df2_cons = set(df2['num_cons'])
    orphans = df2[~df2['num_cons'].isin(df1_cons)]
    print(f"Número de registros huérfanos en archivo_2: {len(orphans)}")
    if len(orphans) > 0:
        print("Muestra de registros huérfanos:")
        print(orphans.head())

    print("\n--- 4. Duplicados en archivo_1.num_cons ---")
    duplicated_cons = df1[df1['num_cons'].duplicated()]
    print(f"Número de duplicados en PK (num_cons): {len(duplicated_cons)}")
    if len(duplicated_cons) > 0:
        print("Muestra de duplicados:")
        print(duplicated_cons.head())

    print("\n--- 5. Detección de Nulos ---")
    print("Nulos en archivo_1 (nomina_registros):")
    print(df1.isna().sum())
    print("\nNulos en archivo_2 (nomina_conceptos):")
    print(df2.isna().sum())

    print("\n--- 6. Catálogos Normalizados (Valores Únicos) ---")
    unique_conceptos = df2['concepto'].unique()
    print(f"Conceptos únicos en archivo_2: {len(unique_conceptos)}")
    print(f"Ejemplo de conceptos: {sorted(list(unique_conceptos))[:20]}")

    unique_cat_puesto = df1['cat_puesto'].unique()
    print(f"Categorías de puesto (cat_puesto) únicas: {len(unique_cat_puesto)}")
    print(f"Ejemplo de cat_puesto: {sorted(list(unique_cat_puesto))[:10]}")

    unique_unidades = df1[['unidad', 'subunidad']].drop_duplicates()
    print(f"Combinaciones únicas de unidad y subunidad: {len(unique_unidades)}")
    print(f"Ejemplo de unidades/subunidades:")
    print(unique_unidades.head(10))

    unique_ent_fed = df1['ent_fed'].unique()
    print(f"Entidades federativas (ent_fed) únicas: {len(unique_ent_fed)}")
    print(f"Ejemplo de ent_fed: {sorted(list(unique_ent_fed))}")

if __name__ == "__main__":
    main()
