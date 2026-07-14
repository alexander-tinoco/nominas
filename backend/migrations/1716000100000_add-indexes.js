export const up = (pgm) => {
  // Índices en la tabla nomina_registros
  pgm.createIndex('nomina_registros', 'unidad', { name: 'idx_registros_unidad' });
  pgm.createIndex('nomina_registros', 'cat_puesto', { name: 'idx_registros_cat_puesto' });
  pgm.createIndex('nomina_registros', 'qna_pago', { name: 'idx_registros_qna_pago' });
  pgm.createIndex('nomina_registros', ['unidad', 'subunidad'], { name: 'idx_registros_unidad_subunidad' });

  // Índices en la tabla nomina_conceptos
  pgm.createIndex('nomina_conceptos', 'num_cons', { name: 'idx_conceptos_num_cons' });
  pgm.createIndex('nomina_conceptos', 'concepto', { name: 'idx_conceptos_concepto' });
  pgm.createIndex('nomina_conceptos', ['qna_ini', 'qna_fin'], { name: 'idx_conceptos_vigencia' });
};

export const down = (pgm) => {
  pgm.dropIndex('nomina_conceptos', ['qna_ini', 'qna_fin'], { name: 'idx_conceptos_vigencia' });
  pgm.dropIndex('nomina_conceptos', 'concepto', { name: 'idx_conceptos_concepto' });
  pgm.dropIndex('nomina_conceptos', 'num_cons', { name: 'idx_conceptos_num_cons' });

  pgm.dropIndex('nomina_registros', ['unidad', 'subunidad'], { name: 'idx_registros_unidad_subunidad' });
  pgm.dropIndex('nomina_registros', 'qna_pago', { name: 'idx_registros_qna_pago' });
  pgm.dropIndex('nomina_registros', 'cat_puesto', { name: 'idx_registros_cat_puesto' });
  pgm.dropIndex('nomina_registros', 'unidad', { name: 'idx_registros_unidad' });
};
