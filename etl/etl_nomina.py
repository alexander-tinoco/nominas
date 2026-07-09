#!/usr/bin/env python3
"""
ETL Pipeline de Nómina
Carga dos archivos Excel de nómina a una base de datos relacional (PostgreSQL).
"""

import os
import sys
import time
import logging
import argparse
import pandas as pd
from sqlalchemy import create_engine, text

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("etl_nomina.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("etl_nomina")

def parse_arguments():
    parser = argparse.ArgumentParser(description="Pipeline ETL para carga de nóminas a PostgreSQL.")
    parser.add_argument(
        "--file1",
        default="raw_data/archivo_1.xlsx",
        help="Ruta al archivo Excel maestro (archivo_1.xlsx)."
    )
    parser.add_argument(
        "--file2",
        default="raw_data/archivo_2.xlsx",
        help="Ruta al archivo Excel de detalle (archivo_2.xlsx)."
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("DATABASE_URL", "postgresql://postgres:postgres_password@localhost:5433/nominas"),
        help="Cadena de conexión de SQLAlchemy para la base de datos."
    )
    parser.add_argument(
        "--mode",
        choices=["initial", "reload"],
        default="initial",
        help="Modo de carga: 'initial' recrea las tablas; 'reload' añade o reemplaza datos sin borrar la estructura."
    )
    parser.add_argument(
        "--chunksize",
        type=int,
        default=5000,
        help="Tamaño de lote para la inserción en la base de datos."
    )
    return parser.parse_args()

def run_ddl(engine, mode):
    """
    Crea las tablas en la base de datos.
    Si el modo es 'initial', elimina las tablas existentes.
    """
    if mode == "initial":
        logger.info("Modo 'initial' activo. Preparando para eliminar tablas anteriores...")
        drop_ddl = """
        DROP TABLE IF EXISTS nomina_conceptos CASCADE;
        DROP TABLE IF EXISTS nomina_registros CASCADE;
        DROP TABLE IF EXISTS conceptos_catalogo CASCADE;
        """
        with engine.begin() as conn:
            conn.execute(text(drop_ddl))
        logger.info("Tablas anteriores eliminadas.")

    create_ddl = """
    CREATE TABLE IF NOT EXISTS conceptos_catalogo (
        concepto VARCHAR(5) PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS nomina_registros (
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

    CREATE TABLE IF NOT EXISTS nomina_conceptos (
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
    """
    
    # Crear índices si no existen
    indices_ddl = """
    CREATE INDEX IF NOT EXISTS idx_registros_rfc ON nomina_registros (rfc);
    CREATE INDEX IF NOT EXISTS idx_registros_qna_ini ON nomina_registros (qna_ini);
    CREATE INDEX IF NOT EXISTS idx_registros_qna_fin ON nomina_registros (qna_fin);
    CREATE INDEX IF NOT EXISTS idx_conceptos_num_cons ON nomina_conceptos (num_cons);
    CREATE INDEX IF NOT EXISTS idx_conceptos_concepto ON nomina_conceptos (concepto);
    """

    logger.info("Creando tablas si no existen...")
    with engine.begin() as conn:
        conn.execute(text(create_ddl))
        conn.execute(text(indices_ddl))
    logger.info("Estructura de tablas e índices lista en la base de datos.")

def main():
    args = parse_arguments()
    logger.info("Iniciando Pipeline ETL de Nómina...")

    # Validar que los archivos de entrada existan
    if not os.path.exists(args.file1):
        logger.error(f"El archivo maestro no existe en la ruta: {args.file1}")
        sys.exit(1)
    if not os.path.exists(args.file2):
        logger.error(f"El archivo de detalle no existe en la ruta: {args.file2}")
        sys.exit(1)

    try:
        # -------------------------------------------------------------
        # ETAPA 1: EXTRACT (Extracción)
        # -------------------------------------------------------------
        logger.info("=== ETAPA 1: EXTRACT ===")
        logger.info(f"Leyendo archivo maestro: {args.file1}")
        t0 = time.time()
        df1 = pd.read_excel(args.file1, engine="openpyxl")
        logger.info(f"Archivo maestro cargado: {len(df1):,} filas, {len(df1.columns)} columnas (en {time.time()-t0:.2f}s)")

        logger.info(f"Leyendo archivo de detalle: {args.file2}")
        t0 = time.time()
        df2 = pd.read_excel(args.file2, engine="openpyxl")
        logger.info(f"Archivo de detalle cargado: {len(df2):,} filas, {len(df2.columns)} columnas (en {time.time()-t0:.2f}s)")

        # -------------------------------------------------------------
        # ETAPA 2: TRANSFORM (Limpieza y Validación)
        # -------------------------------------------------------------
        logger.info("=== ETAPA 2: TRANSFORM ===")
        
        # Limpieza de textos (strip)
        logger.info("Aplicando limpieza de espacios (strip) en columnas de texto...")
        # Pandas 3 warning avoidance: use explicit object/string dtype selection
        for col in df1.select_dtypes(include=['object', 'string']).columns:
            df1[col] = df1[col].astype(str).str.strip()
        for col in df2.select_dtypes(include=['object', 'string']).columns:
            df2[col] = df2[col].astype(str).str.strip()

        # Validación de tipos en df1
        df1['num_cons'] = df1['num_cons'].astype(int)
        for qna_col in ['qna_ini', 'qna_fin', 'qna_pago']:
            df1[qna_col] = df1[qna_col].astype(int)
        for money_col in ['tot_perc_cheque', 'tot_ded_cheque', 'tot_net_cheque']:
            df1[money_col] = df1[money_col].astype(float)

        # Validación de tipos en df2
        df2['num_cons'] = df2['num_cons'].astype(int)
        for qna_col in ['qna_ini', 'qna_fin']:
            df2[qna_col] = df2[qna_col].astype(int)
        df2['importe'] = df2['importe'].astype(float)
        # Normalizar conceptos
        df2['concepto'] = df2['concepto'].apply(
            lambda x: str(int(float(x))) if x.replace('.', '', 1).isdigit() and '.' in x else x
        )

        # Detección de Nulos
        nulls_df1 = df1.isna().sum().sum()
        nulls_df2 = df2.isna().sum().sum()
        if nulls_df1 > 0:
            logger.warning(f"Se detectaron {nulls_df1} valores nulos en el archivo maestro.")
        if nulls_df2 > 0:
            logger.warning(f"Se detectaron {nulls_df2} valores nulos en el archivo de detalle.")

        # Verificar Duplicados en PK de df1
        dups_df1 = df1['num_cons'].duplicated().sum()
        if dups_df1 > 0:
            logger.warning(f"Se encontraron {dups_df1} duplicados para num_cons (PK) en el archivo maestro.")

        # Verificar Integridad Referencial
        df1_cons = set(df1['num_cons'])
        orphans = df2[~df2['num_cons'].isin(df1_cons)]
        if len(orphans) > 0:
            logger.warning(f"Se detectaron {len(orphans)} registros huérfanos en el archivo de detalle (num_cons no existe en maestro).")
            # En caso de huérfanos, podríamos filtrarlos para evitar fallas de FK en BD
            df2 = df2[df2['num_cons'].isin(df1_cons)]
            logger.warning("Registros huérfanos eliminados del set de datos para conservar integridad referencial.")

        # -------------------------------------------------------------
        # ETAPA 3: LOAD (Carga)
        # -------------------------------------------------------------
        logger.info("=== ETAPA 3: LOAD ===")
        logger.info("Estableciendo conexión con la base de datos...")
        engine = create_engine(args.db_url)
        
        # Crear/Actualizar esquema
        run_ddl(engine, args.mode)

        # Cargar catálogo de conceptos
        logger.info("Cargando catálogo de conceptos...")
        unique_conceptos = pd.DataFrame(df2['concepto'].unique(), columns=['concepto'])
        
        # En caso de recarga (reload), evitamos insertar duplicados en la PK del catálogo
        if args.mode == "reload":
            with engine.connect() as conn:
                existing_concepts = pd.read_sql("SELECT concepto FROM conceptos_catalogo", con=conn)
                unique_conceptos = unique_conceptos[~unique_conceptos['concepto'].isin(existing_concepts['concepto'])]
        
        if not unique_conceptos.empty:
            unique_conceptos.to_sql('conceptos_catalogo', con=engine, if_exists='append', index=False)
            logger.info(f"Se agregaron {len(unique_conceptos)} conceptos nuevos al catálogo.")
        else:
            logger.info("No hay nuevos conceptos que añadir al catálogo.")

        # Cargar registros maestros
        logger.info(f"Cargando {len(df1):,} registros maestros a 'nomina_registros' en lotes de {args.chunksize}...")
        t_start = time.time()
        
        # Si es reload y ya existen registros con el mismo num_cons, eliminamos los anteriores o arrojamos advertencia.
        # to_sql con if_exists='append' fallará si encuentra duplicados de PK, lo cual es correcto y seguro.
        df1.to_sql(
            name='nomina_registros',
            con=engine,
            if_exists='append',
            index=False,
            chunksize=args.chunksize
        )
        logger.info(f"Carga de registros maestros finalizada con éxito en {time.time()-t_start:.2f}s.")

        # Cargar registros de detalle (conceptos)
        logger.info(f"Cargando {len(df2):,} registros de detalle a 'nomina_conceptos' en lotes de {args.chunksize}...")
        t_start = time.time()
        df2.to_sql(
            name='nomina_conceptos',
            con=engine,
            if_exists='append',
            index=False,
            chunksize=args.chunksize
        )
        logger.info(f"Carga de registros de detalle finalizada con éxito en {time.time()-t_start:.2f}s.")

        logger.info("=== PIPELINE ETL FINALIZADO CON ÉXITO ===")

    except Exception as e:
        logger.error("Fallo crítico en el pipeline ETL:", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
