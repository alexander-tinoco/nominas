export const edadExpression = `(EXTRACT(YEAR FROM CURRENT_DATE)::int - (
  CASE 
    WHEN rfc ~ '^[A-Z&]{4}[0-9]{6}[A-Z0-9]{3}$' THEN 
      (CASE WHEN SUBSTRING(rfc FROM 5 FOR 2)::int < 30 THEN 2000 ELSE 1900 END + SUBSTRING(rfc FROM 5 FOR 2)::int)
    ELSE NULL 
  END
))`;

export function buildNominaFilters(query = {}) {
  const {
    search,
    rfc,
    nom_emp,
    ent_fed,
    unidad,
    subunidad,
    cat_puesto,
    ct_clasif,
    ct_id,
    ct_secuencial,
    ct_digito_ver,
    ct_search,
    qna_pago,
    qna_pago_min,
    qna_pago_max,
    qna_ini,
    qna_fin,
    neto_min,
    neto_max,
    perc_min,
    perc_max,
    ded_min,
    ded_max,
    horas_min,
    horas_max,
    nivel_sueldo_min,
    nivel_sueldo_max,
    mot_mov,
    concepto,
    concepto_tipo,
    concepto_importe_min,
    concepto_importe_max,
    edad_min,
    edad_max
  } = query;

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

  // neto_max
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

  return { conditions, params: queryParams };
}
