import os
import time
import pandas as pd
from sqlalchemy import create_engine, text

def main():
    db_url = "postgresql://postgres:postgres_password@localhost:5433/nominas"
    raw_dir = "raw_data"
    f1_path = os.path.join(raw_dir, "archivo_1.xlsx")
    f2_path = os.path.join(raw_dir, "archivo_2.xlsx")

    print("Conectando a la base de datos...")
    engine = create_engine(db_url)
    
    # 1. Definición de DDL y eliminación de tablas previas (Carga Inicial)
    print("Preparando esquema de base de datos...")
    drop_ddl = """
    DROP TABLE IF EXISTS nomina_conceptos CASCADE;
    DROP TABLE IF EXISTS nomina_registros CASCADE;
    DROP TABLE IF EXISTS conceptos_catalogo CASCADE;
    """
    
    create_ddl = """
    CREATE TABLE conceptos_catalogo (
        concepto VARCHAR(5) PRIMARY KEY
    );

    CREATE TABLE nomina_registros (
        num_cons INT PRIMARY KEY,
        rfc VARCHAR(13) NOT NULL,
        nom_emp VARCHAR(100) NOT NULL,
        ent_fed INT NOT NULL,
        ct_clasif VARCHAR(5),
        ct_id VARCHAR(5),
        ct_secuencial INT,
        ct_digito_ver VARCHAR(5),
        cod_pago INT,
        unidad INT,
        subunidad INT,
        cat_puesto VARCHAR(10),
        horas INT,
        cons_plaza INT,
        nivel_sueldo INT,
        mot_mov INT,
        qna_ini INT NOT NULL,
        qna_fin INT NOT NULL,
        qna_pago INT NOT NULL,
        tot_perc_cheque NUMERIC(15, 2) NOT NULL,
        tot_ded_cheque NUMERIC(15, 2) NOT NULL,
        tot_net_cheque NUMERIC(15, 2) NOT NULL
    );

    CREATE TABLE nomina_conceptos (
        id SERIAL PRIMARY KEY,
        num_cons INT NOT NULL,
        perc_ded CHAR(1) NOT NULL,
        concepto VARCHAR(5) NOT NULL,
        importe NUMERIC(15, 2) NOT NULL,
        qna_ini INT NOT NULL,
        qna_fin INT NOT NULL,
        CONSTRAINT fk_nomina_registros FOREIGN KEY (num_cons) REFERENCES nomina_registros(num_cons) ON DELETE CASCADE,
        CONSTRAINT fk_conceptos_catalogo FOREIGN KEY (concepto) REFERENCES conceptos_catalogo(concepto)
    );

    CREATE INDEX idx_registros_rfc ON nomina_registros (rfc);
    CREATE INDEX idx_registros_qna_ini ON nomina_registros (qna_ini);
    CREATE INDEX idx_registros_qna_fin ON nomina_registros (qna_fin);

    CREATE INDEX idx_conceptos_num_cons ON nomina_conceptos (num_cons);
    CREATE INDEX idx_conceptos_concepto ON nomina_conceptos (concepto);
    """

    with engine.begin() as conn:
        print("Eliminando tablas anteriores si existen...")
        conn.execute(text(drop_ddl))
        print("Creando tablas e índices...")
        conn.execute(text(create_ddl))
    print("Esquema creado exitosamente.")

    # 2. Extracción y Limpieza de datos (de Paso 3)
    print("\nCargando y transformando datos de archivo_1.xlsx...")
    df1 = pd.read_excel(f1_path, engine="openpyxl")
    # Clean text columns
    for col in df1.select_dtypes(include=['object', 'string']).columns:
        df1[col] = df1[col].astype(str).str.strip()
    
    # Cast types
    df1['num_cons'] = df1['num_cons'].astype(int)
    for qna_col in ['qna_ini', 'qna_fin', 'qna_pago']:
        df1[qna_col] = df1[qna_col].astype(int)
    for money_col in ['tot_perc_cheque', 'tot_ded_cheque', 'tot_net_cheque']:
        df1[money_col] = df1[money_col].astype(float)

    print("Cargando y transformando datos de archivo_2.xlsx...")
    df2 = pd.read_excel(f2_path, engine="openpyxl")
    # Clean text columns
    for col in df2.select_dtypes(include=['object', 'string']).columns:
        df2[col] = df2[col].astype(str).str.strip()
    
    # Cast types
    df2['num_cons'] = df2['num_cons'].astype(int)
    for qna_col in ['qna_ini', 'qna_fin']:
        df2[qna_col] = df2[qna_col].astype(int)
    df2['importe'] = df2['importe'].astype(float)
    # Normalize concepto
    df2['concepto'] = df2['concepto'].apply(lambda x: str(int(float(x))) if x.replace('.','',1).isdigit() and '.' in x else x)

    print("Datos listos en memoria para ser cargados.")

    # 3. Carga de datos
    chunk_size = 5000
    
    # A. Cargar catálogo de conceptos
    print("\nCargando conceptos_catalogo...")
    unique_conceptos = pd.DataFrame(df2['concepto'].unique(), columns=['concepto'])
    unique_conceptos.to_sql('conceptos_catalogo', con=engine, if_exists='append', index=False)
    print(f"Cargados {len(unique_conceptos)} conceptos únicos.")

    # B. Cargar nomina_registros
    print("Cargando nomina_registros en lotes...")
    start_time = time.time()
    df1.to_sql('nomina_registros', con=engine, if_exists='append', index=False, chunksize=chunk_size)
    elapsed = time.time() - start_time
    print(f"Cargados {len(df1):,} registros en {elapsed:.2f} segundos.")

    # C. Cargar nomina_conceptos
    print("Cargando nomina_conceptos en lotes...")
    start_time = time.time()
    df2.to_sql('nomina_conceptos', con=engine, if_exists='append', index=False, chunksize=chunk_size)
    elapsed = time.time() - start_time
    print(f"Cargados {len(df2):,} conceptos en {elapsed:.2f} segundos.")

    print("\n--- ¡Carga completada exitosamente! ---")

if __name__ == "__main__":
    main()
