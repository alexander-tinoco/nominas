export const up = (pgm) => {
  // Tabla de usuarios (login y roles)
  pgm.createTable('usuarios', {
    id: { type: 'serial', primaryKey: true },
    email: { type: 'varchar(150)', notNull: true, unique: true },
    password_hash: { type: 'varchar(100)', notNull: true },
    rol: { type: 'varchar(20)', notNull: true, check: "rol IN ('admin', 'usuario')" },
    nombre: { type: 'varchar(150)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  // Tabla de logs de seguridad (login, accesos, auditoría de cambios)
  pgm.createTable('logs_seguridad', {
    id: { type: 'serial', primaryKey: true },
    fecha_hora: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    usuario: { type: 'varchar(150)', notNull: true },
    evento: { type: 'varchar(50)', notNull: true },
    nivel: { type: 'varchar(10)', notNull: true, check: "nivel IN ('INFO', 'WARNING', 'ERROR', 'DEBUG')" },
    detalle: { type: 'jsonb' }
  });

  pgm.createIndex('logs_seguridad', 'fecha_hora', { name: 'idx_logs_seguridad_fecha_hora' });
  pgm.createIndex('logs_seguridad', 'evento', { name: 'idx_logs_seguridad_evento' });
  pgm.createIndex('logs_seguridad', 'nivel', { name: 'idx_logs_seguridad_nivel' });
};

export const down = (pgm) => {
  pgm.dropIndex('logs_seguridad', 'nivel', { name: 'idx_logs_seguridad_nivel' });
  pgm.dropIndex('logs_seguridad', 'evento', { name: 'idx_logs_seguridad_evento' });
  pgm.dropIndex('logs_seguridad', 'fecha_hora', { name: 'idx_logs_seguridad_fecha_hora' });
  pgm.dropTable('logs_seguridad');
  pgm.dropTable('usuarios');
};
