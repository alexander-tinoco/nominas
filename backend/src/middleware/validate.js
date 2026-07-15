export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Asignar los datos parseados y transformados de vuelta al request de forma segura
      if (validated.body !== undefined) {
        Object.defineProperty(req, 'body', { value: validated.body, writable: true, configurable: true, enumerable: true });
      }
      if (validated.query !== undefined) {
        Object.defineProperty(req, 'query', { value: validated.query, writable: true, configurable: true, enumerable: true });
      }
      if (validated.params !== undefined) {
        Object.defineProperty(req, 'params', { value: validated.params, writable: true, configurable: true, enumerable: true });
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
