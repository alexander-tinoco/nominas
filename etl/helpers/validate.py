import pandas as pd
from sqlalchemy import create_engine, text

def main():
    db_url = "postgresql://postgres:postgres_password@localhost:5433/nominas"
    engine = create_engine(db_url)

    print("--- 1. Conteo de Filas en la Base de Datos ---")
    query_counts = """
    SELECT 
        (SELECT COUNT(*) FROM conceptos_catalogo) as count_cat,
        (SELECT COUNT(*) FROM nomina_registros) as count_reg,
        (SELECT COUNT(*) FROM nomina_conceptos) as count_con
    """
    with engine.connect() as conn:
        counts = conn.execute(text(query_counts)).fetchone()
        print(f"conceptos_catalogo: {counts[0]:,} (Esperado: 200)")
        print(f"nomina_registros:   {counts[1]:,} (Esperado: 15,401)")
        print(f"nomina_conceptos:   {counts[2]:,} (Esperado: 276,978)")

    print("\n--- 2. Consulta JOIN de Muestra (5 filas) ---")
    query_join = """
    SELECT r.num_cons, r.rfc, r.nom_emp, c.perc_ded, c.concepto, c.importe, c.qna_ini
    FROM nomina_registros r
    JOIN nomina_conceptos c ON r.num_cons = c.num_cons
    ORDER BY r.num_cons, c.concepto
    LIMIT 5;
    """
    df_join = pd.read_sql(query_join, con=engine)
    print(df_join)

    print("\n--- 3. Cuadre de Importes vs Totales (5 registros de muestra) ---")
    query_cuadre = """
    SELECT 
        r.num_cons,
        r.tot_perc_cheque AS perc_esperado,
        COALESCE(SUM(CASE WHEN c.perc_ded = 'P' THEN c.importe ELSE 0 END), 0) AS perc_calculado,
        r.tot_ded_cheque AS ded_esperado,
        COALESCE(SUM(CASE WHEN c.perc_ded = 'D' THEN c.importe ELSE 0 END), 0) AS ded_calculado,
        r.tot_net_cheque AS net_esperado,
        (COALESCE(SUM(CASE WHEN c.perc_ded = 'P' THEN c.importe ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN c.perc_ded = 'D' THEN c.importe ELSE 0 END), 0)) AS net_calculado
    FROM nomina_registros r
    LEFT JOIN nomina_conceptos c ON r.num_cons = c.num_cons
    GROUP BY r.num_cons, r.tot_perc_cheque, r.tot_ded_cheque, r.tot_net_cheque
    ORDER BY r.num_cons
    LIMIT 5;
    """
    df_cuadre = pd.read_sql(query_cuadre, con=engine)
    print(df_cuadre)

if __name__ == "__main__":
    main()
