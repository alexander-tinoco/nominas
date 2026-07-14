export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Asignar los datos parseados y transformados de vuelta al request de forma segura sin reasignar la raíz
      if (validated.body !== undefined && req.body !== undefined) {
        for (const key in req.body) delete req.body[key];
        Object.assign(req.body, validated.body);
      }
      if (validated.query !== undefined && req.query !== undefined) {
        for (const key in req.query) delete req.query[key];
        Object.assign(req.query, validated.query);
      }
      if (validated.params !== undefined && req.params !== undefined) {
        for (const key in req.params) delete req.params[key];
        Object.assign(req.params, validated.params);
      }

      next();
    } catch (error) {
      if (error && (error.name === 'ZodError' || Array.isArray(error.issues))) {
        const issues = (error.issues || []).map(err => ({
          field: err.path.slice(1).join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Parámetros de entrada inválidos',
          details: issues
        });
      }
      next(error);
    }
  };
};
