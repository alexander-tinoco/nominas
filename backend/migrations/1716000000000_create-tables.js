export const up = (pgm) => {
  // 1. Tabla de Catálogo de Conceptos
  pgm.createTable('conceptos_catalogo', {
    concepto: { type: 'varchar(50)', primaryKey: true }
  });

  // 2. Tabla de Registros Maestros de Nómina
  pgm.createTable('nomina_registros', {
    num_cons: { type: 'integer', primaryKey: true },
    rfc: { type: 'varchar(15)', notNull: true },
    nom_emp: { type: 'varchar(150)', notNull: true },
    ent_fed: { type: 'integer', notNull: true },
    ct_clasif: { type: 'varchar(5)', notNull: true },
    ct_id: { type: 'varchar(20)', notNull: true },
    ct_secuencial: { type: 'integer', notNull: true },
    ct_digito_ver: { type: 'varchar(5)', notNull: true },
    cod_pago: { type: 'integer', notNull: true },
    unidad: { type: 'integer', notNull: true },
    subunidad: { type: 'integer', notNull: true },
    cat_puesto: { type: 'varchar(20)', notNull: true },
    horas: { type: 'integer', notNull: true },
    cons_plaza: { type: 'integer', notNull: true },
    nivel_sueldo: { type: 'integer', notNull: true },
    mot_mov: { type: 'integer', notNull: true },
    qna_ini: { type: 'integer', notNull: true },
    qna_fin: { type: 'integer', notNull: true },
    qna_pago: { type: 'integer', notNull: true },
    tot_perc_cheque: { type: 'numeric(12, 2)', notNull: true },
    tot_ded_cheque: { type: 'numeric(12, 2)', notNull: true },
    tot_net_cheque: { type: 'numeric(12, 2)', notNull: true }
  });

  // 3. Tabla de Conceptos Detallados de Nómina (Lazos con Registros Maestros)
  pgm.createTable('nomina_conceptos', {
    id: { type: 'serial', primaryKey: true },
    num_cons: { 
      type: 'integer', 
      notNull: true,
      references: '"nomina_registros"',
      onDelete: 'CASCADE'
    },
    perc_ded: { type: 'char(1)', notNull: true },
    concepto: { 
      type: 'varchar(50)', 
      notNull: true,
      references: '"conceptos_catalogo"',
      onDelete: 'CASCADE'
    },
    importe: { type: 'numeric(12, 2)', notNull: true },
    qna_ini: { type: 'integer', notNull: true },
    qna_fin: { type: 'integer', notNull: true }
  });
};

export const down = (pgm) => {
  pgm.dropTable('nomina_conceptos');
  pgm.dropTable('nomina_registros');
  pgm.dropTable('conceptos_catalogo');
};
