import os
import pandas as pd
import time

def main():
    raw_dir = "raw_data"
    f1_path = os.path.join(raw_dir, "archivo_1.xlsx")
    f2_path = os.path.join(raw_dir, "archivo_2.xlsx")

    print("--- Extrayendo archivo_1.xlsx ---")
    start_time = time.time()
    df1 = pd.read_excel(f1_path, engine="openpyxl")
    elapsed_1 = time.time() - start_time
    print(f"Leído en {elapsed_1:.2f} segundos.")
    print(f"Filas: {len(df1):,}")
    print(f"Columnas: {list(df1.columns)}")
    print("Dtypes:")
    print(df1.dtypes)
    print("\nMuestra de las primeras 3 filas:")
    print(df1.head(3))

    print("\n--- Extrayendo archivo_2.xlsx ---")
    start_time = time.time()
    df2 = pd.read_excel(f2_path, engine="openpyxl")
    elapsed_2 = time.time() - start_time
    print(f"Leído en {elapsed_2:.2f} segundos.")
    print(f"Filas: {len(df2):,}")
    print(f"Columnas: {list(df2.columns)}")
    print("Dtypes:")
    print(df2.dtypes)
    print("\nMuestra de las primeras 3 filas:")
    print(df2.head(3))

if __name__ == "__main__":
    main()
