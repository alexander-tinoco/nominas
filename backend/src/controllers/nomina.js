import pool from '../config/db.js';

// GET /api/nomina
export const getNominas = async (req, res, next) => {
  try {
    let {
      // Paginación
      page = 1,
      limit = 20,

      // Filtros básicos e identificación
      search,
      rfc,
      nom_emp,
      ent_fed,

      // Filtros organizacionales
      unidad,
      subunidad,
      cat_puesto,

      // Filtros Centro de Trabajo (C.T.)
      ct_clasif,
      ct_id,
      ct_secuencial,
      ct_digito_ver,
      ct_search,

      // Filtros de periodos (quincenas)
      qna_pago,
      qna_pago_min,
      qna_pago_max,
      qna_ini,
      qna_fin,

      // Filtros de importes
      neto_min,
      neto_max,
      perc_min,
      perc_max,
      ded_min,
      ded_max,

      // Filtros de condiciones de plaza
      horas_min,
      horas_max,
      nivel_sueldo_min,
      nivel_sueldo_max,
      mot_mov,

      // Filtros de Conceptos
      concepto,
      concepto_tipo,
      concepto_importe_min,
      concepto_importe_max,

      // Filtros de Edad
      edad_min,
      edad_max
    } = req.query;

    // Normalizar paginación
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const queryParams = [];

    // Búsqueda general por RFC o nombre
    if (search) {
      const val = `%${search.trim()}%`;
      queryParams.push(val, val);
      conditions.push(`(rfc ILIKE $${queryParams.length - 1} OR nom_emp ILIKE $${queryParams.length})`);
    }

    if (rfc) {
      queryParams.push(rfc.trim());
      conditions.push(`rfc = $${queryParams.length}`);
    }

    if (nom_emp) {
      queryParams.push(`%${nom_emp.trim()}%`);
      conditions.push(`nom_emp ILIKE $${queryParams.length}`);
    }

    if (ent_fed) {
      queryParams.push(parseInt(ent_fed, 10));
      conditions.push(`ent_fed = $${queryParams.length}`);
    }

    // Filtros organizacionales
    if (unidad) {
      queryParams.push(parseInt(unidad, 10));
      conditions.push(`unidad = $${queryParams.length}`);
    }

    if (subunidad) {
      queryParams.push(parseInt(subunidad, 10));
      conditions.push(`subunidad = $${queryParams.length}`);
    }

    if (cat_puesto) {
      queryParams.push(cat_puesto.trim());
      conditions.push(`cat_puesto = $${queryParams.length}`);
    }

    // Centro de trabajo
    if (ct_clasif) {
      queryParams.push(ct_clasif.trim());
      conditions.push(`ct_clasif = $${queryParams.length}`);
    }

    if (ct_id) {
      queryParams.push(ct_id.trim());
      conditions.push(`ct_id = $${queryParams.length}`);
    }

    if (ct_secuencial) {
      queryParams.push(parseInt(ct_secuencial, 10));
      conditions.push(`ct_secuencial = $${queryParams.length}`);
    }

    if (ct_digito_ver) {
      queryParams.push(ct_digito_ver.trim());
      conditions.push(`ct_digito_ver = $${queryParams.length}`);
    }

    if (ct_search) {
      const val = `%${ct_search.trim()}%`;
      queryParams.push(val, val, val);
      conditions.push(`(
        ct_clasif ILIKE $${queryParams.length - 2} OR 
        ct_id ILIKE $${queryParams.length - 1} OR 
        CAST(ct_secuencial AS text) ILIKE $${queryParams.length}
      )`);
    }

    // Quincenas
    if (qna_pago) {
      queryParams.push(parseInt(qna_pago, 10));
      conditions.push(`qna_pago = $${queryParams.length}`);
    }

    if (qna_pago_min) {
      queryParams.push(parseInt(qna_pago_min, 10));
      conditions.push(`qna_pago >= $${queryParams.length}`);
    }

    if (qna_pago_max) {
      queryParams.push(parseInt(qna_pago_max, 10));
      conditions.push(`qna_pago <= $${queryParams.length}`);
    }

    if (qna_ini) {
      queryParams.push(parseInt(qna_ini, 10));
      conditions.push(`qna_ini = $${queryParams.length}`);
    }

    if (qna_fin) {
      queryParams.push(parseInt(qna_fin, 10));
      conditions.push(`qna_fin = $${queryParams.length}`);
    }

    // Importes totales
    if (neto_min) {
      queryParams.push(parseFloat(neto_min));
      conditions.push(`tot_net_cheque >= $${queryParams.length}`);
    }

    if (neto_max) {
      queryParams.push(parseFloat(neto_max));
      conditions.push(`tot_net_cheque <= $${queryParams.length}`);
    }

    if (perc_min) {
      queryParams.push(parseFloat(perc_min));
      conditions.push(`tot_perc_cheque >= $${queryParams.length}`);
    }

    if (perc_max) {
      queryParams.push(parseFloat(perc_max));
      conditions.push(`tot_perc_cheque <= $${queryParams.length}`);
    }

    if (ded_min) {
      queryParams.push(parseFloat(ded_min));
      conditions.push(`tot_ded_cheque >= $${queryParams.length}`);
    }

    if (ded_max) {
      queryParams.push(parseFloat(ded_max));
      conditions.push(`tot_ded_cheque <= $${queryParams.length}`);
    }

    // Horas y nivel sueldo
    if (horas_min) {
      queryParams.push(parseInt(horas_min, 10));
      conditions.push(`horas >= $${queryParams.length}`);
    }

    if (horas_max) {
      queryParams.push(parseInt(horas_max, 10));
      conditions.push(`horas <= $${queryParams.length}`);
    }

    if (nivel_sueldo_min) {
      queryParams.push(parseInt(nivel_sueldo_min, 10));
      conditions.push(`nivel_sueldo >= $${queryParams.length}`);
    }

    if (nivel_sueldo_max) {
      queryParams.push(parseInt(nivel_sueldo_max, 10));
      conditions.push(`nivel_sueldo <= $${queryParams.length}`);
    }

    if (mot_mov) {
      queryParams.push(parseInt(mot_mov, 10));
      conditions.push(`mot_mov = $${queryParams.length}`);
    }

    // Filtros de Edad
    // RFC regex format: 4 letras, 6 dígitos de fecha, y homoclave de 3 letras/dígitos.
    const edadExpression = `(EXTRACT(YEAR FROM CURRENT_DATE)::int - (
      CASE 
        WHEN rfc ~ '^[A-Z&]{4}[0-9]{6}[A-Z0-9]{3}$' THEN 
          (CASE WHEN SUBSTRING(rfc FROM 5 FOR 2)::int < 30 THEN 2000 ELSE 1900 END + SUBSTRING(rfc FROM 5 FOR 2)::int)
        ELSE NULL 
      END
    ))`;

    if (edad_min) {
      queryParams.push(parseInt(edad_min, 10));
      conditions.push(`${edadExpression} >= $${queryParams.length}`);
    }

    if (edad_max) {
      queryParams.push(parseInt(edad_max, 10));
      conditions.push(`${edadExpression} <= $${queryParams.length}`);
    }

    // Conceptos (Tabla relacionada nomina_conceptos)
    if (concepto || concepto_tipo || concepto_importe_min || concepto_importe_max) {
      const conceptoConditions = ['nc.num_cons = nomina_registros.num_cons'];
      
      if (concepto) {
        queryParams.push(concepto.trim());
        conceptoConditions.push(`nc.concepto = $${queryParams.length}`);
      }
      if (concepto_tipo) {
        queryParams.push(concepto_tipo.trim().toUpperCase());
        conceptoConditions.push(`nc.perc_ded = $${queryParams.length}`);
      }
      if (concepto_importe_min) {
        queryParams.push(parseFloat(concepto_importe_min));
        conceptoConditions.push(`nc.importe >= $${queryParams.length}`);
      }
      if (concepto_importe_max) {
        queryParams.push(parseFloat(concepto_importe_max));
        conceptoConditions.push(`nc.importe <= $${queryParams.length}`);
      }
      
      conditions.push(`EXISTS (
        SELECT 1 
        FROM nomina_conceptos nc 
        WHERE ${conceptoConditions.join(' AND ')}
      )`);
    }

    // Construcción de cláusula WHERE
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Consultas SQL
    const summaryQuery = `
      SELECT 
        COUNT(*)::int AS total,
        COALESCE(SUM(tot_perc_cheque), 0)::float AS total_percepciones,
        COALESCE(SUM(tot_ded_cheque), 0)::float AS total_deducciones,
        COALESCE(SUM(tot_net_cheque), 0)::float AS total_neto
      FROM nomina_registros
      ${whereClause}
    `;

    const dataQuery = `
      SELECT *, 
             ${edadExpression} AS edad
      FROM nomina_registros
      ${whereClause}
      ORDER BY num_cons ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    // Ejecutar consultas en paralelo
    const [summaryResult, dataResult] = await Promise.all([
      pool.query(summaryQuery, queryParams),
      pool.query(dataQuery, [...queryParams, limit, offset])
    ]);

    const summary = summaryResult.rows[0];
    const total = summary.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: dataResult.rows,
      summary: {
        total,
        totalPercepciones: summary.total_percepciones,
        totalDeducciones: summary.total_deducciones,
        totalNeto: summary.total_neto
      },
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/nomina/:num_cons
export const getNominaById = async (req, res, next) => {
  try {
    const numCons = parseInt(req.params.num_cons, 10);
    if (isNaN(numCons)) {
      return res.status(400).json({ error: "num_cons debe ser un valor entero válido" });
    }

    const registroQuery = `
      SELECT *
      FROM nomina_registros
      WHERE num_cons = $1
    `;

    const conceptosQuery = `
      SELECT perc_ded, concepto, importe, qna_ini, qna_fin
      FROM nomina_conceptos
      WHERE num_cons = $1
      ORDER BY concepto ASC
    `;

    const [registroResult, conceptosResult] = await Promise.all([
      pool.query(registroQuery, [numCons]),
      pool.query(conceptosQuery, [numCons])
    ]);

    if (registroResult.rows.length === 0) {
      return res.status(404).json({ error: `Registro de nómina con num_cons ${numCons} no encontrado` });
    }

    const registro = registroResult.rows[0];

    // Separar percepciones de deducciones
    const percepciones = [];
    const deducciones = [];

    for (const row of conceptosResult.rows) {
      if (row.perc_ded === 'P') {
        percepciones.push({
          concepto: row.concepto,
          importe: parseFloat(row.importe),
          qna_ini: row.qna_ini,
          qna_fin: row.qna_fin
        });
      } else if (row.perc_ded === 'D') {
        deducciones.push({
          concepto: row.concepto,
          importe: parseFloat(row.importe),
          qna_ini: row.qna_ini,
          qna_fin: row.qna_fin
        });
      }
    }

    res.json({
      ...registro,
      percepciones,
      deducciones
    });
  } catch (err) {
    next(err);
  }
};
