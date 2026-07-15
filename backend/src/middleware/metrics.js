import client from 'prom-client';

// Habilitar la recolección de métricas por defecto de Node.js (CPU, memoria, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Definir métricas personalizadas para el monitoreo de HTTP
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Cantidad total de peticiones HTTP recibidas',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

/**
 * Middleware para capturar y registrar la duración y éxito de cada petición.
 */
export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    
    // Obtener la ruta limpia (evitando ids específicos en el label de Prometheus)
    let route = 'unmatched';
    if (req.route) {
      const basePath = req.baseUrl || '';
      route = `${basePath}${req.route.path}`.replace(/\/+/g, '/');
      if (route.endsWith('/') && route.length > 1) {
        route = route.slice(0, -1);
      }
    }

    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
    httpRequestDurationSeconds.labels(req.method, route, res.statusCode.toString()).observe(durationInSeconds);
  });

  next();
};

/**
 * Controlador del endpoint /metrics para exponer datos a Prometheus.
 */
export const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
