import { z } from 'zod';

// Helper para convertir strings o números a enteros, lanzando error si no es válido
const stringOrNumberToCoercedInteger = () => 
  z.union([z.string(), z.number()])
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'number') return Math.floor(val);
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe ser un número entero válido'
        });
        return z.NEVER;
      }
      return num;
    });

// Helper con valor por defecto para paginación
const paginationCoercedInteger = (defaultValue) => 
  z.union([z.string(), z.number()])
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === null || val === '') return defaultValue;
      if (typeof val === 'number') return Math.floor(val);
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe ser un número entero de paginación válido'
        });
        return z.NEVER;
      }
      return num;
    });

// Helper para convertir strings o números a floats, lanzando error si no es válido
const stringOrNumberToCoercedFloat = () =>
  z.union([z.string(), z.number()])
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'number') return val;
      const num = parseFloat(val);
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe ser un número decimal válido'
        });
        return z.NEVER;
      }
      return num;
    });

// 1. Esquema para GET /api/empleados
export const getEmpleadosSchema = z.object({
  query: z.object({
    page: paginationCoercedInteger(1),
    limit: paginationCoercedInteger(20),
    search: z.string().optional()
  })
});

// 2. Esquema para GET /api/nomina y GET /api/nomina/export
export const getNominaSchema = z.object({
  query: z.object({
    page: paginationCoercedInteger(1),
    limit: paginationCoercedInteger(15),
    search: z.string().optional(),
    rfc: z.string().optional(),
    nom_emp: z.string().optional(),
    ent_fed: stringOrNumberToCoercedInteger(),
    unidad: stringOrNumberToCoercedInteger(),
    subunidad: stringOrNumberToCoercedInteger(),
    cat_puesto: z.string().optional(),
    ct_clasif: z.string().optional(),
    ct_id: z.string().optional(),
    ct_secuencial: stringOrNumberToCoercedInteger(),
    ct_digito_ver: z.string().optional(),
    qna_pago: stringOrNumberToCoercedInteger(),
    qna_pago_min: stringOrNumberToCoercedInteger(),
    qna_pago_max: stringOrNumberToCoercedInteger(),
    qna_ini: stringOrNumberToCoercedInteger(),
    qna_fin: stringOrNumberToCoercedInteger(),
    neto_min: stringOrNumberToCoercedFloat(),
    neto_max: stringOrNumberToCoercedFloat(),
    perc_min: stringOrNumberToCoercedFloat(),
    perc_max: stringOrNumberToCoercedFloat(),
    ded_min: stringOrNumberToCoercedFloat(),
    ded_max: stringOrNumberToCoercedFloat(),
    horas_min: stringOrNumberToCoercedInteger(),
    horas_max: stringOrNumberToCoercedInteger(),
    nivel_sueldo_min: stringOrNumberToCoercedInteger(),
    nivel_sueldo_max: stringOrNumberToCoercedInteger(),
    mot_mov: stringOrNumberToCoercedInteger(),
    concepto: z.string().optional(),
    concepto_tipo: z.string().optional(),
    concepto_importe_min: stringOrNumberToCoercedFloat(),
    concepto_importe_max: stringOrNumberToCoercedFloat(),
    edad_min: stringOrNumberToCoercedInteger(),
    edad_max: stringOrNumberToCoercedInteger()
  })
});

// 3. Esquema para GET /api/nomina/:num_cons
export const getNominaByIdSchema = z.object({
  params: z.object({
    num_cons: z.union([z.string(), z.number()]).transform((val, ctx) => {
      const num = typeof val === 'number' ? Math.floor(val) : parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'num_cons debe ser un valor entero válido y mayor a cero'
        });
        return z.NEVER;
      }
      return num;
    })
  })
});

// 4. Esquema para GET /api/reportes/por-unidad
export const getReportePorUnidadSchema = z.object({
  query: z.object({
    qna: z.union([z.string(), z.number()]).transform((val, ctx) => {
      if (val === undefined || val === null || val === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'qna es requerido y debe ser una quincena válida (AAAAQQ)'
        });
        return z.NEVER;
      }
      const num = typeof val === 'number' ? Math.floor(val) : parseInt(val, 10);
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'qna debe ser un valor entero válido (AAAAQQ)'
        });
        return z.NEVER;
      }
      return num;
    }),
    subunidad: z.union([z.string(), z.boolean(), z.enum(['true', 'false'])]).optional().transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
  })
});

// 5. Esquema para GET /api/reportes/conceptos
export const getReporteConceptosSchema = z.object({
  query: z.object({
    qna_start: z.union([z.string(), z.number()])
      .optional()
      .transform((val, ctx) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return Math.floor(val);
        const num = parseInt(val, 10);
        if (isNaN(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'qna_start debe ser un número entero válido'
          });
          return z.NEVER;
        }
        return num;
      }),
    qna_end: z.union([z.string(), z.number()])
      .optional()
      .transform((val, ctx) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return Math.floor(val);
        const num = parseInt(val, 10);
        if (isNaN(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'qna_end debe ser un número entero válido'
          });
          return z.NEVER;
        }
        return num;
      })
  })
});
