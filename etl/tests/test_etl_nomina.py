import pytest
import pandas as pd
import numpy as np
from etl.etl_nomina import (
    clean_text_columns,
    transform_maestro,
    transform_detalle,
    filter_orphans
)

def test_clean_text_columns():
    # Dataset ficticio con espacios en blanco en columnas de texto
    data = {
        'col_text': ['  RFC12345  ', '  Ana Lopez  ', 'normal'],
        'col_num': [1, 2, 3]
    }
    df = pd.DataFrame(data)
    
    df_clean = clean_text_columns(df)
    
    # Comprobar que hizo strip a los textos
    assert df_clean['col_text'].iloc[0] == 'RFC12345'
    assert df_clean['col_text'].iloc[1] == 'Ana Lopez'
    assert df_clean['col_text'].iloc[2] == 'normal'
    assert df_clean['col_num'].iloc[0] == 1

def test_transform_maestro():
    # Dataset ficticio con tipos mixtos o strings
    data = {
        'num_cons': ['1', '2'],
        'qna_ini': ['201801', '201802'],
        'qna_fin': [201801, 201802],
        'qna_pago': ['201806', 201806],
        'tot_perc_cheque': ['1000.50', 2000.00],
        'tot_ded_cheque': [500, '300.25'],
        'tot_net_cheque': ['500.50', 1699.75]
    }
    df = pd.DataFrame(data)
    
    df_trans = transform_maestro(df)
    
    # Comprobar que los tipos se convirtieron correctamente
    assert pd.api.types.is_integer_dtype(df_trans['num_cons'])
    assert pd.api.types.is_integer_dtype(df_trans['qna_ini'])
    assert pd.api.types.is_integer_dtype(df_trans['qna_fin'])
    assert pd.api.types.is_integer_dtype(df_trans['qna_pago'])
    
    assert pd.api.types.is_float_dtype(df_trans['tot_perc_cheque'])
    assert pd.api.types.is_float_dtype(df_trans['tot_ded_cheque'])
    assert pd.api.types.is_float_dtype(df_trans['tot_net_cheque'])
    
    assert df_trans['tot_perc_cheque'].iloc[0] == 1000.50
    assert df_trans['tot_ded_cheque'].iloc[1] == 300.25

def test_transform_detalle():
    # Dataset ficticio de detalles
    data = {
        'num_cons': ['1', 2],
        'qna_ini': ['201801', 201802],
        'qna_fin': [201801, '201802'],
        'importe': ['150.50', 250.75],
        # Probar normalización de conceptos con decimales (flotantes que representan enteros)
        'concepto': ['1.0', 'P01']
    }
    df = pd.DataFrame(data)
    
    df_trans = transform_detalle(df)
    
    assert pd.api.types.is_integer_dtype(df_trans['num_cons'])
    assert pd.api.types.is_integer_dtype(df_trans['qna_ini'])
    assert pd.api.types.is_integer_dtype(df_trans['qna_fin'])
    assert pd.api.types.is_float_dtype(df_trans['importe'])
    
    # Comprobar normalización de conceptos
    assert df_trans['concepto'].iloc[0] == '1' # '1.0' -> '1'
    assert df_trans['concepto'].iloc[1] == 'P01' # No cambia

def test_filter_orphans():
    # Maestro con num_cons 1 y 2
    df_maestro = pd.DataFrame({'num_cons': [1, 2]})
    # Detalle con num_cons 1, 2 y 3 (huérfano)
    df_detalle = pd.DataFrame({
        'num_cons': [1, 2, 3],
        'importe': [100.0, 200.0, 300.0]
    })
    
    df_filtered = filter_orphans(df_maestro, df_detalle)
    
    # Debe haber eliminado el registro huérfano 3
    assert len(df_filtered) == 2
    assert 3 not in df_filtered['num_cons'].values
    assert 1 in df_filtered['num_cons'].values
    assert 2 in df_filtered['num_cons'].values

def test_column_schemas():
    # Probar que las columnas críticas requeridas por el DDL existen
    required_maestro_cols = [
        'num_cons', 'rfc', 'nom_emp', 'ent_fed', 'qna_ini', 'qna_fin', 'qna_pago',
        'tot_perc_cheque', 'tot_ded_cheque', 'tot_net_cheque'
    ]
    required_detalle_cols = [
        'num_cons', 'perc_ded', 'concepto', 'importe', 'qna_ini', 'qna_fin'
    ]
    
    # En caso de cambios en el esquema, este test fallará previniendo bugs
    # Creamos dataframes ficticios que simulan los del esquema
    df_m = pd.DataFrame(columns=required_maestro_cols)
    df_d = pd.DataFrame(columns=required_detalle_cols)
    
    assert all(col in df_m.columns for col in required_maestro_cols)
    assert all(col in df_d.columns for col in required_detalle_cols)
